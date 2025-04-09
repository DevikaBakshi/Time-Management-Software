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
  const userName = localStorage.getItem("userName") || "User";

  // Inline style objects
  const baseFont = { fontFamily: "Arial, sans-serif" };

  const containerStyle = {
    margin: "0",
    padding: "0",
    width: "100%",
    overflowX: "hidden", // Prevent horizontal scroll
    boxSizing: "border-box"
  };

  const innerContainerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "1rem",
    boxSizing: "border-box"
  };

  const sectionStyle = {
    marginBottom: "1.5rem",
    padding: "1rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "#f7fafc"
  };

  const sectionHeaderStyle = {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "0.75rem",
    color: "#2d3748"
  };

  const meetingItemStyle = {
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    marginBottom: "0.5rem",
    cursor: "pointer",
    backgroundColor: "#fff",
    transition: "background-color 0.2s"
  };

  const meetingItemHover = {
    backgroundColor: "#edf2f7"
  };

  // Helper function to format a date as dd/mm/yyyy and time
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString("en-GB"); // dd/mm/yyyy
    const formattedTime = date.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });
    return `${formattedDate} ${formattedTime}`;
  };

  // Navbar component (extracted)
  const Navbar = () => {
    
    

    const navStyle = {
      backgroundColor: "#333",
      color: "#fff",
      padding: "10px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    };
  
    const navLinksContainer = {
      display: "flex",
      gap: "20px"
    };
  
    const linkStyle = {
      color: "#fff",
      textDecoration: "none",
      fontSize: "16px"
    };
    

    const logoutButtonStyle = {
      backgroundColor: "#e74c3c",
      border: "none",
      padding: "8px 12px",
      color: "#fff",
      borderRadius: "4px",
      cursor: "pointer"
    };
  

    return (
      <nav style={navStyle}>
        <div style={navLinksContainer}>
          <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
          <Link to="/profile" style={linkStyle}>Profile</Link>
          <Link to="/schedule" style={linkStyle}>Schedule</Link>
          <Link to="/calendar" style={linkStyle}>Calendar</Link>
          <Link to="/engagement" style={linkStyle}>Leave/Engagement</Link>
          <Link to="/statistics-dashboard" style={linkStyle}>Statistics</Link>
        </div>
        <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
      </nav>
    );
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const response = await axios.get("http://localhost:5000/api/meetings/all");
        const allMeetings = response.data;
        const now = new Date();
        const todayStr = now.toDateString();

        // Filter meetings where the logged-in user is involved (organizer or attendee)
        const userMeetings = allMeetings.filter((meeting) => {
          const meetingStart = new Date(meeting.start_time);
          // Exclude meetings that have already ended
          if (meetingStart < now && new Date(meeting.end_time) < now) return false;
          if (meeting.created_by.toString() === userId) return true;
          if (meeting.attendee_ids && Array.isArray(meeting.attendee_ids)) {
            return meeting.attendee_ids.includes(parseInt(userId, 10));
          }
          return false;
        });

        setMeetings(userMeetings);

        // Separate meetings into ongoing, today's (future) and upcoming (beyond today)
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
    <div style={{ ...containerStyle, ...baseFont }}>
      <Navbar />
      <div style={innerContainerStyle}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem", color: "#2d3748" }}>
          My Meetings
        </h2>

        {/* Ongoing Meetings */}
        <section style={sectionStyle}>
          <h3 style={sectionHeaderStyle}>Ongoing Meetings</h3>
          {ongoingMeetings.length === 0 ? (
            <p>No ongoing meetings.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {ongoingMeetings.map((meeting) => (
                <li
                  key={meeting.meeting_id}
                  style={meetingItemStyle}
                  onClick={() => navigate(`/meeting-details/${meeting.meeting_id}`)}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = meetingItemHover.backgroundColor}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = "#fff"}
                >
                  <strong>{meeting.title}</strong> - {formatDateTime(meeting.start_time)} to {formatDateTime(meeting.end_time)}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Today's Meetings */}
        <section style={sectionStyle}>
          <h3 style={sectionHeaderStyle}>Today's Meetings (Later)</h3>
          {todaysMeetings.length === 0 ? (
            <p>No more meetings scheduled for today.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {todaysMeetings.map((meeting) => (
                <li
                  key={meeting.meeting_id}
                  style={meetingItemStyle}
                  onClick={() => navigate(`/meeting-details/${meeting.meeting_id}`)}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = meetingItemHover.backgroundColor}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = "#fff"}
                >
                  <strong>{meeting.title}</strong> - {formatDateTime(meeting.start_time)} to {formatDateTime(meeting.end_time)}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming Meetings */}
        <section style={sectionStyle}>
          <h3 style={sectionHeaderStyle}>Upcoming Meetings (Future Dates)</h3>
          {upcomingMeetings.length === 0 ? (
            <p>No upcoming meetings on future dates.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {upcomingMeetings.map((meeting) => (
                <li
                  key={meeting.meeting_id}
                  style={meetingItemStyle}
                  onClick={() => navigate(`/meeting-details/${meeting.meeting_id}`)}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = meetingItemHover.backgroundColor}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = "#fff"}
                >
                  <strong>{meeting.title}</strong> - {formatDateTime(meeting.start_time)} to {formatDateTime(meeting.end_time)}
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
