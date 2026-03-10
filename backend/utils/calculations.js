const Income = require("../models/Income");
const Transaction = require("../models/Transaction");
const Savings = require("../models/Savings");
const Loan = require("../models/Loan");

/**
 * Calculate total income for a user in a given month/year.
 */
const totalIncome = async (userId, month, year) => {
  const result = await Income.aggregate([
    { $match: { userId, month, year } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

/**
 * Calculate total expenses for a user in a given month/year.
 */
const totalExpenses = async (userId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const result = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: "expense",
        date: { $gte: startDate, $lt: endDate },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

/**
 * Calculate total savings for a user in a given month/year.
 */
const totalSavings = async (userId, month, year) => {
  const savings = await Savings.findOne({ userId, month, year });
  return savings ? savings.savedAmount : 0;
};

/**
 * Calculate total active loan payments (sum of monthly EMIs).
 */
const loanPayments = async (userId) => {
  const result = await Loan.aggregate([
    { $match: { userId, status: "active" } },
    { $group: { _id: null, total: { $sum: "$monthlyEMI" } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

/**
 * Calculate savings rate = (savings / income) * 100
 */
const savingsRate = (income, savings) => {
  if (income === 0) return "0%";
  return ((savings / income) * 100).toFixed(2) + "%";
};

/**
 * Generate a full monthly financial summary object.
 */
const monthlyFinancialSummary = async (userId, month, year) => {
  const [income, expenses, savings, loans] = await Promise.all([
    totalIncome(userId, month, year),
    totalExpenses(userId, month, year),
    totalSavings(userId, month, year),
    loanPayments(userId),
  ]);

  return {
    income,
    expenses,
    savings,
    loans,
    netBalance: income - expenses - savings - loans,
    savingsRate: savingsRate(income, savings),
  };
};

module.exports = {
  totalIncome,
  totalExpenses,
  totalSavings,
  loanPayments,
  savingsRate,
  monthlyFinancialSummary,
};
