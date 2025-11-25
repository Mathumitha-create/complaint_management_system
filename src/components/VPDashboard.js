// VP Dashboard: show only unresolved complaints that are past SLA (Overdue)
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { auth } from "../firebase";
import { useTranslation } from "../hooks/useTranslation";
import TranslatedText from "./TranslatedText";
import LanguageSelector from "./LanguageSelector";
import { getSLAStatus } from "../utils/slaUtils";
import SpeakButton from "./SpeakButton";
import "./Dashboard.css";
import "./AdminDashboard.css";

const VPDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [overdueList, setOverdueList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const updateStatus = async (id, newStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to mark this complaint as '${newStatus}'?`
      )
    )
      return;
    try {
      await updateDoc(doc(db, "grievances", id), {
        status: newStatus,
        updated_at: serverTimestamp(),
      });
      // Optional: feedback
      alert(`Complaint updated to '${newStatus}'.`);
    } catch (err) {
      console.error("VPDashboard updateStatus error", err);
      alert("Failed to update complaint status. See console for details.");
    }
  };

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        collection(db, "grievances"),
        (snapshot) => {
          const items = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter(
              (g) =>
                g &&
                g.status !== "Resolved" &&
                getSLAStatus(g).status === "Overdue"
            )
            .sort((a, b) => {
              const aTime = a.created_at?.toMillis?.() || 0;
              const bTime = b.created_at?.toMillis?.() || 0;
              return bTime - aTime;
            });

          setOverdueList(items);
        },
        (err) => {
          console.error("VPDashboard snapshot error", err);
        }
      );
    } catch (e) {
      console.error("VPDashboard setup failed", e);
    }
    return () => unsubscribe();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-brand">🛡️ VP DASHBOARD</div>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className={`sidebar-link active`}
            >
              Overdue
            </a>
          </li>
        </ul>
        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">🎓</div>
            <div className="admin-details">
              <div className="admin-name">Vice Principal</div>
              <div className="admin-email">{user?.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div
          className="header"
          style={{ padding: "24px", marginBottom: "16px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1 style={{ margin: 0 }}>
                {t("overdue") || "Overdue Complaints"}
              </h1>
              <p style={{ margin: 0, color: "#666" }}>
                <TranslatedText
                  text={
                    "Only unresolved complaints past their SLA are shown here."
                  }
                />
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <LanguageSelector />
              <button
                onClick={() => auth.signOut()}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                🚪 {t("logout")}
              </button>
            </div>
          </div>
        </div>

        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <h3>{t("overdue") || "Overdue"}</h3>
            <div className="stat-value" style={{ color: "#ef4444" }}>
              {overdueList.length}
            </div>
            <div className="stat-label">
              {t("unresolved_overdue") || "Unresolved • Past SLA"}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <input
            type="text"
            placeholder={t("search") + "..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ maxWidth: 420 }}
          />
        </div>

        <div className="grievance-table">
          <div
            className="table-header"
            style={{
              gridTemplateColumns: "100px 2fr 1.5fr 1fr 1fr 140px 140px",
            }}
          >
            <div>ID</div>
            <div>{t("title")}</div>
            <div>{t("student")}</div>
            <div>{t("category")}</div>
            <div>{t("date")}</div>
            <div>{t("status")}</div>
            <div>{t("actions") || "Actions"}</div>
          </div>

          {overdueList.length === 0 ? (
            <div className="empty-state">
              <p>{t("no_overdue") || "No overdue complaints"}</p>
            </div>
          ) : (
            overdueList
              .filter((g) => {
                const term = searchTerm.trim().toLowerCase();
                if (!term) return true;
                return (
                  (g.title || "").toLowerCase().includes(term) ||
                  (g.student_name || "").toLowerCase().includes(term) ||
                  (g.category || "").toLowerCase().includes(term)
                );
              })
              .map((g) => (
                <div
                  key={g.id}
                  className="table-row"
                  style={{
                    gridTemplateColumns: "100px 2fr 1.5fr 1fr 1fr 140px 140px",
                  }}
                >
                  <div>GR-{g.id.substring(0, 8)}</div>
                  <div>
                    <TranslatedText text={g.title} />
                  </div>
                  <div>{g.student_name}</div>
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
                      className={`status-badge status-${
                        g.status?.toLowerCase?.() || "pending"
                      }`}
                    >
                      <TranslatedText text={g.status} />
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      className="icon-btn view-btn"
                      title="Mark Resolved"
                      onClick={() => updateStatus(g.id, "Resolved")}
                      style={{
                        background: "#22c55e",
                        color: "white",
                        borderRadius: 8,
                        padding: "6px 10px",
                        border: "none",
                      }}
                    >
                      ✅
                    </button>
                    <button
                      className="icon-btn delete-btn"
                      title="Escalate"
                      onClick={() => updateStatus(g.id, "Escalated")}
                      style={{
                        background: "#f59e0b",
                        color: "white",
                        borderRadius: 8,
                        padding: "6px 10px",
                        border: "none",
                      }}
                    >
                      ⚠️
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VPDashboard;
