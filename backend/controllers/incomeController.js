const Income = require("../models/Income");

/**
 * @desc   Add income entry
 * @route  POST /api/income
 */
const addIncome = async (req, res) => {
  try {
    const income = await Income.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: income });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Get all income entries for current user (optionally by month/year)
 * @route  GET /api/income
 */
const getIncome = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.month) filter.month = Number(req.query.month);
    if (req.query.year) filter.year = Number(req.query.year);

    const incomes = await Income.find(filter).sort({ year: -1, month: -1 });
    res.status(200).json({ success: true, count: incomes.length, data: incomes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Get single income entry
 * @route  GET /api/income/:id
 */
const getIncomeById = async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, userId: req.user._id });
    if (!income) return res.status(404).json({ success: false, message: "Income not found" });
    res.status(200).json({ success: true, data: income });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Update income entry
 * @route  PUT /api/income/:id
 */
const updateIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!income) return res.status(404).json({ success: false, message: "Income not found" });
    res.status(200).json({ success: true, data: income });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Delete income entry
 * @route  DELETE /api/income/:id
 */
const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!income) return res.status(404).json({ success: false, message: "Income not found" });
    res.status(200).json({ success: true, message: "Income deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addIncome, getIncome, getIncomeById, updateIncome, deleteIncome };
