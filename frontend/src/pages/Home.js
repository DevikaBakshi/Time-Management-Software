// src/pages/Home.js
import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Time Management System</h1>
      <p className="mb-6">Schedule and manage your meetings efficiently.</p>
      <div className="space-x-4">
        <Link 
          to="/login" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Login
        </Link>
        <Link 
          to="/register" 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Register
        </Link>
      </div>
    </div>
  );
}

export default Home;
