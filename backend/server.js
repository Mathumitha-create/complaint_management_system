const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const complaintRoutes = require("./routes/complaints");
const adminRoutes = require("./routes/admin");
const vpRoutes = require("./routes/vp");
const escalationJob = require("./cron/escalateJob");

// Load Env
dotenv.config();

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// Verify Email Connection on Startup
const emailService = require("./services/emailService");
emailService.verifyConnection();

// Middleware
// Configure CORS: prefer explicit frontend origin to allow credentials safely
const allowedOrigins = [
  "http://localhost:3000",
  "https://complaint-management-system-beta.vercel.app",
  "https://complaint-management-system-g6kl.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

// ... (imports)

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vp", vpRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("VSB Grievance Backend is Running 🚀");
});

// Start Cron Jobs
escalationJob.startJob();

// Start Server with Error Handling
const server = app.listen(PORT, () => {
  console.log(`
  ==========================================
  🚀 Server running on http://localhost:${PORT}
  ==========================================
  `);
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(`
    ❌ Port ${PORT} is already in use!
    👉 Please stop the other process running on port ${PORT} or change the PORT in .env
    `);
    process.exit(1);
  } else {
    console.error("Server Error:", e);
  }
});
