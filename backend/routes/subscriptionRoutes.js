const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getPlanStatus,
  activatePro,
  verifyOTPAndActivate,
  resendOTP,
  cancelSubscription,
  getSubscriptionHistory,
  getPlans,
} = require("../controllers/subscriptionController");

// Public — view available plans
router.get("/plans", getPlans);

// Protected — require login
router.use(protect);

router.get("/status", getPlanStatus);
router.post("/activate", activatePro);           // Step 1: enter card + send OTP
router.post("/verify-otp", verifyOTPAndActivate); // Step 2: verify OTP + activate
router.post("/resend-otp", resendOTP);            // Resend OTP if expired
router.post("/cancel", cancelSubscription);
router.get("/history", getSubscriptionHistory);

module.exports = router;
