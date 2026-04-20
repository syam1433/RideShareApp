import io from "socket.io-client";

const socketUrlFromEnv = (import.meta.env.VITE_BACKEND_URL || "").trim();
const defaultSocketUrl = import.meta.env.DEV ? "http://localhost:5000" : "https://rideshareapp-1.onrender.com";
const SOCKET_URL = (socketUrlFromEnv || defaultSocketUrl).replace(/\/$/, "");

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const joinUserDashboard = (userId) => {
  const sock = getSocket();
  if (sock && userId) {
    sock.emit("joinUserDashboard", userId);
  }
};

export const joinRide = (rideId) => {
  const sock = getSocket();
  if (sock && rideId) {
    sock.emit("joinRide", rideId);
  }
};

export const onOtpSent = (callback) => {
  const sock = getSocket();
  sock.on("otpSent", callback);
};

export const onRideStatusUpdated = (callback) => {
  const sock = getSocket();
  sock.on("rideStatusUpdated", callback);
};

export const removeOtpListener = () => {
  const sock = getSocket();
  sock.off("otpSent");
};

export const removeRideStatusListener = () => {
  const sock = getSocket();
  sock.off("rideStatusUpdated");
};
