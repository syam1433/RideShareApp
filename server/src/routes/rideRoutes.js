const express = require("express");
const router = express.Router();
const rideController = require("../controllers/rideControllerClean");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");  // ← Add this line

router.get("/", rideController.getAllRides);
router.get("/nearby", rideController.searchNearbyRides);
router.post("/", protect, rideController.createRide);
router.put("/:id/status", protect, authorize("driver"), rideController.updateRideStatus);
router.post("/:id/send-otp", protect, authorize("driver"), rideController.sendRideOTP);
router.get("/locations/search", rideController.searchLocations);
router.get("/my", protect, authorize("driver"), rideController.getMyRides);
router.get("/:id", rideController.getRideById);
router.post("/:id/start", protect, authorize("driver"), rideController.startRide);
router.post("/:id/verify-passenger", protect, authorize("driver"), rideController.verifyPassengerOTP);
router.put("/:id/finish", protect, authorize("driver"), rideController.finishRide);

module.exports = router;