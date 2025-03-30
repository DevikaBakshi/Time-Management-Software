// src/pages/Dashboard.js
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [ongoingMeetings, setOngoingMeetings] = useState([]);
  const [todaysMeetings, setTodaysMeetings] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const userId = localStorage.getItem("userId");

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  // Helper function to format a date as dd/mm/yyyy and time
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString("en-GB"); // dd/mm/yyyy
    const formattedTime = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return `${formattedDate} ${formattedTime}`;
  };

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const response = await axios.get("http://localhost:5000/api/meetings/all");
        const allMeetings = response.data;
        const now = new Date();
        const todayStr = now.toDateString();

        // Filter meetings in which the user is involved (organizer or attendee)
        const userMeetings = allMeetings.filter((meeting) => {
          const meetingStart = new Date(meeting.start_time);
          // Only consider meetings in the future or ongoing
          if (meetingStart < now && new Date(meeting.end_time) < now) return false;
          if (meeting.created_by.toString() === userId) return true;
          if (meeting.attendee_ids && Array.isArray(meeting.attendee_ids)) {
            return meeting.attendee_ids.includes(parseInt(userId, 10));
          }
          return false;
        });

        setMeetings(userMeetings);

        // Separate into ongoing, today's (future) and upcoming (future date beyond today)
        const ongoing = [];
        const today = [];
        const upcoming = [];
        userMeetings.forEach((meeting) => {
          const start = new Date(meeting.start_time);
          const end = new Date(meeting.end_time);
          if (start <= now && end > now) {
            ongoing.push(meeting);
          } else if (start > now && start.toDateString() === todayStr) {
            today.push(meeting);
          } else if (start.toDateString() !== todayStr) {
            upcoming.push(meeting);
          }
        });

        setOngoingMeetings(ongoing);
        setTodaysMeetings(today);
        setUpcomingMeetings(upcoming);
      } catch (error) {
        console.error("Error fetching meetings:", error);
      }
    }
    fetchMeetings();
  }, [userId]);

  return (
    <div>
      {/* Navigation Bar */}
      <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link to="/profile" className="hover:underline">
            Profile
          </Link>
          <Link to="/schedule" className="hover:underline">
            Schedule
          </Link>
          <Link to="/calendar" className="hover:underline">
            Calendar
          </Link>
          <Link to="/engagement" className="hover:underline">
            Leave/Engagement
          </Link>
          <Link to="/statistics-dashboard" className="hover:underline">
            Statistics
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </nav>

      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">My Meetings</h2>

        {/* Ongoing Meetings */}
        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Ongoing Meetings</h3>
          {ongoingMeetings.length === 0 ? (
            <p>No ongoing meetings.</p>
          ) : (
            <ul className="space-y-2">
              {ongoingMeetings.map((meeting) => (
                <li
                  key={meeting.meeting_id}
                  className="p-2 border rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/meeting-details/${meeting.meeting_id}`)}
                >
                  <strong>{meeting.title}</strong> -{" "}
                  {formatDateTime(meeting.start_time)} to {formatDateTime(meeting.end_time)}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Today's Upcoming Meetings */}
        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Today's Meetings (Later)</h3>
          {todaysMeetings.length === 0 ? (
            <p>No more meetings scheduled for today.</p>
          ) : (
            <ul className="space-y-2">
              {todaysMeetings.map((meeting) => (
                <li
                  key={meeting.meeting_id}
                  className="p-2 border rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/meeting-details/${meeting.meeting_id}`)}
                >
                  <strong>{meeting.title}</strong> -{" "}
                  {formatDateTime(meeting.start_time)} to {formatDateTime(meeting.end_time)}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming Meetings on Future Dates */}
        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Upcoming Meetings (Future Dates)</h3>
          {upcomingMeetings.length === 0 ? (
            <p>No upcoming meetings on future dates.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingMeetings.map((meeting) => (
                <li
                  key={meeting.meeting_id}
                  className="p-2 border rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/meeting-details/${meeting.meeting_id}`)}
                >
                  <strong>{meeting.title}</strong> -{" "}
                  {formatDateTime(meeting.start_time)} to {formatDateTime(meeting.end_time)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
