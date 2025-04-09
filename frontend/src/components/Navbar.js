import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const navStyle = {
    backgroundColor: "#333",
    color: "#fff",
    padding: "10px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  };

  const navLinksContainer = {
    display: "flex",
    gap: "20px"
  };

  const navLinkStyle = {
    color: "#fff",
    textDecoration: "none",
    fontSize: "16px"
  };

  const logoutButtonStyle = {
    backgroundColor: "#e74c3c",
    border: "none",
    padding: "8px 12px",
    color: "#fff",
    borderRadius: "4px",
    cursor: "pointer"
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <nav style={navStyle}>
      <div style={navLinksContainer}>
        <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
        <Link to="/profile" style={navLinkStyle}>Profile</Link>
        <Link to="/schedule" style={navLinkStyle}>Schedule</Link>
        <Link to="/calendar" style={navLinkStyle}>Calendar</Link>
        <Link to="/engagement" style={navLinkStyle}>Leave/Engagement</Link>
        <Link to="/statistics-dashboard" style={navLinkStyle}>Statistics</Link>
      </div>
      <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
    </nav>
  );
};

export default Navbar;
