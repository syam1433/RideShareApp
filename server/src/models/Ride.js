const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    from: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: true
    },
    // Geospatial coordinates for pickup location
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    // Geospatial coordinates for destination location
    destinationLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    viaPoints: [String],
    dateTime: {
      type: Date,
      required: true
    },
    pricePerSeat: {
      type: Number,
      required: true
    },
    seatsAvailable: {
      type: Number,
      required: true
    },
    vehicleType: String,
    dlNumber: {
      type: String,
      required: true
    },
    vehicleNumber: {
      type: String,
      required: true
    },
    vehicleModel: {
      type: String,
      required: true
    },
    safetyNote: String,
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming"
    },
    passengers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    otp: { type: String, default: null },
      boardedPassengers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  verifiedPassengers: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
}],
  ratings: [{
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  totalFare: { type: Number, default: 0 }
},

{ timestamps: true }
);

// Add geospatial indexes for location-based queries
rideSchema.index({ pickupLocation: "2dsphere" });
rideSchema.index({ destinationLocation: "2dsphere" });

module.exports = mongoose.model("Ride", rideSchema);