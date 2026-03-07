const express = require("express");
const router = express.Router();
const path = require("path")
const bookingController = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");
const uploadPath = path.join(__dirname, "../../python/Rideshare_Overloading_Detection/uploads");


// Ensure folder exists (good practice)
const fs = require("fs");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const upload = multer({ dest: uploadPath });

// Safe wrapper that ignores the late "Unexpected end of form"
const safeSingleUpload = (fieldName) => (req, res, next) => {
  const uploader = upload.single(fieldName);

  uploader(req, res, (err) => {
    if (err) {
      // Ignore this specific harmless late error (parsing already done)
      if (err.message === "Unexpected end of form") {
        console.log("[MULTER SAFE] Ignored late 'Unexpected end of form' — data parsed OK");
        return next(); // continue normally
      }
      // Real error → pass it on
      return next(err);
    }
    next();
  });
};

router.post(
  "/cancel/:rideId",
  protect,
  safeSingleUpload("proofImage"),
  (req, res, next) => {
    console.log("MULTER PASSED → file:", !!req.file);
    console.log("body keys:", Object.keys(req.body));
    next();
  },
  bookingController.submitCancellation
);

// Passenger routes
router.post("/", protect, bookingController.createBooking);
router.get("/my", protect, bookingController.getMyBookings);
router.put("/:id/status", protect, bookingController.updateBookingStatus);
router.get("/:id", protect, bookingController.getBookingById);
router.put("/cancel", protect, bookingController.cancelBooking);

// Admin route
router.get("/", protect, bookingController.getAllBookings);

module.exports = router;