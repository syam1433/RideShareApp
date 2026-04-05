const Booking = require("../models/Booking");
const Ride = require("../models/Ride");
const User = require("../models/User");
const SafetyRecord = require("../models/SafetyRecord");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs/promises");
const multer = require("multer");

// Socket.io instance (will be set from server.js)
let io = null;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Multer setup – temporary upload
const fsSync = require("fs");
const uploadDir = path.join(__dirname, "../../python/Rideshare_Overloading_Detection/uploads");

if (!fsSync.existsSync(uploadDir)) {
  fsSync.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });
const OVERLOAD_BLACKLIST_THRESHOLD = 2;

const blacklistDriverIfNeeded = async (driverId, rideId, reason) => {
  const resolvedDriverId = driverId?._id || driverId;
  if (!resolvedDriverId) return null;

  const safetyRecord = await SafetyRecord.findOneAndUpdate(
    { driver: resolvedDriverId },
    {
      $inc: { overloadViolations: 1 },
      $set: {
        lastChecked: new Date(),
        aiStatus: "failed",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const driver = await User.findById(resolvedDriverId);
  if (!driver) return { safetyRecord, blacklisted: false };

  const overloadViolations = Number(safetyRecord?.overloadViolations || driver.overloadViolations || 0);
  const blacklisted = overloadViolations >= OVERLOAD_BLACKLIST_THRESHOLD;

  if (blacklisted) {
    driver.isBlacklisted = true;
    driver.canCreateRide = false;
    driver.blacklistedAt = driver.blacklistedAt || new Date();
    driver.blacklistReason =
      reason || "Repeated overloading cancellations detected";
  }

  driver.overloadViolations = overloadViolations;
  await driver.save();

  if (io) {
    io.to(`user_${resolvedDriverId}`).emit("driver_blacklist_updated", {
      rideId,
      overloadViolations,
      blacklisted,
      blacklistReason: driver.blacklistReason,
    });
  }

  return { safetyRecord, blacklisted, overloadViolations, driver };
};

/**
 * Handle Normal Cancellation Logic
 */
const handleNormalCancellation = async (ride, booking, passengerId, reason, customReason) => {
  try {
    const resolvedDriverId = ride.driver?._id || ride.driver;

    // Update booking status
    booking.status = "cancelled";
    booking.cancelReason = reason || customReason;
    booking.cancelledAt = new Date();
    await booking.save();

    // Restore seats in ride
    ride.passengers = ride.passengers.filter(p => p.toString() !== passengerId.toString());
    ride.seatsAvailable += booking.seatsBooked;
    await ride.save();

    // Notify driver via socket
    if (io && resolvedDriverId) {
      io.to(`user_${resolvedDriverId}`).emit('booking_cancelled', {
        rideId: ride._id,
        passengerId,
        reason: reason || customReason,
        seatsRestored: booking.seatsBooked
      });
    }

    console.log(`[CANCELLATION] Passenger ${passengerId} cancelled booking for ride ${ride._id}`);
  } catch (error) {
    console.error('[CANCELLATION ERROR]', error);
    throw error;
  }
};

/**
 * Cancel Ride by Driver
 */
const cancelRideByDriver = async (rideId, driverId, reason) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride || ride.driver.toString() !== driverId.toString()) {
      throw new Error('Ride not found or unauthorized');
    }

    // Update ride status
    ride.status = 'cancelled';
    ride.cancelReason = reason;
    ride.cancelledAt = new Date();
    await ride.save();

    // Cancel all bookings for this ride
    const bookings = await Booking.find({ ride: rideId, status: { $in: ['pending', 'confirmed'] } });
    const cancelledBookings = [];

    for (const booking of bookings) {
      booking.status = 'cancelled';
      booking.cancelReason = `Ride cancelled by driver: ${reason}`;
      booking.cancelledAt = new Date();
      await booking.save();
      cancelledBookings.push(booking);

      // Notify passenger via socket
      if (io) {
        io.to(`user_${booking.passenger}`).emit('ride_cancelled', {
          rideId: ride._id,
          driverId,
          reason,
          bookingId: booking._id
        });
      }
    }

    console.log(`[DRIVER CANCELLATION] Ride ${rideId} cancelled by driver ${driverId}. ${cancelledBookings.length} bookings cancelled.`);

    return { ride, cancelledBookings };
  } catch (error) {
    console.error('[DRIVER CANCELLATION ERROR]', error);
    throw error;
  }
};

// Submit Cancellation with Overloading Detection
exports.submitCancellation = async (req, res) => {
    console.log("=== CANCEL REQUEST START ===");
    console.log("User ID:", req.user?.id);
    console.log("Ride ID:", req.params.rideId);
    console.log("Body:", req.body);
    console.log("File:", req.file ? {
      name: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    } : "NO FILE UPLOADED");

    console.log("Content-Type received:", req.headers['content-type']);

    try {
      const { rideId, reason, customReason, actualMembersCount, overloadedCount } = req.body;
      const passengerId = req.user.id;

      // 1. Find ride
      const ride = await Ride.findById(rideId);
      if (!ride) {
        console.log("[ERROR] Ride not found:", rideId);
        return res.status(404).json({ success: false, message: "Ride not found" });
      }

      // Populate driver safely (don't crash on invalid driver ID)
      let driver = null;
      try {
        await ride.populate("driver");
        driver = ride.driver;
        console.log("[POPULATE] Driver:", driver ? driver._id : "MISSING");
      } catch (popErr) {
        console.warn("[WARN] Driver populate failed:", popErr.message);
      }

      // 2. Find booking
      const booking = await Booking.findOne({ ride: rideId, passenger: passengerId });
      if (!booking) {
        console.log("[ERROR] Booking not found for passenger:", passengerId);
        return res.status(404).json({ success: false, message: "No active booking found" });
      }

      const isOverloadReason = String(reason || "").toLowerCase() === "overloading";

      let modelResult = {
        status: "SKIPPED",
        detected: 0,
        seatsOffered: Math.max(Number(ride.seatCapacity || 0), Number(ride.seatsAvailable || 0), 1),
        message: "Overloading check skipped (no photo or not selected)"
      };

      // 3. Overloading detection
      if (reason === "Overloading" && req.file) {
        const imagePath = req.file.path;
        const activeBookings = await Booking.find({
          ride: rideId,
          status: { $in: ["pending", "confirmed", "completed"] }
        }).select("seatsBooked");

        const bookedSeats = activeBookings.reduce(
          (sum, bookingDoc) => sum + Number(bookingDoc.seatsBooked || 1),
          0
        );

        const seatsOffered = Math.max(
          Number(ride.seatCapacity || 0),
          Number(ride.seatsAvailable || 0) + bookedSeats,
          1
        );

        const pythonScriptPath = path.join(__dirname, "../../python/Rideshare_Overloading_Detection/main.py");

        // Check script exists
        try {
          await fs.access(pythonScriptPath);
          console.log("[PYTHON] Script found:", pythonScriptPath);
        } catch (scriptErr) {
          console.error("[CRASH] Python script missing:", pythonScriptPath);
          return res.status(500).json({ success: false, message: "Overloading model script missing" });
        }

        console.log("[MODEL] Running Python:", pythonScriptPath, imagePath, seatsOffered);

        const pythonBin = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3");
        const pythonProcess = spawn(pythonBin, [pythonScriptPath, imagePath, seatsOffered.toString()]);

        let fullOutput = "";
        let fullError = "";

        pythonProcess.stdout.on("data", (chunk) => {
          fullOutput += chunk.toString();
          console.log("[PYTHON STDOUT]", chunk.toString().trim());
        });

        pythonProcess.stderr.on("data", (chunk) => {
          fullError += chunk.toString();
          console.error("[PYTHON STDERR]", chunk.toString().trim());
        });

        pythonProcess.on("error", (err) => {
          console.error("[SPAWN CRASH]", err.message);
          // Don't return error here, let it fall through to timeout handling
        });

        // Timeout protection (30s)
        const timeout = setTimeout(() => {
          pythonProcess.kill();
          console.error("[TIMEOUT] Python killed after 30s");
        }, 30000);

        await new Promise((resolve) => {
          pythonProcess.on("close", (code) => {
            clearTimeout(timeout);
            console.log("[PYTHON] Exited with code:", code);
            console.log("[FULL PYTHON OUTPUT START]\n" + fullOutput + "\n[FULL PYTHON OUTPUT END]");
            console.log("[FULL PYTHON ERROR START]\n" + fullError + "\n[FULL PYTHON ERROR END]");

            resolve();
          });
        });

        // Clean up
        try {
          await fs.unlink(imagePath);
          console.log("[CLEANUP] Temp file deleted:", imagePath);
        } catch (cleanupErr) {
          console.log("[CLEANUP] Failed:", cleanupErr.message);
        }

        // Parse output - be more lenient with parsing
        let status = "ERROR";
        let detected = 0;

        try {
          const statusMatch = fullOutput.match(/Final Status:\s*(\w+)/i);
          const detectedMatch =
            fullOutput.match(/Total Persons Detected:\s*(\d+)/i) ||
            fullOutput.match(/Persons Detected:\s*(\d+)/i);

          status = statusMatch ? statusMatch[1].trim().toUpperCase() : "ERROR";
          detected = detectedMatch ? parseInt(detectedMatch[1], 10) : 0;
        } catch (parseErr) {
          console.error("[PARSE ERROR]", parseErr.message);
          status = "ERROR";
          detected = 0;
        }

        const reportedActualCount = Number(actualMembersCount || 0);
        const reportedOverloadedCount = Number(overloadedCount || 0);
        const reportedOverloaded = reportedActualCount > seatsOffered || reportedOverloadedCount > 0;

        // If model is uncertain but user-reported values clearly indicate overloading, escalate to borderline review.
        if ((status === "NORMAL" || status === "ERROR") && reportedOverloaded) {
          status = "BORDERLINE";
        }

        modelResult = {
          status,
          detected,
          seatsOffered,
          message: status === "OVERLOADED"
            ? `OVERLOADED! ${detected} persons detected (offered ${seatsOffered} seats)`
            : status === "BORDERLINE"
            ? `BORDERLINE! ${detected} persons detected (${reportedActualCount || "N/A"} reported) - flagged for manual review`
            : status === "ERROR"
            ? "Model analysis failed - proceeding with manual review"
            : `No overload (${detected} persons detected)`
        };

        console.log("[PARSED MODEL RESULT]", modelResult);

        // Handle different statuses
        if (status === "OVERLOADED") {
          console.log("[ACTION] OVERLOADED → penalizing driver & cancelling ride");

          // Safe driver penalization
          if (driver) {
            driver.rating = Math.max(1.0, Number(driver.rating || 5.0) - 0.5);
            await driver.save();
            console.log(`[DRIVER] Rating reduced to ${driver.rating} for ${driver._id}`);
          } else {
            console.warn("[WARN] No driver to penalize for ride", rideId);
          }

          if (isOverloadReason) {
            await blacklistDriverIfNeeded(ride.driver, rideId, modelResult.message);
          }

          ride.status = "cancelled";
          ride.cancelReason = modelResult.message;
          await ride.save();
          console.log("[RIDE] Cancelled due to overloading");

          await Booking.updateMany({ ride: rideId }, { status: "cancelled" });
          console.log("[BOOKINGS] All cancelled for ride", rideId);

          return res.json({
            success: true,
            overloaded: true,
            message: modelResult.message + " – Ride cancelled" + (driver ? ". Driver rating reduced." : " (no driver to penalize)."),
            modelResult
          });
        } else if (status === "BORDERLINE") {
          console.log("[ACTION] BORDERLINE → flag for manual review, allow cancellation");

          // Still allow cancellation but with a warning for manual review
          await handleNormalCancellation(ride, booking, passengerId, reason, "Borderline overloading detected - " + (customReason || "Manual review required"));

          if (isOverloadReason) {
            await blacklistDriverIfNeeded(ride.driver, rideId, "Borderline overloading detected");
          }

          return res.json({
            success: true,
            overloaded: false,
            message: "Booking cancelled. Borderline overloading detected - manual review required.",
            modelResult,
            warning: "Borderline case detected. This incident will be reviewed manually by our safety team."
          });
        } else if (status === "ERROR") {
          console.log("[ACTION] Model failed → normal cancellation with warning");

          // Still allow cancellation but with a warning
          await handleNormalCancellation(ride, booking, passengerId, reason, "Model analysis failed - " + (customReason || "Overloading reported"));

          if (isOverloadReason) {
            await blacklistDriverIfNeeded(ride.driver, rideId, "Overloading cancellation reported");
          }

          return res.json({
            success: true,
            overloaded: false,
            message: "Booking cancelled. Model analysis failed - manual review required.",
            modelResult,
            warning: "Overloading detection model failed. Please contact support for manual review."
          });
        }
      }

      // Normal cancellation
      console.log("[ACTION] Normal cancellation");
      await handleNormalCancellation(ride, booking, passengerId, reason, customReason);

      if (isOverloadReason) {
        await blacklistDriverIfNeeded(ride.driver, rideId, "Overloading cancellation reported");
      }

      return res.json({
        success: true,
        overloaded: false,
        message: modelResult.message || "Booking cancelled successfully (no overload detected)",
        modelResult
      });
    } catch (err) {
      console.error("[FATAL CRASH] submitCancellation:", {
        message: err.message,
        stack: err.stack,
        rideId: req.params.rideId,
        reason: req.body.reason,
        hasFile: !!req.file,
        body: req.body
      });

      return res.status(500).json({
        success: false,
        message: "Server error during cancellation – please try again",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
      });
    }
  };

/**
 * Create Booking
 * Passenger books seats in a ride
 */
exports.createBooking = async (req, res, next) => {
  try {
    const { rideId, seatsBooked } = req.body;

    if (!rideId || !seatsBooked) {
      return res.status(400).json({ message: "Ride ID and seats required" });
    }

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.status !== "upcoming") {
      return res.status(400).json({ message: "Ride not available for booking" });
    }

    if (ride.seatsAvailable < seatsBooked) {
      return res.status(400).json({ message: "Not enough seats available" });
    }

    // Add passenger and reduce available seats
    if (!ride.passengers.includes(req.user.id)) {
      ride.passengers.push(req.user.id);
    }
    ride.seatsAvailable -= seatsBooked;
    await ride.save();

    const booking = await Booking.create({
      ride: ride._id,
      passenger: req.user.id,
      seatsBooked,
      status: "confirmed",
      paymentStatus: "unpaid",
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get My Bookings
 * Logged-in user bookings
 */
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ passenger: req.user.id })
      .populate({
        path: "ride",  // populate the ride field
        populate: {
          path: "driver",  // nested populate: get driver details inside ride
          select: "name avatar rating vehicleType vehicleNumber vehicleModel"  // only needed fields
        }
      })
      .sort({ createdAt: -1 });  // newest first

    res.json({ bookings });  // or res.json(bookings) — both fine
  } catch (error) {
    console.error("Get my bookings error:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

/**
 * Update Booking Status
 * (cancel / completed)
 */
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = status;
    await booking.save();

    res.json({
      success: true,
      message: "Booking status updated",
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get All Bookings
 */
exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate("ride")
      .populate("passenger", "name email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("ride")
      .populate("passenger", "name phone");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Optional: check ownership
    if (booking.passenger.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { rideId, reason, customReason } = req.body;

    if (!rideId) {
      return res.status(400).json({ message: "Ride ID is required" });
    }

    const booking = await Booking.findOne({
      ride: rideId,
      passenger: req.user.id,
      status: { $in: ["pending", "confirmed"] }
    });

    if (!booking) {
      return res.status(404).json({ message: "No active booking found" });
    }

    // Get ride details
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Use the improved cancellation logic
    await handleNormalCancellation(ride, booking, req.user.id, reason, customReason);

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking: {
        id: booking._id,
        status: booking.status,
        cancelledAt: booking.cancelledAt
      }
    });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ message: "Server error during cancellation" });
  }
};

/**
 * Cancel Ride (Driver Only)
 */
exports.cancelRide = async (req, res) => {
  try {
    const { rideId, reason } = req.body;

    if (!rideId || !reason) {
      return res.status(400).json({ message: "Ride ID and cancellation reason are required" });
    }

    const result = await cancelRideByDriver(rideId, req.user.id, reason);

    res.json({
      success: true,
      message: `Ride cancelled successfully. ${result.cancelledBookings.length} passenger bookings cancelled.`,
      ride: {
        id: result.ride._id,
        status: result.ride.status,
        cancelledAt: result.ride.cancelledAt
      },
      cancelledBookings: result.cancelledBookings.length
    });
  } catch (err) {
    console.error("Cancel ride error:", err);
    if (err.message.includes('unauthorized')) {
      return res.status(403).json({ message: "Not authorized to cancel this ride" });
    }
    res.status(500).json({ message: "Server error during ride cancellation" });
  }
};

/**
 * Get Cancellation Reasons
 */
exports.getCancellationReasons = async (req, res) => {
  try {
    const reasons = [
      "Change of plans",
      "Found alternative transport",
      "Emergency situation",
      "Weather conditions",
      "Health issues",
      "Overloading",
      "Driver not responding",
      "Vehicle issues",
      "Schedule conflict",
      "Other"
    ];

    res.json({
      success: true,
      reasons
    });
  } catch (err) {
    console.error("Get cancellation reasons error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createBooking: exports.createBooking,
  getMyBookings: exports.getMyBookings,
  updateBookingStatus: exports.updateBookingStatus,
  getAllBookings: exports.getAllBookings,
  getBookingById: exports.getBookingById,
  cancelBooking: exports.cancelBooking,
  cancelRide: exports.cancelRide,
  getCancellationReasons: exports.getCancellationReasons,
  submitCancellation: exports.submitCancellation,
  setSocketIO
};