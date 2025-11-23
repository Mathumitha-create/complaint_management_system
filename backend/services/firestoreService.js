const firebase = require('../firebaseAdmin');

const COLLECTION_COMPLAINTS = 'complaints';
const COLLECTION_ESCALATIONS = 'escalations';

/**
 * Helper to get DB instance or throw error if not initialized
 */
const getDb = () => {
    if (!firebase.db) {
        throw new Error('Firestore is not initialized. Check serviceAccountKey.json.');
    }
    return firebase.db;
};

/**
 * Create a new complaint in Firestore
 */
const createComplaint = async (complaintData) => {
    try {
        const db = getDb();
        const docRef = db.collection(COLLECTION_COMPLAINTS).doc();
        const complaint = {
            id: docRef.id,
            ...complaintData,
            createdAt: new Date().toISOString(),
            resolved: false,
            resolvedAt: null,
            escalated: false,
            escalatedAt: null,
            wardenResponse: null,
            wardenEmail: null
        };

        await docRef.set(complaint);
        return complaint;
    } catch (error) {
        console.error('Error creating complaint:', error);
        throw error;
    }
};

/**
 * Get a complaint by ID
 */
const getComplaintById = async (id) => {
    try {
        const db = getDb();
        const doc = await db.collection(COLLECTION_COMPLAINTS).doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        console.error('Error fetching complaint:', error);
        throw error;
    }
};

/**
 * Get complaints by hostel type
 */
const getComplaintsByHostel = async (hostelType) => {
    try {
        const db = getDb();
        const snapshot = await db.collection(COLLECTION_COMPLAINTS)
            .where('hostelType', '==', hostelType)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching hostel complaints:', error);
        throw error;
    }
};

/**
 * Get complaints by student ID
 */
const getComplaintsByStudent = async (studentId) => {
    try {
        const db = getDb();
        const snapshot = await db.collection(COLLECTION_COMPLAINTS)
            .where('studentId', '==', studentId)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching student complaints:', error);
        throw error;
    }
};

/**
 * Get ALL complaints (for Admin)
 */
const getAllComplaints = async () => {
    try {
        const db = getDb();
        const snapshot = await db.collection(COLLECTION_COMPLAINTS).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching all complaints:', error);
        throw error;
    }
};

/**
 * Get escalated complaints (for VP)
 */
const getEscalatedComplaints = async () => {
    try {
        const db = getDb();
        const snapshot = await db.collection(COLLECTION_COMPLAINTS)
            .where('escalated', '==', true)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching escalated complaints:', error);
        throw error;
    }
};

/**
 * Update complaint (e.g., resolve, add response)
 */
const updateComplaint = async (id, updateData) => {
    try {
        const db = getDb();
        await db.collection(COLLECTION_COMPLAINTS).doc(id).update(updateData);
        return { id, ...updateData };
    } catch (error) {
        console.error('Error updating complaint:', error);
        throw error;
    }
};

/**
 * Get all unresolved complaints for escalation check
 */
const getUnresolvedComplaints = async () => {
    try {
        const db = getDb();
        const snapshot = await db.collection(COLLECTION_COMPLAINTS)
            .where('resolved', '==', false)
            .where('escalated', '==', false)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching unresolved complaints:', error);
        throw error;
    }
};

/**
 * Escalate a complaint
 */
const escalateComplaint = async (complaintId, note) => {
    try {
        const db = getDb();
        const batch = db.batch();

        // Update complaint status
        const complaintRef = db.collection(COLLECTION_COMPLAINTS).doc(complaintId);
        batch.update(complaintRef, {
            escalated: true,
            escalatedAt: new Date().toISOString()
        });

        // Add to escalations collection
        const escalationRef = db.collection(COLLECTION_ESCALATIONS).doc();
        batch.set(escalationRef, {
            complaintId,
            escalatedAt: new Date().toISOString(),
            note
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error escalating complaint:', error);
        throw error;
    }
};

module.exports = {
    createComplaint,
    getComplaintById,
    getComplaintsByHostel,
    getComplaintsByStudent,
    getAllComplaints,
    getEscalatedComplaints,
    updateComplaint,
    getUnresolvedComplaints,
    escalateComplaint
};
