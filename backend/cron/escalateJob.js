const cron = require('node-cron');
const firestoreService = require('../services/firestoreService');
const emailService = require('../services/emailService');

/**
 * Check for overdue complaints and escalate them
 * Logic: If (now > createdAt + resolutionTime) AND not resolved AND not escalated
 */
const checkEscalations = async () => {
    console.log('⏰ Running Escalation Check...');

    try {
        const complaints = await firestoreService.getUnresolvedComplaints();
        const now = new Date();

        for (const complaint of complaints) {
            const created = new Date(complaint.createdAt);
            // resolutionTime is in days
            const deadline = new Date(created.getTime() + (complaint.resolutionTime * 24 * 60 * 60 * 1000));

            // If current time is past the deadline
            if (now > deadline) {
                console.log(`⚠️ Escalating Complaint ${complaint.id} (Deadline: ${deadline.toISOString()})`);

                // 1. Update DB
                await firestoreService.escalateComplaint(
                    complaint.id,
                    `Auto-escalated: Exceeded resolution time of ${complaint.resolutionTime} days`
                );

                // 2. Send Email to VP
                await emailService.sendEscalationEmail(complaint);
            }
        }

    } catch (error) {
        console.error('Escalation Job Failed:', error);
    }
};

// Schedule: Run every 30 minutes
const startJob = () => {
    cron.schedule('*/30 * * * *', checkEscalations);
    console.log('🚀 Escalation Cron Job Started (Every 30 mins)');
};

module.exports = { startJob };
