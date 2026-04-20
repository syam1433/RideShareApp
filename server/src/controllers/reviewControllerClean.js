const Review = require("../models/Review");
const Ride = require("../models/Ride");
const User = require("../models/User");

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
    const { rideId, rating, comment } = req.body;
    const passengerId = req.user.id;

    // Validate input
    if (!rideId || !rating) {
      return res.status(400).json({ message: "Ride ID and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Get ride and driver info
    const ride = await Ride.findById(rideId).populate("driver");
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const driverId = ride.driver._id;

    // Create review record
    const review = await Review.create({
      ride: rideId,
      reviewer: passengerId,
      reviewee: driverId,
      rating,
      comment: comment || ""
    });

    // Get all reviews for this driver to calculate average
    const allReviews = await Review.find({ reviewee: driverId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRating / allReviews.length).toFixed(2);
    const totalReviews = allReviews.length;

    // Update driver's profile with new average rating
    const updatedDriver = await User.findByIdAndUpdate(
      driverId,
      {
        rating: parseFloat(avgRating),
        totalReviews: totalReviews
      },
      { new: true }
    ).select("name email rating totalReviews avatar role");

    return res.status(201).json({
      success: true,
      review,
      driver: updatedDriver,
      avgRating: parseFloat(avgRating),
      totalReviews,
      message: `Thanks! Driver rating updated to ${avgRating}/5`
    });
  } catch (error) {
    return next(error);
  }
};

exports.getDriverReviews = async (req, res, next) => {
  try {
    const driverId = req.params.id;

    // Get all reviews for driver
    const reviews = await Review.find({ reviewee: driverId })
      .populate("reviewer", "name email avatar")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
      : 0;

    // Get driver info
    const driver = await User.findById(driverId).select("name email rating totalReviews avatar role");

    return res.json({
      driver,
      reviews,
      avgRating: parseFloat(avgRating),
      totalReviews: reviews.length
    });
  } catch (error) {
    return next(error);
  }
};