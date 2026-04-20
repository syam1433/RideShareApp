const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateAccessToken, generateRefreshToken } = require("../services/tokenService");
const otpService = require("../services/otpService");

const buildAuthResponse = (user) => ({
  token: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
  role: user.role,
  user: {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    vehicleType: user.vehicleType,
    vehicleNumber: user.vehicleNumber,
    vehicleModel: user.vehicleModel,
    avatar: user.avatar,
    isBlacklisted: user.isBlacklisted,
    canCreateRide: user.canCreateRide,
  },
});

exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, vehicleType, vehicleNumber, vehicleModel } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      password: hashedPassword,
      role: role === "driver" ? "driver" : "user",
      vehicleType: vehicleType || "Bike",
      vehicleNumber: vehicleNumber || undefined,
      vehicleModel: vehicleModel || undefined,
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

exports.sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    otpService.sendOTP(phone);
    return res.json({ success: true, message: "OTP sent" });
  } catch (error) {
    return next(error);
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    const isValid = otpService.verifyOTP(phone, otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    return res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    return next(error);
  }
};const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateAccessToken, generateRefreshToken } = require("../services/tokenService");
const otpService = require("../services/otpService");

const buildAuthResponse = (user) => ({
  token: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
  role: user.role,
  user: {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    vehicleType: user.vehicleType,
    vehicleNumber: user.vehicleNumber,
    vehicleModel: user.vehicleModel,
    avatar: user.avatar,
    isBlacklisted: user.isBlacklisted,
    canCreateRide: user.canCreateRide,
  },
});

exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, vehicleType, vehicleNumber, vehicleModel } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      password: hashedPassword,
      role: role === "driver" ? "driver" : "user",
      vehicleType: vehicleType || "Bike",
      vehicleNumber: vehicleNumber || undefined,
      vehicleModel: vehicleModel || undefined,
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

exports.sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    otpService.sendOTP(phone);
    return res.json({ success: true, message: "OTP sent" });
  } catch (error) {
    return next(error);
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    const isValid = otpService.verifyOTP(phone, otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    return res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    return next(error);
  }
};
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateAccessToken, generateRefreshToken } = require("../services/tokenService");
const otpService = require("../services/otpService");

const buildAuthResponse = (user) => ({
  token: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
  role: user.role,
  user: {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    vehicleType: user.vehicleType,
    vehicleNumber: user.vehicleNumber,
    vehicleModel: user.vehicleModel,
    avatar: user.avatar,
    isBlacklisted: user.isBlacklisted,
    canCreateRide: user.canCreateRide,
  },
});

exports.register = async (req, res, next) => {
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

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      password: hashedPassword,
      role: role === "driver" ? "driver" : "user",
      vehicleType: vehicleType || "Bike",
      vehicleNumber: vehicleNumber || undefined,
      vehicleModel: vehicleModel || undefined,
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

exports.sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    otpService.sendOTP(phone);
    return res.json({ success: true, message: "OTP sent" });
  } catch (error) {
    return next(error);
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    const isValid = otpService.verifyOTP(phone, otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    return res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    return next(error);
  }
};const User = require("../models/User");
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
    };