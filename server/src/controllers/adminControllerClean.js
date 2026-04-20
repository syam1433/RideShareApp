const User = require("../models/User");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

exports.getDrivers = async (req, res, next) => {
  try {
    const drivers = await User.find({ role: "driver" }).select("-password");
    return res.json(drivers);
  } catch (error) {
    return next(error);
  }
};

exports.getAllRides = async (req, res, next) => {
  try {
    const rides = await Ride.find().populate("driver", "name email role");
    return res.json(rides);
  } catch (error) {
    return next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const [users, drivers, rides, bookings] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "driver" }),
      Ride.countDocuments(),
      Booking.countDocuments(),
    ]);

    return res.json({ users, drivers, rides, bookings });
  } catch (error) {
    return next(error);
  }
};