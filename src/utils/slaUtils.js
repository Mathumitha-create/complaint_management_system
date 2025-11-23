// SLA (Service Level Agreement) Utilities
// Automated escalation and monitoring

// SLA Time Limits (in hours)
export const SLA_LIMITS = {
  HIGH: 24,      // 24 hours for high priority
  MEDIUM: 72,    // 72 hours (3 days) for medium priority
  LOW: 168,      // 168 hours (7 days) for low priority
};

// Priority levels
export const PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

// Calculate priority based on category
export const calculatePriority = (category) => {
  const cat = category?.toLowerCase() || '';
  
  // High priority categories
  if (cat.includes('harassment') || 
      cat.includes('safety') || 
      cat.includes('emergency') ||
      cat.includes('security') ||
      cat.includes('medical')) {
    return PRIORITY.HIGH;
  }
  
  // Medium priority categories
  if (cat.includes('academic') || 
      cat.includes('exam') || 
      cat.includes('personnel') ||
      cat.includes('administrative')) {
    return PRIORITY.MEDIUM;
  }
  
  // Low priority for others
  return PRIORITY.LOW;
};

// Calculate hours elapsed since complaint creation
export const calculateHoursElapsed = (createdAt) => {
  if (!createdAt) return 0;
  
  const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  return diffHours;
};

// Check if complaint is overdue
export const isOverdue = (complaint) => {
  if (complaint.status === 'Resolved') return false;
  
  const priority = complaint.priority || calculatePriority(complaint.category);
  const hoursElapsed = calculateHoursElapsed(complaint.created_at);
  const slaLimit = SLA_LIMITS[priority.toUpperCase()] || SLA_LIMITS.LOW;
  
  return hoursElapsed > slaLimit;
};

// Calculate SLA status
export const getSLAStatus = (complaint) => {
  if (complaint.status === 'Resolved') {
    return { status: 'Resolved', color: '#10b981', percentage: 100 };
  }
  
  const priority = complaint.priority || calculatePriority(complaint.category);
  const hoursElapsed = calculateHoursElapsed(complaint.created_at);
  const slaLimit = SLA_LIMITS[priority.toUpperCase()] || SLA_LIMITS.LOW;
  
  const percentage = Math.min((hoursElapsed / slaLimit) * 100, 100);
  
  if (percentage >= 100) {
    return { status: 'Overdue', color: '#ef4444', percentage: 100 };
  } else if (percentage >= 80) {
    return { status: 'Critical', color: '#f59e0b', percentage };
  } else if (percentage >= 50) {
    return { status: 'Warning', color: '#fbbf24', percentage };
  } else {
    return { status: 'On Track', color: '#10b981', percentage };
  }
};

// Get time remaining
export const getTimeRemaining = (complaint) => {
  if (complaint.status === 'Resolved') return 'Resolved';
  
  const priority = complaint.priority || calculatePriority(complaint.category);
  const hoursElapsed = calculateHoursElapsed(complaint.created_at);
  const slaLimit = SLA_LIMITS[priority.toUpperCase()] || SLA_LIMITS.LOW;
  
  const hoursRemaining = slaLimit - hoursElapsed;
  
  if (hoursRemaining <= 0) {
    const hoursOverdue = Math.abs(hoursRemaining);
    if (hoursOverdue < 24) {
      return `${hoursOverdue}h overdue`;
    } else {
      const daysOverdue = Math.floor(hoursOverdue / 24);
      return `${daysOverdue}d overdue`;
    }
  }
  
  if (hoursRemaining < 24) {
    return `${hoursRemaining}h left`;
  } else {
    const daysRemaining = Math.floor(hoursRemaining / 24);
    return `${daysRemaining}d left`;
  }
};

// Determine if complaint should be auto-escalated
export const shouldAutoEscalate = (complaint) => {
  if (complaint.status === 'Resolved' || complaint.status === 'Escalated') {
    return false;
  }
  
  return isOverdue(complaint);
};

// Get escalation reason
export const getEscalationReason = (complaint) => {
  const priority = complaint.priority || calculatePriority(complaint.category);
  const hoursElapsed = calculateHoursElapsed(complaint.created_at);
  const slaLimit = SLA_LIMITS[priority.toUpperCase()] || SLA_LIMITS.LOW;
  const hoursOverdue = hoursElapsed - slaLimit;
  
  return `Auto-escalated: ${hoursOverdue}h past SLA limit (${priority} priority: ${slaLimit}h)`;
};

// Format date for display
export const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleString();
};

// Get priority badge color
export const getPriorityColor = (priority) => {
  switch (priority?.toUpperCase()) {
    case 'HIGH':
      return { bg: '#fee2e2', color: '#991b1b' };
    case 'MEDIUM':
      return { bg: '#fef3c7', color: '#92400e' };
    case 'LOW':
      return { bg: '#dbeafe', color: '#1e40af' };
    default:
      return { bg: '#e5e7eb', color: '#374151' };
  }
};

// Calculate SLA compliance percentage for dashboard
export const calculateSLACompliance = (complaints) => {
  if (complaints.length === 0) return 100;
  
  const resolvedOnTime = complaints.filter(c => {
    if (c.status !== 'Resolved') return false;
    
    const priority = c.priority || calculatePriority(c.category);
    const hoursElapsed = calculateHoursElapsed(c.created_at);
    const slaLimit = SLA_LIMITS[priority.toUpperCase()] || SLA_LIMITS.LOW;
    
    return hoursElapsed <= slaLimit;
  }).length;
  
  const totalResolved = complaints.filter(c => c.status === 'Resolved').length;
  
  if (totalResolved === 0) return 100;
  
  return Math.round((resolvedOnTime / totalResolved) * 100);
};

// Get complaints by SLA status
export const getComplaintsBySLAStatus = (complaints) => {
  return {
    onTrack: complaints.filter(c => {
      const sla = getSLAStatus(c);
      return sla.status === 'On Track';
    }).length,
    warning: complaints.filter(c => {
      const sla = getSLAStatus(c);
      return sla.status === 'Warning';
    }).length,
    critical: complaints.filter(c => {
      const sla = getSLAStatus(c);
      return sla.status === 'Critical';
    }).length,
    overdue: complaints.filter(c => {
      const sla = getSLAStatus(c);
      return sla.status === 'Overdue';
    }).length,
  };
};
