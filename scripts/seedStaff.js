#!/usr/bin/env node
/**
 * Seed staff accounts into Firebase Auth and create corresponding Firestore user documents.
 *
 * Usage:
 * 1. Install dependency: npm install firebase-admin
 * 2. Download a Firebase service account JSON (from Firebase Console > Project Settings > Service accounts)
 * 3. Run:
 *    node scripts/seedStaff.js ./serviceAccountKey.json
 *
 * The script will create (if missing) Auth users and set documents under `users/{uid}` with role fields.
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), "backend/.env") });

const serviceAccountPath = process.argv[2] || process.env.SERVICE_ACCOUNT;
if (!serviceAccountPath) {
  console.error(
    "Please pass the path to your Firebase service account JSON as the first argument or set SERVICE_ACCOUNT env var."
  );
  console.error("Example: node scripts/seedStaff.js ./serviceAccountKey.json");
  process.exit(1);
}

const fullPath = path.resolve(serviceAccountPath);
if (!fs.existsSync(fullPath)) {
  console.error(`Service account file not found at: ${fullPath}`);
  process.exit(1);
}

const serviceAccount = require(fullPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

// Build accounts dynamically from env; include only those with both email & password
const rawAccounts = [
  {
    email: process.env.WARDEN_GIRLS_EMAIL,
    password: process.env.WARDEN_GIRLS_PASSWORD,
    role: "warden_girls",
    name: "Girls Hostel Warden",
    hostelType: "girls",
  },
  {
    email: process.env.WARDEN_BOYS_EMAIL,
    password: process.env.WARDEN_BOYS_PASSWORD,
    role: "warden_boys",
    name: "Boys Hostel Warden",
    hostelType: "boys",
  },
  {
    email: process.env.FACULTY_EMAIL,
    password: process.env.FACULTY_PASSWORD,
    role: "faculty",
    name: "Faculty",
  },
  {
    email: process.env.HOD_EMAIL,
    password: process.env.HOD_PASSWORD,
    role: "hod",
    name: "HOD",
  },
  {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: "admin",
    name: "Admin",
  },
  {
    email: process.env.VP_EMAIL,
    password: process.env.VP_PASSWORD,
    role: "vp",
    name: "Vice Principal",
  },
];

const accounts = rawAccounts.filter((a) => a.email && a.password);
if (accounts.length === 0) {
  console.error(
    "No staff accounts found in environment variables. Please set *_EMAIL and *_PASSWORD vars."
  );
  process.exit(1);
}

async function ensureUser(account) {
  try {
    // Try fetching the user by email
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(account.email);
      console.log(
        `Found existing user for ${account.email} (uid=${userRecord.uid})`
      );
    } catch (e) {
      if (e.code && e.code === "auth/user-not-found") {
        // Create user
        userRecord = await auth.createUser({
          email: account.email,
          password: account.password,
          emailVerified: true,
          displayName: account.name,
        });
        console.log(
          `Created Auth user for ${account.email} (uid=${userRecord.uid})`
        );
      } else {
        throw e;
      }
    }

    // Ensure Firestore user doc exists
    const userDocRef = db.collection("users").doc(userRecord.uid);
    await userDocRef.set(
      {
        name: account.name,
        email: account.email,
        role: account.role,
        hostelType: account.hostelType || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(
      `Ensured Firestore user doc for ${account.email} (role=${account.role})`
    );
  } catch (err) {
    console.error(`Error ensuring user ${account.email}:`, err.message || err);
    throw err;
  }
}

async function main() {
  console.log("Seeding staff accounts...");
  for (const acc of accounts) {
    await ensureUser(acc);
  }
  console.log("Done seeding staff accounts.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
