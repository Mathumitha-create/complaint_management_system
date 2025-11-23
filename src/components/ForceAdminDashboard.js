// Temporary component to force admin dashboard for testing
import React from "react";
import AdminDashboard from "./AdminDashboard";

const ForceAdminDashboard = ({ user }) => {
  console.log("🔧 FORCING ADMIN DASHBOARD for:", user?.email);
  return <AdminDashboard user={user} />;
};

export default ForceAdminDashboard;
