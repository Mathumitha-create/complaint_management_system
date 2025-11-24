// Admin dashboard: View all and update status
import React, { useState, useEffect } from "react";
import API_BASE from "../config";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { auth } from "../firebase";
import { useTranslation, useTranslatedText } from "../hooks/useTranslation";
import TranslatedText from "./TranslatedText";
import SpeakButton from "./SpeakButton";
import TranslatedTextWithSpeech from "./TranslatedTextWithSpeech";
import LanguageSelector from "./LanguageSelector";
import "./Dashboard.css";
import "./AdminDashboard.css";

const AdminDashboard = ({ user }) => {
  console.log("🚀 AdminDashboard component loaded for user:", user?.email);
  const { t } = useTranslation();

  // Component for translated text with TTS
  const TranslatedSpeakButton = ({ text }) => {
    const { translatedText } = useTranslatedText(text);
    return <SpeakButton text={translatedText} />;
  };

  const [grievances, setGrievances] = useState([]);
  const [filteredGrievances, setFilteredGrievances] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrievanceId, setSelectedGrievanceId] = useState(null);
  const selectedGrievance = grievances.find(
    (g) => g.id === selectedGrievanceId
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Users Management State
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    escalated: 0,
  });

  // Fetch Grievances
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, "grievances")); // add orderBy('created_at','desc') when index ready
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const grievanceData = snapshot.docs.map((d) => {
            const data = d.data();
            if (!data.updated_at && data.updatedAt)
              data.updated_at = data.updatedAt;
            if (!data.created_at && data.createdAt)
              data.created_at = data.createdAt;
            if (!data.category) data.category = "Uncategorized";
            if (!data.student_name) data.student_name = "Unknown Student";
            if (!data.title) data.title = "Untitled Grievance";
            if (!data.description) data.description = "No description provided";
            return { id: d.id, ...data };
          });

          grievanceData.sort((a, b) => {
            const aTime = a.created_at?.toMillis?.() || 0;
            const bTime = b.created_at?.toMillis?.() || 0;
            return bTime - aTime;
          });

          setGrievances(grievanceData);
          setFilteredGrievances(grievanceData);
          setStats({
            total: grievanceData.length,
            pending: grievanceData.filter((g) => g.status === "Pending").length,
            inProgress: grievanceData.filter((g) => g.status === "In Progress")
              .length,
            resolved: grievanceData.filter((g) => g.status === "Resolved")
              .length,
            escalated: grievanceData.filter((g) => g.status === "Escalated")
              .length,
          });
        },
        (error) => {
          console.error("AdminDashboard Firestore onSnapshot error", {
            code: error.code,
            message: error.message,
          });
        }
      );
    } catch (e) {
      console.error("AdminDashboard query setup failed", e);
    }
    return () => unsubscribe();
  }, []);

  // Fetch Users
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Filter Grievances
  useEffect(() => {
    let filtered = grievances;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.title?.toLowerCase().includes(term) ||
          g.description?.toLowerCase().includes(term) ||
          g.student_name?.toLowerCase().includes(term)
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

  // Filter Users
  useEffect(() => {
    if (userSearchTerm) {
      const term = userSearchTerm.toLowerCase();
      const filtered = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.role?.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [userSearchTerm, users]);

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "grievances", id), {
        status: newStatus,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const deleteGrievance = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this grievance? This action cannot be undone."
      )
    ) {
      try {
        await deleteDoc(doc(db, "grievances", id));
        alert("Grievance deleted successfully.");
      } catch (error) {
        console.error("Error deleting grievance:", error);
        alert("Failed to delete grievance. Please try again.");
      }
    }
  };

  // User Management Functions
  const handleEditUser = (user) => {
    setEditingUser({ ...user });
    setShowUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${API_BASE}/api/users/${editingUser.id}/role`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: editingUser.role,
            hostelType: editingUser.hostelType,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      alert("User updated successfully");
      setShowUserModal(false);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Error updating user:", error);
      alert(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This cannot be undone."
      )
    ) {
      try {
        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete user");
        }

        alert("User deleted successfully");
        fetchUsers(); // Refresh list
      } catch (error) {
        console.error("Error deleting user:", error);
        alert(error.message);
      }
    }
  };

  const viewDetails = (grievance) => {
    setSelectedGrievanceId(grievance.id);
    setShowDetailModal(true);
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Title",
      "Description",
      "Category",
      "Status",
      "Student",
      "Submitted On",
      "Updated On",
    ];
    const rows = filteredGrievances.map((g) => [
      `GR-${g.id.substring(0, 8)}`,
      g.title,
      g.description,
      g.category,
      g.status,
      g.student_name,
      g.created_at?.toDate ? g.created_at.toDate().toLocaleDateString() : "-",
      g.updated_at?.toDate ? g.updated_at.toDate().toLocaleDateString() : "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grievances_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderDashboard = () => {
    const categoryBreakdown = grievances.reduce((acc, g) => {
      acc[g.category] = (acc[g.category] || 0) + 1;
      return acc;
    }, {});

    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const recentGrievances = grievances.slice(0, 5);

    return (
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
            {t("dashboard")} {t("statistics")}
          </h2>
          <TranslatedSpeakButton
            text={t("dashboard") + " " + t("statistics")}
          />
        </div>

        <div className="stats-grid">
          <div className="stat-card admin-stat-total">
            <div className="stat-info">
              <h3>{t("all_complaints")}</h3>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-icon">📊</div>
          </div>
          <div className="stat-card admin-stat-pending">
            <div className="stat-info">
              <h3>{t("pending")}</h3>
              <div className="stat-value" style={{ color: "#f59e0b" }}>
                {stats.pending}
              </div>
            </div>
            <div className="stat-icon">⏳</div>
          </div>
          <div className="stat-card admin-stat-progress">
            <div className="stat-info">
              <h3>{t("in_progress")}</h3>
              <div className="stat-value" style={{ color: "#3b82f6" }}>
                {stats.inProgress}
              </div>
            </div>
            <div className="stat-icon">🔄</div>
          </div>
          <div className="stat-card admin-stat-resolved">
            <div className="stat-info">
              <h3>{t("resolved")}</h3>
              <div className="stat-value" style={{ color: "#22c55e" }}>
                {stats.resolved}
              </div>
            </div>
            <div className="stat-icon">✅</div>
          </div>
        </div>

        <div className="admin-dashboard-grid">
          <div className="admin-card">
            <h3>📈 Performance Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <div className="metric-label">Resolution Rate</div>
                <div className="metric-value" style={{ color: "#22c55e" }}>
                  {stats.total > 0
                    ? Math.round((stats.resolved / stats.total) * 100)
                    : 0}
                  %
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Escalated Cases</div>
                <div className="metric-value" style={{ color: "#ef4444" }}>
                  {stats.escalated}
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Active Cases</div>
                <div className="metric-value" style={{ color: "#3b82f6" }}>
                  {stats.pending + stats.inProgress}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h3>📂 Top Categories</h3>
            <div className="category-list">
              {topCategories.length > 0 ? (
                topCategories.map(([category, count]) => (
                  <div key={category} className="category-item-admin">
                    <span className="category-name-admin">{category}</span>
                    <span className="category-count-admin">{count}</span>
                  </div>
                ))
              ) : (
                <p className="empty-message">No categories yet</p>
              )}
            </div>
          </div>

          <div className="admin-card recent-activity">
            <h3>🕒 Recent Submissions</h3>
            <div className="recent-list">
              {recentGrievances.length > 0 ? (
                recentGrievances.map((g) => (
                  <div
                    key={g.id}
                    className="recent-item"
                    onClick={() => viewDetails(g)}
                  >
                    <div className="recent-title">{g.title}</div>
                    <div className="recent-meta">
                      <span className="recent-student">{g.student_name}</span>
                      <span
                        className={`recent-status status-${g.status
                          .toLowerCase()
                          .replace(" ", "")}`}
                      >
                        {g.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message">No recent grievances</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAllGrievances = () => (
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
          <h2 className="page-title" style={{ margin: 0 }}>
            {t("all_complaints")} ({filteredGrievances.length})
          </h2>
          <TranslatedSpeakButton text={t("all_complaints")} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={exportToCSV} className="action-btn export-btn">
            📥 {t("export") || "Export CSV"}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="action-btn refresh-btn"
          >
            🔄 {t("loading")}
          </button>
        </div>
      </div>

      <div className="search-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by Title, Description, or Student..."
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
            All
          </button>
          <button
            className={`filter-btn ${statusFilter === "Pending" && "active"}`}
            onClick={() => setStatusFilter("Pending")}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${
              statusFilter === "In Progress" && "active"
            }`}
            onClick={() => setStatusFilter("In Progress")}
          >
            In Progress
          </button>
          <button
            className={`filter-btn ${statusFilter === "Resolved" && "active"}`}
            onClick={() => setStatusFilter("Resolved")}
          >
            Resolved
          </button>
          <button
            className={`filter-btn ${statusFilter === "Escalated" && "active"}`}
            onClick={() => setStatusFilter("Escalated")}
          >
            Escalated
          </button>
        </div>
      </div>

      <div className="grievance-table">
        <div
          className="table-header"
          style={{
            gridTemplateColumns: "80px 2fr 1.5fr 1fr 110px 140px 100px",
          }}
        >
          <div>ID</div>
          <div>{t("title")}</div>
          <div>{t("student") || "Student"}</div>
          <div>{t("category")}</div>
          <div>{t("date")}</div>
          <div>{t("status")}</div>
          <div>{t("actions") || "Actions"}</div>
        </div>
        {filteredGrievances.length === 0 ? (
          <div className="empty-state">
            <p>
              No grievances found.{" "}
              {grievances.length === 0
                ? "No grievances have been submitted yet."
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          filteredGrievances.map((g) => (
            <div
              key={g.id}
              className="table-row"
              style={{
                gridTemplateColumns: "80px 2fr 1.5fr 1fr 110px 140px 100px",
              }}
            >
              <div>GR-{g.id.substring(0, 4)}</div>
              <div className="grievance-title-cell">
                <span
                  onClick={() => viewDetails(g)}
                  style={{ cursor: "pointer" }}
                >
                  <TranslatedText text={g.title} />
                </span>
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
                <select
                  value={g.status}
                  onChange={(e) => updateStatus(g.id, e.target.value)}
                  className="status-select"
                >
                  <option value="Pending">{t("pending")}</option>
                  <option value="In Progress">{t("in_progress")}</option>
                  <option value="Resolved">{t("resolved")}</option>
                  <option value="Escalated">
                    {t("escalated") || "Escalated"}
                  </option>
                </select>
              </div>
              <div className="action-buttons">
                <button
                  onClick={() => viewDetails(g)}
                  className="icon-btn view-btn"
                  title="View Details"
                >
                  👁️
                </button>
                <button
                  onClick={() => deleteGrievance(g.id)}
                  className="icon-btn delete-btn"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderUsersList = () => (
    <div className="grievances-list">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2 className="page-title" style={{ margin: 0 }}>
          User Management
        </h2>
        <button onClick={fetchUsers} className="action-btn refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="search-box" style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search users..."
          value={userSearchTerm}
          onChange={(e) => setUserSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="grievance-table">
        <div
          className="table-header"
          style={{ gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 100px" }}
        >
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Hostel Type</div>
          <div>Actions</div>
        </div>
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            className="table-row"
            style={{ gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 100px" }}
          >
            <div>{u.name}</div>
            <div>{u.email}</div>
            <div>
              <span className={`status-badge ${u.role}`}>{u.role}</span>
            </div>
            <div>{u.hostelType || "-"}</div>
            <div className="action-buttons">
              <button
                onClick={() => handleEditUser(u)}
                className="icon-btn view-btn"
                title="Edit Role"
              >
                ✏️
              </button>
              {u.email !== "mathupriya2006@gmail.com" && (
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="icon-btn delete-btn"
                  title="Delete User"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUserModal = () => {
    if (!showUserModal || !editingUser) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "500px" }}
        >
          <div className="modal-header">
            <h2>Edit User Role</h2>
            <button
              className="modal-close"
              onClick={() => setShowUserModal(false)}
            >
              ×
            </button>
          </div>
          <form onSubmit={handleUpdateUser} className="modal-body">
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{editingUser.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{editingUser.email}</span>
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Role
              </label>
              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value })
                }
                className="form-input"
                style={{ width: "100%", padding: "0.5rem" }}
              >
                <option value="student">Student</option>
                <option value="warden_girls">Girls Warden</option>
                <option value="warden_boys">Boys Warden</option>
                <option value="vp">Vice Principal</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {(editingUser.role === "warden_girls" ||
              editingUser.role === "warden_boys") && (
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  Hostel Type
                </label>
                <select
                  value={editingUser.hostelType || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      hostelType: e.target.value,
                    })
                  }
                  className="form-input"
                  style={{ width: "100%", padding: "0.5rem" }}
                >
                  <option value="">Select Type</option>
                  <option value="girls">Girls Hostel</option>
                  <option value="boys">Boys Hostel</option>
                </select>
              </div>
            )}

            <div className="modal-footer">
              <button type="submit" className="login-button">
                Update User
              </button>
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!showDetailModal || !selectedGrievance) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h2>{t("details") || "Grievance Details"}</h2>
              <TranslatedSpeakButton
                text={`${selectedGrievance.title}. ${selectedGrievance.description}`}
              />
            </div>
            <button
              className="modal-close"
              onClick={() => setShowDetailModal(false)}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="detail-row">
              <span className="detail-label">ID:</span>
              <span className="detail-value">
                GR-{selectedGrievance.id.substring(0, 8)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t("title")}:</span>
              <span className="detail-value">
                <TranslatedText text={selectedGrievance.title} />
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t("description")}:</span>
              <span className="detail-value">
                <TranslatedText text={selectedGrievance.description} />
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t("category")}:</span>
              <span className="detail-value">
                <TranslatedText text={selectedGrievance.category} />
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t("student") || "Student"}:</span>
              <span className="detail-value">
                {selectedGrievance.student_name}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <select
                value={selectedGrievance.status}
                onChange={(e) => {
                  updateStatus(selectedGrievance.id, e.target.value);
                }}
                className="status-select-modal"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Escalated">Escalated</option>
              </select>
            </div>
            <div className="detail-row">
              <span className="detail-label">Submitted On:</span>
              <span className="detail-value">
                {selectedGrievance.created_at?.toDate
                  ? selectedGrievance.created_at.toDate().toLocaleString()
                  : "-"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Last Updated:</span>
              <span className="detail-value">
                {selectedGrievance.updated_at?.toDate
                  ? selectedGrievance.updated_at.toDate().toLocaleString()
                  : "-"}
              </span>
            </div>
            {selectedGrievance.attachmentUrl && (
              <div className="detail-row">
                <span className="detail-label">Attachment:</span>
                <a
                  href={selectedGrievance.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attachment-link"
                >
                  📎 View Attachment
                </a>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              onClick={() => deleteGrievance(selectedGrievance.id)}
              className="btn-danger"
            >
              Delete Grievance
            </button>
            <button
              onClick={() => setShowDetailModal(false)}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="dashboard-container"
      style={{ display: "flex", visibility: "visible", opacity: 1 }}
    >
      <div className="sidebar">
        <div className="sidebar-brand">🛡️ ADMIN PANEL</div>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("dashboard");
              }}
              className={`sidebar-link ${
                activeTab === "dashboard" ? "active" : ""
              }`}
            >
              <svg
                className="sidebar-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
              Dashboard
            </a>
          </li>
          <li className="sidebar-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("allGrievances");
              }}
              className={`sidebar-link ${
                activeTab === "allGrievances" ? "active" : ""
              }`}
            >
              <svg
                className="sidebar-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              All Grievances
            </a>
          </li>
          <li className="sidebar-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("users");
              }}
              className={`sidebar-link ${
                activeTab === "users" ? "active" : ""
              }`}
            >
              <svg
                className="sidebar-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              User Management
            </a>
          </li>
        </ul>
        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">👨‍💼</div>
            <div className="admin-details">
              <div className="admin-name">Admin</div>
              <div className="admin-email">{user.email}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="main-content">
        <div
          className="header"
          style={{
            background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
            borderRadius: "16px",
            padding: "30px",
            marginBottom: "24px",
            boxShadow: "0 10px 30px rgba(30, 64, 175, 0.25)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div className="header-title">
            <h1
              style={{ color: "white", fontSize: "2rem", margin: "0 0 8px 0" }}
            >
              {activeTab === "dashboard"
                ? "Dashboard"
                : activeTab === "users"
                ? "User Management"
                : "All Grievances"}
            </h1>
            <p
              className="header-subtitle"
              style={{ color: "rgba(255, 255, 255, 0.9)", margin: 0 }}
            >
              {activeTab === "users"
                ? "Manage users and roles"
                : "Manage and monitor all grievances"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <LanguageSelector />
            <button
              onClick={() => auth.signOut()}
              className="logout-btn"
              style={{
                background: "white",
                color: "#1e40af",
                padding: "12px 28px",
                border: "none",
                borderRadius: "50px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "1rem",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
              }}
            >
              🚪 Log Out
            </button>
          </div>
        </div>

        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "allGrievances" && renderAllGrievances()}
        {activeTab === "users" && renderUsersList()}
        {renderDetailModal()}
        {renderUserModal()}
      </div>
    </div>
  );
};

export default AdminDashboard;
