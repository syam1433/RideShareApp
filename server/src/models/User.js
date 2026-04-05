const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "driver"], default: "user" },
  
  // Already existing
  vehicleType: { type: String, default: "Bike" },
  vehicleNumber: String,
  vehicleModel: String,

  // New optional fields for drivers
  vehicleRC: { 
    type: String, 
    default: null 
  }, // e.g. file path or URL to RC document

  insurance: { 
    type: String, 
    default: null 
  }, // e.g. file path or URL to insurance

  // Other fields like rating, avatar, etc.
  rating: { type: Number, default: 4.5 },
  totalReviews: { type: Number, default: 0 },
  overloadViolations: { type: Number, default: 0 },
  canCreateRide: { type: Boolean, default: true },
  isBlacklisted: { type: Boolean, default: false },
  blacklistReason: { type: String, default: null },
  blacklistedAt: { type: Date, default: null },
  avatar: String,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);