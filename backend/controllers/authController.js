const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Income = require("../models/Income");
const Transaction = require("../models/Transaction");
const Savings = require("../models/Savings");
const Loan = require("../models/Loan");

// ── Exchange rates (1 USD = X). Updated periodically. ────────────────
const RATES_TO_USD = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  JPY: 149.5,
  CAD: 1.36,
  AUD: 1.54,
  PKR: 278.5,
};

function convertAmount(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency || !amount) return amount;
  const inUSD = amount / RATES_TO_USD[fromCurrency];
  return Math.round(inUSD * RATES_TO_USD[toCurrency] * 100) / 100;
}

// ── Helper: generate JWT ─────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

/**
 * @desc   Register new user
 * @route  POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, currency } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    const user = await User.create({ name, email, password, currency });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, currency: user.currency },
    });
  } catch (error) {
    const status = error.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Login user
 * @route  POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, currency: user.currency },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Get current user profile
 * @route  GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Update user profile (name, currency) with amount conversion
 * @route  PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, currency } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (name) user.name = name.trim();

    // Currency change → convert all financial data
    if (currency && currency !== user.currency) {
      const validCurrencies = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "PKR"];
      if (!validCurrencies.includes(currency)) {
        return res.status(400).json({ success: false, message: "Invalid currency" });
      }

      const from = user.currency;
      const to = currency;
      const userId = user._id;

      // Convert incomes
      const incomes = await Income.find({ userId });
      for (const inc of incomes) {
        inc.amount = convertAmount(inc.amount, from, to);
        await inc.save();
      }

      // Convert transactions
      const transactions = await Transaction.find({ userId });
      for (const tx of transactions) {
        tx.amount = convertAmount(tx.amount, from, to);
        await tx.save();
      }

      // Convert savings
      const savings = await Savings.find({ userId });
      for (const sv of savings) {
        sv.targetAmount = convertAmount(sv.targetAmount, from, to);
        sv.savedAmount = convertAmount(sv.savedAmount, from, to);
        await sv.save();
      }

      // Convert loans
      const loans = await Loan.find({ userId });
      for (const ln of loans) {
        ln.principalAmount = convertAmount(ln.principalAmount, from, to);
        ln.monthlyEMI = convertAmount(ln.monthlyEMI, from, to);
        ln.remainingBalance = convertAmount(ln.remainingBalance, from, to);
        await ln.save();
      }

      user.currency = currency;
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, currency: user.currency, plan: user.plan, createdAt: user.createdAt },
    });
  } catch (error) {
    const status = error.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile };
