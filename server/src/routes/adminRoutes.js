const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.get("/users", protect, authorize("admin"), adminController.getUsers);
router.get("/drivers", protect, authorize("admin"), adminController.getDrivers);
router.get("/rides", protect, authorize("admin"), adminController.getAllRides);
router.get("/analytics", protect, authorize("admin"), adminController.getAnalytics);

module.exports = router;