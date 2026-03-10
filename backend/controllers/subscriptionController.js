const User = require("../models/User");
const Subscription = require("../models/Subscription");
const OTP = require("../models/OTP");
const { PLAN_LIMITS } = require("../middleware/proMiddleware");
const { generateOTP, sendOTPEmail, sendActivationSuccessEmail } = require("../services/emailService");

/**
 * @desc   Get current user's plan info
 * @route  GET /api/subscriptions/status
 */
const getPlanStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;

    // Check if expired
    let isExpired = false;
    if (user.plan === "pro" && user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
      isExpired = true;
    }

    const activeSubscription = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
    }).sort({ endDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        plan: user.plan,
        isExpired,
        expiresAt: user.planExpiresAt,
        aiUsage: {
          usedToday: user.aiRequestsToday,
          dailyLimit: limits.aiRequestsPerDay === Infinity ? "unlimited" : limits.aiRequestsPerDay,
        },
        features: limits,
        subscription: activeSubscription || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Step 1: Initiate Pro activation — validate card, send OTP to email
 * @route  POST /api/subscriptions/activate
 */
const activatePro = async (req, res) => {
  try {
    const { duration, cardNumber, phoneNumber, email } = req.body;

    // ── Validation ──────────────────────────────────────────────────
    if (!duration || !["monthly", "yearly"].includes(duration)) {
      return res.status(400).json({
        success: false,
        message: 'duration is required: "monthly" or "yearly"',
      });
    }

    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 13) {
      return res.status(400).json({
        success: false,
        message: "A valid card number is required (minimum 13 digits)",
      });
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({
        success: false,
        message: "A valid phone number is required (minimum 10 digits)",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required to receive OTP",
      });
    }

    const pricing = { monthly: 9.99, yearly: 99.99 };

    // ── Delete any existing unused OTPs for this user ───────────────
    await OTP.deleteMany({ userId: req.user._id, isVerified: false });

    // ── Generate and save OTP ───────────────────────────────────────
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.create({
      userId: req.user._id,
      email,
      otp,
      purpose: "pro_activation",
      paymentDetails: {
        cardNumber: cardNumber.replace(/\s/g, ""),
        phoneNumber,
        duration,
        amount: pricing[duration],
      },
      expiresAt,
    });

    // ── Send OTP email ──────────────────────────────────────────────
    const user = await User.findById(req.user._id);
    await sendOTPEmail(email, otp, user.name, {
      cardNumber: cardNumber.replace(/\s/g, ""),
      phoneNumber,
      duration,
      amount: pricing[duration],
    });

    const maskedCard = "**** **** **** " + cardNumber.replace(/\s/g, "").slice(-4);

    res.status(200).json({
      success: true,
      message: `OTP sent to ${email}. Please verify to activate Pro plan.`,
      data: {
        email,
        maskedCard,
        phoneNumber,
        duration,
        amount: pricing[duration],
        otpExpiresIn: "10 minutes",
        nextStep: "POST /api/subscriptions/verify-otp with { otp: '123456' }",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};









/**
 * @desc   Step 2: Verify OTP and activate Pro plan
 * @route  POST /api/subscriptions/verify-otp
 */
const verifyOTPAndActivate = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required" });
    }

    // ── Find matching OTP ───────────────────────────────────────────
    const otpRecord = await OTP.findOne({
      userId: req.user._id,
      otp,
      isVerified: false,
      purpose: "pro_activation",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // ── Mark OTP as verified ────────────────────────────────────────
    otpRecord.isVerified = true;
    await otpRecord.save();

    // ── Activate Pro plan ───────────────────────────────────────────
    const { duration, amount, cardNumber, phoneNumber } = otpRecord.paymentDetails;
    const durationDays = { monthly: 30, yearly: 365 };

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays[duration]);

    const subscription = await Subscription.create({
      userId: req.user._id,
      plan: "pro",
      status: "active",
      startDate,
      endDate,
      amount,
      currency: req.user.currency || "USD",
      paymentMethod: "card",
      transactionId: `TXN_${Date.now()}`,
    });

    // ── Upgrade user ────────────────────────────────────────────────
    await User.findByIdAndUpdate(req.user._id, {
      plan: "pro",
      planExpiresAt: endDate,
    });

    // ── Send activation success email ───────────────────────────────
    const user = await User.findById(req.user._id);
    try {
      await sendActivationSuccessEmail(otpRecord.email, user.name, {
        duration: duration === "yearly" ? "Yearly Pro" : "Monthly Pro",
        amount,
        expiresAt: endDate.toDateString(),
      });
    } catch (emailErr) {
      console.error("Success email failed (non-blocking):", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: `🎉 Pro plan activated for ${duration} (${durationDays[duration]} days)!`,
      data: {
        subscription,
        maskedCard: "**** **** **** " + cardNumber.slice(-4),
        features: PLAN_LIMITS.pro,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Resend OTP if expired or not received
 * @route  POST /api/subscriptions/resend-otp
 */
const resendOTP = async (req, res) => {
  try {
    // Find the latest unverified OTP record for this user
    const lastOTP = await OTP.findOne({
      userId: req.user._id,
      isVerified: false,
      purpose: "pro_activation",
    }).sort({ createdAt: -1 });

    if (!lastOTP) {
      return res.status(400).json({
        success: false,
        message: "No pending activation found. Please start the activation process again.",
      });
    }

    // Delete old OTP and create a new one
    await OTP.deleteMany({ userId: req.user._id, isVerified: false });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.create({
      userId: req.user._id,
      email: lastOTP.email,
      otp,
      purpose: "pro_activation",
      paymentDetails: lastOTP.paymentDetails,
      expiresAt,
    });

    const user = await User.findById(req.user._id);
    await sendOTPEmail(lastOTP.email, otp, user.name, lastOTP.paymentDetails);

    res.status(200).json({
      success: true,
      message: `New OTP sent to ${lastOTP.email}`,
      data: { email: lastOTP.email, otpExpiresIn: "10 minutes" },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Cancel Pro subscription
 * @route  POST /api/subscriptions/cancel
 */
const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { userId: req.user._id, status: "active" },
      { status: "cancelled" },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ success: false, message: "No active subscription found" });
    }

    // Downgrade user — they keep Pro until planExpiresAt
    // (plan stays "pro" until expiry check in middleware)

    res.status(200).json({
      success: true,
      message: `Subscription cancelled. Pro features remain active until ${subscription.endDate.toDateString()}.`,
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Get subscription history
 * @route  GET /api/subscriptions/history
 */
const getSubscriptionHistory = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: subscriptions.length, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Compare Free vs Pro plans
 * @route  GET /api/subscriptions/plans (public)
 */
const getPlans = async (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      free: {
        price: 0,
        features: {
          aiRequestsPerDay: 5,
          insightHistory: "Last 10 insights",
          exportData: false,
          advancedAnalytics: false,
          categoryPredictions: false,
          budgetAlerts: false,
          chat: true,
          incomeTracking: true,
          expenseTracking: true,
          savingsGoals: true,
          loanTracking: true,
        },
      },
      pro: {
        monthly: { price: 9.99, currency: "USD" },
        yearly: { price: 99.99, currency: "USD", savings: "17%" },
        features: {
          aiRequestsPerDay: "Unlimited",
          insightHistory: "Unlimited history",
          exportData: true,
          advancedAnalytics: true,
          categoryPredictions: true,
          budgetAlerts: true,
          chat: true,
          incomeTracking: true,
          expenseTracking: true,
          savingsGoals: true,
          loanTracking: true,
          prioritySupport: true,
        },
      },
    },
  });
};

/**
 * @desc   Phone Payment — enter phone, get OTP via response (toast)
 * @route  POST /api/subscriptions/activate-phone
 */
const activateViaPhone = async (req, res) => {
  try {
    const { duration, phoneNumber } = req.body;

    if (!duration || !["monthly", "yearly"].includes(duration)) {
      return res.status(400).json({
        success: false,
        message: 'duration is required: "monthly" or "yearly"',
      });
    }

    if (!phoneNumber || phoneNumber.replace(/[\s\-+]/g, "").length < 10) {
      return res.status(400).json({
        success: false,
        message: "A valid phone number is required (minimum 10 digits)",
      });
    }

    const pricing = { monthly: 9.99, yearly: 99.99 };

    await OTP.deleteMany({ userId: req.user._id, isVerified: false });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    const user = await User.findById(req.user._id);

    await OTP.create({
      userId: req.user._id,
      email: user.email,
      otp,
      purpose: "pro_activation",
      paymentDetails: {
        phoneNumber: phoneNumber.replace(/[\s\-]/g, ""),
        duration,
        amount: pricing[duration],
      },
      expiresAt,
    });

    res.status(200).json({
      success: true,
      message: `OTP sent to ${phoneNumber}`,
      data: {
        otp,
        phoneNumber,
        duration,
        amount: pricing[duration],
        otpExpiresIn: "2 minutes",
        paymentMethod: "phone",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPlanStatus,
  activatePro,
  activateViaPhone,
  verifyOTPAndActivate,
  resendOTP,
  cancelSubscription,
  getSubscriptionHistory,
  getPlans,
};

