const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addIncome,
  getIncome,
  getIncomeById,
  updateIncome,
  deleteIncome,
} = require("../controllers/incomeController");

router.use(protect); // all income routes are protected

router.route("/").get(getIncome).post(addIncome);
router.route("/:id").get(getIncomeById).put(updateIncome).delete(deleteIncome);

module.exports = router;
