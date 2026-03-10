const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addLoan,
  getLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
} = require("../controllers/loanController");

router.use(protect);

router.route("/").get(getLoans).post(addLoan);
router.route("/:id").get(getLoanById).put(updateLoan).delete(deleteLoan);

module.exports = router;
