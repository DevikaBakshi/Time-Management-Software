import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    // Default to today's date formatted as YYYY-MM-DD
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

    console.log("User Role:", role);
    console.log("User ID:", id);

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
    return <p>Loading...</p>;
  }

  if (userRole !== "executive") {
    return <p>You do not have permission to schedule meetings.</p>;
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
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Schedule a New Meeting</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Title:
          <input
            type="text"
            name="title"
            value={meetingData.title}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </label>
        <label className="block">
          Start Time:
          <input
            type="datetime-local"
            name="start_time"
            value={meetingData.start_time}
            onChange={handleChange}
            required
            min={getCurrentDateTimeLocal()}
            className="w-full p-2 border rounded"
          />
        </label>
        <label className="block">
          End Time:
          <input
            type="datetime-local"
            name="end_time"
            value={meetingData.end_time}
            onChange={handleChange}
            required
            min={meetingData.start_time || getCurrentDateTimeLocal()}
            className="w-full p-2 border rounded"
          />
        </label>
        <label className="block">
          Venue:
          <input
            type="text"
            name="venue"
            value={meetingData.venue}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>
        <label className="block">
          Project Name:
          <input
            type="text"
            name="project_name"
            value={meetingData.project_name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>
        <label className="block">
          Select Attendees:
          <Select
            isMulti
            options={attendeeOptions}
            value={selectedAttendees}
            onChange={handleAttendeesChange}
            placeholder="Search and select attendees..."
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className={`w-full p-2 rounded ${loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
        >
          {loading ? "Scheduling..." : "Schedule Meeting"}
        </button>
      </form>

      <div className="mt-6">
        <label className="block mb-2 font-medium">Select Date for Available Slots:</label>
        <input
          type="date"
          value={slotDate}
          onChange={handleSlotDateChange}
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={findAvailableSlots}
          disabled={loadingSlots}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          {loadingSlots ? "Finding Slots..." : "Find Available Slots"}
        </button>
        {availableSlots.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Available Slots:</h3>
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

      <ToastContainer />
    </div>
  );
}

export default ScheduleMeeting;
