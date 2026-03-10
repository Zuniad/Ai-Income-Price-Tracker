const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["pro_activation", "verification"],
    default: "pro_activation",
  },
  // Payment details saved temporarily until OTP verified
  paymentDetails: {
    cardNumber: { type: String },
    phoneNumber: { type: String },
    duration: { type: String, enum: ["monthly", "yearly"] },
    amount: { type: Number },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index — auto-deletes after expiry
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("OTP", otpSchema);
