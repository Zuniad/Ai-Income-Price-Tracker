import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import incomeReducer from "../features/income/incomeSlice";
import transactionReducer from "../features/transactions/transactionSlice";
import savingsReducer from "../features/savings/savingsSlice";
import loanReducer from "../features/loans/loanSlice";
import aiReducer from "../features/ai/aiSlice";
import subscriptionReducer from "../features/subscription/subscriptionSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    income: incomeReducer,
    transactions: transactionReducer,
    savings: savingsReducer,
    loans: loanReducer,
    ai: aiReducer,
    subscription: subscriptionReducer,
  },
});

export default store;
