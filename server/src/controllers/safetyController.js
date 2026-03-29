const SafetyRecord = require("../models/SafetyRecord");
const mongoose = require("mongoose");

const resolveDriverId = (req) => {
  const candidate = req.params.driverId || req.user?.id;
  if (!candidate || candidate === "undefined" || candidate === "null") {
    return null;
  }

  return mongoose.Types.ObjectId.isValid(candidate) ? candidate : null;
};

exports.getSafetyRecord = async (req, res, next) => {
  try {
    const driverId = resolveDriverId(req);
    if (!driverId) {
      return res.status(400).json({ message: "Valid driver ID is required" });
    }

    const record = await SafetyRecord.findOne({
      driver: driverId,
    });

    res.json(record);
  } catch (error) {
    next(error);
  }
};

exports.updateSafetyRecord = async (req, res, next) => {
  try {
    const driverId = resolveDriverId(req);
    if (!driverId) {
      return res.status(400).json({ message: "Valid driver ID is required" });
    }

    const record = await SafetyRecord.findOneAndUpdate(
      { driver: driverId },
      req.body,
      { new: true, upsert: true }
    );

    res.json(record);
  } catch (error) {
    next(error);
  }
};