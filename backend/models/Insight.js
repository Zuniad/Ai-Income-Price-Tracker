const mongoose = require("mongoose");

const insightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    insightText: {
      type: String,
      required: [true, "Insight text is required"],
    },
    category: {
      type: String,
      enum: ["spending", "savings", "budgeting", "prediction", "general"],
      default: "general",
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
  },
  {
    timestamps: true, // createdAt handled here
  }
);

insightSchema.index({ userId: 1, year: 1, month: 1 });

module.exports = mongoose.model("Insight", insightSchema);
