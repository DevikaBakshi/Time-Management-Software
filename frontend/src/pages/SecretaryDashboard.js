// src/pages/SecretaryDashboard.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { format } from "date-fns";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function SecretaryDashboard() {
  const navigate = useNavigate();
  const [executives, setExecutives] = useState([]);
  const [selectedExecutive, setSelectedExecutive] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [schedule, setSchedule] = useState([]);
  const [freeIntervals, setFreeIntervals] = useState([]);
  const [manualMeetings, setManualMeetings] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingFree, setLoadingFree] = useState(false);
  const [loadingManual, setLoadingManual] = useState(false);

  // For personalized email
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
/*
  // Inline styles
  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px"
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

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1F2937", // Dark gray
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "4px",
    marginBottom: "20px"
  };

  const sectionStyle = {
    backgroundColor: "#F3F4F6", // light gray
    padding: "15px",
    borderRadius: "4px",
    marginBottom: "20px"
  };

  const buttonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer"
  };

  const blueButton = {
    ...buttonStyle,
    backgroundColor: "#3B82F6",
    color: "#fff",
    marginRight: "10px"
  };

  const greenButton = {
    ...buttonStyle,
    backgroundColor: "#10B981",
    color: "#fff"
  };

  const redButton = {
    ...buttonStyle,
    backgroundColor: "#EF4444",
    color: "#fff"
  };

  // Logout handler: Clear auth info and redirect to login
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  // Fetch executives and manual intervention records on mount
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users?role=executive")
      .then((res) => {
        setExecutives(res.data);
      })
      .catch((err) => {
        console.error("Error fetching executives:", err);
        toast.error("Failed to fetch executives");
      });

    fetchManualMeetings();
  }, []);

  const fetchManualMeetings = async () => {
    setLoadingManual(true);
    try {
      const res = await axios.get("http://localhost:5000/api/meetings/secretary-dashboard");
      setManualMeetings(res.data);
    } catch (err) {
      console.error("Error fetching manual meetings:", err);
      toast.error("Failed to fetch meetings needing intervention");
    }
    setLoadingManual(false);
  };

  // Fetch selected executive's schedule for the given date
  const fetchSchedule = async () => {
    if (!selectedExecutive) {
      toast.error("Please select an executive");
      return;
    }
    setLoadingSchedule(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/meetings/schedules?user_id=${selectedExecutive}&date=${date}`
      );
      setSchedule(res.data);
    } catch (err) {
      console.error("Error fetching schedule:", err);
      toast.error("Failed to fetch schedule");
    }
    setLoadingSchedule(false);
  };

  // Fetch free intervals for the selected executive on the given date
  const fetchFreeIntervals = async () => {
    if (!selectedExecutive) {
      toast.error("Please select an executive");
      return;
    }
    setLoadingFree(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/meetings/free-intervals?user_id=${selectedExecutive}&date=${date}`
      );
      setFreeIntervals(res.data.availableIntervals);
    } catch (err) {
      console.error("Error fetching free intervals:", err);
      toast.error("Failed to fetch free intervals");
    }
    setLoadingFree(false);
  };

  // Delete a manual intervention record
  const deleteManualRecord = async (recordId) => {
    try {
      await axios.delete(`http://localhost:5000/api/meetings/secretary/manual/${recordId}`);
      toast.success("Manual intervention record deleted successfully.");
      // Refresh the list after deletion
      fetchManualMeetings();
    } catch (err) {
      console.error("Error deleting record:", err);
      toast.error("Failed to delete manual intervention record.");
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!selectedRecipients.length) {
      toast.error("Please select at least one executive to email.");
      return;
    }
    if (!emailSubject || !emailMessage) {
      toast.error("Subject and message are required.");
      return;
    }
    const recipients = selectedRecipients.map(rec => rec.value);
    try {
      await axios.post(
        "http://localhost:5000/api/meetings/secretary/send-email",
        {
          recipients,
          subject: emailSubject,
          message: emailMessage,
          date,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      toast.success("Personalized email sent successfully.");
      // Clear form fields
      setSelectedRecipients([]);
      setEmailSubject("");
      setEmailMessage("");
    } catch (err) {
      console.error("Error sending personalized email:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Failed to send personalized email.");
    }
  };

  // Prepare options for react-select dropdown for executives
  const executiveOptions = executives.map((exec) => ({
    value: exec.user_id,
    label: `${exec.name} (${exec.email})`,
  }));

  return (
    <div style={{ ...containerStyle, ...baseFont }}>
      {/* Navbar */}
      <nav style={headerStyle}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Secretary Dashboard</h1>
        </div>
        <button onClick={handleLogout} style={redButton}>Logout</button>
      </nav>

      {/* Main Content */}
      <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}>
        {/* Executive Selection and Date Picker */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>Select Executive:</label>
          <select
            value={selectedExecutive}
            onChange={(e) => setSelectedExecutive(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", width: "100%" }}
          >
            <option value="">-- Select an Executive --</option>
            {executives.map((exec) => (
              <option key={exec.user_id} value={exec.user_id}>
                {exec.name} ({exec.email})
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>Select Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", width: "100%" }}
          />
        </div>

        {/* Buttons */}
        <div style={{ marginBottom: "20px" }}>
          <button onClick={fetchSchedule} style={blueButton}>
            {loadingSchedule ? "Loading Schedule..." : "Fetch Schedule"}
          </button>
          <button onClick={fetchFreeIntervals} style={greenButton}>
            {loadingFree ? "Loading Free Intervals..." : "Fetch Free Intervals"}
          </button>
        </div>

        {/* Executive's Schedule */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "10px" }}>
            Executive's Schedule for {date}
          </h2>
          {loadingSchedule ? (
            <p>Loading schedule...</p>
          ) : schedule.length > 0 ? (
            <ul style={{ listStyle: "disc", paddingLeft: "20px" }}>
              {schedule.map((meeting) => (
                <li key={meeting.meeting_id} style={{ marginBottom: "8px" }}>
                  <strong>{meeting.title}</strong> - {new Date(meeting.start_time).toLocaleString()} to {new Date(meeting.end_time).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>No meetings scheduled.</p>
          )}
        </div>

        {/* Free Intervals */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "10px" }}>
            Free Intervals for {date}
          </h2>
          {loadingFree ? (
            <p>Loading free intervals...</p>
          ) : freeIntervals && freeIntervals.length > 0 ? (
            <ul style={{ listStyle: "disc", paddingLeft: "20px" }}>
              {freeIntervals.map((interval, index) => (
                <li key={index} style={{ marginBottom: "8px" }}>
                  {interval.start} to {interval.end}
                </li>
              ))}
            </ul>
          ) : (
            <p>No free intervals found.</p>
          )}
        </div>

        {/* Manual Intervention Records */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "10px" }}>
            Meetings Needing Manual Intervention
          </h2>
          {loadingManual ? (
            <p>Loading manual intervention records...</p>
          ) : manualMeetings && manualMeetings.length > 0 ? (
            <ul style={{ listStyle: "disc", paddingLeft: "20px" }}>
              {manualMeetings.map((record) => (
                <li key={record.id} style={{ marginBottom: "8px" }}>
                  <p>
                    <strong>Meeting Date:</strong>{" "}
                    {record.meeting_date ? format(new Date(record.meeting_date), "eee, MMM d, yyyy") : "N/A"}
                  </p>
                  <p>
                    <strong>Executives Involved:</strong>{" "}
                    {record.executives_involved && record.executives_involved.length > 0
                      ? record.executives_involved.map((exec) => `${exec.name} (${exec.email})`).join(", ")
                      : "Not Provided"}
                  </p>
                  <button onClick={() => deleteManualRecord(record.id)} style={redButton}>
                    Delete Record
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No meetings flagged for manual intervention.</p>
          )}
        </div>

        {/* Personalized Email Section */}
        <div style={{ ...sectionStyle, border: "1px solid #D1D5DB" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "10px" }}>Send Personalized Email</h2>
          <label style={{ display: "block", marginBottom: "8px" }}>Select Recipients:</label>
          <Select
            isMulti
            options={executiveOptions}
            value={selectedRecipients}
            onChange={setSelectedRecipients}
            placeholder="Select executives..."
          />
          <label style={{ display: "block", marginTop: "16px", marginBottom: "8px" }}>Subject:</label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", width: "100%", border: "1px solid #D1D5DB" }}
          />
          <label style={{ display: "block", marginTop: "16px", marginBottom: "8px" }}>Message:</label>
          <textarea
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            rows="4"
            style={{ padding: "8px", borderRadius: "4px", width: "100%", border: "1px solid #D1D5DB" }}
          ></textarea>
          <button
            onClick={handleSendEmail}
            style={{ ...blueButton, marginTop: "16px" }}
          >
            Send Email
          </button>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}

export default SecretaryDashboard;
