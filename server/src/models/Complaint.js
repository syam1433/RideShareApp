const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ride: { type: mongoose.Schema.Types.ObjectId, ref: "Ride" },
    description: String,
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved"],
      default: "pending",
    },
    adminResponse: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);