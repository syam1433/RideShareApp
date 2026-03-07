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

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});