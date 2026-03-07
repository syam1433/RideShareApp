const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, reviewController.createReview);
router.post("/rate-ride", protect, reviewController.rateRide);
router.get("/driver/:id", reviewController.getDriverReviews);

module.exports = router;