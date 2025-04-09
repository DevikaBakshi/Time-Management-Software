// src/pages/CalendarView.js
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function CalendarView() {
  const [meetings, setMeetings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetingsForDate, setMeetingsForDate] = useState([]);

  // Fetch all meetings on component mount
  useEffect(() => {
    async function fetchMeetings() {
      try {
        const response = await axios.get("http://localhost:5000/api/meetings/all");
        setMeetings(response.data);
      } catch (error) {
        console.error("Error fetching meetings:", error);
      }
    }
    fetchMeetings();
  }, []);

  // Filter meetings for the selected date
  useEffect(() => {
    const filtered = meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.start_time);
      return meetingDate.toDateString() === selectedDate.toDateString();
    });
    setMeetingsForDate(filtered);
  }, [selectedDate, meetings]);

  // Inline styles
  

  const baseFont = { fontFamily: "Arial, sans-serif" };

  const containerStyle = {
    margin: "0",
    padding: "0",
    width: "100%",
    overflowX: "hidden", // Prevent horizontal scroll
    boxSizing: "border-box"
  };
  const headerStyle = {
    backgroundColor: "#4a90e2",
    color: "#fff",
    padding: "10px 20px",
    marginBottom: "20px",
    textAlign: "center",
  };

  const navStyle = {
    backgroundColor: "#333",
    color: "#fff",
    padding: "10px 20px",
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "20px",
  };

  const navLinkStyle = {
    color: "#fff",
    textDecoration: "none",
    fontWeight: "bold",
  };

  const calendarContainerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const meetingListStyle = {
    marginTop: "20px",
    padding: "10px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "5px",
    width: "100%",
  };

  const meetingItemStyle = {
    marginBottom: "10px",
    padding: "5px",
    borderBottom: "1px solid #ccc",
  };

  const meetingLinkStyle = {
    textDecoration: "none",
    color: "#4a90e2",
    fontWeight: "bold",
  };

  return (
    <div style={{ ...containerStyle, ...baseFont }}>
      <Navbar/>
      <header style={headerStyle}>
        <h1>Meeting Calendar</h1>
      </header>
      
      <div style={calendarContainerStyle}>
        <Calendar onChange={setSelectedDate} value={selectedDate} />
        <h3 style={{ marginTop: "20px" }}>
          Meetings on {selectedDate.toDateString()}
        </h3>
        {meetingsForDate.length === 0 ? (
          <p>No meetings scheduled for this date.</p>
        ) : (
          <div style={meetingListStyle}>
            {meetingsForDate.map((meeting) => (
              <div key={meeting.meeting_id} style={meetingItemStyle}>
                <Link to={`/meeting-details/${meeting.meeting_id}`} style={meetingLinkStyle}>
                  {meeting.title}
                </Link>{" "}
                from{" "}
                {new Date(meeting.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                to{" "}
                {new Date(meeting.end_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarView;
