const express = require("express");
const router = express.Router();
const safetyController = require("../controllers/safetyControllerClean");
const { protect } = require("../middleware/authMiddleware");

router.get("/:driverId", protect, safetyController.getSafetyRecord);
router.put("/:driverId", protect, safetyController.updateSafetyRecord);

module.exports = router;