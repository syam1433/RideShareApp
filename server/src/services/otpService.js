const { generateOTP } = require("../utils/generateOTP");

let otpStore = new Map(); // In production use Redis

exports.sendOTP = (phone) => {
  const otp = generateOTP();

  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  console.log(`OTP for ${phone}: ${otp}`);
  return true;
};

exports.verifyOTP = (phone, otp) => {
  const record = otpStore.get(phone);

  if (!record) return false;
  if (record.expiresAt < Date.now()) return false;
  if (record.otp !== otp) return false;

  otpStore.delete(phone);
  return true;
};