// src/pages/Login.js
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/users/login", { email, password });
  
      console.log("Raw Response:", response);
      console.log("Response Data:", response.data);
  
      const { token, user } = response.data;
      if (!token || !user?.userId) {
        throw new Error("Invalid response from server");
      }
      
      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.userId);
      localStorage.setItem("userRole", user.role);

      // Navigate based on role: executive goes to dashboard, secretary to secretary dashboard.
      if (user.role === "secretary") {
        navigate("/secretary-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <label>Email:</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <label>Password:</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
