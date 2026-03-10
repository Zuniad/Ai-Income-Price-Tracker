import axios from "axios";

const API = axios.create({ baseURL: "https://ai-income-price-tracker.onrender.com/api" });

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──
export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const getMe = () => API.get("/auth/me");
export const updateProfileAPI = (data) => API.put("/auth/profile", data);

// ── Income ──
export const fetchIncomes = (params) => API.get("/income", { params });
export const addIncome = (data) => API.post("/income", data);
export const updateIncome = (id, data) => API.put(`/income/${id}`, data);
export const deleteIncome = (id) => API.delete(`/income/${id}`);

// ── Transactions ──
export const fetchTransactions = (params) => API.get("/transactions", { params });
export const addTransaction = (data) => API.post("/transactions", data);
export const updateTransaction = (id, data) => API.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`);

// ── Savings ──
export const fetchSavings = (params) => API.get("/savings", { params });
export const upsertSavings = (data) => API.post("/savings", data);
export const deleteSavings = (id) => API.delete(`/savings/${id}`);

// ── Loans ──
export const fetchLoans = (params) => API.get("/loans", { params });
export const addLoan = (data) => API.post("/loans", data);
export const updateLoan = (id, data) => API.put(`/loans/${id}`, data);
export const deleteLoan = (id) => API.delete(`/loans/${id}`);

// ── AI ──
export const aiChat = (data) => API.post("/ai/chat", data);
export const aiGenerate = (data) => API.post("/ai/generate", data);
export const aiInsights = (params) => API.get("/ai/insights", { params });
export const aiSummary = (params) => API.get("/ai/summary", { params });
export const aiProAnalytics = (params) => API.get("/ai/pro/analytics", { params });
export const aiProPredict = (data) => API.post("/ai/pro/predict", data);
export const aiProBudgetAdvice = (data) => API.post("/ai/pro/budget-advice", data);

// ── Subscriptions ──
export const getPlans = () => API.get("/subscriptions/plans");
export const activateViaPhone = (data) => API.post("/subscriptions/activate-phone", data);
export const getSubStatus = () => API.get("/subscriptions/status");
export const activatePro = (data) => API.post("/subscriptions/activate", data);
export const verifyOTP = (data) => API.post("/subscriptions/verify-otp", data);
export const resendOTP = () => API.post("/subscriptions/resend-otp");
export const cancelSub = () => API.post("/subscriptions/cancel");
export const subHistory = () => API.get("/subscriptions/history");

export default API;
