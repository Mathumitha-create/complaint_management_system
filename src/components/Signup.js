// Signup component using Firebase Auth
import React, { useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import "./login.css";

const Signup = ({ onBackToLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [hostelType, setHostelType] = useState("");
  // Force role to student; other roles cannot self-register
  const [role] = useState("student");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters");
      setLoading(false);
      return;
    }

    // Hostel type required for students (only self-registerable role now)
    if (!hostelType) {
      setError("Please select your hostel type");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name || user.email.split("@")[0],
        email: user.email,
        role: role,
        registerNumber: registerNumber || "",
        hostelType: hostelType,
        createdAt: new Date(),
      });

      // Reload to trigger auth state change in App.js
      window.location.reload();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists");
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      console.log("🔐 Google Sign-Up successful. Verifying with backend...");

      // Call Backend API to Verify Google Token & Create User with Role
      const response = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          role, // Pass selected role
          hostelType, // Pass selected hostel type
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Google Sign-Up failed");
      }

      console.log("✅ Backend verification successful. Role:", data.user.role);

      // Reload to let App.js handle the new auth state
      window.location.reload();
    } catch (err) {
      console.error("❌ Google Sign-Up Error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div
        className="login-card"
        style={{ maxWidth: "600px", padding: "2.5rem" }}
      >
        <button
          onClick={onBackToLogin}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            fontSize: "28px",
            color: "#94a3b8",
            cursor: "pointer",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            transition: "all 0.2s",
          }}
        >
          ×
        </button>

        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h2
            style={{
              fontSize: "1.875rem",
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: "0.5rem",
            }}
          >
            Create Your Account
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Join the Grievance Management System
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#dc2626",
              padding: "1rem",
              borderRadius: "10px",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#475569",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              Full Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: "2px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "0.95rem",
                transition: "border-color 0.2s",
                backgroundColor: "#f8fafc",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#475569",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              Email Address <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: "2px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "0.95rem",
                transition: "border-color 0.2s",
                backgroundColor: "#f8fafc",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {/* Role selection removed: only students can register */}

          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#475569",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              Register Number{" "}
              <span style={{ color: "#94a3b8", fontWeight: "400" }}>
                (Optional)
              </span>
            </label>
            <input
              type="text"
              placeholder="Enter your register number"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: "2px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "0.95rem",
                transition: "border-color 0.2s",
                backgroundColor: "#f8fafc",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#475569",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              Hostel Type <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              value={hostelType}
              onChange={(e) => setHostelType(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: "2px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "0.95rem",
                transition: "border-color 0.2s",
                backgroundColor: "#f8fafc",
                cursor: "pointer",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            >
              <option value="">Select Hostel Type</option>
              <option value="boys">Boys Hostel</option>
              <option value="girls">Girls Hostel</option>
            </select>
          </div>

          <div style={{ marginBottom: "1.25rem", position: "relative" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#475569",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              Password <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength="6"
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                paddingRight: "3rem",
                border: "2px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "0.95rem",
                transition: "border-color 0.2s",
                backgroundColor: "#f8fafc",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "1rem",
                top: "2.25rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                fontSize: "1.25rem",
              }}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          <div style={{ marginBottom: "1.5rem", position: "relative" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#475569",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              Confirm Password <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength="6"
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                paddingRight: "3rem",
                border: "2px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "0.95rem",
                transition: "border-color 0.2s",
                backgroundColor: "#f8fafc",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: "1rem",
                top: "2.25rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                fontSize: "1.25rem",
              }}
            >
              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
              opacity: loading ? 0.7 : 1,
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 6px 16px rgba(102, 126, 234, 0.4)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 12px rgba(102, 126, 234, 0.3)";
              }
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Google Sign-In Button */}
        <div
          style={{
            marginTop: "1.5rem",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "1.5rem",
          }}
        >
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "#fff",
              color: "#333",
              border: "1px solid #ddd",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              transition: "all 0.2s",
            }}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              style={{ width: "18px", height: "18px" }}
            />
            {loading ? "Signing in..." : "Sign up with Google"}
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "0.875rem",
            color: "#64748b",
          }}
        >
          Already have an account?{" "}
          <button
            type="button"
            onClick={onBackToLogin}
            style={{
              background: "none",
              border: "none",
              color: "#667eea",
              fontWeight: "600",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Sign In
          </button>
        </p>

        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "#f1f5f9",
            borderRadius: "10px",
            fontSize: "0.8rem",
            color: "#64748b",
            lineHeight: "1.5",
          }}
        >
          <strong>Note:</strong> Only <strong>students</strong> can create
          accounts here. All other roles (warden, faculty, HOD, VP, admin) are
          provisioned by the administration. Please use the credentials provided
          to you.
        </div>
      </div>
    </div>
  );
};

export default Signup;
