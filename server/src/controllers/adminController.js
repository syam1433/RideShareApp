const User = require("../models/User");
const Ride = require("../models/Ride");

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: "user" });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.getDrivers = async (req, res, next) => {
  try {
    const drivers = await User.find({ role: "driver" });
    res.json(drivers);
  } catch (error) {
    next(error);
  }
};

exports.getAllRides = async (req, res, next) => {
  try {
    const rides = await Ride.find().populate("driver");
    res.json(rides);
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRides = await Ride.countDocuments();

    res.json({
      totalUsers,
      totalRides,
    });
  } catch (error) {
    next(error);
  }
};