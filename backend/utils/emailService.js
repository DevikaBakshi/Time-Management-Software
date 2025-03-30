require("dotenv").config();
const nodemailer = require("nodemailer");

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
    connectionTimeout: 30000, // Increase timeout to 20 seconds
  });
  

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error verifying transporter:", error);
  } else {
    console.log("Server is ready to take our messages:", success);
  }
});

async function sendEmail(to, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to, // Make sure to pass a valid email address when calling the function
      subject,
      text,
    });
    console.log("✅ Email sent successfully:", info.response);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

// Export the sendEmail function so other modules can use it
module.exports = sendEmail;
