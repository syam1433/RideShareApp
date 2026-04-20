const Review = require("../models/Review");

exports.createReview = async (req, res, next) => {
  try {
    const review = await Review.create({ ...req.body, reviewer: req.user.id });
    return res.status(201).json(review);
  } catch (error) {
    return next(error);
  }
};

exports.rateRide = async (req, res, next) => {
  try {
    const review = await Review.create({ ...req.body, reviewer: req.user.id });
    return res.status(201).json(review);
  } catch (error) {
    return next(error);
  }
};

exports.getDriverReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.id }).populate("reviewer", "name email role");
    return res.json(reviews);
  } catch (error) {
    return next(error);
  }
};
const Review = require("../models/Review");

exports.createReview = async (req, res, next) => {
  try {
    const review = await Review.create({ ...req.body, reviewer: req.user.id });
    return res.status(201).json(review);
  } catch (error) {
    return next(error);
  }
};

exports.rateRide = async (req, res, next) => {
  try {
    const review = await Review.create({ ...req.body, reviewer: req.user.id });
    return res.status(201).json(review);
  } catch (error) {
    return next(error);
  }
};

exports.getDriverReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.id }).populate("reviewer", "name email role");
    return res.json(reviews);
  } catch (error) {
    return next(error);
  }
};