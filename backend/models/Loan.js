const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    loanName: {
      type: String,
      required: [true, "Loan name is required"],
      trim: true,
      maxlength: 200,
    },
    principalAmount: {
      type: Number,
      required: [true, "Principal amount is required"],
      min: [0, "Principal amount cannot be negative"],
    },
    interestRate: {
      type: Number,
      required: [true, "Interest rate is required"],
      min: [0, "Interest rate cannot be negative"],
      max: [100, "Interest rate cannot exceed 100%"],
    },
    monthlyEMI: {
      type: Number,
      required: [true, "Monthly EMI is required"],
      min: [0, "EMI cannot be negative"],
    },
    remainingBalance: {
      type: Number,
      required: [true, "Remaining balance is required"],
      min: [0, "Remaining balance cannot be negative"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    status: {
      type: String,
      enum: ["active", "paid_off", "defaulted"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: total interest payable
loanSchema.virtual("totalInterest").get(function () {
  const months =
    (this.endDate.getFullYear() - this.startDate.getFullYear()) * 12 +
    (this.endDate.getMonth() - this.startDate.getMonth());
  return Math.max(this.monthlyEMI * months - this.principalAmount, 0);
});

loanSchema.set("toJSON", { virtuals: true });
loanSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Loan", loanSchema);
