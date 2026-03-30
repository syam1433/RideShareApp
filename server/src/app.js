const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorHandler");
const path = require("path");

const app = express();

const allowedOrigins = [
  ...(process.env.CLIENT_URLS || "").split(",").map((origin) => origin.trim()).filter(Boolean),
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // add this if you use urlencoded anywhere

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests and same-origin requests with no Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(cookieParser());

// Static files first (good)
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

// ← Put routes BEFORE json/urlencoded
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/rides", require("./routes/rideRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/safety", require("./routes/safetyRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

// ← Apply json & urlencoded ONLY AFTER file-upload routes

// Global error handler last
app.use(errorHandler);

module.exports = app;