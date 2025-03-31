// src/App.js
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SecretaryDashboard from "./pages/SecretaryDashboard";
import LeaveEngagement from "./pages/LeaveEngagement";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ScheduleMeeting from "./pages/ScheduleMeeting";
import CalendarView from "./pages/CalendarView";
import Home from "./pages/Home";
import MeetingDetails from "./pages/MeetingDetails";
import StatisticsDashboard from "./pages/StatisticsDashboard";
import Profile from "./pages/Profile"; // Import Profile page
import PrivateRoute from "./PrivateRoute";
import LeaveDetails from "./pages/LeaveDetails";
import EngagementDetails from "./pages/EngagementDetails";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/secretary-dashboard"
          element={
            <PrivateRoute>
              <SecretaryDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <PrivateRoute>
              <ScheduleMeeting />
            </PrivateRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <PrivateRoute>
              <CalendarView />
            </PrivateRoute>
          }
        />
        <Route
          path="/meeting-details/:id"
          element={
            <PrivateRoute>
              <MeetingDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/engagement"
          element={
            <PrivateRoute>
              <LeaveEngagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/statistics-dashboard"
          element={
            <PrivateRoute>
              <StatisticsDashboard />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/leaves/:id"
          element={
            <PrivateRoute>
              <LeaveDetails />
            </PrivateRoute>
          }
        />
        
        
        <Route
          path="/engagements/:id"
          element={
            <PrivateRoute>
              <EngagementDetails />
            </PrivateRoute>
          }
        />


        {/* Fallback Route */}
        <Route path="*" element={<h1>Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
