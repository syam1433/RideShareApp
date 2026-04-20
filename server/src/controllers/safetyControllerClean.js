const SafetyRecord = require("../models/SafetyRecord");

exports.getSafetyRecord = async (req, res, next) => {
  try {
    const record = await SafetyRecord.findOne({ driver: req.params.driverId });
    return res.json(record || null);
  } catch (error) {
    return next(error);
  }
};

exports.updateSafetyRecord = async (req, res, next) => {
  try {
    const record = await SafetyRecord.findOneAndUpdate(
      { driver: req.params.driverId },
      req.body,
      { new: true, upsert: true }
    );
    return res.json(record);
  } catch (error) {
    return next(error);
  }
};