// src/pages/MeetingDetails.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Make sure to import format from date-fns if you want to format dates in the available slots section.
import { format } from "date-fns";
import Navbar from "../components/Navbar";

function MeetingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meetingData, setMeetingData] = useState({
    title: "",
    start_time: "",
    end_time: "",
    venue: "",
    project_name: "",
    created_by: "",
    attendees: [] // Array of selected attendee IDs
  });
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState("");

  // Reschedule states
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newVenue, setNewVenue] = useState("");

  // Find available slots states
  const [slotDate, setSlotDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    async function fetchMeeting() {
      try {
        console.log("Fetching meeting with id:", id); // Debug log
        const response = await axios.get(`http://localhost:5000/api/meetings/${id}`);
        setMeeting(response.data);
      } catch (err) {
        console.error("Error fetching meeting details:", err.response?.data || err.message);
        setError(err.response?.data?.error || "Failed to fetch meeting details");
      }
    }
    fetchMeeting();
  }, [id]);
  

  const baseFont = { fontFamily: "Arial, sans-serif" };

  const containerStyle = {
    margin: "0",
    padding: "0",
    width: "100%",
    overflowX: "hidden", // Prevent horizontal scroll
    boxSizing: "border-box"
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

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to cancel this meeting?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/meetings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Meeting cancelled successfully.");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error cancelling meeting:", err);
      toast.error(err.response?.data?.error || "Failed to cancel meeting.");
    }
  };

  const handleRescheduleToggle = () => {
    setShowRescheduleForm((prev) => !prev);
  };

  const confirmReschedule = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/meetings/${id}`,
        { start_time: newStart, end_time: newEnd, venue: newVenue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Meeting rescheduled successfully.");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error rescheduling meeting:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Failed to reschedule meeting.");
    }
  };

  // Disable modifications if the meeting has started or is ongoing
  const meetingStart = new Date(meeting?.start_time);
  const now = new Date();
  const canModify = meeting && now < meetingStart;

  if (error) return <p style={styles.error}>{error}</p>;
  if (!meeting) return <p style={styles.loading}>Loading meeting details...</p>;

  const loggedUserId = localStorage.getItem("userId");

  return (
    <div style={{ ...containerStyle, ...baseFont }}>
      <Navbar/>
      <div style={styles.content}>
        <h2 style={styles.title}>Meeting Details</h2>
        <p><strong>Title:</strong> {meeting.title}</p>
        <p><strong>Start Time:</strong> {new Date(meeting.start_time).toLocaleString()}</p>
        <p><strong>End Time:</strong> {new Date(meeting.end_time).toLocaleString()}</p>
        <p><strong>Venue:</strong> {meeting.venue}</p>
        <p><strong>Project Name:</strong> {meeting.project_name}</p>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Organizer Details</h3>
          {meeting.organizer ? (
            <div style={styles.detailBox}>
              <p><strong>Name:</strong> {meeting.organizer.name}</p>
              <p><strong>Email:</strong> {meeting.organizer.email}</p>
              <p><strong>User ID:</strong> {meeting.organizer.user_id}</p>
            </div>
          ) : (
            <p>Organizer details not available</p>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Attendees</h3>
          {meeting.attendees && meeting.attendees.length > 0 ? (
            <ul style={styles.list}>
              {meeting.attendees.map((attendee, index) => (
                <li key={index} style={styles.listItem}>
                  <p><strong>Name:</strong> {attendee.name}</p>
                  <p><strong>Email:</strong> {attendee.email}</p>
                  <p><strong>User ID:</strong> {attendee.user_id}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No additional attendees.</p>
          )}
        </div>

        {meeting.created_by.toString() === loggedUserId.toString() && canModify && (
          <>
            <div style={styles.buttonContainer}>
              <button style={styles.deleteButton} onClick={handleDelete}>Cancel Meeting</button>
            </div>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Reschedule Meeting</h3>
              <button style={styles.toggleButton} onClick={handleRescheduleToggle}>
                {showRescheduleForm ? "Hide Reschedule Form" : "Reschedule Meeting"}
              </button>
              {showRescheduleForm && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Start Time:</label>
                    <input
                      type="datetime-local"
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>New End Time:</label>
                    <input
                      type="datetime-local"
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Venue:</label>
                    <input
                      type="text"
                      value={newVenue}
                      onChange={(e) => setNewVenue(e.target.value)}
                      placeholder={meeting.venue}
                      style={styles.input}
                    />
                  </div>
                  <button style={styles.confirmButton} onClick={confirmReschedule}>
                    Confirm Reschedule
                  </button>
                  
                  {/* Find Available Slots Section */}
                  <div style={styles.slotSection}>
                    <h3 style={styles.sectionTitle}>Find Available Slots</h3>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Date for Available Slots:</label>
                      <input
                        type="date"
                        value={slotDate}
                        onChange={(e) => setSlotDate(e.target.value)}
                        style={styles.input}
                      />
                    </div>
                    <button style={styles.findButton} onClick={findAvailableSlots} disabled={loadingSlots}>
                      {loadingSlots ? "Finding Slots..." : "Find Available Slots"}
                    </button>
                    {availableSlots.length > 0 && (
                      <div style={styles.slotsContainer}>
                        <h4 style={styles.sectionTitle}>Available Slots:</h4>
                        <ul style={styles.list}>
                          {availableSlots.map((slot, index) => (
                            <li key={index} style={styles.listItem}>
                              <p><strong>Start:</strong> {slot.start}</p>
                              <p><strong>End:</strong> {slot.end}</p>
                              <button
                                style={styles.slotButton}
                                onClick={() => {
                                  setNewStart(slot.startISO);
                                  setNewEnd(slot.endISO);
                                  toast.info("Slot applied successfully!");
                                }}
                              >
                                Use this Slot
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
        <div style={styles.buttonContainer}>
          <button style={styles.backButton} onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    color: "#333"
  },
  navbar: {
    backgroundColor: "#333",
    color: "#fff",
    padding: "10px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  navItems: {
    display: "flex",
    gap: "15px"
  },
  navLink: {
    color: "#fff",
    textDecoration: "none",
    fontWeight: "bold"
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    border: "none",
    color: "#fff",
    padding: "8px 16px",
    cursor: "pointer",
    borderRadius: "4px"
  },
  content: {
    backgroundColor: "#f9f9f9",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
  },
  title: {
    fontSize: "24px",
    marginBottom: "16px"
  },
  section: {
    marginTop: "20px"
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "8px"
  },
  detailBox: {
    marginLeft: "20px",
    padding: "10px",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px"
  },
  list: {
    listStyleType: "disc",
    paddingLeft: "20px"
  },
  listItem: {
    marginBottom: "8px"
  },
  buttonContainer: {
    marginTop: "20px"
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  },
  toggleButton: {
    backgroundColor: "#f39c12",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  },
  formGroup: {
    marginBottom: "10px"
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold"
  },
  input: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px"
  },
  confirmButton: {
    backgroundColor: "#3498db",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  },
  slotSection: {
    marginTop: "20px",
    borderTop: "1px solid #ccc",
    paddingTop: "10px"
  },
  findButton: {
    backgroundColor: "#9b59b6",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  },
  slotsContainer: {
    marginTop: "10px"
  },
  slotButton: {
    backgroundColor: "#e67e22",
    color: "#fff",
    padding: "5px 10px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "5px"
  },
  backButton: {
    backgroundColor: "#2980b9",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  },
  error: {
    color: "red",
    textAlign: "center",
    marginTop: "20px"
  },
  loading: {
    textAlign: "center",
    marginTop: "20px"
  }
};

export default MeetingDetails;
