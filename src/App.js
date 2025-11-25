// Main app component handling routing and auth state
import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import Login from "./components/login";
import Signup from "./components/Signup";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import VPDashboard from "./components/VPDashboard";
import WardenDashboard from "./components/SimpleWardenDashboard";
import FacultyDashboard from "./components/SimpleFacultyDashboard";
import DebugPanel from "./components/DebugPanel";
import { LanguageProvider } from "./contexts/LanguageContext";
import LanguageSelector from "./components/LanguageSelector";
import TranslationDemo from "./components/TranslationDemo";

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // New state for Firestore data
  const [loading, setLoading] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Enable debug mode with Ctrl+Shift+D
  // Enable demo mode with Ctrl+Shift+T (Translation demo)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setDebugMode((prev) => !prev);
        console.log("Debug mode:", !debugMode ? "ENABLED" : "DISABLED");
      }
      if (e.ctrlKey && e.shiftKey && e.key === "T") {
        setShowDemo((prev) => !prev);
        console.log("Translation Demo:", !showDemo ? "ENABLED" : "DISABLED");
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [debugMode, showDemo]);

  useEffect(() => {
    console.log("🔧 Setting up auth listener...");
    let isSubscribed = true;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!isSubscribed) return;

      if (user) {
        console.log("✅ User authenticated, fetching role...");
        setUser(user);

        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          let role = "student";

          if (userSnap.exists()) {
            const data = userSnap.data();
            role = data.role || "student";
            setUserProfile(data); // Store full profile
          } else {
            // Fallback to email-based detection
            const email = (user.email || "").toLowerCase();
            if (email.includes("admin")) role = "admin";
            else if (email.includes("warden")) role = "warden";
            else if (email.includes("hod")) role = "hod";
            else if (email.includes("faculty")) role = "faculty";
            setUserProfile({ role }); // Minimal profile
          }

          setUserRole(role);
          console.log("✅ Role determined:", role);
        } catch (fetchErr) {
          console.warn("Error fetching role:", fetchErr);
          setUserRole("student");
        }
      } else {
        console.log("❌ User logged out");
        setUser(null);
        setUserRole(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  // Redirect logic based on role
  useEffect(() => {
    if (!loading && user && userRole) {
      const path = location.pathname;
      // Only redirect if we are on login, signup, or root
      if (path === "/login" || path === "/signup" || path === "/") {
        if (userRole === "admin") navigate("/admin-dashboard");
        else if (userRole === "vp") navigate("/vp-dashboard");
        else if (
          userRole === "warden" ||
          userRole === "warden_boys" ||
          userRole === "warden_girls"
        )
          navigate("/warden-dashboard");
        else if (userRole === "faculty" || userRole === "hod")
          navigate("/faculty-dashboard");
        else navigate("/student-dashboard");
      }
    }
  }, [user, userRole, loading, navigate, location.pathname]);

  // Memoize the combined user object to prevent re-renders
  const combinedUser = React.useMemo(() => {
    if (!user) return null;
    return { ...user, ...userProfile };
  }, [user, userProfile]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
          color: "white",
          fontSize: "1.5rem",
          fontWeight: "bold",
        }}
      >
        Loading...
      </div>
    );
  }

  const languageSelectorStyle = {
    position: "absolute",
    top: "20px",
    right: "20px",
    zIndex: 1000,
  };

  // Protected Route Component
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) return <Navigate to="/login" />;
    if (
      allowedRoles &&
      !allowedRoles.includes(userRole) &&
      !allowedRoles.includes("any")
    ) {
      // Redirect to appropriate dashboard if role doesn't match
      if (userRole === "admin") return <Navigate to="/admin-dashboard" />;
      if (
        userRole === "warden" ||
        userRole === "warden_boys" ||
        userRole === "warden_girls"
      )
        return <Navigate to="/warden-dashboard" />;
      if (userRole === "faculty" || userRole === "hod")
        return <Navigate to="/faculty-dashboard" />;
      return <Navigate to="/student-dashboard" />;
    }
    return <>{children}</>;
  };

  return (
    <LanguageProvider>
      {debugMode && (
        <div>
          <div
            style={{
              position: "fixed",
              top: "10px",
              right: "10px",
              backgroundColor: "#ef4444",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontWeight: "bold",
              zIndex: 9999,
              cursor: "pointer",
            }}
            onClick={() => setDebugMode(false)}
          >
            🔍 DEBUG MODE - Click to Exit
          </div>
          <DebugPanel />
        </div>
      )}

      {showDemo && (
        <div>
          <div
            style={{
              position: "fixed",
              top: "10px",
              right: "10px",
              backgroundColor: "#8b5cf6",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontWeight: "bold",
              zIndex: 9999,
              cursor: "pointer",
            }}
            onClick={() => setShowDemo(false)}
          >
            🌐 TRANSLATION DEMO - Click to Exit
          </div>
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              zIndex: 1000,
            }}
          >
            <LanguageSelector />
          </div>
          <TranslationDemo />
        </div>
      )}

      <Routes>
        <Route
          path="/login"
          element={
            !user ? (
              <Login onShowSignup={() => navigate("/signup")} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/signup"
          element={
            !user ? (
              <Signup onBackToLogin={() => navigate("/login")} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard user={combinedUser} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard user={combinedUser} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vp-dashboard"
          element={
            <ProtectedRoute allowedRoles={["vp"]}>
              <VPDashboard user={combinedUser} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/warden-dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["warden", "warden_boys", "warden_girls"]}
            >
              <WardenDashboard user={combinedUser} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute allowedRoles={["faculty", "hod"]}>
              <FacultyDashboard user={combinedUser} />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </LanguageProvider>
  );
}

export default App;
