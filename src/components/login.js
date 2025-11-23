// Login component using Backend Verification
import React, { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithCustomToken,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import "./login.css";

const Login = ({ onShowSignup }) => {
  const [selectedRole, setSelectedRole] = useState("student"); // Default to student
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      console.log("🔐 Google Sign-In successful. Verifying with backend...");

      // Call Backend API to Verify Google Token & Get Role
      const response = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Google Login failed");
      }

      console.log("✅ Backend verification successful. Role:", data.user.role);

      // Reload to let App.js handle the new auth state and redirection
      window.location.reload();
    } catch (err) {
      console.error("❌ Google Login Error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Handle Login Submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log(`🔐 Attempting login as ${selectedRole}...`);

      // 1. Call Backend API to Verify Credentials & Role
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      console.log("✅ Backend verification successful. Signing in...");

      // 2. Sign in with Custom Token from Backend
      await signInWithCustomToken(auth, data.token);

      // 3. Redirect based on Role
      const role = data.user.role;
      console.log("🚀 Redirecting to dashboard for role:", role);

      // Since we're not using React Router, just reload the page
      // The auth state will handle showing the correct dashboard
      window.location.reload();
    } catch (err) {
      console.error("❌ Login Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div
        className="login-card"
        style={{ maxWidth: "500px", padding: "2.5rem" }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: "0.5rem",
            }}
          >
            Welcome Back
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Sign in to the Grievance Cell
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

        <form onSubmit={handleLogin}>
          {/* Role Selection */}
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
              Select Role <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
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
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em 1.5em",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            >
              <option value="student">Student</option>
              <option value="warden_girls">Girls Hostel Warden</option>
              <option value="warden_boys">Boys Hostel Warden</option>
              <option value="vp">Vice Principal</option>
              <option value="admin">Admin</option>
              <option value="hod">HOD</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          {/* Email Field */}
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
              placeholder="Enter your email"
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

          {/* Password Field */}
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
              Password <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          {/* Login Button */}
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
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "1.5rem 0",
            color: "#94a3b8",
            fontSize: "0.875rem",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
          <span style={{ padding: "0 10px" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: "#fff",
            color: "#333",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            fontSize: "0.95rem",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "all 0.2s",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#f8fafc")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#fff")}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: "18px", height: "18px" }}
          />
          Continue with Google
        </button>

        {/* Signup Link visible only for student role */}
        {selectedRole === "student" && (
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
              New student?{" "}
              <button
                type="button"
                onClick={onShowSignup}
                style={{
                  background: "none",
                  border: "none",
                  color: "#667eea",
                  fontWeight: "600",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Sign Up Here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
