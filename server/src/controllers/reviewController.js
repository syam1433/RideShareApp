const Review = require("../models/Review");
const User = require("../models/User");
const Ride = require("../models/Ride");

exports.createReview = async (req, res) => {
  try {
    const { rideId, revieweeId, rating, comment } = req.body;

    if (!rideId || !revieweeId || !rating) {
      return res.status(400).json({ message: "Ride, reviewee and rating are required" });
    }

    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.status !== "completed") {
      return res.status(400).json({ message: "Ride must be completed to rate" });
    }

    const isPassenger = (ride.passengers || []).some((p) => String(p) === String(req.user.id));
    if (!isPassenger) {
      return res.status(403).json({ message: "Not authorized to rate this ride" });
    }

    const existing = await Review.findOne({ ride: rideId, reviewer: req.user.id });
    if (existing) {
      return res.status(400).json({ message: "Already rated this ride" });
    }

    const review = await Review.create({
      ride: rideId,
      reviewer: req.user.id,
      reviewee: revieweeId,
      rating: parsedRating,
      comment: comment || "",
    });

    ride.ratings = ride.ratings || [];
    ride.ratings.push({
      passenger: req.user.id,
      rating: parsedRating,
      comment: comment || "",
    });
    await ride.save();

    const reviews = await Review.find({ reviewee: revieweeId });
    const totalReviews = reviews.length;
    const avg = totalReviews > 0
      ? reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / totalReviews
      : 0;

    await User.findByIdAndUpdate(revieweeId, {
      rating: Number(avg.toFixed(1)),
      totalReviews,
    });

    res.status(201).json({
      message: "Rating submitted successfully",
      review,
      avgRating: Number(avg.toFixed(1)),
      totalReviews,
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ message: "Server error" });
  }
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

    const alreadyRated = await Review.findOne({ ride: rideId, reviewer: passengerId });
    if (alreadyRated) {
      return res.status(400).json({ message: "Already rated this ride" });
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Add rating to ride for compatibility with existing UI
    ride.ratings.push({
      passenger: passengerId,
      rating: numericRating,
      comment: comment || ""
    });

    await ride.save();

    await Review.create({
      ride: rideId,
      reviewer: passengerId,
      reviewee: ride.driver,
      rating: numericRating,
      comment: comment || ""
    });

    // Calculate new average rating for driver across all ride reviews
    const reviews = await Review.find({ reviewee: ride.driver });
    const totalRatings = reviews.length;
    const sumRatings = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    const avgRating = totalRatings > 0 ? Number((sumRatings / totalRatings).toFixed(1)) : 0;

    await User.findByIdAndUpdate(ride.driver, {
      rating: avgRating,
      totalReviews: totalRatings,
    });

    res.json({ message: "Rating submitted successfully", avgRating, totalReviews: totalRatings });
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