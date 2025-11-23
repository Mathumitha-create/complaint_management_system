const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Nodemailer with Gmail SMTP (Port 587 - STARTTLS)
// We explicitly use host/port instead of 'service: gmail' to force Port 587
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false // Helps with some strict firewalls/antivirus
    }
});

/**
 * Load and compile email template
 */
const loadTemplate = (templateName, data) => {
    try {
        const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
        let template = fs.readFileSync(templatePath, 'utf8');

        // Variable replacement
        for (const [key, value] of Object.entries(data)) {
            template = template.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        }
        return template;
    } catch (error) {
        console.error(`❌ Error loading template ${templateName}:`, error);
        return `<p>Error loading template. Content: ${JSON.stringify(data)}</p>`;
    }
};

/**
 * Send email using Nodemailer
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        console.log(`📧 Attempting to send email to ${to}...`);

        const info = await transporter.sendMail({
            from: `"VSB Grievance Cell" <${process.env.SMTP_EMAIL}>`,
            to: to,
            subject: subject,
            html: html
        });

        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * 1. Send new complaint notification to Warden (with Action Button)
 */
const sendComplaintNotification = async (complaint) => {
    // Determine recipient
    let recipientEmail = process.env.ADMIN_EMAIL;
    if (complaint.hostelType && complaint.hostelType.toLowerCase().includes('boys')) {
        recipientEmail = process.env.WARDEN_BOYS_EMAIL;
    } else if (complaint.hostelType && complaint.hostelType.toLowerCase().includes('girls')) {
        recipientEmail = process.env.WARDEN_GIRLS_EMAIL;
    }

    const resolveLink = `${process.env.API_BASE_URL}/api/complaints/auto-resolve/${complaint.id}`;

    const html = loadTemplate('wardenEmail', {
        ...complaint,
        resolveLink: resolveLink
    });

    return await sendEmail({
        to: recipientEmail,
        subject: `Action Required: Complaint #${complaint.id}`,
        html: html
    });
};

/**
 * 2. Send confirmation to Student
 */
const sendConfirmationEmail = async (complaint) => {
    const html = loadTemplate('studentConfirmation', complaint);

    return await sendEmail({
        to: complaint.studentEmail,
        subject: `Complaint Received: #${complaint.id}`,
        html: html
    });
};

/**
 * 3. Send resolution email to Student
 */
const sendResolutionEmail = async (complaint) => {
    const html = loadTemplate('studentResolved', complaint);

    return await sendEmail({
        to: complaint.studentEmail,
        subject: `✅ Complaint Resolved: #${complaint.id}`,
        html: html
    });
};

/**
 * 4. Send escalation email to VP
 */
const sendEscalationEmail = async (complaint) => {
    // Simple HTML for escalation (or create a template if needed)
    const html = `
    <h2 style="color: #dc2626;">🚨 Complaint Escalation Alert</h2>
    <p>The following complaint has exceeded the resolution time (${complaint.resolutionTime} days) and is now <b>ESCALATED</b> to you.</p>
    <hr>
    <p><b>ID:</b> ${complaint.id}</p>
    <p><b>Student:</b> ${complaint.studentName} (${complaint.registerNumber})</p>
    <p><b>Category:</b> ${complaint.category}</p>
    <p><b>Hostel:</b> ${complaint.hostelType}</p>
    <p><b>Description:</b> ${complaint.description}</p>
    <hr>
    <p>Please take necessary action.</p>
  `;

    return await sendEmail({
        to: process.env.VP_EMAIL || process.env.ADMIN_EMAIL,
        subject: `[ESCALATED] Complaint #${complaint.id} Overdue`,
        html: html
    });
};

/**
 * Verify SMTP Connection
 */
const verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ SMTP Server Connected Successfully');
        return true;
    } catch (error) {
        console.error('❌ SMTP Connection Failed:', error.message);
        console.error('👉 Check your .env file for correct SMTP_EMAIL and SMTP_PASS');
        return false;
    }
};

module.exports = {
    sendComplaintNotification,
    sendConfirmationEmail,
    sendResolutionEmail,
    sendEscalationEmail,
    verifyConnection
};
