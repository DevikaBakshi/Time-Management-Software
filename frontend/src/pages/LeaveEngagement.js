// src/pages/LeaveEngagement.js
import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function LeaveEngagement() {
  // State for leave form
  const [leaveData, setLeaveData] = useState({
    leave_start: "",
    leave_end: "",
    reason: ""
  });

  // State for engagement form
  const [engagementData, setEngagementData] = useState({
    engagement_start: "",
    engagement_end: "",
    description: ""
  });

  // State for available slots for leave and engagement
  const [leaveAvailableSlots, setLeaveAvailableSlots] = useState([]);
  const [engagementAvailableSlots, setEngagementAvailableSlots] = useState([]);

  // Loading states for slot searches
  const [loadingLeaveSlots, setLoadingLeaveSlots] = useState(false);
  const [loadingEngagementSlots, setLoadingEngagementSlots] = useState(false);

  // Date fields for slot search (default to today)
  const [leaveSlotDate, setLeaveSlotDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [engagementSlotDate, setEngagementSlotDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Handler for submitting leave
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const executiveId = localStorage.getItem("userId");
      await axios.post(
        "http://localhost:5000/api/leaves",
        {
          executive_id: executiveId,
          ...leaveData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Leave marked successfully!");
      setLeaveData({ leave_start: "", leave_end: "", reason: "" });
    } catch (error) {
      console.error("Error marking leave:", error.response?.data || error.message);
      toast.error("Failed to mark leave.");
    }
  };

  // Handler for submitting engagement
  const handleEngagementSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const executiveId = localStorage.getItem("userId");
      await axios.post(
        "http://localhost:5000/api/engagements",
        {
          executive_id: executiveId,
          ...engagementData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Engagement marked successfully!");
      setEngagementData({ engagement_start: "", engagement_end: "", description: "" });
      setEngagementAvailableSlots([]);
    } catch (error) {
      console.error("Error marking engagement:", error.response?.data || error.message);
      toast.error("Failed to mark engagement.");
    }
  };

  // Handler for finding available slots for leave
  const findLeaveAvailableSlots = async () => {
    setLoadingLeaveSlots(true);
    try {
      const executiveId = localStorage.getItem("userId");
      const response = await axios.get(
        `http://localhost:5000/api/leaves/find-slot?date=${leaveSlotDate}&executive_id=${executiveId}`
      );
      setLeaveAvailableSlots(response.data.availableIntervals);
    } catch (error) {
      console.error("Error finding available leave slots:", error.response?.data || error.message);
      setLeaveAvailableSlots([]);
      toast.error(error.response?.data?.error || "Failed to fetch available leave slots.");
    } finally {
      setLoadingLeaveSlots(false);
    }
  };

  // Handler for finding available slots for engagement
  const findEngagementAvailableSlots = async () => {
    setLoadingEngagementSlots(true);
    try {
      const executiveId = localStorage.getItem("userId");
      const response = await axios.get(
        `http://localhost:5000/api/engagements/find-slot?date=${engagementSlotDate}&executive_id=${executiveId}`
      );
      setEngagementAvailableSlots(response.data.availableIntervals);
    } catch (error) {
      console.error("Error finding available engagement slots:", error.response?.data || error.message);
      setEngagementAvailableSlots([]);
      toast.error(error.response?.data?.error || "Failed to fetch available engagement slots.");
    } finally {
      setLoadingEngagementSlots(false);
    }
  };

  // Handler for applying a selected slot to the leave form
  const applyLeaveSlot = (slot) => {
    setLeaveData((prev) => ({
      ...prev,
      leave_start: slot.startISO,
      leave_end: slot.endISO
    }));
    toast.info("Leave slot applied successfully!");
  };

  // Handler for applying a selected slot to the engagement form
  const applyEngagementSlot = (slot) => {
    setEngagementData((prev) => ({
      ...prev,
      engagement_start: slot.startISO,
      engagement_end: slot.endISO
    }));
    toast.info("Engagement slot applied successfully!");
  };
/*
  // Inline styles
  const containerStyle = {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f4f4f4",
    minHeight: "100vh"
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
  const navbarStyle = {
    backgroundColor: "#333",
    color: "#fff",
    padding: "10px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  };

  const navLinkStyle = {
    color: "#fff",
    textDecoration: "none",
    marginRight: "15px"
  };

  const formContainerStyle = {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    marginBottom: "30px"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: "bold"
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    border: "1px solid #ccc",
    borderRadius: "4px"
  };

  const buttonStyle = {
    padding: "10px 20px",
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  };

  const findSlotButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#6a1b9a",
    marginTop: "10px"
  };

  const slotItemStyle = {
    backgroundColor: "#ffeb3b",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "8px"
  };

  return (
    <div style={{ ...containerStyle, ...baseFont }}>
      <Navbar/>

      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", textAlign: "center" }}>
        Mark Leave and Engagement
      </h2>

      {/* Leave Section */}
      <div style={formContainerStyle}>
        <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>Mark Leave</h3>
        <form onSubmit={handleLeaveSubmit}>
          <label style={labelStyle}>Leave Start:</label>
          <input
            type="datetime-local"
            value={leaveData.leave_start}
            onChange={(e) => setLeaveData({ ...leaveData, leave_start: e.target.value })}
            style={inputStyle}
            required
          />
          <label style={labelStyle}>Leave End:</label>
          <input
            type="datetime-local"
            value={leaveData.leave_end}
            onChange={(e) => setLeaveData({ ...leaveData, leave_end: e.target.value })}
            style={inputStyle}
            required
          />
          <label style={labelStyle}>Reason (optional):</label>
          <textarea
            value={leaveData.reason}
            onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
            style={{ ...inputStyle, height: "80px" }}
          ></textarea>
          <button type="submit" style={buttonStyle}>Mark Leave</button>
        </form>
        <div style={{ marginTop: "20px" }}>
          <label style={labelStyle}>Select Date for Available Leave Slots:</label>
          <input
            type="date"
            value={leaveSlotDate}
            onChange={(e) => setLeaveSlotDate(e.target.value)}
            style={inputStyle}
          />
          <button onClick={findLeaveAvailableSlots} style={findSlotButtonStyle} disabled={loadingLeaveSlots}>
            {loadingLeaveSlots ? "Finding Slots..." : "Find Available Leave Slots"}
          </button>
          {leaveAvailableSlots.length > 0 && (
            <div style={{ marginTop: "15px" }}>
              <h4 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>Available Leave Slots:</h4>
              <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                {leaveAvailableSlots.map((slot, index) => (
                  <li key={index} style={slotItemStyle}>
                    <div><strong>Start:</strong> {slot.start}</div>
                    <div><strong>End:</strong> {slot.end}</div>
                    <button onClick={() => applyLeaveSlot(slot)} style={{ ...buttonStyle, backgroundColor: "#ff9800", marginTop: "10px" }}>
                      Use this Slot
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Engagement Section */}
      <div style={formContainerStyle}>
        <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>Mark Engagement</h3>
        <form onSubmit={handleEngagementSubmit}>
          <label style={labelStyle}>Engagement Start:</label>
          <input
            type="datetime-local"
            value={engagementData.engagement_start}
            onChange={(e) => setEngagementData({ ...engagementData, engagement_start: e.target.value })}
            style={inputStyle}
            required
          />
          <label style={labelStyle}>Engagement End:</label>
          <input
            type="datetime-local"
            value={engagementData.engagement_end}
            onChange={(e) => setEngagementData({ ...engagementData, engagement_end: e.target.value })}
            style={inputStyle}
            required
          />
          <label style={labelStyle}>Description (optional):</label>
          <textarea
            value={engagementData.description}
            onChange={(e) => setEngagementData({ ...engagementData, description: e.target.value })}
            style={{ ...inputStyle, height: "80px" }}
          ></textarea>
          <button type="submit" style={{ ...buttonStyle, backgroundColor: "#388e3c" }}>Mark Engagement</button>
        </form>
        <div style={{ marginTop: "20px" }}>
          <label style={labelStyle}>Select Date for Available Engagement Slots:</label>
          <input
            type="date"
            value={engagementSlotDate}
            onChange={(e) => setEngagementSlotDate(e.target.value)}
            style={inputStyle}
          />
          <button onClick={findEngagementAvailableSlots} style={findSlotButtonStyle} disabled={loadingEngagementSlots}>
            {loadingEngagementSlots ? "Finding Slots..." : "Find Available Engagement Slots"}
          </button>
          {engagementAvailableSlots.length > 0 && (
            <div style={{ marginTop: "15px" }}>
              <h4 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>Available Engagement Slots:</h4>
              <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                {engagementAvailableSlots.map((slot, index) => (
                  <li key={index} style={slotItemStyle}>
                    <div><strong>Start:</strong> {slot.start}</div>
                    <div><strong>End:</strong> {slot.end}</div>
                    <button onClick={() => applyEngagementSlot(slot)} style={{ ...buttonStyle, backgroundColor: "#ff9800", marginTop: "10px" }}>
                      Use this Slot
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <ToastContainer />
    </div>
  );
}

export default LeaveEngagement;
