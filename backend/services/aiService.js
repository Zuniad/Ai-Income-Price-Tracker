const { monthlyFinancialSummary } = require("../utils/calculations");
const Transaction = require("../models/Transaction");
const Income = require("../models/Income");
const Loan = require("../models/Loan");

/**
 * Build a prompt-ready financial context object for the AI engine.
 */
const buildFinancialContext = async (userId, month, year) => {
  const summary = await monthlyFinancialSummary(userId, month, year);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  // Category-wise expense breakdown
  const categoryBreakdown = await Transaction.aggregate([
    { $match: { userId, type: "expense", date: { $gte: startDate, $lt: endDate } } },
    { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  // Income sources
  const incomeSources = await Income.aggregate([
    { $match: { userId, month, year } },
    { $group: { _id: "$source", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  // Active loans
  const activeLoans = await Loan.find({ userId, status: "active" }).select("title amount remainingAmount monthlyEMI interestRate").lean();

  // Build category table string
  const categoryTable = categoryBreakdown.length > 0
    ? categoryBreakdown.map(c => `  - ${c._id}: ₹${c.total.toLocaleString()} (${c.count} transaction${c.count > 1 ? "s" : ""}, ${summary.expenses > 0 ? ((c.total / summary.expenses) * 100).toFixed(1) : 0}% of total expenses)`).join("\n")
    : "  No expenses recorded this month.";

  const incomeTable = incomeSources.length > 0
    ? incomeSources.map(s => `  - ${s._id}: ₹${s.total.toLocaleString()}`).join("\n")
    : "  No income recorded this month.";

  const loanTable = activeLoans.length > 0
    ? activeLoans.map(l => `  - ${l.title}: Principal ₹${l.amount?.toLocaleString()}, Remaining ₹${l.remainingAmount?.toLocaleString()}, EMI ₹${l.monthlyEMI?.toLocaleString()}, Rate ${l.interestRate}%`).join("\n")
    : "  No active loans.";

  const prompt = `
You are an expert financial advisor AI. Analyze the following personal finance data for ${new Date(year, month - 1).toLocaleString("default", { month: "long" })} ${year} and provide a **comprehensive, detailed financial insight report**.

## Financial Summary
- Total Income: ₹${summary.income.toLocaleString()}
- Total Expenses: ₹${summary.expenses.toLocaleString()}
- Total Savings: ₹${summary.savings.toLocaleString()}
- Loan EMI Payments: ₹${summary.loans.toLocaleString()}
- Net Balance: ₹${summary.netBalance.toLocaleString()}
- Savings Rate: ${summary.savingsRate}

## Income Sources
${incomeTable}

## Expense Breakdown by Category
${categoryTable}

## Active Loans
${loanTable}

---

**Instructions for your response:**

You MUST format your response in proper Markdown with the following structure:

## 📊 Monthly Financial Overview
Provide a summary paragraph analyzing the overall financial health.

## 💰 Income Analysis
| Source | Amount | % of Total |
|--------|--------|-----------|
(Fill in a markdown table of income sources with percentages)

- Bullet point observations about income diversification
- Note any concerning patterns

## 📉 Expense Analysis
| Category | Amount | % of Expenses | Transactions |
|----------|--------|---------------|-------------|
(Fill in a markdown table of expenses sorted by highest to lowest)

- Highlight the top 3 spending categories
- Identify any unusual or high spending areas
- Compare to typical healthy spending ratios

## 💡 Key Insights
- Provide 5-7 specific, data-driven bullet point insights
- Each insight should reference actual numbers from the data
- Include both positive observations and areas of concern

## ⚠️ Warnings & Red Flags
- List any concerning financial patterns
- Highlight if savings rate is below recommended 20%
- Note any category where spending seems excessive

## 🎯 Actionable Recommendations
1. Numbered, specific recommendations to improve finances
2. Each recommendation should be practical and immediately actionable
3. Include target amounts or percentages where relevant
4. Suggest specific categories where spending can be reduced
5. Recommend savings strategies based on their income level

## 📈 Next Month Prediction
- Predict likely expenses for next month based on current patterns
- Suggest a realistic savings target
- Identify upcoming financial risks or opportunities

Make the response detailed (at least 400 words), data-driven, professional, and encouraging. Use actual numbers from the data throughout.
`.trim();

  return {
    month,
    year,
    ...summary,
    categoryBreakdown,
    incomeSources,
    activeLoans,
    prompt,
  };
};

/**
 * Generate an AI insight (stub — replace with actual LLM call).
 * Returns an object { insightText, category }.
 */
const generateInsight = async (userId, month, year) => {
  const context = await buildFinancialContext(userId, month, year);

  const { GoogleGenAI } = require("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: context.prompt,
    });

    return { insightText: response.text, category: "general" };
  } catch (error) {
    console.error("Gemini API error:", error.message);
    // Fallback to placeholder if AI call fails
    return {
      insightText: `[Fallback] Based on your ${month}/${year} data — income: ${context.income}, expenses: ${context.expenses}, savings rate: ${context.savingsRate}. Consider reviewing your spending categories to improve your savings.`,
      category: "general",
    };
  }
};

module.exports = {
  buildFinancialContext,
  generateInsight,
};
