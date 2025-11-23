// Debug panel to show current auth state
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const DebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState({
    user: null,
    role: null,
    firestoreData: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          
          setDebugInfo({
            user: {
              uid: user.uid,
              email: user.email,
              emailVerified: user.emailVerified,
            },
            role: userDoc.exists() ? userDoc.data().role : "NOT FOUND",
            firestoreData: userDoc.exists() ? userDoc.data() : null,
            loading: false,
          });
        } catch (error) {
          setDebugInfo({
            user: {
              uid: user.uid,
              email: user.email,
              emailVerified: user.emailVerified,
            },
            role: "ERROR",
            firestoreData: null,
            loading: false,
            error: error.message,
          });
        }
      } else {
        setDebugInfo({
          user: null,
          role: null,
          firestoreData: null,
          loading: false,
        });
      }
    });
    
    return unsubscribe;
  }, []);

  if (debugInfo.loading) {
    return <div style={styles.container}>Loading debug info...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🔍 Debug Panel</h2>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Authentication Status</h3>
        <div style={styles.info}>
          <strong>Logged In:</strong> {debugInfo.user ? "✅ YES" : "❌ NO"}
        </div>
        {debugInfo.user && (
          <>
            <div style={styles.info}>
              <strong>Email:</strong> {debugInfo.user.email}
            </div>
            <div style={styles.info}>
              <strong>UID:</strong> {debugInfo.user.uid}
            </div>
          </>
        )}
      </div>

      {debugInfo.user && (
        <>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Firestore User Document</h3>
            <div style={styles.info}>
              <strong>Role:</strong>{" "}
              <span style={{
                color: debugInfo.role === "admin" ? "#22c55e" : 
                       debugInfo.role === "student" ? "#3b82f6" : "#ef4444",
                fontWeight: "bold",
                fontSize: "1.2rem"
              }}>
                {debugInfo.role}
              </span>
            </div>
            {debugInfo.firestoreData ? (
              <div style={styles.codeBlock}>
                <pre>{JSON.stringify(debugInfo.firestoreData, null, 2)}</pre>
              </div>
            ) : (
              <div style={{ color: "#ef4444", marginTop: "0.5rem" }}>
                ⚠️ No Firestore document found for this user!
              </div>
            )}
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Expected Dashboard</h3>
            <div style={styles.info}>
              {debugInfo.role === "admin" ? (
                <div style={{ color: "#22c55e", fontSize: "1.2rem", fontWeight: "bold" }}>
                  ✅ Should show: ADMIN DASHBOARD
                </div>
              ) : debugInfo.role === "student" ? (
                <div style={{ color: "#3b82f6", fontSize: "1.2rem", fontWeight: "bold" }}>
                  ✅ Should show: STUDENT DASHBOARD
                </div>
              ) : (
                <div style={{ color: "#ef4444", fontSize: "1.2rem", fontWeight: "bold" }}>
                  ❌ ERROR: No valid role found!
                </div>
              )}
            </div>
          </div>

          {debugInfo.role !== "admin" && debugInfo.user.email.includes("admin") && (
            <div style={styles.warning}>
              <h3>⚠️ Warning</h3>
              <p>Your email contains "admin" but your role is "{debugInfo.role}".</p>
              <p><strong>Solution:</strong> Create a new account or update Firestore manually.</p>
            </div>
          )}

          {debugInfo.error && (
            <div style={styles.error}>
              <h3>❌ Error</h3>
              <p>{debugInfo.error}</p>
            </div>
          )}
        </>
      )}

      <div style={styles.section}>
        <button 
          onClick={() => auth.signOut()} 
          style={styles.button}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "800px",
    margin: "2rem auto",
    padding: "2rem",
    backgroundColor: "#1f2937",
    color: "white",
    borderRadius: "12px",
    fontFamily: "monospace",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
    textAlign: "center",
    color: "#60a5fa",
  },
  section: {
    marginBottom: "1.5rem",
    padding: "1rem",
    backgroundColor: "#374151",
    borderRadius: "8px",
  },
  sectionTitle: {
    fontSize: "1.2rem",
    marginBottom: "0.75rem",
    color: "#93c5fd",
  },
  info: {
    marginBottom: "0.5rem",
    fontSize: "1rem",
  },
  codeBlock: {
    backgroundColor: "#111827",
    padding: "1rem",
    borderRadius: "6px",
    marginTop: "0.5rem",
    overflow: "auto",
  },
  warning: {
    backgroundColor: "#f59e0b",
    color: "#000",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
  error: {
    backgroundColor: "#ef4444",
    color: "#fff",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
  button: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default DebugPanel;
