const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    source: {
      type: String,
      required: [true, "Income source is required"],
      enum: {
        values: ["salary", "freelance", "business", "investment", "rental", "other"],
        message: "{VALUE} is not a supported income source",
      },
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
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
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast monthly queries
incomeSchema.index({ userId: 1, year: 1, month: 1 });

module.exports = mongoose.model("Income", incomeSchema);
