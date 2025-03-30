// src/PrivateRoute.js
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Use a named import

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // current time in seconds
    if (decoded.exp < currentTime) {
      // Token expired: remove it and redirect to login
      localStorage.removeItem("token");
      return <Navigate to="/login" replace />;
    }
  } catch (err) {
    // If token is malformed, remove it and redirect
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;
