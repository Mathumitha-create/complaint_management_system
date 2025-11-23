# Seeding staff accounts (admin/warden/faculty/hod)

This document explains how to run the provided seeding script to create staff accounts in Firebase Auth and corresponding `users/{uid}` documents in Firestore.

## Prerequisites

- Node.js installed
- You have a Firebase project and a service account JSON (create one in Firebase Console → Project Settings → Service accounts → Generate new private key)

## Steps

1. Install the admin SDK locally (in the repository root):

   npm install firebase-admin

2. Save the downloaded service account JSON file into the project root (for example as `serviceAccountKey.json`).

3. Run the seeding script:

   node scripts/seedStaff.js ./serviceAccountKey.json

The script will create these accounts (if they don't already exist):

- admin@gmail.com (password: 987456) role: admin
- warden@gmail.com (password: 987456) role: warden
- faculty@gmail.com (password: 987456) role: faculty
- hod@gmail.com (password: 987456) role: hod

## Security notes

- These sample credentials are for local testing only. Do NOT use these passwords in production.
- Remove the service account JSON from the repository afterwards or keep it out of version control.

If you want me to generate a version that also sets custom claims for role-based auth, I can add that too — say the word and I'll patch the script.
