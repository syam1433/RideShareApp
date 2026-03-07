const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: "Ride" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);