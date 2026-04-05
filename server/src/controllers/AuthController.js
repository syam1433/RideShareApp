const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOTP, verifyOTP } = require("../services/otpService");

// ================= REGISTER =================

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads folder if not exists
const uploadDir = path.join(__dirname, "../uploads/documents");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG, PNG, and PDF files are allowed"));
  },
});

// Register controller with multer middleware
exports.register = [
  // Handle file uploads (only for RC and Insurance)
  upload.fields([
    { name: "vehicleRC", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
  ]),

  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        password,
        role,
        vehicleType,
        vehicleNumber,
        vehicleModel,
      } = req.body;

      // Validation
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      if (role === "driver" && (!vehicleNumber || !vehicleModel)) {
        return res.status(400).json({
          message: "Vehicle number and model required for drivers",
        });
      }

      // Check if email exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Prepare user data
      const userData = {
        name,
        email,
        phone: phone || undefined,
        password: hashedPassword,
        role,
        ...(role === "driver" && {
          vehicleType: vehicleType || "Bike",
          vehicleNumber,
          vehicleModel,
        }),
      };

      // Add uploaded file paths (only if driver)
      if (role === "driver") {
        if (req.files && req.files["vehicleRC"]) {
          userData.vehicleRC = `/uploads/documents/${req.files["vehicleRC"][0].filename}`;
        }
        if (req.files && req.files["insurance"]) {
          userData.insurance = `/uploads/documents/${req.files["insurance"][0].filename}`;
        }
      }

      // Create and save user
      user = new User(userData);
      await user.save();

      // Generate JWT
      const payload = {
        id: user._id,
        role: user.role,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      // Send success response
      res.status(201).json({
        token,
        role: user.role,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          rating: user.rating,
          totalReviews: user.totalReviews,
          overloadViolations: user.overloadViolations,
          canCreateRide: user.canCreateRide,
          isBlacklisted: user.isBlacklisted,
          blacklistReason: user.blacklistReason,
          blacklistedAt: user.blacklistedAt,
          ...(role === "driver" && {
            vehicleType: user.vehicleType,
            vehicleNumber: user.vehicleNumber,
            vehicleModel: user.vehicleModel,
            vehicleRC: user.vehicleRC,
            insurance: user.insurance,
          }),
        },
      });
    } catch (err) {
      console.error("Registration error:", err);
      
      // Handle MongoDB duplicate key error
      if (err.code === 11000) {
        if (err.keyPattern && err.keyPattern.phone) {
          return res.status(400).json({ message: "Phone number already registered. Please use a different phone number." });
        }
        if (err.keyPattern && err.keyPattern.email) {
          return res.status(400).json({ message: "Email already registered. Please use a different email." });
        }
        return res.status(400).json({ message: "Duplicate registration data. Please check your information." });
      }
      
      if (err.message.includes("Only JPEG, PNG, and PDF")) {
        return res.status(400).json({ message: err.message });
      }
      
      res.status(500).json({ message: "Server error during registration" });
    }
  },
];

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = {
      id: user._id,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      role: user.role,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        rating: user.rating,
        totalReviews: user.totalReviews,
        overloadViolations: user.overloadViolations,
        canCreateRide: user.canCreateRide,
        isBlacklisted: user.isBlacklisted,
        blacklistReason: user.blacklistReason,
        blacklistedAt: user.blacklistedAt,
        // add vehicle fields if driver
        ...(user.role === "driver" && {
          vehicleType: user.vehicleType,
          vehicleNumber: user.vehicleNumber,
          vehicleModel: user.vehicleModel,
        }),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= SEND OTP =================
exports.sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    sendOTP(phone);

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    next(error);
  }
};

// ================= VERIFY OTP =================
exports.verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    const isValid = verifyOTP(phone, otp);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({ phone });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};