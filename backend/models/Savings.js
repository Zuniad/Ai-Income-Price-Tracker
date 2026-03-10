const mongoose = require("mongoose");

const savingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Savings Goal",
      trim: true,
      maxlength: 100,
    },
    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [0, "Target amount cannot be negative"],
    },
    savedAmount: {
      type: Number,
      default: 0,
      min: [0, "Saved amount cannot be negative"],
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
    },
    deadline: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One savings goal per user per month
savingsSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

// Virtual: progress percentage
savingsSchema.virtual("progress").get(function () {
  if (this.targetAmount === 0) return 100;
  return Math.min(((this.savedAmount / this.targetAmount) * 100).toFixed(2), 100);
});

savingsSchema.set("toJSON", { virtuals: true });
savingsSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Savings", savingsSchema);
