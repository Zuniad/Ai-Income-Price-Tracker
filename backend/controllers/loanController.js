const Loan = require("../models/Loan");

/**
 * @desc   Add a loan
 * @route  POST /api/loans
 */
const addLoan = async (req, res) => {
  try {
    const loan = await Loan.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: loan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Get all loans for current user
 * @route  GET /api/loans
 */
const getLoans = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const loans = await Loan.find(filter).sort({ startDate: -1 });
    res.status(200).json({ success: true, count: loans.length, data: loans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Get single loan
 * @route  GET /api/loans/:id
 */
const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });
    res.status(200).json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Update loan
 * @route  PUT /api/loans/:id
 */
const updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });
    res.status(200).json({ success: true, data: loan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Delete loan
 * @route  DELETE /api/loans/:id
 */
const deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });
    res.status(200).json({ success: true, message: "Loan deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addLoan, getLoans, getLoanById, updateLoan, deleteLoan };
