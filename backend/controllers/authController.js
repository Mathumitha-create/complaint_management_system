const firebase = require("../firebaseAdmin");
const axios = require("axios");
require("dotenv").config();

// Get API Key from env or hardcode (since it's public in frontend anyway)
// Ideally this should be in .env, but for now we'll use the one from src/firebase.js
const FIREBASE_API_KEY =
    process.env.FIREBASE_API_KEY || "AIzaSyCrgpFValhMfN9Xi1v4zPKusZnQ02ZjEyI";

/**
 * Login with Role Verification
 * POST /api/auth/login
 */
const login = async (req, res) => {
    const { email, password, selectedRole } = req.body;

    if (!email || !password || !selectedRole) {
        return res
            .status(400)
            .json({ error: "Email, password, and role are required." });
    }

    try {
        // 0. Check for Env-based Credentials (Admin/VP/etc)
        const envCredentials = [
            {
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
                role: "admin",
                uid: "env-admin",
                hostelType: null,
            },
            {
                email: process.env.VP_EMAIL,
                password: process.env.VP_PASSWORD,
                role: "vp",
                uid: "env-vp",
                hostelType: null,
            },
            {
                email: process.env.WARDEN_BOYS_EMAIL,
                password: process.env.WARDEN_BOYS_PASSWORD,
                role: "warden_boys",
                uid: "env-warden-boys",
                hostelType: "Boys Hostel",
            },
            {
                email: process.env.WARDEN_GIRLS_EMAIL,
                password: process.env.WARDEN_GIRLS_PASSWORD,
                role: "warden_girls",
                uid: "env-warden-girls",
                hostelType: "Girls Hostel",
            },
            {
                email: process.env.HOD_EMAIL,
                password: process.env.HOD_PASSWORD,
                role: "hod",
                uid: "env-hod",
                hostelType: null,
            },
            {
                email: process.env.FACULTY_EMAIL,
                password: process.env.FACULTY_PASSWORD,
                role: "faculty",
                uid: "env-faculty",
                hostelType: null,
            },
        ];

        const matchedEnvUser = envCredentials.find((u) => u.email === email);

        if (matchedEnvUser) {
            // Verify Password
            if (matchedEnvUser.password !== password) {
                return res.status(401).json({ error: "Invalid email or password." });
            }

            // Verify Role
            if (matchedEnvUser.role !== selectedRole) {
                return res.status(403).json({
                    error: `Access Denied: You are registered as a "${matchedEnvUser.role}", but tried to log in as "${selectedRole}".`,
                });
            }

            // Ensure User Exists in Firestore (Sync Env User to DB)
            const db = firebase.db;
            const userRef = db.collection("users").doc(matchedEnvUser.uid);

            await userRef.set(
                {
                    email: matchedEnvUser.email,
                    role: matchedEnvUser.role,
                    name: matchedEnvUser.role.toUpperCase(),
                    hostelType: matchedEnvUser.hostelType, // Sync hostelType
                    lastLogin: new Date().toISOString(),
                    isEnvUser: true, // Flag to identify these users
                },
                { merge: true }
            );

            // Generate Token
            const customToken = await firebase.admin
                .auth()
                .createCustomToken(matchedEnvUser.uid);

            return res.json({
                token: customToken,
                user: {
                    uid: matchedEnvUser.uid,
                    email: matchedEnvUser.email,
                    role: matchedEnvUser.role,
                    hostelType: matchedEnvUser.hostelType,
                    name: matchedEnvUser.role.toUpperCase(), // e.g., ADMIN
                },
            });
        }

        // 1. Verify Password via Firebase REST API
        const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
        const response = await axios.post(verifyUrl, {
            email,
            password,
            returnSecureToken: true,
        });

        const uid = response.data.localId;

        // 2. Fetch User Role from Firestore
        const db = firebase.db;
        const userDoc = await db.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            return res
                .status(403)
                .json({ error: "User record not found in database." });
        }

        const userData = userDoc.data();
        const actualRole = userData.role;

        // 3. Verify Role Match
        if (actualRole !== selectedRole) {
            console.warn(
                `Login blocked: User ${email} (role: ${actualRole}) tried to login as ${selectedRole}`
            );
            return res.status(403).json({
                error: `Access Denied: You are registered as a "${actualRole}", but tried to log in as "${selectedRole}".`,
            });
        }

        // 4. Generate Custom Token for Frontend
        const customToken = await firebase.admin.auth().createCustomToken(uid);

        res.json({
            token: customToken,
            user: {
                uid,
                email,
                role: actualRole,
                hostelType: userData.hostelType || null,
                name: userData.name,
            },
        });
    } catch (error) {
        console.error("Login Error:", error.response?.data || error.message);

        if (
            error.response?.data?.error?.message === "INVALID_PASSWORD" ||
            error.response?.data?.error?.message === "EMAIL_NOT_FOUND"
        ) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        res.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * Google Login with Auto-Admin Assignment
 * POST /api/auth/google
 */
const googleLogin = async (req, res) => {
    const {
        idToken,
        role: requestedRole,
        hostelType: requestedHostelType,
    } = req.body;

    if (!idToken) {
        return res.status(400).json({ error: "ID Token is required." });
    }

    try {
        // 1. Verify Google ID Token
        const decodedToken = await firebase.admin.auth().verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        const db = firebase.db;
        const userRef = db.collection("users").doc(uid);
        const userDoc = await userRef.get();

        let role = "student"; // Default role
        let hostelType = null;

        // 2. Check for Admin Email
        if (email === "mathupriya2006@gmail.com") {
            role = "admin";
        } else if (userDoc.exists) {
            // 3. If user exists, keep existing role
            const userData = userDoc.data();
            role = userData.role;
            hostelType = userData.hostelType || null;
        } else {
            // 4. New User: Use requested role/hostelType if provided
            if (requestedRole) role = requestedRole;
            if (requestedHostelType) hostelType = requestedHostelType;
        }

        // 5. Update or Create User in Firestore
        await userRef.set(
            {
                name: name || email.split("@")[0],
                email,
                role,
                hostelType,
                photoUrl: picture || null,
                lastLogin: new Date().toISOString(),
            },
            { merge: true }
        );

        // 5. Generate Custom Token (optional, but good for consistency)
        // Note: Client can also just use the Google credential, but using custom token ensures backend control
        // However, for Google Sign-In, we usually just return the role and user info
        // since the client is already authenticated with Firebase via Google.

        // But to maintain consistency with our login flow which returns a token:
        const customToken = await firebase.admin.auth().createCustomToken(uid);

        res.json({
            token: customToken,
            user: {
                uid,
                email,
                role,
                hostelType,
                name,
            },
        });
    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(401).json({ error: "Invalid Google Token" });
    }
};

module.exports = { login, googleLogin };
