const Complaint = require("../models/Complaint");

exports.createComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.create({ ...req.body, user: req.user.id });
    return res.status(201).json(complaint);
  } catch (error) {
    return next(error);
  }
};

exports.getComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find().populate("user", "name email role").populate("ride");
    return res.json(complaints);
  } catch (error) {
    return next(error);
  }
};

exports.updateComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    return res.json(complaint);
  } catch (error) {
    return next(error);
  }
};