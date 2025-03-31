// src/pages/EngagementDetails.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EngagementDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [engagement, setEngagement] = useState(null);
  const [error, setError] = useState("");
  
  // States for rescheduling
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  
  // States for available slots search
  const [slotDate, setSlotDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

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
    // Clear any previously found available slots when toggling the form
    setAvailableSlots([]);
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

  if (error) return <p className="text-red-500">{error}</p>;
  if (!engagement) return <p>Loading engagement details...</p>;

  const loggedUserId = localStorage.getItem("userId");

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Engagement Details</h2>
      <p>
        <strong>Engagement Start:</strong> {new Date(engagement.engagement_start).toLocaleString()}
      </p>
      <p>
        <strong>Engagement End:</strong> {new Date(engagement.engagement_end).toLocaleString()}
      </p>
      <p><strong>Description:</strong> {engagement.description}</p>

      {/* Delete button: visible only if the logged-in user is the creator */}
      {engagement.executive_id.toString() === loggedUserId.toString() && (
        <div className="mt-4">
          <button 
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Delete Engagement
          </button>
        </div>
      )}

      {/* Reschedule Section: visible only if the logged-in user is the creator */}
      {engagement.executive_id.toString() === loggedUserId.toString() && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-xl font-semibold">Reschedule Engagement</h3>
          <button 
            onClick={handleRescheduleToggle}
            className="mt-2 px-4 py-2 bg-orange-500 text-white rounded"
          >
            {showRescheduleForm ? "Hide Reschedule Form" : "Show Reschedule Options"}
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
              <button
                onClick={confirmReschedule}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Confirm Update
              </button>

              {/* Find Available Slots Section */}
              <div className="mt-6 border-t pt-4">
                <h4 className="text-lg font-semibold mb-2">Find Available Slots</h4>
                <div className="mb-2">
                  <label className="block mb-1 font-medium">
                    Select Date for Available Slots:
                  </label>
                  <input
                    type="date"
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <button
                  onClick={findAvailableSlots}
                  disabled={loadingSlots}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
                >
                  {loadingSlots ? "Finding Slots..." : "Find Available Slots"}
                </button>
                {availableSlots.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-lg font-semibold">Available Slots:</h5>
                    <ul className="list-disc pl-5">
                      {availableSlots.map((slot, index) => (
                        <li key={index} className="mt-2">
                          <strong>Start:</strong> {slot.start} <br />
                          <strong>End:</strong> {slot.end} <br />
                          <button
                            onClick={() => applySlot(slot)}
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
            </div>
          )}
        </div>
      )}

      <Link to="/profile" className="mt-4 ml-2 px-4 py-2 bg-blue-500 text-white rounded">
        Back to Profile
      </Link>

      <ToastContainer />
    </div>
  );
}

export default EngagementDetails;
