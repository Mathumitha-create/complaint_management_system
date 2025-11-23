// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCrgpFValhMfN9Xi1v4zPKusZnQ02ZjEyI",
  authDomain: "grievance-cell-3c548.firebaseapp.com",
  projectId: "grievance-cell-3c548",
  storageBucket: "grievance-cell-3c548.appspot.com", // ✅ fixed
  messagingSenderId: "919523730013",
  appId: "1:919523730013:web:5f5391b78ad6f6826123b4",
  measurementId: "G-VKD9C3DHBZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export initialized instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
