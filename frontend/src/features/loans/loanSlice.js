import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchLoans, addLoan, updateLoan, deleteLoan } from "../../services/api";

export const getLoans = createAsyncThunk("loans/getAll", async (_, { rejectWithValue }) => {
  try {
    const res = await fetchLoans();
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch loans"); }
});

export const createLoan = createAsyncThunk("loans/create", async (data, { rejectWithValue }) => {
  try {
    const res = await addLoan(data);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to add loan"); }
});

export const editLoan = createAsyncThunk("loans/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await updateLoan(id, data);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update loan"); }
});

export const removeLoan = createAsyncThunk("loans/delete", async (id, { rejectWithValue }) => {
  try {
    await deleteLoan(id);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to delete loan"); }
});

const loanSlice = createSlice({
  name: "loans",
  initialState: { items: [], loading: false, error: null },
  reducers: { clearLoanError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b
      .addCase(getLoans.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(getLoans.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data || a.payload; })
      .addCase(getLoans.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createLoan.fulfilled, (s, a) => { s.items.unshift(a.payload.data || a.payload); })
      .addCase(editLoan.fulfilled, (s, a) => {
        const updated = a.payload.data || a.payload;
        const idx = s.items.findIndex((i) => i._id === updated._id);
        if (idx !== -1) s.items[idx] = updated;
      })
      .addCase(removeLoan.fulfilled, (s, a) => { s.items = s.items.filter((i) => i._id !== a.payload); });
  },
});

export const { clearLoanError } = loanSlice.actions;
export default loanSlice.reducer;
