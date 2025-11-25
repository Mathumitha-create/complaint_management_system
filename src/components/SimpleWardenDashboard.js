import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
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

import LanguageSelector from "./LanguageSelector";

const SimpleWardenDashboard = ({ user }) => {
  console.log("✅ SimpleWardenDashboard rendering for:", user?.email);

  const { currentLanguage } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [speakingId, setSpeakingId] = useState(null);

  useEffect(() => {
    console.log("🎯 Warden Dashboard MOUNTED - Fetching complaints");
    let unsubscribe = () => { };

    try {
      // Query the 'complaints' collection
      const q = query(collection(db, "complaints"));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const allComplaints = snapshot.docs.map((d) => {
            const data = d.data();
            // Normalize dates
            if (!data.updated_at && data.updatedAt) data.updated_at = data.updatedAt;
            if (!data.created_at && data.createdAt) data.created_at = data.createdAt;

            // Normalize status
            if (!data.status && data.resolved) data.status = "Resolved";
            if (!data.status && data.escalated) data.status = "Escalated";
            if (!data.status) data.status = "Pending";

            // Normalize other fields
            if (!data.category) data.category = "Uncategorized";

            // Parse title and description if they're combined
            // Backend stores: "title\n\ndescription"
            if (data.description && (!data.title || data.title.trim() === "")) {
              // Try to extract title from description
              if (data.description.includes("\n\n")) {
                const parts = data.description.split("\n\n");
                data.title = parts[0].trim();
                data.description = parts.slice(1).join("\n\n").trim();
              } else {
                // Use first line as title if multiple lines exist
                const lines = data.description.split("\n");
                if (lines.length > 1) {
                  data.title = lines[0].trim();
                  data.description = lines.slice(1).join("\n").trim();
                } else {
                  // Single line - use category as title
                  data.title = data.category + " Complaint";
                }
              }
            }

            // Better title handling: 
            // If no title exists after parsing, create one from category
            if (!data.title || data.title.trim() === "" || data.title === data.description) {
              data.title = data.category + " Complaint";
            }

            // Clean up description if it starts with the title
            // This handles cases where the title is duplicated at the start of the description
            if (data.description && data.title) {
              const titleLower = data.title.toLowerCase().trim();
              const descLower = data.description.toLowerCase().trim();

              // If description starts with the title, remove it
              if (descLower.startsWith(titleLower)) {
                // Remove the title from the description and trim any leading spaces/punctuation
                data.description = data.description.substring(data.title.length).trim();
                // Remove leading punctuation like colons, dashes, etc.
                data.description = data.description.replace(/^[:\-\s]+/, '');
              }
            }

            if (!data.student_name) data.student_name = "Unknown Student";

            return { id: d.id, ...data };
          });

          // Determine Warden Type
          // Priority: 1. user.hostelType (from Firestore/Env), 2. Email pattern
          let wardenType = "General";
          if (user?.hostelType) {
            wardenType = user.hostelType;
          } else {
            const email = user?.email?.toLowerCase() || "";
            if (email.includes("boys") || email.includes("men")) wardenType = "Boys Hostel";
            else if (email.includes("girls") || email.includes("women") || email.includes("ladies")) wardenType = "Girls Hostel";
          }

          console.log(`👮 Warden Type: ${wardenType}`);

          // Filter Complaints
          const finalComplaints = allComplaints.filter(c => {
            // First, check if this is a hostel-related complaint
            const category = (c.category || "").toLowerCase().trim();
            const isHostelComplaint = category.includes("hostel") ||
              category.includes("mess") ||
              category.includes("food") ||
              category.includes("accommodation") ||
              category.includes("maintenance");

            // If not a hostel complaint, exclude it
            if (!isHostelComplaint) {
              return false;
            }

            // If warden is "General" (e.g. Admin/VP viewing this dashboard), show all hostel complaints
            if (wardenType === "General") return true;

            // Check hostel type match
            const rawType = c.hostelType || c.hostel_type || c.hostel || "";
            const cHostelType = rawType.toString().toLowerCase().trim();
            const wType = wardenType.toLowerCase().trim();

            // If complaint has no hostel type specified, exclude it (safety check)
            if (!cHostelType) {
              console.warn(`⚠️ Complaint ${c.id} has no hostel type, excluding from warden view`);
              return false;
            }

            // Match Boys Hostel
            if (wType.includes("boys")) {
              return cHostelType.includes("boys") || cHostelType.includes("men");
            }

            // Match Girls Hostel
            if (wType.includes("girls")) {
              return cHostelType.includes("girls") || cHostelType.includes("women") || cHostelType.includes("ladies");
            }

            // If warden type doesn't match known patterns, exclude
            return false;
          });

          console.log(`✅ Loaded ${finalComplaints.length} complaints for ${wardenType}`);
          setComplaints(finalComplaints);
          setLoading(false);
        },
        (error) => {
          console.error("❌ Firestore Error:", error);
          setLoading(false);
        }
      );
    } catch (e) {
      console.error("❌ Query Setup Error:", e);
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, [user?.email, user?.hostelType]);

  const updateStatus = async (complaintId, newStatus) => {
    try {
      const complaintRef = doc(db, "complaints", complaintId);
      await updateDoc(complaintRef, {
        status: newStatus,
        resolved: newStatus === "Resolved",
        updated_at: serverTimestamp(),
        updatedBy: user.email,
        resolvedAt: newStatus === "Resolved" ? new Date().toISOString() : null
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

  // Text-to-speech function
  const speakText = async (text, complaintId) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      if (speakingId === complaintId) {
        setSpeakingId(null);
        return;
      }

      let textToSpeak = text;
      if (currentLanguage !== "en") {
        try {
          const { translateText } = await import("../services/translationService");
          textToSpeak = await translateText(text, currentLanguage);
        } catch (error) {
          console.error("Translation error:", error);
          textToSpeak = text;
        }
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      // Language mapping
      const languageVoiceMap = {
        en: "en-US", hi: "hi-IN", ta: "ta-IN", te: "te-IN", bn: "bn-IN",
        mr: "mr-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN",
        or: "or-IN", as: "as-IN", ur: "ur-IN", sa: "sa-IN", ks: "ks-IN",
        sd: "sd-IN", ne: "ne-NP", si: "si-LK",
      };

      utterance.lang = languageVoiceMap[currentLanguage] || "en-US";
      utterance.rate = 0.9;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);

      setSpeakingId(complaintId);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech not supported");
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
          background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
          padding: "30px",
          borderRadius: "16px",
          color: "white",
          marginBottom: "24px",
          boxShadow: "0 10px 30px rgba(37, 99, 235, 0.25)",
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
              🏠 <TranslatedText text="Hostel Complaints" />
            </h1>
            <p style={{ margin: "0", opacity: 0.9, fontSize: "1rem" }}>
              <TranslatedText text="Manage hostel-related grievances" />
            </p>
            {user?.hostelType && (
              <span style={{
                display: "inline-block",
                marginTop: "8px",
                background: "rgba(255,255,255,0.2)",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "0.85rem"
              }}>
                {user.hostelType}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <LanguageSelector />
            <button
              onClick={() => auth.signOut()}
              style={{
                background: "white",
                color: "#2563eb",
                padding: "10px 24px",
                border: "none",
                borderRadius: "50px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "1rem",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              }}
            >
              🚪 <TranslatedText text="Log Out" />
            </button>
          </div>
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
        <StatCard value={stats.total} label="Total Complaints" color="#2563eb" />
        <StatCard value={stats.pending} label="Pending" color="#f59e0b" />
        <StatCard value={stats.inProgress} label="In Progress" color="#8b5cf6" />
        <StatCard value={stats.resolved} label="Resolved" color="#16a34a" />
      </div>

      {/* SLA Monitoring */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "16px",
          marginBottom: "20px",
          boxShadow: "0 4px 15px rgba(37, 99, 235, 0.1)",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", color: "#0f172a", fontSize: "1.2rem", fontWeight: "600" }}>
          ⏱️ <TranslatedText text="SLA Monitoring" />
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
          <SLACard value={`${slaCompliance}%`} label="SLA Compliance" color="#10b981" />
          <SLACard value={overdueCount} label="Overdue" color="#ef4444" />
          <SLACard value={slaCounts.critical} label="Critical" color="#f59e0b" />
          <SLACard value={slaCounts.warning} label="Warning" color="#fbbf24" />
          <SLACard value={slaCounts.onTrack} label="On Track" color="#10b981" />
        </div>
      </div>

      {/* Filter Buttons */}
      <div
        style={{
          background: "white",
          padding: "15px",
          borderRadius: "16px",
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          boxShadow: "0 4px 15px rgba(37, 99, 235, 0.1)",
        }}
      >
        {["All", "Pending", "In Progress", "Resolved"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: "10px 20px",
              border: filter === status ? "none" : "2px solid rgba(37, 99, 235, 0.2)",
              background: filter === status ? "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)" : "white",
              color: filter === status ? "white" : "#64748b",
              borderRadius: "50px",
              cursor: "pointer",
              fontWeight: filter === status ? "600" : "500",
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
          borderRadius: "16px",
          boxShadow: "0 4px 15px rgba(37, 99, 235, 0.1)",
        }}
      >
        <h2 style={{ marginTop: 0, color: "#0f172a", marginBottom: "20px", fontWeight: "600" }}>
          🏠 <TranslatedText text="Hostel Complaints" /> ({filteredComplaints.length})
        </h2>

        {loading ? (
          <p style={{ textAlign: "center", padding: "40px" }}>Loading...</p>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            <p><TranslatedText text="No complaints found" /></p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {filteredComplaints.map((complaint) => {
              const priority = complaint.priority || calculatePriority(complaint.category);
              const slaStatus = getSLAStatus(complaint);
              const timeRemaining = getTimeRemaining(complaint);
              const overdueFlag = isOverdue(complaint);

              // Get status color
              const getStatusBgColor = (status) => {
                switch (status) {
                  case "Resolved": return "#d1fae5";
                  case "In Progress": return "#dbeafe";
                  case "Escalated": return "#fee2e2";
                  default: return "#fef3c7"; // Pending
                }
              };

              const getStatusTextColor = (status) => {
                switch (status) {
                  case "Resolved": return "#065f46";
                  case "In Progress": return "#1e40af";
                  case "Escalated": return "#991b1b";
                  default: return "#92400e"; // Pending
                }
              };

              return (
                <div
                  key={complaint.id}
                  style={{
                    border: overdueFlag ? "2px solid #ef4444" : "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "18px",
                    background: overdueFlag ? "#fef2f2" : "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                >
                  {/* Title with speak button */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, color: "#1f2937", fontSize: "1.1rem", fontWeight: "600", flex: 1 }}>
                      <TranslatedText text={complaint.title} />
                    </h3>
                    {overdueFlag && <span style={{ fontSize: "1.2rem" }}>⚠️</span>}
                    <button
                      onClick={() => speakText(`${complaint.title}. ${complaint.description}`, complaint.id)}
                      style={{
                        background: speakingId === complaint.id ? "#ef4444" : "#2563eb",
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
                      }}
                      title={speakingId === complaint.id ? "Stop" : "Read aloud"}
                    >
                      {speakingId === complaint.id ? "⏸️" : "🔊"}
                    </button>
                  </div>

                  {/* Description */}
                  <p style={{ color: "#4b5563", margin: "0 0 12px 0", fontSize: "0.95rem", lineHeight: "1.5" }}>
                    <TranslatedText text={complaint.description} />
                  </p>

                  {/* SLA Status Bar */}
                  {overdueFlag && (
                    <div style={{
                      background: "#fee2e2",
                      color: "#991b1b",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      marginBottom: "12px",
                      fontSize: "0.85rem",
                      fontWeight: "600"
                    }}>
                      ⚠️ Overdue: {slaStatus.status} - {timeRemaining}
                    </div>
                  )}

                  {/* Horizontal separator */}
                  <div style={{
                    height: overdueFlag ? "3px" : "2px",
                    background: overdueFlag ? "#ef4444" : slaStatus.color || "#e5e7eb",
                    marginBottom: "12px",
                    borderRadius: "2px"
                  }} />

                  {/* Bottom row with badges and status dropdown */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px"
                  }}>
                    {/* Left side - badges */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", fontSize: "0.85rem" }}>
                      {/* Category badge */}
                      <span style={{
                        background: "#dbeafe",
                        color: "#1e40af",
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        📁 <TranslatedText text={complaint.category} />
                      </span>

                      {/* Status badge */}
                      <span style={{
                        background: getStatusBgColor(complaint.status),
                        color: getStatusTextColor(complaint.status),
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontWeight: "600"
                      }}>
                        {complaint.status}
                      </span>

                      {/* Priority badge */}
                      <span style={{
                        background: priority === "High" ? "#fee2e2" : priority === "Medium" ? "#fef3c7" : "#dbeafe",
                        color: priority === "High" ? "#991b1b" : priority === "Medium" ? "#92400e" : "#1e40af",
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        🎯 {priority}
                      </span>

                      {/* Student email */}
                      <span style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}>
                        📧 {complaint.studentEmail || complaint.email || complaint.studentName}
                      </span>

                      {/* Date */}
                      <span style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}>
                        📅 {complaint.created_at?.toDate ? complaint.created_at.toDate().toLocaleDateString() : "N/A"}
                      </span>
                    </div>

                    {/* Right side - status dropdown */}
                    <select
                      value={complaint.status}
                      onChange={(e) => updateStatus(complaint.id, e.target.value)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "2px solid #e5e7eb",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        color: "#1f2937"
                      }}
                    >
                      <option value="Pending">Pending</option>

                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
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

// Helper Components
const StatCard = ({ value, label, color }) => (
  <div style={{ background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
    <div style={{ fontSize: "2rem", fontWeight: "bold", color }}>{value}</div>
    <div style={{ color: "#64748b", marginTop: "5px" }}><TranslatedText text={label} /></div>
  </div>
);

const SLACard = ({ value, label, color }) => (
  <div style={{ textAlign: "center", padding: "15px", background: "#f9fafb", borderRadius: "8px" }}>
    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color }}>{value}</div>
    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}><TranslatedText text={label} /></div>
  </div>
);



export default SimpleWardenDashboard;