import React, { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import "./login.css";

const Login = ({ onShowSignup }) => {
  const [selectedRole, setSelectedRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ----------------------------
  // GOOGLE LOGIN (Firebase Only)
  // ----------------------------
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);

      console.log("✅ Google Login success");
      window.location.reload();
    } catch (err) {
      console.error("❌ Google Login Error:", err);
      setError(err.message);
    }

    setLoading(false);
  };

  // --------------------------------------
  // EMAIL + PASSWORD LOGIN (Firebase Only)
  // --------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("🔐 Firebase login attempt...");

      await signInWithEmailAndPassword(auth, email, password);

      console.log("✅ Firebase email login success");
      window.location.reload();
    } catch (err) {
      console.error("❌ Login Error:", err);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: "500px", padding: "2.5rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "700", color: "#1e293b" }}>
            Welcome Back
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Sign in to the Grievance Cell
          </p>
        </div>

        {/* Error Box */}
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

        {/* Login Form */}
        <form onSubmit={handleLogin}>

          {/* Role Selection (only UI, not backend) */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#475569" }}>
              Select Role <span style={{ color: "red" }}>*</span>
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
                backgroundColor: "#f8fafc",
              }}
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

          {/* Email */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#475569" }}>
              Email Address <span style={{ color: "red" }}>*</span>
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
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1.5rem", position: "relative" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#475569" }}>
              Password <span style={{ color: "red" }}>*</span>
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
              }}
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
                fontSize: "1.25rem",
                cursor: "pointer",
                color: "#94a3b8",
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
              opacity: loading ? 0.7 : 1,
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

        {/* Google Login */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            fontSize: "0.95rem",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: "18px", height: "18px" }}
          />
          Continue with Google
        </button>

        {/* Show Signup only for students */}
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
