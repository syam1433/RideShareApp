const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: "Ride" },
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    seatsBooked: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);



module.exports = mongoose.model("Booking", bookingSchema);
