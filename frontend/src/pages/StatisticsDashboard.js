// src/pages/StatisticsDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";

function StatisticsDashboard() {
  const [execTimeStats, setExecTimeStats] = useState([]);
  const [projectStats, setProjectStats] = useState([]);
  const [execFractionStats, setExecFractionStats] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search terms for filtering each section
  const [execSearch, setExecSearch] = useState("");
  const [projSearch, setProjSearch] = useState("");
  const [fractionSearch, setFractionSearch] = useState("");

  // Default period: last 7 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [workingHours, setWorkingHours] = useState(8);
/*
  // Inline style objects
  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif"
  };
*/
  const baseFont = { fontFamily: "Arial, sans-serif" };

  const containerStyle = {
    margin: "0",
    padding: "0",
    width: "100%",
    overflowX: "hidden", // Prevent horizontal scroll
    boxSizing: "border-box"
  };

  const headerStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "20px",
    textAlign: "center"
  };

  const sectionStyle = {
    marginBottom: "30px",
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    backgroundColor: "#fafafa"
  };

  const labelStyle = {
    marginRight: "10px",
    fontWeight: "bold"
  };

  const inputStyle = {
    border: "1px solid #ccc",
    padding: "6px 8px",
    marginRight: "10px",
    borderRadius: "3px"
  };

  const buttonStyle = {
    backgroundColor: "#007BFF",
    color: "#fff",
    padding: "8px 16px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginRight: "10px"
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px"
  };

  const thStyle = {
    border: "1px solid #ccc",
    padding: "8px",
    backgroundColor: "#f2f2f2",
    textAlign: "left"
  };

  const tdStyle = {
    border: "1px solid #ccc",
    padding: "8px"
  };

  // Fetch Executive Time Statistics
  const fetchExecutiveTimeStats = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/statistics/executive-time?start_date=${startDate}&end_date=${endDate}`
      );
      setExecTimeStats(res.data);
    } catch (err) {
      console.error("Error fetching executive time stats:", err.response?.data || err.message);
      toast.error("Error fetching executive time statistics");
    }
  }, [startDate, endDate]);

  // Fetch Project Statistics
  const fetchProjectStats = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/statistics/project?start_date=${startDate}&end_date=${endDate}`
      );
      setProjectStats(res.data);
    } catch (err) {
      console.error("Error fetching project stats:", err.response?.data || err.message);
      toast.error("Error fetching project statistics");
    }
  }, [startDate, endDate]);

  // Fetch Executive Fraction Statistics
  const fetchExecFractionStats = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/statistics/executive-fraction?start_date=${startDate}&end_date=${endDate}&working_hours_per_day=${workingHours}`
      );
      setExecFractionStats(res.data.stats);
    } catch (err) {
      console.error("Error fetching executive fraction stats:", err.response?.data || err.message);
      toast.error("Error fetching executive fraction statistics");
    }
  }, [startDate, endDate, workingHours]);

  const handleFetchStats = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchExecutiveTimeStats(),
      fetchProjectStats(),
      fetchExecFractionStats()
    ]);
    setLoading(false);
  }, [fetchExecutiveTimeStats, fetchProjectStats, fetchExecFractionStats]);

  useEffect(() => {
    handleFetchStats();
  }, [handleFetchStats]);

  // Helper to round values to two decimals
  const roundValue = (val) => Number(val).toFixed(2);

  // Filter functions for each statistics section
  const filteredExecTimeStats = execTimeStats.filter((stat) =>
    stat.name.toLowerCase().includes(execSearch.toLowerCase()) ||
    stat.email.toLowerCase().includes(execSearch.toLowerCase()) ||
    String(stat.user_id).includes(execSearch)
  );

  const filteredProjectStats = projectStats.filter((proj) =>
    proj.project_name.toLowerCase().includes(projSearch.toLowerCase())
  );

  const filteredExecFractionStats = execFractionStats.filter((stat) =>
    stat.name.toLowerCase().includes(fractionSearch.toLowerCase()) ||
    stat.email.toLowerCase().includes(fractionSearch.toLowerCase()) ||
    String(stat.user_id).includes(fractionSearch)
  );

  return (
    <div style={{ ...containerStyle, ...baseFont ,containerStyle}}>
      <Navbar />
      <h1 style={headerStyle}>Statistics Dashboard</h1>
      
      <div style={{ marginBottom: "20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
        <label style={labelStyle}>Start Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={inputStyle}
        />
        <label style={labelStyle}>End Date:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={inputStyle}
        />
        <label style={labelStyle}>Working Hours/Day:</label>
        <input
          type="number"
          value={workingHours}
          onChange={(e) => setWorkingHours(e.target.value)}
          style={{ ...inputStyle, width: "60px" }}
        />
        <button onClick={handleFetchStats} style={buttonStyle}>
          Refresh Statistics
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center" }}>Loading statistics...</p>
      ) : (
        <div>
          {/* Executive Meeting Time Statistics */}
          <section style={sectionStyle}>
            <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>Executive Meeting Time</h2>
            <div style={{ marginBottom: "10px" }}>
              <input
                type="text"
                value={execSearch}
                onChange={(e) => setExecSearch(e.target.value)}
                placeholder="Search by executive details..."
                style={inputStyle}
              />
            </div>
            {filteredExecTimeStats.length === 0 ? (
              <p>No data available.</p>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Executive</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Total Meeting Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExecTimeStats.map((stat) => (
                    <tr key={stat.user_id}>
                      <td style={tdStyle}>{stat.user_id}</td>
                      <td style={tdStyle}>{stat.name}</td>
                      <td style={tdStyle}>{stat.email}</td>
                      <td style={tdStyle}>{roundValue(stat.total_meeting_hours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Project Meeting Statistics */}
          <section style={sectionStyle}>
            <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>Project Meeting Statistics</h2>
            <div style={{ marginBottom: "10px" }}>
              <input
                type="text"
                value={projSearch}
                onChange={(e) => setProjSearch(e.target.value)}
                placeholder="Search by project name..."
                style={inputStyle}
              />
            </div>
            {filteredProjectStats.length === 0 ? (
              <p>No data available.</p>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Project Name</th>
                    <th style={thStyle}>Meeting Count</th>
                    <th style={thStyle}>Total Duration (hrs)</th>
                    <th style={thStyle}>Total Man-Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjectStats.map((proj, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>{proj.project_name}</td>
                      <td style={tdStyle}>{proj.meeting_count}</td>
                      <td style={tdStyle}>{roundValue(proj.total_duration_hours)}</td>
                      <td style={tdStyle}>{roundValue(proj.total_man_hours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Executive Meeting Fraction Statistics */}
          <section style={sectionStyle}>
            <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>Executive Meeting Fraction</h2>
            <div style={{ marginBottom: "10px" }}>
              <input
                type="text"
                value={fractionSearch}
                onChange={(e) => setFractionSearch(e.target.value)}
                placeholder="Search by executive details..."
                style={inputStyle}
              />
            </div>
            {filteredExecFractionStats.length === 0 ? (
              <p>No data available.</p>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Executive</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Meeting Hours</th>
                    <th style={thStyle}>Fraction of Working Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExecFractionStats.map((stat) => (
                    <tr key={stat.user_id}>
                      <td style={tdStyle}>{stat.user_id}</td>
                      <td style={tdStyle}>{stat.name}</td>
                      <td style={tdStyle}>{stat.email}</td>
                      <td style={tdStyle}>{roundValue(stat.meeting_hours)}</td>
                      <td style={tdStyle}>{roundValue(stat.fraction)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default StatisticsDashboard;
