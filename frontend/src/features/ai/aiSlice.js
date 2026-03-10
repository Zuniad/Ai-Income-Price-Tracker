import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { aiChat, aiGenerate, aiInsights, aiSummary, aiProAnalytics, aiProPredict, aiProBudgetAdvice } from "../../services/api";

export const sendChat = createAsyncThunk("ai/chat", async (message, { rejectWithValue }) => {
  try {
    const res = await aiChat({ question: message });
    return { role: "assistant", content: res.data.data?.answer || res.data.data?.reply || res.data.data };
  } catch (err) { return rejectWithValue(err.response?.data?.message || "AI chat failed"); }
});

export const generateData = createAsyncThunk("ai/generate", async ({ month, year }, { rejectWithValue }) => {
  try {
    const res = await aiGenerate({ month, year });
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "AI generation failed"); }
});

export const fetchInsights = createAsyncThunk("ai/insights", async (params, { rejectWithValue }) => {
  try {
    const res = await aiInsights(params);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch insights"); }
});

export const fetchSummary = createAsyncThunk("ai/summary", async (params, { rejectWithValue }) => {
  try {
    const res = await aiSummary(params);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch summary"); }
});

export const fetchProAnalytics = createAsyncThunk("ai/proAnalytics", async (params, { rejectWithValue }) => {
  try {
    const res = await aiProAnalytics(params);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Pro analytics failed"); }
});

export const fetchProPredict = createAsyncThunk("ai/proPredict", async (data, { rejectWithValue }) => {
  try {
    const res = await aiProPredict(data);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Pro prediction failed"); }
});

export const fetchProBudget = createAsyncThunk("ai/proBudget", async (data, { rejectWithValue }) => {
  try {
    const res = await aiProBudgetAdvice(data);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Pro budget advice failed"); }
});

const aiSlice = createSlice({
  name: "ai",
  initialState: {
    chatMessages: [],
    generated: null,
    insights: null,
    summary: null,
    proAnalytics: null,
    proPredictions: null,
    proBudget: null,
    loading: false,
    chatLoading: false,
    error: null,
  },
  reducers: {
    addUserMessage: (s, a) => { s.chatMessages.push({ role: "user", content: a.payload }); },
    clearChat: (s) => { s.chatMessages = []; },
    clearAiError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    b
      .addCase(sendChat.pending, (s) => { s.chatLoading = true; s.error = null; })
      .addCase(sendChat.fulfilled, (s, a) => { s.chatLoading = false; s.chatMessages.push(a.payload); })
      .addCase(sendChat.rejected, (s, a) => { s.chatLoading = false; s.error = a.payload; })
      .addCase(generateData.pending, (s) => { s.loading = true; })
      .addCase(generateData.fulfilled, (s, a) => { s.loading = false; s.generated = a.payload.data || a.payload; })
      .addCase(generateData.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchInsights.pending, (s) => { s.loading = true; })
      .addCase(fetchInsights.fulfilled, (s, a) => { s.loading = false; s.insights = a.payload.data || a.payload; })
      .addCase(fetchInsights.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchSummary.pending, (s) => { s.loading = true; })
      .addCase(fetchSummary.fulfilled, (s, a) => { s.loading = false; s.summary = a.payload.data || a.payload; })
      .addCase(fetchSummary.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchProAnalytics.pending, (s) => { s.loading = true; })
      .addCase(fetchProAnalytics.fulfilled, (s, a) => { s.loading = false; s.proAnalytics = a.payload.data || a.payload; })
      .addCase(fetchProAnalytics.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchProPredict.pending, (s) => { s.loading = true; })
      .addCase(fetchProPredict.fulfilled, (s, a) => { s.loading = false; s.proPredictions = a.payload.data || a.payload; })
      .addCase(fetchProPredict.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchProBudget.pending, (s) => { s.loading = true; })
      .addCase(fetchProBudget.fulfilled, (s, a) => { s.loading = false; s.proBudget = a.payload.data || a.payload; })
      .addCase(fetchProBudget.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { addUserMessage, clearChat, clearAiError } = aiSlice.actions;
export default aiSlice.reducer;
