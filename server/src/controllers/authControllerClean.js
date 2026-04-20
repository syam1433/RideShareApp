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
};