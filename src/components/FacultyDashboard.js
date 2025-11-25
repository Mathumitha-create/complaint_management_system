import React, { useEffect, useState } from "react";
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
import TranslatedText from "./TranslatedText";
import SpeakButton from "./SpeakButton";
import { useTranslatedText } from "../hooks/useTranslation";
import NotificationsBell from "./NotificationsBell";
import { auth } from "../firebase";

// HOD Dashboard: academic complaints + assigned ones
const HODDashboard = ({ user }) => {
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const TranslatedSpeakButton = ({ text }) => {
    const { translatedText } = useTranslatedText(text);
    return <SpeakButton text={translatedText} />;
  };

  useEffect(() => {
    // Pull potentially relevant complaints (filter client-side to reduce indexes)
    const q = query(collection(db, "complaints"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Filter: academic category OR assignedRoles includes 'hod'
      const filtered = data
        .filter((c) => {
          const cat = (c.category || "").toLowerCase();
          const academicCat =
            cat.includes("academic") ||
            cat.includes("library") ||
            cat.includes("lab") ||
            cat.includes("course") ||
            cat.includes("exam");
          const assigned =
            Array.isArray(c.assignedRoles) && c.assignedRoles.includes("hod");
          return academicCat || assigned;
        })
        .sort(
          (a, b) =>
            (b.created_at?.toMillis?.() || 0) -
            (a.created_at?.toMillis?.() || 0)
        );
      setComplaints(filtered);
    });
    return () => unsub();
  }, []);

  const visible = complaints.filter(
    (c) => !statusFilter || c.status === statusFilter
  );

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "complaints", id), {
      status,
      updated_at: serverTimestamp(),
      hod_note: note || null,
      hod_updated_by: user.email,
    });
    setSelectedId(null);
    setNote("");
  };

  const statusColor = (s) =>
    ({
      Pending: "#f59e0b",
      "In Progress": "#3b82f6",
      Resolved: "#10b981",
      Escalated: "#ef4444",
    }[s] || "#6b7280");

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>🏫 HOD Portal</h2>
          <p>Academic Complaints</p>
        </div>
      </div>
      <div className="main-content">
        <div
          className="header"
          style={{
            background: "linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)",
            padding: "20px 28px",
            borderRadius: "12px",
            marginBottom: "24px",
            color: "#fff",
          }}
        >
          <h1 style={{ margin: 0 }}>HOD Dashboard</h1>
          <p style={{ margin: "4px 0" }}>{user.email}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <NotificationsBell user={user} />
            <button
              onClick={() => auth.signOut()}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2>Academic / Assigned ({visible.length})</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "2px solid #e5e7eb",
              borderRadius: 6,
            }}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>
        <div className="complaints-list">
          {visible.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
              No complaints found.
            </div>
          ) : (
            visible.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "#fff",
                  border: "2px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 18,
                  marginBottom: 14,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 6px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <TranslatedText text={c.title} />{" "}
                  <TranslatedSpeakButton text={c.title} />
                </h3>
                <p
                  style={{
                    margin: "0 0 8px",
                    color: "#374151",
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <TranslatedText text={c.description} />{" "}
                  <TranslatedSpeakButton text={c.description} />
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    fontSize: "0.8rem",
                  }}
                >
                  <span
                    style={{
                      background: "#f3f4f6",
                      padding: "4px 10px",
                      borderRadius: 6,
                    }}
                  >
                    📁 {c.category}
                  </span>
                  <span
                    style={{
                      background: "#fef3c7",
                      padding: "4px 10px",
                      borderRadius: 6,
                    }}
                  >
                    ⏱ {c.resolutionDays || c.resolution_deadline_days}d
                  </span>
                  <span
                    style={{
                      background: "#ede9fe",
                      padding: "4px 10px",
                      borderRadius: 6,
                    }}
                  >
                    📅{" "}
                    {c.deadlineAt?.toDate
                      ? c.deadlineAt.toDate().toLocaleDateString()
                      : "-"}
                  </span>
                  <span
                    style={{
                      background: statusColor(c.status) + "20",
                      color: statusColor(c.status),
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    {c.status}
                  </span>
                </div>
                {selectedId === c.id ? (
                  <div
                    style={{
                      marginTop: 12,
                      background: "#f9fafb",
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="HOD resolution note..."
                      style={{
                        width: "100%",
                        padding: 10,
                        border: "2px solid #e5e7eb",
                        borderRadius: 6,
                        minHeight: 70,
                      }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => updateStatus(c.id, "In Progress")}
                        style={{
                          background: "#3b82f6",
                          color: "#fff",
                          border: "none",
                          padding: "8px 14px",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => updateStatus(c.id, "Resolved")}
                        style={{
                          background: "#10b981",
                          color: "#fff",
                          border: "none",
                          padding: "8px 14px",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        Resolved
                      </button>
                      <button
                        onClick={() => {
                          setSelectedId(null);
                          setNote("");
                        }}
                        style={{
                          background: "#6b7280",
                          color: "#fff",
                          border: "none",
                          padding: "8px 14px",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedId(c.id)}
                    style={{
                      marginTop: 10,
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Update Status
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HODDashboard;
