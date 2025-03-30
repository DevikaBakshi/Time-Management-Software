// debugEmail.js
const nodemailer = require("nodemailer");
require("dotenv").config();

// Log environment variables (for debugging purposes)
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

// Create a transporter using Gmail with TLS
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 20000, // Increase timeout to 20 seconds
  });
  

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error verifying transporter:", error);
  } else {
    console.log("Server is ready to take our messages:", success);
  }
});

// Function to send a test email
async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "executive@example.com", // Use a valid email address to test
      subject: "Test Email Using App Password",
      text: "This is a test email sent.",
    });
    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

sendTestEmail();
