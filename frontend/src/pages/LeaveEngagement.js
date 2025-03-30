// src/pages/LeaveEngagement.js
import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  // Separate state for available slots for leave and engagement
  const [leaveAvailableSlots, setLeaveAvailableSlots] = useState([]);
  const [engagementAvailableSlots, setEngagementAvailableSlots] = useState([]);

  // Separate loading states for leave and engagement slots
  const [loadingLeaveSlots, setLoadingLeaveSlots] = useState(false);
  const [loadingEngagementSlots, setLoadingEngagementSlots] = useState(false);

  // Separate date fields for leave and engagement available slot search (default to today)
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
      // Call the leave find-slot endpoint (assumes your backend endpoint is implemented similarly)
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

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Mark Leave and Engagement</h2>

      {/* Leave Section */}
      <div className="mb-8 p-4 border rounded bg-gray-50">
        <h3 className="text-xl font-semibold mb-2">Mark Leave</h3>
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Leave Start:</label>
            <input
              type="datetime-local"
              value={leaveData.leave_start}
              onChange={(e) =>
                setLeaveData({ ...leaveData, leave_start: e.target.value })
              }
              className="border p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Leave End:</label>
            <input
              type="datetime-local"
              value={leaveData.leave_end}
              onChange={(e) =>
                setLeaveData({ ...leaveData, leave_end: e.target.value })
              }
              className="border p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Reason (optional):</label>
            <textarea
              value={leaveData.reason}
              onChange={(e) =>
                setLeaveData({ ...leaveData, reason: e.target.value })
              }
              className="border p-2 w-full"
              rows="3"
            ></textarea>
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Mark Leave
          </button>
        </form>
        <div className="mt-4">
          <label className="block mb-2 font-medium">Select Date for Available Leave Slots:</label>
          <input
            type="date"
            value={leaveSlotDate}
            onChange={(e) => setLeaveSlotDate(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <button
            onClick={findLeaveAvailableSlots}
            disabled={loadingLeaveSlots}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          >
            {loadingLeaveSlots ? "Finding Slots..." : "Find Available Leave Slots"}
          </button>
          {leaveAvailableSlots.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg font-semibold">Available Leave Slots:</h4>
              <ul className="list-disc pl-5">
                {leaveAvailableSlots.map((slot, index) => (
                  <li key={index} className="mt-2">
                    <strong>Start:</strong> {slot.start} <br />
                    <strong>End:</strong> {slot.end} <br />
                    <button
                      onClick={() => applyLeaveSlot(slot)}
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

      {/* Engagement Section */}
      <div className="p-4 border rounded bg-gray-50 mb-8">
        <h3 className="text-xl font-semibold mb-2">Mark Engagement</h3>
        <form onSubmit={handleEngagementSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Engagement Start:</label>
            <input
              type="datetime-local"
              value={engagementData.engagement_start}
              onChange={(e) =>
                setEngagementData({ ...engagementData, engagement_start: e.target.value })
              }
              className="border p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Engagement End:</label>
            <input
              type="datetime-local"
              value={engagementData.engagement_end}
              onChange={(e) =>
                setEngagementData({ ...engagementData, engagement_end: e.target.value })
              }
              className="border p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Description (optional):</label>
            <textarea
              value={engagementData.description}
              onChange={(e) =>
                setEngagementData({ ...engagementData, description: e.target.value })
              }
              className="border p-2 w-full"
              rows="3"
            ></textarea>
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Mark Engagement
          </button>
        </form>
        <div className="mt-4">
          <label className="block mb-2 font-medium">Select Date for Available Engagement Slots:</label>
          <input
            type="date"
            value={engagementSlotDate}
            onChange={(e) => setEngagementSlotDate(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <button
            onClick={findEngagementAvailableSlots}
            disabled={loadingEngagementSlots}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          >
            {loadingEngagementSlots ? "Finding Slots..." : "Find Available Engagement Slots"}
          </button>
          {engagementAvailableSlots.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg font-semibold">Available Engagement Slots:</h4>
              <ul className="list-disc pl-5">
                {engagementAvailableSlots.map((slot, index) => (
                  <li key={index} className="mt-2">
                    <strong>Start:</strong> {slot.start} <br />
                    <strong>End:</strong> {slot.end} <br />
                    <button
                      onClick={() => applyEngagementSlot(slot)}
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

      <ToastContainer />
    </div>
  );
}

export default LeaveEngagement;
