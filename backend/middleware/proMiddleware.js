const User = require("../models/User");

// ── Plan limits ──────────────────────────────────────────────────────
const PLAN_LIMITS = {
  free: {
    aiRequestsPerDay: 5,
    insightHistory: 10,       // max stored insights
    exportData: false,
    advancedAnalytics: false,
    categoryPredictions: false,
    budgetAlerts: false,
  },
  pro: {
    aiRequestsPerDay: Infinity,
    insightHistory: Infinity,
    exportData: true,
    advancedAnalytics: true,
    categoryPredictions: true,
    budgetAlerts: true,
  },
};

/**
 * Middleware: Require Pro plan to access a route.
 * Checks if user plan is "pro" and subscription hasn't expired.
 */
const requirePro = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.plan !== "pro") {
      return res.status(403).json({
        success: false,
        message: "This feature requires a Pro subscription",
        upgrade: {
          url: "/api/subscriptions/activate",
          plans: { monthly: 9.99, yearly: 99.99 },
        },
      });
    }

    // Check if plan has expired
    if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
      user.plan = "free";
      user.planExpiresAt = null;
      await user.save();

      return res.status(403).json({
        success: false,
        message: "Your Pro subscription has expired. Please renew.",
        upgrade: {
          url: "/api/subscriptions/activate",
          plans: { monthly: 9.99, yearly: 99.99 },
        },
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Middleware: Rate-limit AI requests based on plan.
 * Free users get 5/day, Pro users get unlimited.
 */
const aiRateLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;

    // Reset counter if it's a new day
    const now = new Date();
    const resetAt = new Date(user.aiRequestsResetAt);
    if (now.toDateString() !== resetAt.toDateString()) {
      user.aiRequestsToday = 0;
      user.aiRequestsResetAt = now;
    }

    if (user.aiRequestsToday >= limits.aiRequestsPerDay) {
      return res.status(429).json({
        success: false,
        message: `Free plan limit: ${limits.aiRequestsPerDay} AI requests per day. Upgrade to Pro for unlimited access.`,
        usage: {
          used: user.aiRequestsToday,
          limit: limits.aiRequestsPerDay,
          resetsAt: new Date(now.setHours(24, 0, 0, 0)),
        },
        upgrade: {
          url: "/api/subscriptions/activate",
          plans: { monthly: 9.99, yearly: 99.99 },
        },
      });
    }

    // Increment counter
    user.aiRequestsToday += 1;
    await user.save();

    // Attach limits to req for controllers to use
    req.planLimits = limits;
    req.aiUsage = { used: user.aiRequestsToday, limit: limits.aiRequestsPerDay };

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { requirePro, aiRateLimit, PLAN_LIMITS };
