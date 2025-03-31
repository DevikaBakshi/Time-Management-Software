// src/pages/Profile.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [error, setError] = useState("");

  // Fetch profile details
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
      } catch (err) {
        console.error("Error fetching profile:", err.response?.data || err.message);
        setError(err.response?.data?.error || "Failed to fetch profile");
        toast.error(err.response?.data?.error || "Failed to fetch profile");
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch today's schedule for the logged-in executive
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const token = localStorage.getItem("token");
        const today = new Date().toISOString().split("T")[0];
        const response = await axios.get(
          `http://localhost:5000/api/users/profile/schedule?date=${today}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSchedule(response.data);
      } catch (err) {
        console.error("Error fetching schedule:", err.response?.data || err.message);
        toast.error(err.response?.data?.error || "Failed to fetch schedule");
      } finally {
        setLoadingSchedule(false);
      }
    };
    fetchSchedule();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  // Navbar (same as Dashboard)
  const Navbar = () => (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
        <Link to="/profile" className="hover:underline">Profile</Link>
        <Link to="/schedule" className="hover:underline">Schedule</Link>
        <Link to="/calendar" className="hover:underline">Calendar</Link>
        <Link to="/engagement" className="hover:underline">Leave/Engagement</Link>
        <Link to="/statistics-dashboard" className="hover:underline">Statistics</Link>
      </div>
      <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded hover:bg-red-600">
        Logout
      </button>
    </nav>
  );

  if (loadingProfile || loadingSchedule) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!profile) return <p>No profile data available.</p>;

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">My Profile</h1>
        
        <div className="border p-4 rounded shadow-sm bg-white mb-6">
          <p><strong>User ID:</strong> {profile.user_id}</p>
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
        </div>
        
        <h2 className="text-2xl font-bold mb-2">My Schedule for Today</h2>
        {schedule.length === 0 ? (
          <p>No scheduled events for today.</p>
        ) : (
          <table className="min-w-full border mb-6">
            <thead>
              <tr>
                <th className="border px-2 py-1">Type</th>
                <th className="border px-2 py-1">Title/Description</th>
                <th className="border px-2 py-1">Start Time</th>
                <th className="border px-2 py-1">End Time</th>
                <th className="border px-2 py-1">Additional Info</th>
                <th className="border px-2 py-1">Details</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item) => (
                <tr key={`${item.type}-${item.id}-${item.start_time}`}>
                  <td className="border px-2 py-1">{item.type}</td>
                  <td className="border px-2 py-1">
                    {item.type === "Meeting"
                      ? item.title
                      : item.type === "Engagement"
                      ? item.description
                      : item.type === "Leave"
                      ? item.reason
                      : "N/A"}
                  </td>
                  <td className="border px-2 py-1">
                    {new Date(item.start_time).toLocaleString("en-GB")}
                  </td>
                  <td className="border px-2 py-1">
                    {new Date(item.end_time).toLocaleString("en-GB")}
                  </td>
                  <td className="border px-2 py-1">
                    {item.type === "Meeting" && item.venue ? `Venue: ${item.venue}` : ""}
                  </td>
                  <td className="border px-2 py-1">
                    {item.type === "Meeting" ? (
                      <Link to={`/meeting-details/${item.id}`} className="text-blue-500 hover:underline">
                        View Details
                      </Link>
                    ) : item.type === "Leave" ? (
                      <Link to={`/leaves/${item.id}`} className="text-blue-500 hover:underline">
                        View Details
                      </Link>
                    ) : item.type === "Engagement" ? (
                      <Link to={`/engagements/${item.id}`} className="text-blue-500 hover:underline">
                        View Details
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <ToastContainer />
      </div>
    </div>
  );
}

export default Profile;
