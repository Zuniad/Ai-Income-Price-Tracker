const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { requirePro, aiRateLimit } = require("../middleware/proMiddleware");
const {
  chat,
  generateAndSaveInsight,
  getInsights,
  getFinancialSummary,
  proAdvancedAnalytics,
  proPredictExpenses,
  proBudgetAdvice,
} = require("../controllers/aiController");

// Public route — no auth needed
router.post("/chat", chat);

// Protected routes — require JWT
router.use(protect);
router.post("/generate", aiRateLimit, generateAndSaveInsight);
router.get("/insights", getInsights);
router.get("/summary", getFinancialSummary);

// ── Pro-only routes ──────────────────────────────────────────────────
router.get("/pro/analytics", requirePro, proAdvancedAnalytics);
router.post("/pro/predict", requirePro, proPredictExpenses);
router.post("/pro/budget-advice", requirePro, proBudgetAdvice);

module.exports = router;
