const Chat = require("../models/Chat");

// Get all messages for a ride
exports.getRideMessages = async (req, res) => {
  try {
    const { rideId } = req.params;
    const messages = await Chat.find({ ride: rideId })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Get ride messages error:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { rideId, message } = req.body;
    const sender = req.user.id;

    const newMessage = new Chat({
      ride: rideId,
      sender,
      message,
    });

    await newMessage.save();
    await newMessage.populate("sender", "name avatar");

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};