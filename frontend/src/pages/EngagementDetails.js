// src/pages/EngagementDetails.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";

function EngagementDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [engagement, setEngagement] = useState(null);
  const [error, setError] = useState("");

  // States for rescheduling
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newVenue, setNewVenue] = useState("");

  // States for available slots search
  const [slotDate, setSlotDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);


  const baseFont = { fontFamily: "Arial, sans-serif" };

  const containerStyle = {
    margin: "0",
    padding: "0",
    width: "100%",
    overflowX: "hidden", // Prevent horizontal scroll
    boxSizing: "border-box"
  };
  useEffect(() => {
    async function fetchEngagement() {
      try {
        const response = await axios.get(`http://localhost:5000/api/engagements/${id}`);
        setEngagement(response.data);
      } catch (err) {
        console.error("Error fetching engagement details:", err.response?.data || err.message);
        setError(err.response?.data?.error || "Failed to fetch engagement details");
      }
    }
    fetchEngagement();
  }, [id]);

  // Handler for deleting the engagement
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this engagement?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/engagements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Engagement deleted successfully.");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error deleting engagement:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Failed to delete engagement.");
    }
  };

  // Toggle reschedule form visibility
  const handleRescheduleToggle = () => {
    setShowRescheduleForm((prev) => !prev);
    setAvailableSlots([]); // Clear any available slots when toggling the form
  };

  // Handler for finding available slots for rescheduling
  const findAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const executiveId = localStorage.getItem("userId");
      const response = await axios.get(
        `http://localhost:5000/api/engagements/find-slot?date=${slotDate}&executive_id=${executiveId}`
      );
      setAvailableSlots(response.data.availableIntervals);
    } catch (error) {
      console.error("Error finding available slots:", error.response?.data || error.message);
      setAvailableSlots([]);
      toast.error(error.response?.data?.error || "Failed to fetch available slots.");
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handler for applying a selected slot to the reschedule form
  const applySlot = (slot) => {
    setNewStart(slot.startISO);
    setNewEnd(slot.endISO);
    toast.info("Slot applied successfully!");
  };

  // Handler for confirming the reschedule (update)
  const confirmReschedule = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/engagements/${id}`,
        { engagement_start: newStart, engagement_end: newEnd, description: engagement.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Engagement updated successfully.");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error updating engagement:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Failed to update engagement.");
    }
  };

  if (error) return <p style={styles.errorText}>{error}</p>;
  if (!engagement) return <p>Loading engagement details...</p>;

  const loggedUserId = localStorage.getItem("userId");

  return (
    <div style={{ ...containerStyle, ...baseFont }}>
      <Navbar/>
      <h2 style={styles.heading}>Engagement Details</h2>
      <div style={styles.detailBox}>
        <p><strong>Engagement Start:</strong> {new Date(engagement.engagement_start).toLocaleString()}</p>
        <p><strong>Engagement End:</strong> {new Date(engagement.engagement_end).toLocaleString()}</p>
        <p><strong>Description:</strong> {engagement.description}</p>
      </div>

      {/* Delete button: visible only if the logged-in user is the creator */}
      {engagement.executive_id.toString() === loggedUserId.toString() && (
        <div style={styles.buttonContainer}>
          <button onClick={handleDelete} style={styles.deleteButton}>
            Delete Engagement
          </button>
        </div>
      )}

      {/* Reschedule Section: visible only for the meeting creator */}
      {engagement.executive_id.toString() === loggedUserId.toString() && (
        <div style={styles.rescheduleSection}>
          <h3 style={styles.subHeading}>Reschedule Engagement</h3>
          <button onClick={handleRescheduleToggle} style={styles.toggleButton}>
            {showRescheduleForm ? "Hide Reschedule Form" : "Show Reschedule Options"}
          </button>

          {showRescheduleForm && (
            <div style={styles.formContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>New Start Time:</label>
                <input
                  type="datetime-local"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>New End Time:</label>
                <input
                  type="datetime-local"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>New Venue:</label>
                <input
                  type="text"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  placeholder={engagement.venue || "Enter new venue"}
                  style={styles.input}
                />
              </div>
              <button onClick={confirmReschedule} style={styles.confirmButton}>
                Confirm Reschedule
              </button>

              {/* Find Available Slots Section */}
              <div style={styles.slotSection}>
                <h4 style={styles.subHeading}>Find Available Slots</h4>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Select Date for Available Slots:</label>
                  <input
                    type="date"
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <button
                  onClick={findAvailableSlots}
                  disabled={loadingSlots}
                  style={styles.slotButton}
                >
                  {loadingSlots ? "Finding Slots..." : "Find Available Slots"}
                </button>
                {availableSlots.length > 0 && (
                  <div style={styles.slotList}>
                    <h5 style={styles.subHeading}>Available Slots:</h5>
                    <ul style={styles.ulList}>
                      {availableSlots.map((slot, index) => (
                        <li key={index} style={styles.liItem}>
                          <p><strong>Start:</strong> {slot.start}</p>
                          <p><strong>End:</strong> {slot.end}</p>
                          <button
                            onClick={() => applySlot(slot)}
                            style={styles.applyButton}
                          >
                            Use this Slot
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <Link to="/profile" style={styles.backButton}>
        Back to Profile
      </Link>

      <ToastContainer />
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "20px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    fontSize: "1.75rem",
    fontWeight: "bold",
    marginBottom: "20px",
    textAlign: "center",
  },
  subHeading: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  detailBox: {
    backgroundColor: "#f9f9f9",
    padding: "15px",
    borderRadius: "4px",
    marginBottom: "20px",
  },
  buttonContainer: {
    marginTop: "10px",
    textAlign: "center",
  },
  deleteButton: {
    padding: "10px 20px",
    backgroundColor: "#e53e3e",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  rescheduleSection: {
    marginTop: "20px",
    paddingTop: "10px",
    borderTop: "1px solid #ccc",
  },
  toggleButton: {
    padding: "10px 20px",
    backgroundColor: "#dd6b20",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  formContainer: {
    marginTop: "20px",
  },
  inputGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  input: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  confirmButton: {
    padding: "10px 20px",
    backgroundColor: "#3182ce",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  slotSection: {
    marginTop: "20px",
    paddingTop: "10px",
    borderTop: "1px solid #ccc",
  },
  slotButton: {
    padding: "10px 20px",
    backgroundColor: "#6b46c1",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  slotList: {
    marginTop: "15px",
  },
  ulList: {
    listStyleType: "disc",
    paddingLeft: "20px",
  },
  liItem: {
    marginBottom: "10px",
    padding: "10px",
    backgroundColor: "#f7fafc",
    borderRadius: "4px",
  },
  applyButton: {
    marginTop: "5px",
    padding: "5px 10px",
    backgroundColor: "#d69e2e",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  backButton: {
    display: "inline-block",
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#3182ce",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "4px",
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
};

export default EngagementDetails;
