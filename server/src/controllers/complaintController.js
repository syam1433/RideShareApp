const Complaint = require("../models/Complaint");

exports.createComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.create({
      user: req.user.id,
      ride: req.body.rideId,
      description: req.body.description,
    });

    res.status(201).json(complaint);
  } catch (error) {
    next(error);
  }
};

exports.getComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find().populate("user ride");
    res.json(complaints);
  } catch (error) {
    next(error);
  }
};

exports.updateComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(complaint);
  } catch (error) {
    next(error);
  }
};