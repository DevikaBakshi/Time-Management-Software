// src/pages/LeaveDetails.js
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";

function LeaveDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leave, setLeave] = useState(null);
  const [error, setError] = useState("");
  
  // States for rescheduling
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  
  // State for available slots for leave
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingLeaveSlots, setLoadingLeaveSlots] = useState(false);
  
  // Date for checking available slots (default to today)
  const [leaveSlotDate, setLeaveSlotDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  
  useEffect(() => {
    async function fetchLeave() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5000/api/leaves/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLeave(res.data);
      } catch (err) {
        console.error("Error fetching leave details:", err.response?.data || err.message);
        setError(err.response?.data?.error || "Failed to fetch leave details");
        toast.error(err.response?.data?.error || "Failed to fetch leave details");
      }
    }
    fetchLeave();
  }, [id]);
  
  // Handler to fetch available slots from the backend for leave
  const fetchAvailableSlots = async () => {
    setLoadingLeaveSlots(true);
    try {
      const token = localStorage.getItem("token");
      const executiveId = localStorage.getItem("userId");
      const res = await axios.get("http://localhost:5000/api/leaves/find-slot", {
        params: { date: leaveSlotDate, executive_id: executiveId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableSlots(res.data.availableIntervals);
      toast.success("Available slots fetched successfully.");
    } catch (err) {
      console.error("Error fetching available slots:", err.response?.data || err.message);
      setAvailableSlots([]);
      toast.error(err.response?.data?.error || "Failed to fetch available slots.");
    } finally {
      setLoadingLeaveSlots(false);
    }
  };

  // Toggle reschedule form visibility
  const handleRescheduleToggle = () => {
    setShowRescheduleForm(prev => !prev);
  };

  // Handler for confirming the reschedule (update)
  const confirmReschedule = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/leaves/${id}`,
        { leave_start: newStart, leave_end: newEnd, reason: leave.reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Leave updated successfully.");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error updating leave:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Failed to update leave.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this leave?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/leaves/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Leave deleted successfully.");
      navigate("/profile");
    } catch (err) {
      console.error("Error deleting leave:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Failed to delete leave.");
    }
  };

  const loggedUserId = localStorage.getItem("userId");

  if (error) return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  if (!leave) return <p style={{ textAlign: "center" }}>Loading leave details...</p>;
/*
  // Inline style objects
  const containerStyle = {
    maxWidth: "600px",
    margin: "20px auto",
    padding: "20px",
    backgroundColor: "#fdfdfd",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
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
  const headingStyle = {
    textAlign: "center",
    marginBottom: "20px",
    color: "#333"
  };

  const sectionStyle = {
    marginTop: "20px",
    paddingTop: "10px",
    borderTop: "1px solid #ccc"
  };

  const buttonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    marginRight: "10px"
  };

  return (
    <div style={{ ...containerStyle, ...baseFont }}>
      <Navbar/>
      <h2 style={headingStyle}>Leave Details</h2>
      <p><strong>Leave Start:</strong> {new Date(leave.leave_start).toLocaleString()}</p>
      <p><strong>Leave End:</strong> {new Date(leave.leave_end).toLocaleString()}</p>
      <p><strong>Reason:</strong> {leave.reason}</p>

      {/* Allow update/delete only if the logged-in user is the one who marked the leave */}
      {leave.executive_id.toString() === loggedUserId.toString() && (
        <div style={{ marginTop: "20px" }}>
          <button 
            onClick={handleDelete}
            style={{ ...buttonStyle, backgroundColor: "#e74c3c", color: "#fff" }}
          >
            Delete Leave
          </button>
        </div>
      )}

      {/* Reschedule Section: visible only for the leave creator */}
      {leave.executive_id.toString() === loggedUserId.toString() && (
        <div style={sectionStyle}>
          <h3 style={{ marginBottom: "10px" }}>Update Leave</h3>
          <button 
            onClick={handleRescheduleToggle}
            style={{ ...buttonStyle, backgroundColor: "#e67e22", color: "#fff" }}
          >
            {showRescheduleForm ? "Hide Reschedule Form" : "Reschedule Leave"}
          </button>

          {showRescheduleForm && (
            <div style={{ marginTop: "10px" }}>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>New Start Time:</label>
                <input
                  type="datetime-local"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>New End Time:</label>
                <input
                  type="datetime-local"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>
              <button
                onClick={confirmReschedule}
                style={{ ...buttonStyle, backgroundColor: "#3498db", color: "#fff" }}
              >
                Confirm Update
              </button>
            </div>
          )}
        </div>
      )}

      {/* Available Slots Section */}
      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "10px" }}>Find Available Leave Slots</h3>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Select Date:</label>
          <input
            type="date"
            value={leaveSlotDate}
            onChange={(e) => setLeaveSlotDate(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>
        <button
          onClick={fetchAvailableSlots}
          disabled={loadingLeaveSlots}
          style={{ ...buttonStyle, backgroundColor: "#9b59b6", color: "#fff" }}
        >
          {loadingLeaveSlots ? "Finding Slots..." : "Find Available Leave Slots"}
        </button>
        {availableSlots.length > 0 && (
          <div style={{ marginTop: "15px" }}>
            <h4 style={{ fontWeight: "bold", marginBottom: "10px" }}>Available Slots:</h4>
            <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
              {availableSlots.map((slot, index) => (
                <li key={index} style={{ marginBottom: "10px" }}>
                  <strong>Start:</strong> {slot.start} <br />
                  <strong>End:</strong> {slot.end} <br />
                  <button
                    onClick={() => {
                      setNewStart(slot.startISO);
                      setNewEnd(slot.endISO);
                      toast.info("Slot applied successfully!");
                    }}
                    style={{ ...buttonStyle, backgroundColor: "#f1c40f", color: "#fff" }}
                  >
                    Use this Slot
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Link to="/profile" style={{ display: "inline-block", marginTop: "20px", ...buttonStyle, backgroundColor: "#3498db", color: "#fff", textDecoration: "none", textAlign: "center" }}>
        Back to Profile
      </Link>

      <ToastContainer />
    </div>
  );
}

export default LeaveDetails;
