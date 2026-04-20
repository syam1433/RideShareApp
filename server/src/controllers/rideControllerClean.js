const Ride = require("../models/Ride");
const { generateOTP } = require("../utils/generateOTP");
const { notifyOTP, notifyRideStatusUpdate, getIO } = require("../Config/socket");

const DEFAULT_COORDINATES = [80.4365, 16.3067];

const toGeoPoint = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    type: "Point",
    coordinates: [lng, lat],
  };
};

const resolveGeoPoint = (body, prefix) => {
  const directPoint = body[prefix];
  if (directPoint?.type === "Point" && Array.isArray(directPoint.coordinates) && directPoint.coordinates.length === 2) {
    return {
      type: "Point",
      coordinates: [Number(directPoint.coordinates[0]), Number(directPoint.coordinates[1])],
    };
  }

  const lat = body[`${prefix}Lat`];
  const lng = body[`${prefix}Lng`];
  const geoPoint = toGeoPoint(lat, lng);

  return geoPoint || {
    type: "Point",
    coordinates: DEFAULT_COORDINATES,
  };
};

exports.getAllRides = async (req, res, next) => {
  try {
    const rides = await Ride.find().populate("driver", "name email role");
    return res.json(rides);
  } catch (error) {
    return next(error);
  }
};

exports.searchNearbyRides = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from) filter.from = new RegExp(from, "i");
    if (to) filter.to = new RegExp(to, "i");

    const rides = await Ride.find(filter).populate("driver", "name email role");
    return res.json(rides);
  } catch (error) {
    return next(error);
  }
};

exports.createRide = async (req, res, next) => {
  try {
    const pickupLocation = resolveGeoPoint(req.body, "pickup");
    const destinationLocation = resolveGeoPoint(req.body, "destination");

    if (!pickupLocation || !destinationLocation) {
      return res.status(400).json({
        message: "Pickup and destination coordinates are required",
      });
    }

    const ride = await Ride.create({
      ...req.body,
      driver: req.user.id,
      pickupLocation,
      destinationLocation,
      seatsAvailable: Number(req.body.seatsAvailable),
      pricePerSeat: Number(req.body.pricePerSeat),
    });
    return res.status(201).json(ride);
  } catch (error) {
    return next(error);
  }
};

const broadcastRideState = async (ride, status) => {
  const otp = status === "active" ? (ride.otp || generateOTP()) : ride.otp || null;

  if (status === "active" && !ride.otp) {
    ride.otp = otp;
    await ride.save();
  }

  const passengerIds = (ride.passengers || []).map((passenger) => String(passenger._id || passenger));
  notifyRideStatusUpdate(ride._id, passengerIds, status, otp);

  if (status === "active" && otp) {
    notifyOTP(ride._id, passengerIds, otp);
  }

  return { otp };
};

exports.updateRideStatus = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("passengers", "name email avatar phone rating");
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    ride.status = req.body.status;
    await ride.save();

    const { otp } = await broadcastRideState(ride, req.body.status);
    return res.json({
      success: true,
      ride,
      otpSent: req.body.status === "active",
      otpValue: otp,
    });
  } catch (error) {
    return next(error);
  }
};

exports.searchLocations = async (req, res, next) => {
  try {
    const { q = "" } = req.query;
    const rides = await Ride.find({
      $or: [{ from: new RegExp(q, "i") }, { to: new RegExp(q, "i") }],
    }).limit(20);
    return res.json(rides);
  } catch (error) {
    return next(error);
  }
};

exports.getMyRides = async (req, res, next) => {
  try {
    const rides = await Ride.find({ driver: req.user.id });
    return res.json(rides);
  } catch (error) {
    return next(error);
  }
};

exports.getRideById = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("driver", "name email role avatar rating totalReviews")
      .populate("passengers", "name email avatar phone rating");
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    return res.json(ride);
  } catch (error) {
    return next(error);
  }
};

exports.startRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("passengers", "name email avatar phone rating");
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    ride.status = "active";
    await ride.save();

    const { otp } = await broadcastRideState(ride, "active");
    return res.json({
      success: true,
      ride,
      otpSent: true,
      otpValue: otp,
    });
  } catch (error) {
    return next(error);
  }
};

exports.sendRideOTP = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("passengers", "name email avatar phone rating");
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    const { otp } = await broadcastRideState(ride, ride.status === "active" ? "active" : ride.status);
    return res.json({
      success: true,
      otpSent: true,
      otpValue: otp,
    });
  } catch (error) {
    return next(error);
  }
};

exports.verifyPassengerOTP = async (req, res, next) => {
  try {
    const { otp, passengerId } = req.body;
    
    if (!otp || otp.length !== 6) {
      return res.status(400).json({ message: "Invalid OTP format" });
    }

    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // Verify the OTP matches
    if (String(ride.otp) !== String(otp)) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Add passenger to verifiedPassengers if not already there
    if (passengerId) {
      const passId = String(passengerId);
      if (!ride.verifiedPassengers) {
        ride.verifiedPassengers = [];
      }
      
      // Avoid duplicates
      const alreadyVerified = ride.verifiedPassengers.some(
        (id) => String(id) === passId
      );
      
      if (!alreadyVerified) {
        ride.verifiedPassengers.push(passengerId);
      }
    }

    await ride.save();

    // Return updated ride with populated data
    const updatedRide = await Ride.findById(req.params.id)
      .populate("driver", "name email role avatar rating")
      .populate("passengers", "name email avatar phone rating");

    return res.json({
      success: true,
      message: "Passenger verified successfully",
      ride: updatedRide,
      verifiedCount: updatedRide.verifiedPassengers?.length || 0,
      totalPassengers: updatedRide.passengers?.length || 0,
    });
  } catch (error) {
    return next(error);
  }
};

exports.finishRide = async (req, res, next) => {
  try {
    const ride = await Ride.findByIdAndUpdate(req.params.id, { status: "completed" }, { new: true })
      .populate("passengers", "name email avatar phone rating")
      .populate("driver", "name email role avatar rating");
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    return res.json(ride);
  } catch (error) {
    return next(error);
  }
};