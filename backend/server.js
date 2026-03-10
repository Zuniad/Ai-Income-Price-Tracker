const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");

// ── Route imports ────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const savingsRoutes = require("./routes/savingsRoutes");
const loanRoutes = require("./routes/loanRoutes");
const aiRoutes = require("./routes/aiRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");

// ── App init ─────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 8080;

// ── Global middleware ────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: ["http://localhost:5173","https://ai-income-price-tracker.vercel.app/"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: "*",
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiter — 500 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: "Too many requests, please try again later" },
});
app.use("/api", limiter);

// ── API routes ───────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// ── Health check ─────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ success: true, message: "AI Income Tracker API is running" });
});

// ── 404 handler ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global error handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ── Start server ─────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
