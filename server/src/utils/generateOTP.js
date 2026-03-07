const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

// Placeholder - replace with real SMS (Twilio, MSG91, Fast2SMS, etc.)
const sendOTP = async (phone, otp, rideInfo = "") => {
  console.log(`[SMS] To ${phone}: Your ride OTP is ${otp}. ${rideInfo}`);
  // In production:
  // await twilio.messages.create({ to: phone, from: '...', body: `Your OTP: ${otp}` });
  return true;
};

module.exports = { generateOTP, sendOTP };