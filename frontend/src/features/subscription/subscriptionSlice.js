import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getPlans, getSubStatus, activatePro, verifyOTP, resendOTP, cancelSub, subHistory } from "../../services/api";

export const fetchPlans = createAsyncThunk("subscription/plans", async (_, { rejectWithValue }) => {
  try { const res = await getPlans(); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch plans"); }
});

export const fetchSubStatus = createAsyncThunk("subscription/status", async (_, { rejectWithValue }) => {
  try { const res = await getSubStatus(); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to get status"); }
});

export const activate = createAsyncThunk("subscription/activate", async (data, { rejectWithValue }) => {
  try { const res = await activatePro(data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Activation failed"); }
});

export const verify = createAsyncThunk("subscription/verify", async (data, { rejectWithValue }) => {
  try { const res = await verifyOTP(data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Verification failed"); }
});

export const resend = createAsyncThunk("subscription/resend", async (_, { rejectWithValue }) => {
  try { const res = await resendOTP(); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Resend failed"); }
});

export const cancel = createAsyncThunk("subscription/cancel", async (_, { rejectWithValue }) => {
  try { const res = await cancelSub(); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Cancel failed"); }
});

export const fetchHistory = createAsyncThunk("subscription/history", async (_, { rejectWithValue }) => {
  try { const res = await subHistory(); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch history"); }
});

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState: {
    plans: [],
    status: null,
    history: [],
    otpSent: false,
    loading: false,
    verifying: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearSubError: (s) => { s.error = null; },
    clearSubSuccess: (s) => { s.successMessage = null; },
    resetOtpState: (s) => { s.otpSent = false; },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchPlans.pending, (s) => { s.loading = true; })
      .addCase(fetchPlans.fulfilled, (s, a) => {
        s.loading = false;
        const d = a.payload.data || a.payload;
        // Transform backend object { free: {...}, pro: { monthly: {...}, yearly: {...} } } into array
        if (d && d.pro && !Array.isArray(d)) {
          const plans = [];
          if (d.pro.monthly) plans.push({ name: "Pro Monthly", interval: "monthly", price: d.pro.monthly.price, currency: d.pro.monthly.currency || "USD" });
          if (d.pro.yearly) plans.push({ name: "Pro Yearly", interval: "yearly", price: d.pro.yearly.price, currency: d.pro.yearly.currency || "USD", savings: d.pro.yearly.savings });
          s.plans = plans;
        } else {
          s.plans = Array.isArray(d) ? d : [];
        }
      })
      .addCase(fetchPlans.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchSubStatus.fulfilled, (s, a) => { s.status = a.payload.data || a.payload; })
      .addCase(activate.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(activate.fulfilled, (s, a) => { s.loading = false; s.otpSent = true; s.successMessage = a.payload.message || "OTP sent!"; })
      .addCase(activate.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(verify.pending, (s) => { s.verifying = true; s.error = null; })
      .addCase(verify.fulfilled, (s, a) => { s.verifying = false; s.otpSent = false; s.status = a.payload.data || a.payload; s.successMessage = "Pro activated!"; })
      .addCase(verify.rejected, (s, a) => { s.verifying = false; s.error = a.payload; })
      .addCase(resend.fulfilled, (s) => { s.successMessage = "OTP resent!"; })
      .addCase(cancel.fulfilled, (s, a) => { s.status = a.payload.data || a.payload; s.successMessage = "Subscription cancelled"; })
      .addCase(fetchHistory.fulfilled, (s, a) => { s.history = a.payload.data || a.payload; });
  },
});

export const { clearSubError, clearSubSuccess, resetOtpState } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
