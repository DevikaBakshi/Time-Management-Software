// src/pages/Profile.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";


function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [error, setError] = useState("");

  // Inline styles
  const navbarStyle = {
    backgroundColor: "#2d3748",
    color: "#fff",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
  };

  const navLinkStyle = {
    marginRight: "16px",
    textDecoration: "none",
    color: "#fff",
    fontWeight: "500",
  };
/*
  const containerStyle = {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "16px",
    boxSizing: "border-box",
  };
*/


  const baseFont = { fontFamily: "Arial, sans-serif" };

  const containerStyle = {
    margin: "0",
    padding: "0",
    width: "100%",
    overflowX: "hidden", // Prevent horizontal scroll
    boxSizing: "border-box"
  };
  
  const boxStyle = {
    border: "1px solid #ccc",
    padding: "16px",
    borderRadius: "4px",
    backgroundColor: "#fff",
    marginBottom: "16px",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "16px",
  };

  const thStyle = {
    border: "1px solid #ccc",
    padding: "8px",
    backgroundColor: "#f0f0f0",
    textAlign: "left",
  };

  const tdStyle = {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "left",
  };

  const buttonStyle = {
    padding: "8px 16px",
    margin: "4px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  };

  // Fetch profile details
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
      } catch (err) {
        console.error("Error fetching profile:", err.response?.data || err.message);
        setError(err.response?.data?.error || "Failed to fetch profile");
        toast.error(err.response?.data?.error || "Failed to fetch profile");
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch today's schedule for the logged-in executive
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const token = localStorage.getItem("token");
        const today = new Date().toISOString().split("T")[0];
        const response = await axios.get(
          `http://localhost:5000/api/users/profile/schedule?date=${today}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSchedule(response.data);
      } catch (err) {
        console.error("Error fetching schedule:", err.response?.data || err.message);
        toast.error(err.response?.data?.error || "Failed to fetch schedule");
      } finally {
        setLoadingSchedule(false);
      }
    };
    fetchSchedule();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("/login");
  };
/*
  // Navbar component
  const Navbar = () => (
    <nav style={navbarStyle}>
      <div>
        <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
        <Link to="/profile" style={navLinkStyle}>Profile</Link>
        <Link to="/schedule" style={navLinkStyle}>Schedule</Link>
        <Link to="/calendar" style={navLinkStyle}>Calendar</Link>
        <Link to="/engagement" style={navLinkStyle}>Leave/Engagement</Link>
        <Link to="/statistics-dashboard" style={navLinkStyle}>Statistics</Link>
      </div>
      <button onClick={handleLogout} style={{ ...buttonStyle, backgroundColor: "#e53e3e", color: "#fff" }}>
        Logout
      </button>
    </nav>
  );
*/
  if (loadingProfile || loadingSchedule) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (error) return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  if (!profile) return <p style={{ textAlign: "center" }}>No profile data available.</p>;

  return (
    <div style={{ ...containerStyle, ...baseFont }}>
      <Navbar />
      <div style={containerStyle}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "16px" }}>My Profile</h1>
        
        <div style={boxStyle}>
          <p><strong>User ID:</strong> {profile.user_id}</p>
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
        </div>
        
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "8px" }}>My Schedule for Today</h2>
        {schedule.length === 0 ? (
          <p>No scheduled events for today.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Title/Description</th>
                <th style={thStyle}>Start Time</th>
                <th style={thStyle}>End Time</th>
                <th style={thStyle}>Additional Info</th>
                <th style={thStyle}>Details</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item) => (
                <tr key={`${item.type}-${item.id}-${item.start_time}`}>
                  <td style={tdStyle}>{item.type}</td>
                  <td style={tdStyle}>
                    {item.type === "Meeting"
                      ? item.title
                      : item.type === "Engagement"
                      ? item.description
                      : item.type === "Leave"
                      ? item.reason
                      : "N/A"}
                  </td>
                  <td style={tdStyle}>{new Date(item.start_time).toLocaleString("en-GB")}</td>
                  <td style={tdStyle}>{new Date(item.end_time).toLocaleString("en-GB")}</td>
                  <td style={tdStyle}>
                    {item.type === "Meeting" && item.venue ? `Venue: ${item.venue}` : ""}
                  </td>
                  <td style={tdStyle}>
                    {item.type === "Meeting" ? (
                      <Link to={`/meeting-details/${item.id}`} style={{ color: "#3182ce", textDecoration: "underline" }}>
                        View Details
                      </Link>
                    ) : item.type === "Leave" ? (
                      <Link to={`/leaves/${item.id}`} style={{ color: "#3182ce", textDecoration: "underline" }}>
                        View Details
                      </Link>
                    ) : item.type === "Engagement" ? (
                      <Link to={`/engagements/${item.id}`} style={{ color: "#3182ce", textDecoration: "underline" }}>
                        View Details
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <ToastContainer />
      </div>
    </div>
  );
}

export default Profile;
