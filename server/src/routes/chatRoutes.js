const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

// Get messages for a ride
router.get("/:rideId", authMiddleware.protect, chatController.getRideMessages);

// Send a message
router.post("/", authMiddleware.protect, chatController.sendMessage);

module.exports = router;