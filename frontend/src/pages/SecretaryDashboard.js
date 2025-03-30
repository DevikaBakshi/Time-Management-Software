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

  // Delete a manual intervention record (assuming a DELETE endpoint exists)
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
          date, // optional: include date info if needed
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      toast.success("Personalized email sent successfully.");
      // Clear form fields if needed
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
    <div className="container mx-auto p-4">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Secretary Dashboard</h1>
        <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded">
          Logout
        </button>
      </div>

      {/* Executive selection and date picker */}
      <div className="mb-4">
        <label className="block mb-2">Select Executive:</label>
        <select
          value={selectedExecutive}
          onChange={(e) => setSelectedExecutive(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">-- Select an Executive --</option>
          {executives.map((exec) => (
            <option key={exec.user_id} value={exec.user_id}>
              {exec.name} ({exec.email})
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2">Select Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 border rounded"
        />
      </div>

      {/* Buttons to fetch schedule and free intervals */}
      <div className="mb-6">
        <button
          onClick={fetchSchedule}
          className="mr-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {loadingSchedule ? "Loading Schedule..." : "Fetch Schedule"}
        </button>
        <button
          onClick={fetchFreeIntervals}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          {loadingFree ? "Loading Free Intervals..." : "Fetch Free Intervals"}
        </button>
      </div>

      {/* Display Executive's Schedule */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Executive's Schedule for {date}</h2>
        {loadingSchedule ? (
          <p>Loading schedule...</p>
        ) : schedule.length > 0 ? (
          <ul className="list-disc pl-4">
            {schedule.map((meeting) => (
              <li key={meeting.meeting_id}>
                <strong>{meeting.title}</strong> -{" "}
                {new Date(meeting.start_time).toLocaleString()} to{" "}
                {new Date(meeting.end_time).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No meetings scheduled.</p>
        )}
      </div>

      {/* Display Free Intervals */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Free Intervals for {date}</h2>
        {loadingFree ? (
          <p>Loading free intervals...</p>
        ) : freeIntervals && freeIntervals.length > 0 ? (
          <ul className="list-disc pl-4">
            {freeIntervals.map((interval, index) => (
              <li key={index}>
                {interval.start} to {interval.end}
              </li>
            ))}
          </ul>
        ) : (
          <p>No free intervals found.</p>
        )}
      </div>

      {/* Display Meetings Needing Manual Intervention */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Meetings Needing Manual Intervention</h2>
        {loadingManual ? (
          <p>Loading meetings...</p>
        ) : manualMeetings && manualMeetings.length > 0 ? (
          <ul className="list-disc pl-4">
            {manualMeetings.map((record) => (
              <li key={record.id} className="mb-2">
                <p>
                  <strong>Meeting Date:</strong>{" "}
                  {record.meeting_date
                    ? format(new Date(record.meeting_date), "eee, MMM d, yyyy")
                    : "N/A"}
                </p>
                <p>
                  <strong>Executives Involved:</strong>{" "}
                  {record.executives_involved && record.executives_involved.length > 0
                    ? record.executives_involved
                        .map((exec) => `${exec.name} (${exec.email})`)
                        .join(", ")
                    : "Not Provided"}
                </p>
                <button
                  onClick={() => deleteManualRecord(record.id)}
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
                >
                  Delete Record
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No meetings flagged for manual intervention.</p>
        )}
      </div>

      {/* Section: Send Personalized Email */}
      <div className="mb-6 border p-4 rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Send Personalized Email</h2>
        <label className="block mb-2">Select Recipients:</label>
        <Select
          isMulti
          options={executiveOptions}
          value={selectedRecipients}
          onChange={setSelectedRecipients}
          placeholder="Select executives..."
        />
        <label className="block mt-4 mb-2">Subject:</label>
        <input
          type="text"
          value={emailSubject}
          onChange={(e) => setEmailSubject(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <label className="block mt-4 mb-2">Message:</label>
        <textarea
          value={emailMessage}
          onChange={(e) => setEmailMessage(e.target.value)}
          className="w-full p-2 border rounded"
          rows="4"
        ></textarea>
        <button
          onClick={handleSendEmail}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send Email
        </button>
      </div>

      <ToastContainer />
    </div>
  );
}

export default SecretaryDashboard;
