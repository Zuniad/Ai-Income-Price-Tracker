const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");

router.use(protect);

router.route("/").get(getTransactions).post(createTransaction);
router.route("/:id").get(getTransactionById).put(updateTransaction).delete(deleteTransaction);

module.exports = router;
