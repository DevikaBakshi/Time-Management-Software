import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EngagementDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [engagement, setEngagement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEngagement = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/engagements/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEngagement(response.data);
      } catch (err) {
        console.error("Error fetching engagement details:", err.response?.data || err.message);
        setError(err.response?.data?.error || "Failed to fetch engagement details");
        toast.error(err.response?.data?.error || "Failed to fetch engagement details");
      } finally {
        setLoading(false);
      }
    };
    fetchEngagement();
  }, [id]);

  if (loading) return <p>Loading engagement details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!engagement) return <p>No engagement data available.</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Engagement Details</h1>
      <div className="border p-4 rounded bg-white shadow-sm mb-4">
        <p><strong>Engagement ID:</strong> {engagement.id}</p>
        <p><strong>Executive ID:</strong> {engagement.executive_id}</p>
        <p><strong>Engagement Start:</strong> {new Date(engagement.engagement_start).toLocaleString("en-GB")}</p>
        <p><strong>Engagement End:</strong> {new Date(engagement.engagement_end).toLocaleString("en-GB")}</p>
        <p><strong>Description:</strong> {engagement.description}</p>
      </div>
      <Link to="/profile" className="text-blue-500 hover:underline">Back to Profile</Link>
      <ToastContainer />
    </div>
  );
}

export default EngagementDetails;
