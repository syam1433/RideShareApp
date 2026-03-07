const SafetyRecord = require("../models/SafetyRecord");

exports.getSafetyRecord = async (req, res, next) => {
  try {
    const record = await SafetyRecord.findOne({
      driver: req.params.driverId,
    });

    res.json(record);
  } catch (error) {
    next(error);
  }
};

exports.updateSafetyRecord = async (req, res, next) => {
  try {
    const record = await SafetyRecord.findOneAndUpdate(
      { driver: req.params.driverId },
      req.body,
      { new: true, upsert: true }
    );

    res.json(record);
  } catch (error) {
    next(error);
  }
};