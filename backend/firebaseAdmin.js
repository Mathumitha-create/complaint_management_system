const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

let db = null;
let auth = null;

// Check if we are using the placeholder service account
if (serviceAccount.note) {
    console.log('ℹ️  Running in Offline Mode (Database features disabled)');
    console.log('   (Add serviceAccountKey.json to enable database)');
} else {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        db = admin.firestore();
        auth = admin.auth();
        console.log('🔥 Firebase Admin Initialized Successfully');
    } catch (error) {
        console.error('❌ Firebase Init Error:', error.message);
    }
}

module.exports = { admin, db, auth };
