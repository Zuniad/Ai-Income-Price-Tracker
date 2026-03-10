const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { upsertSavings, getSavings, deleteSavings } = require("../controllers/savingsController");

router.use(protect);

router.route("/").get(getSavings).post(upsertSavings);
router.route("/:id").delete(deleteSavings);

module.exports = router;
