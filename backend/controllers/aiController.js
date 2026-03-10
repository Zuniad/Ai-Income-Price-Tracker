const Insight = require("../models/Insight");
const Transaction = require("../models/Transaction");
const { generateInsight } = require("../services/aiService");
const { monthlyFinancialSummary } = require("../utils/calculations");
const { GoogleGenAI } = require("@google/genai");

/**
 * @desc   Ask any question to Gemini AI
 * @route  POST /api/ai/chat
 */
const chat = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: "question is required" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: question,
    });

    res.status(200).json({ success: true, data: { question, answer: response.text } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Generate AI insight for a given month/year
 * @route  POST /api/ai/generate
 */
const generateAndSaveInsight = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "month and year are required" });
    }

    const result = await generateInsight(req.user._id, month, year);

    const insight = await Insight.create({
      userId: req.user._id,
      insightText: result.insightText,
      category: result.category,
      month,
      year,
    });

    res.status(201).json({ success: true, data: insight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Get insights for the authenticated user
 * @route  GET /api/ai/insights
 */
const getInsights = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.month) filter.month = Number(req.query.month);
    if (req.query.year) filter.year = Number(req.query.year);

    const insights = await Insight.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: insights.length, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Get financial summary for a month
 * @route  GET /api/ai/summary
 */
const getFinancialSummary = async (req, res) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "month and year query params are required" });
    }

    const summary = await monthlyFinancialSummary(req.user._id, month, year);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════
// PRO-ONLY FEATURES
// ══════════════════════════════════════════════════════════════════════

/**
 * @desc   [PRO] Advanced analytics — category breakdown + spending trends
 * @route  GET /api/ai/pro/analytics?month=&year=
 */
const proAdvancedAnalytics = async (req, res) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "month and year are required" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Category-wise breakdown
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: "expense",
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgTransaction: { $avg: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Daily spending pattern
    const dailySpending = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: "expense",
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$date" },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const summary = await monthlyFinancialSummary(req.user._id, month, year);

    // Top spending category
    const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

    res.status(200).json({
      success: true,
      data: {
        summary,
        categoryBreakdown,
        dailySpending,
        topSpendingCategory: topCategory
          ? { category: topCategory._id, amount: topCategory.total, percentage: ((topCategory.total / summary.expenses) * 100).toFixed(1) + "%" }
          : null,
        totalCategories: categoryBreakdown.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   [PRO] AI expense prediction for next month
 * @route  POST /api/ai/pro/predict
 */
const proPredictExpenses = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "month and year are required" });
    }

    // Gather last 3 months of data for context
    const months = [];
    for (let i = 0; i < 3; i++) {
      let m = month - i;
      let y = year;
      if (m <= 0) { m += 12; y -= 1; }
      const s = await monthlyFinancialSummary(req.user._id, m, y);
      months.push({ month: m, year: y, ...s });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are a financial advisor AI. Based on the user's last 3 months of financial data:
${months.map(m => `- ${m.month}/${m.year}: Income=${m.income}, Expenses=${m.expenses}, Savings=${m.savings}, Loans=${m.loans}, SavingsRate=${m.savingsRate}`).join("\n")}

Predict the user's likely expenses for next month. Provide:
1. Predicted total expenses
2. Category-wise predictions (food, rent, shopping, utilities, transport, entertainment)
3. Recommended budget for each category
4. Savings goal recommendation
5. Warning flags (overspending risks)

Respond in valid JSON format only: { "predictedExpenses": number, "categories": [...], "savingsGoal": number, "warnings": [...], "advice": "..." }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    let prediction;
    try {
      const cleaned = response.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      prediction = JSON.parse(cleaned);
    } catch {
      prediction = { raw: response.text };
    }

    res.status(200).json({
      success: true,
      data: {
        basedOnMonths: months,
        prediction,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   [PRO] AI-powered detailed budget advice
 * @route  POST /api/ai/pro/budget-advice
 */
const proBudgetAdvice = async (req, res) => {
  try {
    const { month, year, goal } = req.body;
    // goal: e.g., "save 20% more", "reduce food spending", "pay off loan faster"

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "month and year are required" });
    }

    const summary = await monthlyFinancialSummary(req.user._id, month, year);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const categories = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: "expense",
          date: { $gte: startDate, $lt: endDate },
        },
      },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are a premium financial advisor AI. Analyze this user's ${month}/${year} finances:

Income: ${summary.income}
Expenses: ${summary.expenses}
Savings: ${summary.savings}
Loan Payments: ${summary.loans}
Savings Rate: ${summary.savingsRate}
Net Balance: ${summary.netBalance}

Category Breakdown:
${categories.map(c => `- ${c._id}: ${c.total}`).join("\n") || "No category data available"}

User Goal: ${goal || "General financial improvement"}

Provide a detailed, personalized budget plan with:
1. Specific dollar amounts to cut from each category
2. Step-by-step savings strategy
3. Debt reduction timeline
4. Emergency fund recommendation
5. Monthly action items

Be specific with numbers, not generic advice.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    res.status(200).json({
      success: true,
      data: {
        currentSummary: summary,
        categoryBreakdown: categories,
        userGoal: goal || "General financial improvement",
        advice: response.text,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { chat, generateAndSaveInsight, getInsights, getFinancialSummary, proAdvancedAnalytics, proPredictExpenses, proBudgetAdvice };
