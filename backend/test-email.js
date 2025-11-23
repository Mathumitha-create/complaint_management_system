const nodemailer = require('nodemailer');
require('dotenv').config();

const testEmail = async () => {
    console.log('🔍 Testing Email Configuration...');
    console.log(`📧 User: ${process.env.SMTP_EMAIL}`);

    if (!process.env.SMTP_PASS || process.env.SMTP_PASS.includes('xxxx')) {
        console.error('❌ ERROR: SMTP_PASS is still set to placeholder "xxxx". Please update .env file!');
        return;
    }

    // Explicitly use Port 587 (STARTTLS)
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        // 1. Verify Connection
        console.log('🔌 Verifying SMTP Connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');

        // 2. Send Test Email
        console.log('📤 Sending Test Email...');
        const info = await transporter.sendMail({
            from: `"Test Script" <${process.env.SMTP_EMAIL}>`,
            to: process.env.SMTP_EMAIL, // Send to self
            subject: "VSB Backend Test Email",
            text: "If you see this, your email configuration is working perfectly! 🚀",
            html: "<h1>It Works!</h1><p>Your backend email configuration is correct.</p>"
        });

        console.log('✅ Test Email Sent!');
        console.log('🆔 Message ID:', info.messageId);
        console.log('-----------------------------------');
        console.log('🎉 YOU ARE READY TO GO!');
        console.log('-----------------------------------');

    } catch (error) {
        console.error('❌ EMAIL TEST FAILED:', error);
        if (error.code === 'EAUTH') {
            console.error('👉 Cause: Invalid Email or App Password.');
            console.error('👉 Fix: Check SMTP_EMAIL and SMTP_PASS in .env');
        }
    }
};

testEmail();
