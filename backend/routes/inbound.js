const express = require('express');
const router = express.Router();
const firestoreService = require('../services/firestoreService');

/**
 * Resend Inbound Webhook
 * Handles replies from wardens via email
 */
router.post('/resend-webhook', async (req, res) => {
    try {
        const { subject, text, from } = req.body;

        console.log('📨 Inbound Email Received:', subject);

        // Extract Complaint ID from Subject (Format: "Complaint #<id> ...")
        const match = subject.match(/Complaint #([a-zA-Z0-9]+)/);

        if (match && match[1]) {
            const complaintId = match[1];
            const wardenEmail = from;
            const responseText = text || 'No content';

            console.log(`✅ Updating Complaint ${complaintId} with response from ${wardenEmail}`);

            await firestoreService.updateComplaint(complaintId, {
                resolved: true,
                resolvedAt: new Date().toISOString(),
                wardenResponse: responseText,
                wardenEmail: wardenEmail
            });

            return res.status(200).json({ message: 'Processed successfully' });
        }

        console.warn('⚠️ Could not extract Complaint ID from subject');
        res.status(200).json({ message: 'Ignored: No ID found' });

    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
