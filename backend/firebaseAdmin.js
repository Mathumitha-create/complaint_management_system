const admin = require('firebase-admin');
require('dotenv').config();

let db = null;
let auth = null;

try {
    // Check if we have environment variables for Firebase Admin
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        // Use environment variables (for production/Render)
        console.log('🔧 Initializing Firebase Admin with environment variables...');

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle escaped newlines
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            })
        });

        db = admin.firestore();
        auth = admin.auth();
        console.log('🔥 Firebase Admin Initialized Successfully (Environment Variables)');
    } else {
        // Try to use serviceAccountKey.json (for local development)
        console.log('🔧 Attempting to use serviceAccountKey.json...');
        const serviceAccount = require('./serviceAccountKey.json');

        if (serviceAccount.note) {
            console.log('ℹ️  Running in Offline Mode (Database features disabled)');
            console.log('   (Add serviceAccountKey.json or set environment variables to enable database)');
        } else {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            db = admin.firestore();
            auth = admin.auth();
            console.log('🔥 Firebase Admin Initialized Successfully (Service Account File)');
        }
    }
} catch (error) {
    console.error('❌ Firebase Init Error:', error.message);
    console.log('ℹ️  Make sure to set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables');
}

module.exports = { admin, db, auth };
