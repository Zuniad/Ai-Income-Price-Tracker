import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchTransactions, addTransaction, updateTransaction, deleteTransaction } from "../../services/api";

export const getTransactions = createAsyncThunk("transactions/getAll", async (params, { rejectWithValue }) => {
  try {
    const res = await fetchTransactions(params);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch transactions"); }
});

export const createTransaction = createAsyncThunk("transactions/create", async (data, { rejectWithValue }) => {
  try {
    const res = await addTransaction(data);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to add transaction"); }
});

export const editTransaction = createAsyncThunk("transactions/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await updateTransaction(id, data);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update transaction"); }
});

export const removeTransaction = createAsyncThunk("transactions/delete", async (id, { rejectWithValue }) => {
  try {
    await deleteTransaction(id);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to delete transaction"); }
});

const transactionSlice = createSlice({
  name: "transactions",
  initialState: { items: [], pagination: null, loading: false, error: null },
  reducers: { clearTransactionError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b
      .addCase(getTransactions.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(getTransactions.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.data || a.payload;
        if (a.payload.pagination) s.pagination = a.payload.pagination;
      })
      .addCase(getTransactions.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createTransaction.fulfilled, (s, a) => { s.items.unshift(a.payload.data || a.payload); })
      .addCase(editTransaction.fulfilled, (s, a) => {
        const updated = a.payload.data || a.payload;
        const idx = s.items.findIndex((i) => i._id === updated._id);
        if (idx !== -1) s.items[idx] = updated;
      })
      .addCase(removeTransaction.fulfilled, (s, a) => { s.items = s.items.filter((i) => i._id !== a.payload); });
  },
});

export const { clearTransactionError } = transactionSlice.actions;
export default transactionSlice.reducer;
