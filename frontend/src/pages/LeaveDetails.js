import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function LeaveDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeave = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/leaves/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLeave(response.data);
      } catch (err) {
        console.error("Error fetching leave details:", err.response?.data || err.message);
        setError(err.response?.data?.error || "Failed to fetch leave details");
        toast.error(err.response?.data?.error || "Failed to fetch leave details");
      } finally {
        setLoading(false);
      }
    };
    fetchLeave();
  }, [id]);

  if (loading) return <p>Loading leave details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!leave) return <p>No leave data available.</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Leave Details</h1>
      <div className="border p-4 rounded bg-white shadow-sm mb-4">
        <p><strong>Leave ID:</strong> {leave.id}</p>
        <p><strong>Executive ID:</strong> {leave.executive_id}</p>
        <p><strong>Leave Start:</strong> {new Date(leave.leave_start).toLocaleString("en-GB")}</p>
        <p><strong>Leave End:</strong> {new Date(leave.leave_end).toLocaleString("en-GB")}</p>
        <p><strong>Reason:</strong> {leave.reason}</p>
      </div>
      <Link to="/profile" className="text-blue-500 hover:underline">Back to Profile</Link>
      <ToastContainer />
    </div>
  );
}

export default LeaveDetails;
