const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllerClean");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);

module.exports = router;