const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintControllerClean");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, complaintController.createComplaint);
router.get("/", protect, complaintController.getComplaints);
router.put("/:id", protect, complaintController.updateComplaint);

module.exports = router;