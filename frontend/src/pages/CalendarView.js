// src/pages/CalendarView.js
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Import the default styles
import axios from "axios";
import { Link } from "react-router-dom";

function CalendarView() {
  const [meetings, setMeetings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetingsForDate, setMeetingsForDate] = useState([]);

  // Fetch all meetings from the backend on component mount
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

  return (
    <div style={{ padding: "20px" }}>
      <h2>Meeting Calendar</h2>
      <Calendar onChange={setSelectedDate} value={selectedDate} />
      <h3 style={{ marginTop: "20px" }}>
        Meetings on {selectedDate.toDateString()}
      </h3>
      {meetingsForDate.length === 0 ? (
        <p>No meetings scheduled for this date.</p>
      ) : (
        <ul>
          {meetingsForDate.map((meeting) => (
            <li key={meeting.meeting_id} style={{ marginBottom: "10px" }}>
              <Link to={`/meeting-details/${meeting.meeting_id}`} className="text-blue-500 hover:underline">
                <strong>{meeting.title}</strong>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CalendarView;
