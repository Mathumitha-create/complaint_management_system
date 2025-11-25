import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useTranslation } from "../hooks/useTranslation";
import TranslatedText from "./TranslatedText";
import {
  calculatePriority,
  getSLAStatus,
  getTimeRemaining,
  isOverdue,
  calculateSLACompliance,
  getComplaintsBySLAStatus,
} from "../utils/slaUtils";

const SimpleFacultyDashboard = ({ user }) => {
  console.log("✅✅✅ SimpleFacultyDashboard is rendering for:", user?.email);

  const { t, currentLanguage } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [speakingId, setSpeakingId] = useState(null);

  const isHOD = user?.email?.toLowerCase().includes("hod");
  const role = isHOD ? "HOD" : "Faculty";

  useEffect(() => {
    console.log(`🎯 ${role} Dashboard MOUNTED - Fetching academic complaints`);

    const q = query(collection(db, "grievances"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allComplaints = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter for academic-related complaints
        const academicComplaints = allComplaints.filter((c) => {
          const category = c.category?.toLowerCase() || "";
          return (
            category.includes("academic") ||
            category.includes("course") ||
            category.includes("exam") ||
            category.includes("library") ||
            category.includes("lab") ||
            category.includes("classroom") ||
            category.includes("faculty") ||
            category.includes("teaching") ||
            category.includes("personnel") ||
            category.includes("administrative")
          );
        });

        console.log(
          "✅ Academic complaints loaded:",
          academicComplaints.length
        );
        setComplaints(academicComplaints);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Error loading complaints:", error);
        setLoading(false);
      }
    );

    return () => {
      console.log(`🧹 Cleaning up ${role} dashboard`);
      unsubscribe();
    };
  }, [role]);

  const updateStatus = async (complaintId, newStatus) => {
    try {
      const complaintRef = doc(db, "grievances", complaintId);
      await updateDoc(complaintRef, {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: user.email,
      });
      console.log("✅ Status updated to:", newStatus);
    } catch (error) {
      console.error("❌ Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const filteredComplaints =
    filter === "All"
      ? complaints
      : complaints.filter((c) => c.status === filter);

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "Pending").length,
    inProgress: complaints.filter((c) => c.status === "In Progress").length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
  };

  // SLA stats
  const slaCompliance = calculateSLACompliance(complaints);
  const slaCounts = getComplaintsBySLAStatus(complaints);
  const overdueCount = complaints.filter((c) => isOverdue(c)).length;

  // Text-to-speech function with proper language support and translated text
  const speakText = async (text, complaintId) => {
    if ("speechSynthesis" in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      if (speakingId === complaintId) {
        setSpeakingId(null);
        return;
      }

      // For dynamic content, we need to translate it first
      let textToSpeak = text;
      if (currentLanguage !== "en") {
        try {
          // Import translation service dynamically to avoid circular dependencies
          const { translateText } = await import(
            "../services/translationService"
          );
          textToSpeak = await translateText(text, currentLanguage);
        } catch (error) {
          console.error("Translation error:", error);
          textToSpeak = text; // Fallback to original text
        }
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      // Language mapping for better TTS support
      const languageVoiceMap = {
        en: "en-US",
        hi: "hi-IN",
        ta: "ta-IN",
        te: "te-IN",
        bn: "bn-IN",
        mr: "mr-IN",
        gu: "gu-IN",
        kn: "kn-IN",
        ml: "ml-IN",
        pa: "pa-IN",
        or: "or-IN",
        as: "as-IN",
        ur: "ur-IN",
        sa: "sa-IN",
        ks: "ks-IN",
        sd: "sd-IN",
        ne: "ne-NP",
        si: "si-LK",
      };

      // Set language
      const lang = languageVoiceMap[currentLanguage] || "en-US";
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);

      setSpeakingId(complaintId);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech not supported in this browser");
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial",
        minHeight: "100vh",
        background: "#f3f4f6",
      }}
    >
      <div
        style={{
          background: isHOD
            ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
            : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          padding: "30px",
          borderRadius: "10px",
          color: "white",
          marginBottom: "20px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "2rem" }}>
              {isHOD ? "👔" : "👨‍🏫"} {role} Dashboard
            </h1>
            <p style={{ margin: "0", opacity: 0.9, fontSize: "1rem" }}>
              Email: {user?.email}
            </p>
            <p
              style={{ margin: "5px 0 0 0", opacity: 0.8, fontSize: "0.9rem" }}
            >
              Academic Department - Manage academic complaints
            </p>
          </div>
          <button
            onClick={() => auth.signOut()}
            style={{
              background: "white",
              color: isHOD ? "#8b5cf6" : "#10b981",
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1rem",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{ fontSize: "2rem", fontWeight: "bold", color: "#3b82f6" }}
          >
            {stats.total}
          </div>
          <div style={{ color: "#6b7280", marginTop: "5px" }}>
            <TranslatedText text="Total Complaints" />
          </div>
        </div>
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{ fontSize: "2rem", fontWeight: "bold", color: "#f59e0b" }}
          >
            {stats.pending}
          </div>
          <div style={{ color: "#6b7280", marginTop: "5px" }}>
            <TranslatedText text="Pending" />
          </div>
        </div>
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{ fontSize: "2rem", fontWeight: "bold", color: "#8b5cf6" }}
          >
            {stats.inProgress}
          </div>
          <div style={{ color: "#6b7280", marginTop: "5px" }}>
            <TranslatedText text="In Progress" />
          </div>
        </div>
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}
          >
            {stats.resolved}
          </div>
          <div style={{ color: "#6b7280", marginTop: "5px" }}>
            <TranslatedText text="Resolved" />
          </div>
        </div>
      </div>

      {/* SLA Monitoring Card */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{ margin: "0 0 15px 0", color: "#1f2937", fontSize: "1.2rem" }}
        >
          ⏱️ <TranslatedText text="SLA Monitoring" />
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "15px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "15px",
              background: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#10b981",
              }}
            >
              {slaCompliance}%
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#6b7280",
                marginTop: "5px",
              }}
            >
              <TranslatedText text="SLA Compliance" />
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "15px",
              background: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#ef4444",
              }}
            >
              {overdueCount}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#6b7280",
                marginTop: "5px",
              }}
            >
              <TranslatedText text="Overdue" />
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "15px",
              background: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#f59e0b",
              }}
            >
              {slaCounts.critical}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#6b7280",
                marginTop: "5px",
              }}
            >
              <TranslatedText text="Critical" />
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "15px",
              background: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#fbbf24",
              }}
            >
              {slaCounts.warning}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#6b7280",
                marginTop: "5px",
              }}
            >
              <TranslatedText text="Warning" />
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "15px",
              background: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#10b981",
              }}
            >
              {slaCounts.onTrack}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#6b7280",
                marginTop: "5px",
              }}
            >
              <TranslatedText text="On Track" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div
        style={{
          background: "white",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {["All", "Pending", "In Progress", "Resolved"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: "8px 16px",
              border:
                filter === status
                  ? `2px solid ${isHOD ? "#8b5cf6" : "#10b981"}`
                  : "2px solid #e5e7eb",
              background:
                filter === status ? (isHOD ? "#ede9fe" : "#d1fae5") : "white",
              color:
                filter === status ? (isHOD ? "#6b21a8" : "#065f46") : "#6b7280",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: filter === status ? "bold" : "normal",
              fontSize: "0.9rem",
            }}
          >
            <TranslatedText text={status} />
          </button>
        ))}
      </div>

      {/* Complaints List */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginTop: 0, color: "#1f2937", marginBottom: "20px" }}>
          📚 <TranslatedText text="Academic Complaints" /> (
          {filteredComplaints.length})
        </h2>

        {loading ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>
            <TranslatedText text="Loading complaints..." />
          </p>
        ) : filteredComplaints.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}
          >
            <p style={{ fontSize: "1.2rem", marginBottom: "10px" }}>
              <TranslatedText text="No complaints found" />
            </p>
            <p style={{ fontSize: "0.9rem" }}>
              {filter === "All" ? (
                <TranslatedText text="No academic complaints have been submitted yet" />
              ) : (
                <TranslatedText
                  text={`No complaints with status "${filter}"`}
                />
              )}
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {filteredComplaints.map((complaint) => {
              const priority =
                complaint.priority || calculatePriority(complaint.category);
              const slaStatus = getSLAStatus(complaint);
              const timeRemaining = getTimeRemaining(complaint);
              const overdueFlag = isOverdue(complaint);

              return (
                <div
                  key={complaint.id}
                  style={{
                    border: overdueFlag
                      ? "2px solid #ef4444"
                      : "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "15px",
                    background: overdueFlag ? "#fef2f2" : "#f9fafb",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow = "none")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: "10px",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          marginBottom: "5px",
                          flexWrap: "wrap",
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            color: "#1f2937",
                            fontSize: "1.1rem",
                          }}
                        >
                          <TranslatedText text={complaint.title} />
                        </h3>
                        {overdueFlag && (
                          <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                        )}
                        <button
                          onClick={() =>
                            speakText(
                              `${complaint.title}. ${complaint.description}`,
                              complaint.id
                            )
                          }
                          style={{
                            background:
                              speakingId === complaint.id
                                ? "#ef4444"
                                : isHOD
                                ? "#8b5cf6"
                                : "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "32px",
                            height: "32px",
                            cursor: "pointer",
                            fontSize: "1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.3s ease",
                          }}
                          title={
                            speakingId === complaint.id ? "Stop" : "Read aloud"
                          }
                        >
                          {speakingId === complaint.id ? "⏸️" : "🔊"}
                        </button>
                      </div>
                      <p
                        style={{
                          margin: "0 0 10px 0",
                          color: "#4b5563",
                          fontSize: "0.95rem",
                        }}
                      >
                        <TranslatedText text={complaint.description} />
                      </p>
                      {/* SLA Progress Bar */}
                      <div style={{ marginTop: "10px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "5px",
                            fontSize: "0.8rem",
                          }}
                        >
                          <span
                            style={{
                              color: slaStatus.color,
                              fontWeight: "bold",
                            }}
                          >
                            ⏱️ {slaStatus.status}: {timeRemaining}
                          </span>
                          <span style={{ color: "#6b7280" }}>
                            Priority: {priority}
                          </span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: "6px",
                            background: "#e5e7eb",
                            borderRadius: "3px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${slaStatus.percentage}%`,
                              height: "100%",
                              background: slaStatus.color,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <select
                      value={complaint.status}
                      onChange={(e) =>
                        updateStatus(complaint.id, e.target.value)
                      }
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "2px solid #e5e7eb",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Escalated">Escalated</option>
                    </select>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span
                      style={{
                        background: "#dbeafe",
                        color: "#1e40af",
                        padding: "4px 12px",
                        borderRadius: "4px",
                        fontWeight: "500",
                      }}
                    >
                      📁 <TranslatedText text={complaint.category} />
                    </span>
                    <span
                      style={{
                        background:
                          complaint.status === "Resolved"
                            ? "#d1fae5"
                            : complaint.status === "In Progress"
                            ? "#e0e7ff"
                            : complaint.status === "Escalated"
                            ? "#fee2e2"
                            : "#fef3c7",
                        color:
                          complaint.status === "Resolved"
                            ? "#065f46"
                            : complaint.status === "In Progress"
                            ? "#3730a3"
                            : complaint.status === "Escalated"
                            ? "#991b1b"
                            : "#92400e",
                        padding: "4px 12px",
                        borderRadius: "4px",
                        fontWeight: "500",
                      }}
                    >
                      {complaint.status}
                    </span>
                    <span
                      style={{
                        background:
                          priority === "High"
                            ? "#fee2e2"
                            : priority === "Medium"
                            ? "#fef3c7"
                            : "#dbeafe",
                        color:
                          priority === "High"
                            ? "#991b1b"
                            : priority === "Medium"
                            ? "#92400e"
                            : "#1e40af",
                        padding: "4px 12px",
                        borderRadius: "4px",
                        fontWeight: "500",
                      }}
                    >
                      🎯 {priority}
                    </span>
                    <span style={{ color: "#6b7280" }}>
                      📧 {complaint.student_name || complaint.email}
                    </span>
                    <span style={{ color: "#6b7280" }}>
                      📅{" "}
                      {complaint.created_at?.toDate
                        ? complaint.created_at.toDate().toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleFacultyDashboard;
