const User = require("../models/User");

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.role;
    delete updates.isBlacklisted;
    delete updates.canCreateRide;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};
const User = require("../models/User");

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.role;
    delete updates.isBlacklisted;
    delete updates.canCreateRide;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};