// Warden Dashboard - View and resolve hostel complaints
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { auth } from "../firebase";
import { useTranslation, useTranslatedText } from "../hooks/useTranslation";
import TranslatedText from "./TranslatedText";
import SpeakButton from "./SpeakButton";
import "./Dashboard.css";

const WardenDashboard = ({ user }) => {
  console.log("🏠 WardenDashboard rendering for:", user?.email);
  const { t } = useTranslation();

  // Component for translated text with TTS
  const TranslatedSpeakButton = ({ text }) => {
    const { translatedText } = useTranslatedText(text);
    return <SpeakButton text={translatedText} />;
  };

  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");

  useEffect(() => {
    if (!user) return;

    console.log("📡 Setting up Firestore listener for Warden:", user.role);

    // 1. Base Reference to 'complaints' collection (Backend writes here)
    const complaintsRef = collection(db, "complaints");
    let q = query(complaintsRef);

    // 2. Apply Filtering based on Role/HostelType
    if (user.hostelType) {
      console.log(`🔍 Filtering for ${user.hostelType}`);
      // Handle variations (e.g., "Boys Hostel" vs "boys")
      const searchTerms = [user.hostelType];
      if (user.hostelType === "Boys Hostel") searchTerms.push("boys", "Boys", "boys hostel", "Boys hostel");
      if (user.hostelType === "Girls Hostel") searchTerms.push("girls", "Girls", "girls hostel", "Girls hostel");

      q = query(complaintsRef, where("hostelType", "in", searchTerms));
    } else if (user.role === 'warden_boys') {
      console.log("🔍 Filtering for Boys Hostel (Legacy Role Check)");
      q = query(complaintsRef, where("hostelType", "in", ["Boys Hostel", "boys", "Boys", "boys hostel", "Boys hostel"]));
    } else if (user.role === 'warden_girls') {
      console.log("🔍 Filtering for Girls Hostel (Legacy Role Check)");
      q = query(complaintsRef, where("hostelType", "in", ["Girls Hostel", "girls", "Girls", "girls hostel", "Girls hostel"]));
    } else {
      console.log("👀 Admin/VP: Showing all complaints");
      // Admin/VP see all
    }

    console.log("🛠️ Query constructed. Listening for updates...");

    // 3. Real-time Listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const complaintData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Normalize fields for frontend
        status: doc.data().resolved ? "Resolved" : (doc.data().escalated ? "Escalated" : "Pending"),
        created_at: doc.data().createdAt ? new Date(doc.data().createdAt) : new Date()
      }));

      console.log("✅ Real-time update:", complaintData.length, "complaints");

      // Client-side sort (safer than Firestore orderBy without index)
      complaintData.sort((a, b) => b.created_at - a.created_at);

      setComplaints(complaintData);
      setFilteredComplaints(complaintData);
    }, (error) => {
      console.error("❌ Firestore Error:", error);
      // Fallback or alert
      if (error.code === 'permission-denied') {
        alert("Permission denied. Please check Firestore rules.");
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (statusFilter) {
      setFilteredComplaints(
        complaints.filter((c) => c.status === statusFilter)
      );
    } else {
      setFilteredComplaints(complaints);
    }
  }, [statusFilter, complaints]);

  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      await updateDoc(doc(db, "complaints", complaintId), { // Fixed collection name to 'complaints'
        resolved: newStatus === "Resolved",
        status: newStatus, // Keep status field for backward compatibility if needed
        resolvedAt: newStatus === "Resolved" ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
        resolvedBy: user.email,
        wardenResponse: resolutionNote || null,
      });
      setResolutionNote("");
      setSelectedComplaint(null);
      alert(t("success"));
    } catch (error) {
      console.error("Error updating status:", error);
      alert(t("error") + ": " + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#f59e0b";
      case "In Progress":
        return "#3b82f6";
      case "Resolved":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>🏠 <TranslatedText text="Warden Portal" /></h2>
          <p><TranslatedText text="Hostel Management" /></p>
        </div>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <div className="sidebar-link active">
              <svg
                className="sidebar-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              <TranslatedText text="Triage / Resolution" />
            </div>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <div
          className="header"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            padding: "24px 32px",
            borderRadius: "12px",
            marginBottom: "24px",
            boxShadow: "0 4px 20px rgba(245, 158, 11, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1
                style={{
                  color: "white",
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  margin: "0 0 8px 0",
                }}
              >
                🏠 <TranslatedText text="Warden Dashboard" />
              </h1>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "1rem",
                  margin: "0",
                }}
              >
                {user.email}
              </p>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "0.9rem",
                  margin: "4px 0 0 0",
                }}
              >
                📋 <TranslatedText text="Hostel Department Complaints" />
              </p>
              {user.hostelType && (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "8px",
                    padding: "4px 12px",
                    background: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    color: "white",
                    border: "1px solid rgba(255, 255, 255, 0.4)"
                  }}
                >
                  🔍 Filtering: {user.hostelType}
                </span>
              )}
            </div>
            <button
              onClick={() => auth.signOut()}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                padding: "10px 24px",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              🚪 {t("logout")}
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2><TranslatedText text="Hostel Complaints" /> ({filteredComplaints.length})</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "2px solid #e5e7eb",
                fontSize: "0.9rem",
              }}
            >
              <option value="">{t("all_complaints")}</option>
              <option value="Pending">{t("pending")}</option>
              <option value="In Progress">{t("in_progress")}</option>
              <option value="Resolved">{t("resolved")}</option>
            </select>
          </div>

          <div className="complaints-list">
            {filteredComplaints.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#6b7280",
                }}
              >
                <p>{t("no_complaints")}</p>
              </div>
            ) : (
              filteredComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="complaint-card"
                  style={{
                    background: "white",
                    padding: "20px",
                    borderRadius: "12px",
                    marginBottom: "16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    border: "2px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "1.2rem",
                          color: "#1f2937",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <TranslatedText text={complaint.title} />
                        <TranslatedSpeakButton text={complaint.title} />
                      </h3>
                      <p
                        style={{
                          color: "#6b7280",
                          fontSize: "0.9rem",
                          margin: "0 0 8px 0",
                        }}
                      >
                        📧 {complaint.studentName || complaint.studentEmail || "Student"}
                      </p>
                      <p
                        style={{
                          color: "#374151",
                          margin: "0 0 12px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <TranslatedText text={complaint.description} />
                        <TranslatedSpeakButton text={complaint.description} />
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            background: "#f3f4f6",
                            padding: "4px 12px",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            color: "#4b5563",
                          }}
                        >
                          📁 <TranslatedText text={complaint.category} />
                        </span>
                        <span
                          style={{
                            background: "#fef3c7",
                            padding: "4px 12px",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            color: "#92400e",
                          }}
                        >
                          🏠 <TranslatedText text={complaint.hostelType || "Hostel"} />
                        </span>
                        <span
                          style={{
                            background: getStatusColor(complaint.status) + "20",
                            color: getStatusColor(complaint.status),
                            padding: "4px 12px",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                          }}
                        >
                          <TranslatedText text={complaint.status} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedComplaint === complaint.id ? (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "16px",
                        background: "#f9fafb",
                        borderRadius: "8px",
                      }}
                    >
                      <textarea
                        placeholder={t("add_comment") || "Add resolution note..."}
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "6px",
                          border: "2px solid #e5e7eb",
                          fontSize: "0.9rem",
                          marginBottom: "12px",
                          minHeight: "80px",
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() =>
                            handleUpdateStatus(complaint.id, "In Progress")
                          }
                          style={{
                            background: "#3b82f6",
                            color: "white",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                          }}
                        >
                          <TranslatedText text="Mark In Progress" />
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(complaint.id, "Resolved")
                          }
                          style={{
                            background: "#10b981",
                            color: "white",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                          }}
                        >
                          <TranslatedText text="Mark Resolved" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedComplaint(null);
                            setResolutionNote("");
                          }}
                          style={{
                            background: "#6b7280",
                            color: "white",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                          }}
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedComplaint(complaint.id)}
                      style={{
                        marginTop: "12px",
                        background: "#f59e0b",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                      }}
                    >
                      {t("update_status")}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WardenDashboard;
