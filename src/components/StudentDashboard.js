// Student dashboard: Submit form and list grievances
import React, { useState, useEffect } from "react";
import API_BASE from "../config";
import GrievanceForm from "./GrievanceForm";
import { auth } from "../firebase";
import { useTranslation } from "../hooks/useTranslation";
import TranslatedText from "./TranslatedText";
import SpeakButton from "./SpeakButton";
import { useTranslatedText } from "../hooks/useTranslation";
import LanguageSelector from "./LanguageSelector";
import "./Dashboard.css";

const StudentDashboard = ({ user }) => {
  console.log("📚 STUDENT DASHBOARD loaded for:", user?.email);
  console.log(
    "⚠️ If you expected ADMIN dashboard, your account role is 'student'"
  );

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("summary");
  const [grievances, setGrievances] = useState([]);
  const [categoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filteredGrievances, setFilteredGrievances] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    open: 0,
    avgResolutionDays: 0,
  });

  // Component for translated text with TTS
  const TranslatedSpeakButton = ({ text }) => {
    const { translatedText } = useTranslatedText(text);
    return <SpeakButton text={translatedText} />;
  };

  useEffect(() => {
    // Wait for user to be available
    if (!user || !user.uid) return;

    const fetchComplaints = async () => {
      try {
        console.log("📡 Fetching complaints from Backend API...");
        const response = await fetch(
          `${API_BASE}/api/complaints/student/${user.uid}`
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ API Response:", data);

        const grievanceData = data.map((d) => {
          // Map Backend Fields to Frontend State
          return {
            id: d.id,
            ...d,
            // Map 'resolved' boolean to 'status' string
            status: d.resolved
              ? "Resolved"
              : d.escalated
              ? "Escalated"
              : "Pending",
            // Map 'createdAt' (ISO string) to 'created_at' (Date object or keep string)
            created_at: d.createdAt ? new Date(d.createdAt) : new Date(),
            updated_at: d.resolvedAt ? new Date(d.resolvedAt) : new Date(),
            // Ensure title exists (Backend stores description only)
            title: d.category || "Complaint",
            description: d.description,
          };
        });

        // Sort by date (newest first)
        grievanceData.sort((a, b) => b.created_at - a.created_at);

        setGrievances(grievanceData);
        setFilteredGrievances(grievanceData);

        // Update Stats
        const total = grievanceData.length;
        const resolved = grievanceData.filter(
          (g) => g.status === "Resolved"
        ).length;
        const open = grievanceData.filter((g) => g.status === "Pending").length;

        // Calculate Avg Resolution Time
        const resolvedGrievances = grievanceData.filter(
          (g) => g.status === "Resolved"
        );
        let totalDays = 0;
        resolvedGrievances.forEach((g) => {
          if (g.created_at && g.updated_at) {
            const diffTime = Math.abs(g.updated_at - g.created_at);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalDays += diffDays;
          }
        });
        const avgDays = resolvedGrievances.length
          ? Math.round(totalDays / resolvedGrievances.length)
          : 0;

        setStats({ total, resolved, open, avgResolutionDays: avgDays });
      } catch (error) {
        console.error("❌ Error fetching complaints:", error);
        setStats((prev) => ({ ...prev, error: error.message }));
      }
    };

    fetchComplaints();

    // Poll every 10 seconds for updates (since we removed real-time listener)
    const interval = setInterval(fetchComplaints, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    let filtered = grievances;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.title?.toLowerCase().includes(term) ||
          g.description?.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((g) => g.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((g) => g.status === statusFilter);
    }

    setFilteredGrievances(filtered);
  }, [categoryFilter, statusFilter, searchTerm, grievances]);

  const handleSubmit = async (data) => {
    console.log("🚀 handleSubmit called with data:", data);

    if (!user) {
      console.error("❌ User object is missing! Submission aborted.");
      return { success: false, error: "User authentication missing" };
    }

    try {
      // Map duration string to days (integer) for backend logic
      let resolutionDays = 7; // Default Normal
      const durationStr = data.expectedDuration || "";
      if (durationStr.includes("24 Hours")) resolutionDays = 1;
      else if (durationStr.includes("3 Days")) resolutionDays = 3;
      else if (durationStr.includes("1 Week")) resolutionDays = 7;
      else if (durationStr.includes("Flexible")) resolutionDays = 30;

      // Prepare payload for Backend API
      const payload = {
        studentId: user.uid,
        studentName: user.displayName || user.email.split("@")[0] || "Student",
        studentEmail: user.email,
        registerNumber: user.uid.substring(0, 8).toUpperCase(), // Fallback if not available
        category: data.category,
        description: `${data.title}\n\n${data.description}`, // Combine title and description
        hostelType: data.hostelType || "Boys Hostel", // Default to Boys Hostel if missing
        resolutionTime: resolutionDays,
      };

      console.log("🚀 Sending complaint to Backend API:", payload);

      const response = await fetch(`${API_BASE}/api/complaints/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Backend submission failed");
      }

      console.log("✅ Backend response:", result);

      // Immediately switch to My Grievances tab
      setActiveTab("myGrievances");
      return { success: true, id: result.complaintId };
    } catch (error) {
      console.error("❌ Error submitting grievance (API):", error);
      return {
        success: false,
        error: error.message || "Network error connecting to backend",
      };
    }
  };

  const renderSummary = () => (
    <div className="dashboard-content">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <h2 className="page-title" style={{ margin: 0 }}>
          {t("dashboard")} {t("welcome")}
        </h2>
        <TranslatedSpeakButton text={t("dashboard") + " " + t("welcome")} />
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{t("my_complaints")}</h3>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <h3>{t("resolved_complaints")}</h3>
          <div className="stat-value">{stats.resolved}</div>
        </div>
        <div className="stat-card">
          <h3>{t("pending_complaints")}</h3>
          <div className="stat-value">{stats.open}</div>
        </div>
        <div className="stat-card">
          <h3>
            <TranslatedText text="Avg. Resolution Time" />
          </h3>
          <div className="stat-value">
            {stats.avgResolutionDays} {t("days") || "Days"}
          </div>
        </div>
      </div>

      <div className="chart-section">
        <h3>{t("statistics")}</h3>
        <div className="breakdown-info">
          <h4>{t("category")}</h4>
          <div>
            {Object.entries(
              grievances.reduce((acc, g) => {
                acc[g.category] = (acc[g.category] || 0) + 1;
                return acc;
              }, {})
            ).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubmitGrievance = () => {
    if (!user) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p style={{ margin: 0 }}>
            <TranslatedText text="Loading user session..." />
          </p>
        </div>
      );
    }
    return <GrievanceForm onSubmit={handleSubmit} />;
  };

  const renderMyGrievances = () => (
    <div className="grievances-list">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2 className="page-title" style={{ margin: 2 }}>
            {t("my_complaints")}
          </h2>
          <TranslatedSpeakButton text={t("my_complaints")} />
        </div>
        <button
          onClick={() => window.location.reload()}
          className="filter-btn"
          style={{ marginLeft: "auto" }}
        >
          🔄 {t("loading")}
        </button>
      </div>
      <div className="search-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder={t("search") + "..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${!statusFilter && "active"}`}
            onClick={() => setStatusFilter("")}
          >
            {t("all_complaints")}
          </button>
          <button
            className={`filter-btn ${statusFilter === "Pending" && "active"}`}
            onClick={() => setStatusFilter("Pending")}
          >
            {t("pending")}
          </button>
          <button
            className={`filter-btn ${
              statusFilter === "In Progress" && "active"
            }`}
            onClick={() => setStatusFilter("In Progress")}
          >
            {t("in_progress")}
          </button>
          <button
            className={`filter-btn ${statusFilter === "Resolved" && "active"}`}
            onClick={() => setStatusFilter("Resolved")}
          >
            {t("resolved")}
          </button>
          <button
            className={`filter-btn ${statusFilter === "Escalated" && "active"}`}
            onClick={() => setStatusFilter("Escalated")}
          >
            <TranslatedText text="Escalated" />
          </button>
        </div>
      </div>

      <div className="grievance-table">
        <div className="table-header">
          <div>ID</div>
          <div>{t("title")}</div>
          <div>{t("category")}</div>
          <div>{t("date")}</div>
          <div>{t("status")}</div>
        </div>
        {filteredGrievances.length === 0 ? (
          <div className="empty-state">
            <p>{t("no_complaints")}</p>
          </div>
        ) : (
          filteredGrievances.map((g) => (
            <div key={g.id} className="table-row">
              <div>GR-{g.id.substring(0, 4)}</div>
              <div>
                <TranslatedText text={g.title} />
              </div>
              <div>
                <TranslatedText text={g.category} />
              </div>
              <div>
                {g.created_at?.toDate
                  ? g.created_at.toDate().toLocaleDateString()
                  : "-"}
              </div>
              <div>
                <span
                  className={`status-badge status-${g.status.toLowerCase()}`}
                >
                  <TranslatedText text={g.status} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-brand">
          <TranslatedText text="GRIEVANCE CELL" />
        </div>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <button
              onClick={() => setActiveTab("summary")}
              className={`sidebar-link ${
                activeTab === "summary" ? "active" : ""
              }`}
              style={{
                background: "none",
                border: "none",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <svg
                className="sidebar-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
              {t("dashboard")}
            </button>
          </li>
          <li className="sidebar-item">
            <button
              onClick={() => setActiveTab("submitGrievance")}
              className={`sidebar-link ${
                activeTab === "submitGrievance" ? "active" : ""
              }`}
              style={{
                background: "none",
                border: "none",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <svg
                className="sidebar-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              {t("submit_grievance")}
            </button>
          </li>
          <li className="sidebar-item">
            <button
              onClick={() => setActiveTab("myGrievances")}
              className={`sidebar-link ${
                activeTab === "myGrievances" ? "active" : ""
              }`}
              style={{
                background: "none",
                border: "none",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <svg
                className="sidebar-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              {t("my_grievances")}
            </button>
          </li>
        </ul>
      </div>
      <div className="main-content">
        <div
          className="header"
          style={{
            background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
            padding: "24px 32px",
            borderRadius: "16px",
            marginBottom: "24px",
            boxShadow: "0 8px 32px rgba(6, 182, 212, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  color: "white",
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  margin: "0 0 8px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  letterSpacing: "-0.5px",
                }}
              >
                👋 {t("welcome")}!
              </h1>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.95)",
                  fontSize: "1rem",
                  margin: "0 0 4px 0",
                  fontWeight: "500",
                }}
              >
                {user.email}
              </p>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.85)",
                  fontSize: "0.9rem",
                  margin: "0",
                  fontStyle: "italic",
                }}
              >
                💬 {t("submit_grievance")} • {t("track_status")} •{" "}
                {t("get_help")}
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <LanguageSelector />
              <button
                onClick={() => auth.signOut()}
                style={{
                  background: "rgba(255, 255, 255, 0.25)",
                  color: "white",
                  border: "2px solid rgba(255, 255, 255, 0.4)",
                  padding: "12px 28px",
                  borderRadius: "50px",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                }}
                onMouseOver={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.35)";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.15)";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.25)";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.1)";
                }}
              >
                🚪 {t("logout")}
              </button>
            </div>
          </div>
        </div>

        {activeTab === "summary" && renderSummary()}
        {activeTab === "submitGrievance" && renderSubmitGrievance()}
        {activeTab === "myGrievances" && renderMyGrievances()}
      </div>
    </div>
  );
};

export default StudentDashboard;
