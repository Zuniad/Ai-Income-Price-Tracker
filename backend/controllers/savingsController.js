const Savings = require("../models/Savings");

/**
 * @desc   Create or update savings goal for a month
 * @route  POST /api/savings
 */
const upsertSavings = async (req, res) => {
  try {
    const { targetAmount, savedAmount, addAmount, month, year, title, deadline } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "month and year are required" });
    }

    const filter = { userId: req.user._id, month, year };
    const existing = await Savings.findOne(filter);

    if (existing) {
      // Update existing goal
      if (targetAmount !== undefined) existing.targetAmount = targetAmount;
      if (title !== undefined) existing.title = title;
      if (deadline !== undefined) existing.deadline = deadline || null;

      // Increment saved amount if addAmount provided, otherwise allow direct set
      if (addAmount !== undefined && addAmount > 0) {
        existing.savedAmount = (existing.savedAmount || 0) + Number(addAmount);
      } else if (savedAmount !== undefined) {
        existing.savedAmount = savedAmount;
      }

      await existing.save();
      return res.status(200).json({ success: true, data: existing });
    }

    // Create new goal
    const savings = await Savings.create({
      userId: req.user._id,
      month,
      year,
      targetAmount,
      savedAmount: savedAmount || 0,
      title: title || "Savings Goal",
      deadline: deadline || null,
    });

    res.status(201).json({ success: true, data: savings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Get savings (optionally by month/year)
 * @route  GET /api/savings
 */
const getSavings = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.month) filter.month = Number(req.query.month);
    if (req.query.year) filter.year = Number(req.query.year);

    const savings = await Savings.find(filter).sort({ year: -1, month: -1 });
    res.status(200).json({ success: true, count: savings.length, data: savings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Delete savings goal
 * @route  DELETE /api/savings/:id
 */
const deleteSavings = async (req, res) => {
  try {
    const savings = await Savings.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!savings) return res.status(404).json({ success: false, message: "Savings goal not found" });
    res.status(200).json({ success: true, message: "Savings goal deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { upsertSavings, getSavings, deleteSavings };
