// Automated Escalation Service
// Monitors complaints and auto-escalates overdue ones

import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { shouldAutoEscalate, getEscalationReason, calculatePriority } from '../utils/slaUtils';

// Auto-escalate overdue complaints
export const autoEscalateOverdueComplaints = async () => {
  try {
    console.log('🔄 Running auto-escalation check...');
    
    // Get all non-resolved, non-escalated complaints
    const q = query(
      collection(db, 'grievances'),
      where('status', 'in', ['Pending', 'In Progress'])
    );
    
    const snapshot = await getDocs(q);
    const complaints = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 Checking ${complaints.length} complaints for escalation...`);
    
    let escalatedCount = 0;
    
    for (const complaint of complaints) {
      if (shouldAutoEscalate(complaint)) {
        await escalateComplaint(complaint);
        escalatedCount++;
      }
    }
    
    console.log(`✅ Auto-escalation complete: ${escalatedCount} complaints escalated`);
    return escalatedCount;
    
  } catch (error) {
    console.error('❌ Error in auto-escalation:', error);
    return 0;
  }
};

// Escalate a single complaint
export const escalateComplaint = async (complaint) => {
  try {
    const complaintRef = doc(db, 'grievances', complaint.id);
    const reason = getEscalationReason(complaint);
    
    // Update complaint status
    await updateDoc(complaintRef, {
      status: 'Escalated',
      escalatedAt: new Date(),
      escalationReason: reason,
      priority: complaint.priority || calculatePriority(complaint.category),
      updatedAt: new Date()
    });
    
    // Log escalation
    await addDoc(collection(db, 'escalation_logs'), {
      complaintId: complaint.id,
      complaintTitle: complaint.title,
      reason: reason,
      escalatedAt: new Date(),
      originalStatus: complaint.status,
      category: complaint.category,
      priority: complaint.priority || calculatePriority(complaint.category)
    });
    
    console.log(`⚠️ Escalated complaint: ${complaint.id} - ${complaint.title}`);
    
  } catch (error) {
    console.error(`❌ Error escalating complaint ${complaint.id}:`, error);
  }
};

// Manual escalation (by user)
export const manualEscalateComplaint = async (complaintId, reason, userEmail) => {
  try {
    const complaintRef = doc(db, 'grievances', complaintId);
    
    await updateDoc(complaintRef, {
      status: 'Escalated',
      escalatedAt: new Date(),
      escalationReason: reason || 'Manually escalated',
      escalatedBy: userEmail,
      updatedAt: new Date()
    });
    
    // Log escalation
    await addDoc(collection(db, 'escalation_logs'), {
      complaintId: complaintId,
      reason: reason || 'Manually escalated',
      escalatedAt: new Date(),
      escalatedBy: userEmail,
      type: 'manual'
    });
    
    console.log(`✅ Manually escalated complaint: ${complaintId}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error manually escalating complaint:`, error);
    return false;
  }
};

// Get escalation history for a complaint
export const getEscalationHistory = async (complaintId) => {
  try {
    const q = query(
      collection(db, 'escalation_logs'),
      where('complaintId', '==', complaintId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
  } catch (error) {
    console.error('❌ Error fetching escalation history:', error);
    return [];
  }
};

// Initialize auto-escalation scheduler (runs every hour)
export const initAutoEscalation = () => {
  console.log('🚀 Initializing auto-escalation service...');
  
  // Run immediately on init
  autoEscalateOverdueComplaints();
  
  // Run every hour
  const intervalId = setInterval(() => {
    autoEscalateOverdueComplaints();
  }, 60 * 60 * 1000); // 1 hour
  
  return intervalId;
};

// Stop auto-escalation scheduler
export const stopAutoEscalation = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('🛑 Auto-escalation service stopped');
  }
};
