// src/pages/MeetingDetails.js
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function MeetingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState("");
  
  // States for rescheduling
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newVenue, setNewVenue] = useState("");
  
  useEffect(() => {
    async function fetchMeeting() {
      try {
        const response = await axios.get(`http://localhost:5000/api/meetings/${id}`);
        setMeeting(response.data);
      } catch (err) {
        console.error("Error fetching meeting details:", err);
        setError(err.response?.data?.error || "Failed to fetch meeting details");
      }
    }
    fetchMeeting();
  }, [id]);

  // Cancel meeting if the logged-in user is the creator (scheduler)
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to cancel this meeting? Cancellation emails will be sent to all attendees.")) {
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

  // Toggle reschedule form visibility
  const handleRescheduleToggle = () => {
    setShowRescheduleForm(!showRescheduleForm);
  };

  // Confirm reschedule: send a PUT request to update meeting times and venue.
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

  if (error) return <p className="text-red-500">{error}</p>;
  if (!meeting) return <p>Loading meeting details...</p>;

  const loggedUserId = localStorage.getItem("userId");

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Meeting Details</h2>
      <p><strong>Title:</strong> {meeting.title}</p>
      <p>
        <strong>Start Time:</strong> {new Date(meeting.start_time).toLocaleString()}
      </p>
      <p>
        <strong>End Time:</strong> {new Date(meeting.end_time).toLocaleString()}
      </p>
      <p><strong>Venue:</strong> {meeting.venue}</p>
      <p><strong>Project Name:</strong> {meeting.project_name}</p>

      <div className="mt-4">
        <h3 className="text-xl font-semibold">Organizer Details</h3>
        {meeting.organizer ? (
          <div className="ml-4">
            <p><strong>Name:</strong> {meeting.organizer.name}</p>
            <p><strong>Email:</strong> {meeting.organizer.email}</p>
            <p><strong>User ID:</strong> {meeting.organizer.user_id}</p>
          </div>
        ) : (
          <p>Organizer details not available</p>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-semibold">Attendees</h3>
        {meeting.attendees && meeting.attendees.length > 0 ? (
          <ul className="list-disc pl-5">
            {meeting.attendees.map((attendee, index) => (
              <li key={index}>
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

      {/* Cancel Meeting button: visible only if the logged-in user is the creator */}
      {meeting.created_by.toString() === loggedUserId.toString() && (
        <div className="mt-4">
          <button 
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Cancel Meeting
          </button>
        </div>
      )}

      {/* Reschedule Section: visible only for the meeting creator */}
      {meeting.created_by.toString() === loggedUserId.toString() && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-xl font-semibold">Reschedule Meeting</h3>
          <button 
            onClick={handleRescheduleToggle}
            className="mt-2 px-4 py-2 bg-orange-500 text-white rounded"
          >
            {showRescheduleForm ? "Hide Reschedule Form" : "Reschedule Meeting"}
          </button>

          {showRescheduleForm && (
            <div className="mt-4 space-y-4">
              <label className="block font-medium">
                New Start Time:
                <input
                  type="datetime-local"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </label>
              <label className="block font-medium">
                New End Time:
                <input
                  type="datetime-local"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </label>
              <label className="block font-medium">
                New Venue:
                <input
                  type="text"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  placeholder={meeting.venue}  // Optionally show current venue as placeholder
                  className="w-full p-2 border rounded"
                />
              </label>
              <button
                onClick={confirmReschedule}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Confirm Reschedule
              </button>
            </div>
          )}
        </div>
      )}

      <button 
        onClick={() => navigate("/dashboard")}
        className="mt-4 ml-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Back to Dashboard
      </button>

      <ToastContainer />
    </div>
  );
}

export default MeetingDetails;
