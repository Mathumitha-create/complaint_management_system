const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api/auth/login';

async function testLogin(email, password, role) {
    console.log(`Testing login for ${role}...`);
    try {
        const response = await axios.post(API_URL, {
            email,
            password,
            selectedRole: role
        });
        console.log(`✅ Success! Token received for ${role}`);
        console.log('User:', response.data.user);
    } catch (error) {
        console.error(`❌ Failed for ${role}:`, error.response ? error.response.data : error.message);
    }
    console.log('-----------------------------------');
}

async function runTests() {
    console.log('--- Starting Env Login Tests ---');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPass) {
        console.warn('⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not found in .env');
    } else {
        await testLogin(adminEmail, adminPass, 'admin');
    }

    const vpEmail = process.env.VP_EMAIL;
    const vpPass = process.env.VP_PASSWORD;

    if (!vpEmail || !vpPass) {
        console.warn('⚠️ VP_EMAIL or VP_PASSWORD not found in .env');
    } else {
        await testLogin(vpEmail, vpPass, 'vp');
    }

    // Test Invalid Password
    if (adminEmail) {
        console.log('Testing Invalid Password...');
        await testLogin(adminEmail, 'wrongpassword', 'admin');
    }
}

runTests();
