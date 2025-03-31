// src/pages/LeaveDetails.js
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  
  // Fetch leave details
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

  // Handler to fetch available slots from the backend
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
    setShowRescheduleForm((prev) => !prev);
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

  if (error) return <p className="text-red-500">{error}</p>;
  if (!leave) return <p>Loading leave details...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Leave Details</h2>
      <p>
        <strong>Leave Start:</strong> {new Date(leave.leave_start).toLocaleString()}
      </p>
      <p>
        <strong>Leave End:</strong> {new Date(leave.leave_end).toLocaleString()}
      </p>
      <p><strong>Reason:</strong> {leave.reason}</p>

      {/* Allow update/delete only if the logged-in user is the one who marked the leave */}
      {leave.executive_id.toString() === loggedUserId.toString() && (
        <div className="mt-4">
          <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded">
            Delete Leave
          </button>
        </div>
      )}

      {/* Reschedule Section: visible only for the leave creator */}
      {leave.executive_id.toString() === loggedUserId.toString() && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-xl font-semibold">Update Leave</h3>
          <button onClick={handleRescheduleToggle} className="mt-2 px-4 py-2 bg-orange-500 text-white rounded">
            {showRescheduleForm ? "Hide Reschedule Form" : "Reschedule Leave"}
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
              <button onClick={confirmReschedule} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
                Confirm Update
              </button>
            </div>
          )}
        </div>
      )}

      {/* Available Slots Section */}
      <div className="mt-6 border-t pt-4">
        <h3 className="text-xl font-semibold mb-2">Find Available Leave Slots</h3>
        <div className="mb-2">
          <label className="block mb-1 font-medium">Select Date:</label>
          <input
            type="date"
            value={leaveSlotDate}
            onChange={(e) => setLeaveSlotDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          onClick={fetchAvailableSlots}
          disabled={loadingLeaveSlots}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
        >
          {loadingLeaveSlots ? "Finding Slots..." : "Find Available Leave Slots"}
        </button>
        {availableSlots.length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-semibold">Available Slots:</h4>
            <ul className="list-disc pl-5">
              {availableSlots.map((slot, index) => (
                <li key={index} className="mt-2">
                  <strong>Start:</strong> {slot.start} <br />
                  <strong>End:</strong> {slot.end} <br />
                  <button
                    onClick={() => {
                      setNewStart(slot.startISO);
                      setNewEnd(slot.endISO);
                      toast.info("Slot applied successfully!");
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mt-2"
                  >
                    Use this Slot
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Link to="/profile" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded">
        Back to Profile
      </Link>

      <ToastContainer />
    </div>
  );
}

export default LeaveDetails;
