// src/pages/Home.js
import React from "react";
import { Link } from "react-router-dom";

function Home() {
  const fullPageStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    margin: 0,
    padding: 0,
    overflow: "hidden",
  };

  const containerStyle = {
    maxWidth: "800px",
    width: "100%",
    padding: "40px 20px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  };

  const headingStyle = {
    fontSize: "2.5rem",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#333",
  };

  const paragraphStyle = {
    marginBottom: "30px",
    fontSize: "1.2rem",
    color: "#555",
  };

  const buttonContainerStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
  };

  const buttonStyle = {
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    color: "#fff",
    fontSize: "1rem",
    cursor: "pointer",
    textDecoration: "none",
  };

  const loginButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#007bff", // blue
  };

  const registerButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#28a745", // green
  };

  return (
    <div style={fullPageStyle}>
      <div style={containerStyle}>
        <h1 style={headingStyle}>Welcome to the Time Management System</h1>
        <p style={paragraphStyle}>Schedule and manage your meetings efficiently.</p>
        <div style={buttonContainerStyle}>
          <Link to="/login" style={loginButtonStyle}>
            Login
          </Link>
          <Link to="/register" style={registerButtonStyle}>
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
