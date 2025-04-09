// src/pages/ScheduleMeeting.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
// Inline styles for the Navbar
const navbarStyle = {
  backgroundColor: "#333",
  color: "#fff",
  padding: "10px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
};

const navLinksStyle = {
  display: "flex",
  gap: "15px"
};

const linkStyle = {
  color: "#fff",
  textDecoration: "none",
  fontWeight: "bold"
};

const baseFont = { fontFamily: "Arial, sans-serif" };
/*
// Inline style objects
const containerStyle = {
  margin: "0",
  padding: "0",
  width: "100%",
  overflowX: "hidden", // Prevent horizontal scroll
  boxSizing: "border-box"
};
*/
// Inline styles for the container and form
const containerStyle = {
  maxWidth: "800px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f9f9f9",
  borderRadius: "8px",
  overflowX: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "20px",
  fontSize: "1.75rem",
  fontWeight: "bold",
  color: "#333"
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "15px"
};

const labelStyle = {
  fontWeight: "bold",
  marginBottom: "5px",
  color: "#333"
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "1rem"
};

const buttonStyle = {
  padding: "12px",
  borderRadius: "4px",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold"
};

const slotButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#f59e0b", // yellow
  marginTop: "10px"
};

const findSlotButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#10b981", // green
  marginTop: "10px"
};

const disabledButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#9ca3af" // gray
};

function ScheduleMeeting() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [executives, setExecutives] = useState([]);
  const [meetingData, setMeetingData] = useState({
    title: "",
    start_time: "",
    end_time: "",
    venue: "",
    project_name: "",
    created_by: "",
    attendees: [] // Array of selected attendee IDs
  });
  const [slotDate, setSlotDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState([]);

  // Helper: returns current date/time formatted as "YYYY-MM-DDTHH:mm"
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  
  // Fetch user role, user id, and available executives on mount
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const id = localStorage.getItem("userId");

    if (!id) {
      setError("Error: User ID not found. Please log in again.");
      return;
    }

    setUserRole(role);
    setMeetingData((prev) => ({ ...prev, created_by: id }));

    // Fetch executives for attendee selection
    axios
      .get("http://localhost:5000/api/users?role=executive")
      .then((response) => {
        // Exclude the logged-in user from the options
        const filtered = response.data.filter(
          (exec) => exec.user_id.toString() !== id.toString()
        );
        setExecutives(filtered);
      })
      .catch((err) => {
        console.error("Error fetching executives:", err);
      });
  }, []);

  if (userRole === null) {
    return <p style={{ textAlign: "center" }}>Loading...</p>;
  }

  if (userRole !== "executive") {
    return <p style={{ textAlign: "center" }}>You do not have permission to schedule meetings.</p>;
  }

  const handleChange = (e) => {
    setMeetingData({ ...meetingData, [e.target.name]: e.target.value });
  };

  // Handler for the slot date input
  const handleSlotDateChange = (e) => {
    setSlotDate(e.target.value);
  };

  // Using react-select to handle attendee selection
  const handleAttendeesChange = (selectedOptions) => {
    setSelectedAttendees(selectedOptions);
    setMeetingData((prev) => ({
      ...prev,
      attendees: selectedOptions ? selectedOptions.map((option) => option.value) : []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/meetings/create", meetingData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Meeting Scheduled Successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error scheduling meeting:", error.response?.data || error.message);
      setError(error.response?.data?.error || "An unexpected error occurred.");
      toast.error(error.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const findAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      // Include both the organizer and the selected attendees in the query
      const attendeeQuery = [meetingData.created_by, ...meetingData.attendees].join(",");
      const response = await axios.get(
        `http://localhost:5000/api/meetings/find-slot?date=${slotDate}&attendees=${attendeeQuery}`
      );
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      console.error("Error finding slots:", error.response?.data || error.message);
      setAvailableSlots([]);
      toast.error(error.response?.data?.error || "Failed to fetch available slots.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const applySlot = (slot) => {
    setMeetingData({
      ...meetingData,
      start_time: slot.startISO,
      end_time: slot.endISO,
    });
    toast.info("Slot applied successfully!");
  };

  // Prepare options for react-select dropdown
  const attendeeOptions = executives.map((exec) => ({
    value: exec.user_id,
    label: `${exec.name} (${exec.email})`,
  }));

  return (
    <div style={{ ...baseFont }}>
      <Navbar />
      <div style={containerStyle}>
        <h2 style={headerStyle}>Schedule a New Meeting</h2>
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
        <form onSubmit={handleSubmit} style={formStyle}>
          <div>
            <label style={labelStyle}>Title:</label>
            <input
              type="text"
              name="title"
              value={meetingData.title}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Start Time:</label>
            <input
              type="datetime-local"
              name="start_time"
              value={meetingData.start_time}
              onChange={handleChange}
              required
              min={getCurrentDateTimeLocal()}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>End Time:</label>
            <input
              type="datetime-local"
              name="end_time"
              value={meetingData.end_time}
              onChange={handleChange}
              required
              min={meetingData.start_time || getCurrentDateTimeLocal()}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Venue:</label>
            <input
              type="text"
              name="venue"
              value={meetingData.venue}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Project Name:</label>
            <input
              type="text"
              name="project_name"
              value={meetingData.project_name}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Select Attendees:</label>
            <Select
              isMulti
              options={attendeeOptions}
              value={selectedAttendees}
              onChange={handleAttendeesChange}
              placeholder="Search and select attendees..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={loading ? disabledButtonStyle : { ...buttonStyle, backgroundColor: "#3b82f6" }} // blue
          >
            {loading ? "Scheduling..." : "Schedule Meeting"}
          </button>
        </form>

        <div style={{ marginTop: "20px" }}>
          <label style={{ ...labelStyle, marginBottom: "10px", display: "block" }}>
            Select Date for Available Slots:
          </label>
          <input
            type="date"
            value={slotDate}
            onChange={handleSlotDateChange}
            style={{ ...inputStyle, marginBottom: "10px" }}
          />
          <button
            onClick={findAvailableSlots}
            disabled={loadingSlots}
            style={loadingSlots ? disabledButtonStyle : { ...findSlotButtonStyle }}
          >
            {loadingSlots ? "Finding Slots..." : "Find Available Slots"}
          </button>
          {availableSlots.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "10px" }}>Available Slots:</h3>
              <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                {availableSlots.map((slot, index) => (
                  <li key={index} style={{ marginBottom: "10px" }}>
                    <div>
                      <strong>Start:</strong> {slot.start}
                    </div>
                    <div>
                      <strong>End:</strong> {slot.end}
                    </div>
                    <button
                      onClick={() => applySlot(slot)}
                      style={slotButtonStyle}
                    >
                      Use this Slot
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <ToastContainer />
      </div>
    </div>
  );
}

export default ScheduleMeeting;
