// src/pages/StatisticsDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Statistics Dashboard</h1>
      
      <div className="mb-6 flex flex-wrap items-center">
        <label className="mr-2">Start Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-1 mr-4 mb-2"
        />
        <label className="mr-2">End Date:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-1 mr-4 mb-2"
        />
        <label className="mr-2">Working Hours/Day:</label>
        <input
          type="number"
          value={workingHours}
          onChange={(e) => setWorkingHours(e.target.value)}
          className="border p-1 w-16 mr-4 mb-2"
        />
        <button
          onClick={handleFetchStats}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded mb-2"
        >
          Refresh Statistics
        </button>
      </div>

      {loading ? (
        <p>Loading statistics...</p>
      ) : (
        <div>
          {/* Executive Meeting Time Statistics */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Executive Meeting Time</h2>
            <div className="mb-2">
              <input
                type="text"
                value={execSearch}
                onChange={(e) => setExecSearch(e.target.value)}
                placeholder="Search by executive details"
                className="border p-1 mr-2"
              />
            </div>
            {filteredExecTimeStats.length === 0 ? (
              <p>No data available.</p>
            ) : (
              <table className="min-w-full border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">ID</th>
                    <th className="border px-2 py-1">Executive</th>
                    <th className="border px-2 py-1">Email</th>
                    <th className="border px-2 py-1">Total Meeting Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExecTimeStats.map((stat) => (
                    <tr key={stat.user_id}>
                      <td className="border px-2 py-1">{stat.user_id}</td>
                      <td className="border px-2 py-1">{stat.name}</td>
                      <td className="border px-2 py-1">{stat.email}</td>
                      <td className="border px-2 py-1">{roundValue(stat.total_meeting_hours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Project Meeting Statistics */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Project Meeting Statistics</h2>
            <div className="mb-2">
              <input
                type="text"
                value={projSearch}
                onChange={(e) => setProjSearch(e.target.value)}
                placeholder="Search by project name"
                className="border p-1 mr-2"
              />
            </div>
            {filteredProjectStats.length === 0 ? (
              <p>No data available.</p>
            ) : (
              <table className="min-w-full border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Project Name</th>
                    <th className="border px-2 py-1">Meeting Count</th>
                    <th className="border px-2 py-1">Total Duration (hrs)</th>
                    <th className="border px-2 py-1">Total Man-Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjectStats.map((proj, index) => (
                    <tr key={index}>
                      <td className="border px-2 py-1">{proj.project_name}</td>
                      <td className="border px-2 py-1">{proj.meeting_count}</td>
                      <td className="border px-2 py-1">{roundValue(proj.total_duration_hours)}</td>
                      <td className="border px-2 py-1">{roundValue(proj.total_man_hours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Executive Meeting Fraction Statistics */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Executive Meeting Fraction</h2>
            <div className="mb-2">
              <input
                type="text"
                value={fractionSearch}
                onChange={(e) => setFractionSearch(e.target.value)}
                placeholder="Search by executive details"
                className="border p-1 mr-2"
              />
            </div>
            {filteredExecFractionStats.length === 0 ? (
              <p>No data available.</p>
            ) : (
              <table className="min-w-full border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">ID</th>
                    <th className="border px-2 py-1">Executive</th>
                    <th className="border px-2 py-1">Email</th>
                    <th className="border px-2 py-1">Meeting Hours</th>
                    <th className="border px-2 py-1">Fraction of Working Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExecFractionStats.map((stat) => (
                    <tr key={stat.user_id}>
                      <td className="border px-2 py-1">{stat.user_id}</td>
                      <td className="border px-2 py-1">{stat.name}</td>
                      <td className="border px-2 py-1">{stat.email}</td>
                      <td className="border px-2 py-1">{roundValue(stat.meeting_hours)}</td>
                      <td className="border px-2 py-1">{roundValue(stat.fraction)}</td>
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
