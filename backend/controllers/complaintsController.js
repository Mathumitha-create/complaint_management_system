const firestoreService = require('../services/firestoreService');
const emailService = require('../services/emailService');
const { validateComplaint } = require('../utils/validators');

/**
 * 1. POST /api/complaints/create
 */
const createComplaint = async (req, res) => {
    try {
        const data = req.body;

        // Validate request
        const error = validateComplaint(data);
        if (error) {
            return res.status(400).json({ error });
        }

        // Create in Firestore
        const complaint = await firestoreService.createComplaint(data);

        // Send Email Notification to Warden
        const wardenEmailResult = await emailService.sendComplaintNotification(complaint);

        // Send Confirmation Email to Student
        const studentEmailResult = await emailService.sendConfirmationEmail(complaint);

        res.status(201).json({
            message: 'Complaint created successfully',
            complaintId: complaint.id,
            emailStatus: {
                warden: wardenEmailResult.success ? 'sent' : 'failed',
                student: studentEmailResult.success ? 'sent' : 'failed'
            }
        });

    } catch (error) {
        console.error('Controller Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 2. GET /api/complaints/auto-resolve/:complaintId
 * Used by the "Complaint Rectified" button in email
 */
const autoResolveComplaint = async (req, res) => {
    try {
        const { complaintId } = req.params;

        // Fetch complaint first to get student email
        const complaint = await firestoreService.getComplaintById(complaintId);
        if (!complaint) {
            return res.status(404).send('<h1>Complaint Not Found</h1>');
        }

        if (complaint.resolved) {
            return res.status(200).send('<h1>Complaint is already resolved.</h1>');
        }

        // Update Firestore
        const updateData = {
            resolved: true,
            resolvedAt: new Date().toISOString(),
            wardenResponse: 'Resolved via one-click button'
        };

        await firestoreService.updateComplaint(complaintId, updateData);

        // Send Resolution Email to Student
        await emailService.sendResolutionEmail({ ...complaint, ...updateData });

        // Return HTML response
        res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: green;">✅ Complaint Resolved Successfully</h1>
        <p>The student has been notified via email.</p>
        <p>You can close this window.</p>
      </div>
    `);

    } catch (error) {
        console.error('Auto-Resolve Error:', error);
        res.status(500).send('<h1>Internal Server Error</h1>');
    }
};

/**
 * 4. GET /api/complaints/:id
 */
const getComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await firestoreService.getComplaintById(id);

        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        res.json(complaint);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 5. GET /api/complaints/warden/:hostelType
 */
const getWardenComplaints = async (req, res) => {
    try {
        const { hostelType } = req.params;
        const complaints = await firestoreService.getComplaintsByHostel(hostelType);
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 6. GET /api/complaints/student/:studentId
 */
const getStudentComplaints = async (req, res) => {
    try {
        const { studentId } = req.params;
        const complaints = await firestoreService.getComplaintsByStudent(studentId);
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 7. POST /api/complaints/resolve/:id
 * Manual resolution from Dashboard
 */
const resolveComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        // Fetch complaint to get student email
        const complaint = await firestoreService.getComplaintById(id);
        if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

        const updateData = {
            resolved: true,
            resolvedAt: new Date().toISOString(),
            wardenResponse: note || 'Resolved via Dashboard'
        };

        const result = await firestoreService.updateComplaint(id, updateData);

        // Notify Student
        await emailService.sendResolutionEmail({ ...complaint, ...updateData });

        res.json({ message: 'Complaint resolved', result });

    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 8. GET /api/admin/all-complaints
 */
const getAllComplaints = async (req, res) => {
    try {
        const complaints = await firestoreService.getAllComplaints();
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 9. GET /api/vp/escalated
 */
const getEscalatedComplaints = async (req, res) => {
    try {
        const complaints = await firestoreService.getEscalatedComplaints();
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    createComplaint,
    autoResolveComplaint,
    getComplaint,
    getWardenComplaints,
    getStudentComplaints,
    resolveComplaint,
    getAllComplaints,
    getEscalatedComplaints
};
