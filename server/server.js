require("dotenv").config();
const http = require("http");
const connectDB = require("./src/Config/db");
const { initSocket } = require("./src/Config/socket");
const app = require("./src/app");

connectDB();

const server = http.createServer(app);
const io = initSocket(server);

// Set socket instance in booking controller
const bookingController = require("./src/controllers/bookingController");
bookingController.setSocketIO(io);

const PORT = Number(process.env.PORT) || 5000;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing process or change PORT in .env.`);
    process.exit(1);
  }

  console.error("Server error:", error.message);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
