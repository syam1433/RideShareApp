const { Server } = require("socket.io");
const bookingController = require("../controllers/bookingController");

let io;

const normalizeOrigin = (origin) => origin.replace(/\/$/, "");

const getAllowedOrigins = () => {
  return [
    ...(process.env.CLIENT_URLS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    process.env.CLIENT_URL,
  ]
    .filter(Boolean)
    .map(normalizeOrigin);
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const allowedOrigins = getAllowedOrigins();
        const normalizedOrigin = normalizeOrigin(origin);

        if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
        return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    },
  });

  // Set socket instance in booking controller
  bookingController.setSocketIO(io);

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("joinRide", (rideId) => {
      socket.join(rideId);
      console.log(`Socket ${socket.id} joined ride ${rideId}`);
    });

    socket.on("joinUserDashboard", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined user dashboard ${userId}`);
    });

    socket.on("sendMessage", async ({ rideId, message, sender }) => {
      try {
        const Chat = require("../models/Chat");
        const newMessage = new Chat({
          ride: rideId,
          sender,
          message,
        });
        await newMessage.save();
        await newMessage.populate("sender", "name avatar");

        io.to(rideId).emit("receiveMessage", newMessage);
      } catch (err) {
        console.error("Socket send message error:", err);
      }
    });

    socket.on("locationUpdate", ({ rideId, location }) => {
      io.to(rideId).emit("driverLocation", location);
    });

    socket.on("rideStatusUpdate", ({ rideId, status, otp }) => {
      io.to(rideId).emit("rideStatusChanged", { rideId, status, otp });
    });

    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });

  return io;
};

const getIO = () => io;

// Helper function to notify passengers about OTP
const notifyOTP = (rideId, userIds, otp) => {
  if (io) {
    io.to(rideId).emit("otpSent", { rideId, otp });

    userIds.forEach((userId) => {
      io.to(`user_${userId}`).emit("otpSent", { rideId, otp });
    });

    console.log(`OTP notified for ride ${rideId} to users:`, userIds);
  }
};

// Helper function to notify ride status updates
const notifyRideStatusUpdate = (rideId, userIds, status, otp = null) => {
  if (io) {
    io.to(rideId).emit("rideStatusUpdated", { rideId, status, otp });

    userIds.forEach((userId) => {
      io.to(`user_${userId}`).emit("rideStatusUpdated", { rideId, status, otp });
    });

    console.log(`Ride status updated for ${rideId}:`, status);
  }
};

module.exports = { initSocket, getIO, notifyOTP, notifyRideStatusUpdate };