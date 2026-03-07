const Review = require("../models/Review");
const User = require("../models/User");
const Ride = require("../models/Ride");

exports.createReview = async (req, res) => {
  const { rideId, revieweeId, rating, comment } = req.body;

  const review = await Review.create({
    ride: rideId,
    reviewer: req.user.id,
    reviewee: revieweeId,
    rating,
    comment,
  });

  // Update driver rating
  const reviews = await Review.find({ reviewee: revieweeId });
  const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;

  await User.findByIdAndUpdate(revieweeId, {
    rating: avg.toFixed(1),
    totalReviews: reviews.length,
  });

  res.status(201).json(review);
};

exports.rateRide = async (req, res) => {
  try {
    const { rideId, rating, comment } = req.body;
    const passengerId = req.user.id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.status !== "completed") {
      return res.status(400).json({ message: "Ride must be completed to rate" });
    }

    // Check if passenger was on this ride
    const isPassenger = ride.passengers.some(p => p.toString() === passengerId);
    if (!isPassenger) {
      return res.status(403).json({ message: "Not authorized to rate this ride" });
    }

    // Check if already rated
    const existingRating = ride.ratings.find(r => r.passenger.toString() === passengerId);
    if (existingRating) {
      return res.status(400).json({ message: "Already rated this ride" });
    }

    // Add rating
    ride.ratings.push({
      passenger: passengerId,
      rating: Number(rating),
      comment: comment || ""
    });

    await ride.save();

    // Calculate new average rating for driver
    const totalRatings = ride.ratings.length;
    const sumRatings = ride.ratings.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : 0;

    await User.findByIdAndUpdate(ride.driver, { rating: avgRating });

    res.json({ message: "Rating submitted successfully", avgRating });
  } catch (error) {
    console.error("Rate ride error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDriverReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      reviewee: req.params.id,
    }).populate("reviewer", "name");

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};