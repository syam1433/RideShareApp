const Ride = require("../models/Ride");
const { generateOTP, sendOTP } = require("../utils/generateOTP");
const User = require("../models/User");
const { notifyOTP, notifyRideStatusUpdate } = require("../Config/socket");

const DEFAULT_PICKUP_COORDS = [80.4365, 16.3067]; // Vijayawada [lng, lat]
const DEFAULT_DEST_COORDS = [80.4365, 16.3067]; // Vijayawada [lng, lat]

const isValidCoordinatePair = (lat, lng) => {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

// Get all rides
exports.getAllRides = async (req, res) => {
  try {
    const { from, to, date, passengers, page = 1, limit = 20 } = req.query;

    // Base query: only show upcoming/active rides
    const query = { status: { $in: ["upcoming", "active", "pending"] } };

    // Filter by 'from' (case-insensitive partial match)
    if (from) {
      query.from = { $regex: from.trim(), $options: "i" };
    }

    // Filter by 'to'
    if (to) {
      query.to = { $regex: to.trim(), $options: "i" };
    }

    // Filter by date (exact day match)
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      query.dateTime = {
        $gte: startOfDay,
        $lt: endOfDay,
      };
    }

    // Filter by available seats >= requested passengers
    if (passengers && !isNaN(passengers)) {
      query.seatsAvailable = { $gte: Number(passengers) };
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination info
    const total = await Ride.countDocuments(query);

    const rides = await Ride.find(query)
      .populate("driver", "name avatar rating vehicleType vehicleNumber vehicleModel")
      .sort({ dateTime: 1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      rides,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalRides: total,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    });
  } catch (err) {
    console.error("Get all rides error:", err);
    res.status(500).json({ message: "Failed to fetch rides" });
  }
};

// Create ride (Driver only)
exports.createRide = async (req, res) => {
  try {
    const {
      from,
      to,
      viaPoints = [],
      dateTime,
      pricePerSeat,
      seatsAvailable,
      vehicleType,
      dlNumber,
      vehicleNumber,
      vehicleModel,
      safetyNote,
      pickupLat,
      pickupLng,
      destinationLat,
      destinationLng,
    } = req.body;

    if (
      !from?.trim() ||
      !to?.trim() ||
      !dateTime ||
      !pricePerSeat ||
      !seatsAvailable ||
      !dlNumber?.trim() ||
      !vehicleNumber?.trim() ||
      !vehicleModel?.trim()
    ) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Coordinates are optional in request; fallback defaults are used when missing/invalid.
    const pickupLatitude = parseFloat(pickupLat);
    const pickupLongitude = parseFloat(pickupLng);
    const destLatitude = parseFloat(destinationLat);
    const destLongitude = parseFloat(destinationLng);

    const pickupCoordinates = isValidCoordinatePair(pickupLatitude, pickupLongitude)
      ? [pickupLongitude, pickupLatitude]
      : DEFAULT_PICKUP_COORDS;

    const destinationCoordinates = isValidCoordinatePair(destLatitude, destLongitude)
      ? [destLongitude, destLatitude]
      : DEFAULT_DEST_COORDS;

    const ride = new Ride({
      driver: req.user.id,
      from: from.trim(),
      to: to.trim(),
      pickupLocation: {
        type: 'Point',
        coordinates: pickupCoordinates // [lng, lat]
      },
      destinationLocation: {
        type: 'Point',
        coordinates: destinationCoordinates // [lng, lat]
      },
      viaPoints: viaPoints.filter((p) => p.trim()),
      dateTime: new Date(dateTime),
      pricePerSeat: Number(pricePerSeat),
      seatsAvailable: Number(seatsAvailable),
      seatCapacity: Number(seatsAvailable),
      vehicleType,
      dlNumber: dlNumber.trim(),
      vehicleNumber: vehicleNumber.trim(),
      vehicleModel: vehicleModel.trim(),
      safetyNote: safetyNote?.trim() || "",
      status: "upcoming",
      passengers: []
    });

    await ride.save();

    res.status(201).json({ message: "Ride posted successfully", ride });
  } catch (err) {
    console.error("Create ride error:", err);
    res.status(500).json({ message: "Failed to post ride" });
  }
};

// Update ride status
// rideController.js – updateRideStatus
exports.updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ride = await Ride.findById(req.params.id)
      .populate('passengers', 'phone name _id'); // important: get phones and IDs!

    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (status === "active" && ride.status === "upcoming") {
      const otp = generateOTP();

      ride.otp = otp; // shared OTP

      // Send OTP via SMS to all passengers
      for (const passenger of ride.passengers || []) {
        if (passenger.phone) {
          await sendOTP(
            passenger.phone,
            otp,
            `for ride ${ride.from} → ${ride.to}`
          );
        }
      }

      // Optional: also notify driver
      await sendOTP(req.user.phone, otp, "(driver copy - shared OTP)");

      // IMPORTANT: Notify via Socket.IO for real-time updates
      const passengerIds = ride.passengers?.map(p => p._id.toString()) || [];
      notifyRideStatusUpdate(ride._id.toString(), passengerIds, status, otp);
      console.log(`[Socket] Notified OTP for ride ${ride._id} to ${passengerIds.length} passengers`);
    }

    ride.status = status;
    await ride.save();

    res.json(ride);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyPassengerOTP = async (req, res) => {
  try {
    const { otp, passengerId } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (ride.status !== "active") {
      return res.status(400).json({ message: "Ride is not active" });
    }
    if (!ride.otp) {
      return res.status(400).json({ message: "No OTP generated" });
    }

    if (String(otp || "") !== String(ride.otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const passengerIds = (ride.passengers || []).map((id) => id.toString());
    const verifiedPassengerIds = (ride.verifiedPassengers || []).map((id) => id.toString());

    if (passengerIds.length === 0) {
      return res.status(400).json({ message: "No passengers booked for this ride" });
    }

    let targetPassengerId = passengerId ? String(passengerId) : null;

    if (targetPassengerId) {
      if (!passengerIds.includes(targetPassengerId)) {
        return res.status(400).json({ message: "Selected passenger is not part of this ride" });
      }
      if (verifiedPassengerIds.includes(targetPassengerId)) {
        return res.status(400).json({
          message: "Passenger already verified",
          verifiedCount: ride.verifiedPassengers.length,
          totalBooked: ride.passengers.length,
        });
      }
    } else {
      targetPassengerId = passengerIds.find((id) => !verifiedPassengerIds.includes(id));
      if (!targetPassengerId) {
        return res.status(400).json({
          message: "All passengers are already verified",
          verifiedCount: ride.verifiedPassengers.length,
          totalBooked: ride.passengers.length,
        });
      }
    }

    ride.verifiedPassengers.push(targetPassengerId);

    // Keep boarded passengers in sync with verified passengers for fare/finish calculations.
    const boardedPassengerIds = (ride.boardedPassengers || []).map((id) => id.toString());
    if (!boardedPassengerIds.includes(targetPassengerId)) {
      ride.boardedPassengers.push(targetPassengerId);
    }

    await ride.save();

    res.json({
      success: true,
      message: "Passenger verified",
      passengerId: targetPassengerId,
      verifiedCount: ride.verifiedPassengers.length,
      totalBooked: ride.passengers.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Search rides near a location (geospatial search)
exports.searchNearbyRides = async (req, res) => {
  try {
    const { lat, lng, radius = 10, passengers = 1 } = req.query; // radius in km, default 10km

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    const requiredSeats = parseInt(passengers) || 1;

    if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
      return res.status(400).json({ message: "Radius must be a positive number in km" });
    }

    // Keep search performant and predictable.
    const normalizedRadiusKm = Math.min(radiusKm, 50);
    const searchRadius = normalizedRadiusKm * 1000; // Convert km to meters

    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: "Invalid latitude or longitude" });
    }

    // Find rides where pickup location is within the search radius
    const rides = await Ride.find({
      status: { $in: ["upcoming", "active"] },
      seatsAvailable: { $gte: requiredSeats },
      dateTime: { $gte: new Date() },
      pickupLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude] // [lng, lat]
          },
          $maxDistance: searchRadius
        }
      }
    })
    .populate("driver", "name avatar rating vehicleType vehicleNumber vehicleModel")
    .sort({ dateTime: 1 })
    .limit(50); // Limit results to prevent overwhelming response

    // Calculate distance for each ride and add it to the response
    const ridesWithDistance = rides.map(ride => {
      const rideObj = ride.toObject();

      if (!Array.isArray(ride.pickupLocation?.coordinates) || ride.pickupLocation.coordinates.length !== 2) {
        return null;
      }

      // Calculate distance using Haversine formula (approximate)
      const distance = calculateDistance(
        latitude, longitude,
        ride.pickupLocation.coordinates[1], // lat
        ride.pickupLocation.coordinates[0]  // lng
      );

      rideObj.distance = Math.round(distance * 10) / 10; // Round to 1 decimal place
      return rideObj;
    }).filter(Boolean);

    res.json({
      success: true,
      count: ridesWithDistance.length,
      searchLocation: { lat: latitude, lng: longitude },
      radius: normalizedRadiusKm,
      rides: ridesWithDistance
    });
  } catch (err) {
    console.error("Search nearby rides error:", err);
    res.status(500).json({ message: "Failed to search nearby rides" });
  }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}
// rideController.js
exports.searchLocations = async (req, res) => {
  try {
    const { q } = req.query; // ?q=raj

    if (!q || q.length < 2) {
      return res.json([]);
    }

    // Simple prefix search (case insensitive)
    // You can improve this with text index or aggregation later
    const locations = await Ride.distinct("from", {
      from: { $regex: `^${q}`, $options: "i" },
    });

    const toLocations = await Ride.distinct("to", {
      to: { $regex: `^${q}`, $options: "i" },
    });

    // Combine and remove duplicates
    const unique = [...new Set([...locations, ...toLocations])];

    res.json(unique.slice(0, 10)); // limit to 10 suggestions
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
};
// rideController.js
exports.getMyRides = async (req, res) => {
  try {
    const rides = await Ride.find({ driver: req.user.id })
      .populate("passengers", "name avatar")
      .sort({ dateTime: 1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch rides" });
  }
};

exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("driver", "name avatar rating")
      .populate("passengers", "name avatar phone");

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    const rideObj = ride.toObject();

    // TEMP: send OTP to everyone for testing
    rideObj.otp = ride.otp; // ← remove isPassenger check temporarily

    console.log("Sending ride to user:", {
      userId: req.user?.id || "NO USER",
      otpSent: !!rideObj.otp,
      otpValue: rideObj.otp,
      passengersCount: ride.passengers?.length || 0
    });

    res.json(rideObj);
  } catch (error) {
    console.error("Get ride by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.startRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (ride.status !== "upcoming") {
      return res.status(400).json({ message: "Ride cannot be started" });
    }

    // Generate OTP logic here (same as above)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`Starting ride ${ride._id} – OTP example: ${otp}`);
    // TODO: send real OTPs to each passenger

    ride.status = "active";
    await ride.save();

    res.json({ success: true, ride });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.finishRide = async (req, res) => {
  try {
    const { paymentDone = false } = req.body;
    console.log("[finishRide] Starting for ride:", req.params.id, "paymentDone:", paymentDone);

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      console.log("[finishRide] Ride not found");
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    if (ride.driver.toString() !== req.user.id) {
      console.log("[finishRide] Not authorized - user:", req.user.id, "driver:", ride.driver);
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (ride.status !== "active") {
      console.log("[finishRide] Invalid status:", ride.status);
      return res.status(400).json({ success: false, message: "Ride must be active" });
    }

    ride.status = "completed";
    ride.paymentStatus = paymentDone ? "paid" : "unpaid";

    // Calculate total fare based on boarded passengers
    const boardedCount = ride.boardedPassengers.length;
    ride.totalFare = boardedCount * ride.pricePerSeat;

    await ride.save();
    console.log("[finishRide] Ride saved - new status:", ride.status);

    // Update bookings to completed
    try {
      await Booking.updateMany(
        { ride: ride._id, status: "confirmed" },
        { status: "completed", paymentStatus: paymentDone ? "paid" : "unpaid" }
      );
      console.log("[finishRide] Bookings updated to completed");
    } catch (bookingErr) {
      console.error("[finishRide] Failed to update bookings:", bookingErr.message);
    }

    res.json({
      success: true,
      message: "Ride completed successfully",
      ride
    });
  } catch (err) {
    console.error("[finishRide] Critical error:", err.stack);
    res.status(500).json({
      success: false,
      message: "Server error while finishing ride",
      error: err.message
    });
  }
};

module.exports = {
  getAllRides: exports.getAllRides,
  createRide: exports.createRide,
  updateRideStatus: exports.updateRideStatus,
  searchLocations: exports.searchLocations,
  getMyRides: exports.getMyRides,
  getRideById: exports.getRideById,
  startRide: exports.startRide,
  verifyPassengerOTP: exports.verifyPassengerOTP,
  finishRide: exports.finishRide,
  searchNearbyRides: exports.searchNearbyRides
};