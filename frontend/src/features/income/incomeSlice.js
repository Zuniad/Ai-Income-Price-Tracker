import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchIncomes, addIncome, updateIncome, deleteIncome } from "../../services/api";

export const getIncomes = createAsyncThunk("income/getAll", async (_, { rejectWithValue }) => {
  try {
    const res = await fetchIncomes();
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch incomes"); }
});

export const createIncome = createAsyncThunk("income/create", async (data, { rejectWithValue }) => {
  try {
    const res = await addIncome(data);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to add income"); }
});

export const editIncome = createAsyncThunk("income/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await updateIncome(id, data);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update income"); }
});

export const removeIncome = createAsyncThunk("income/delete", async (id, { rejectWithValue }) => {
  try {
    await deleteIncome(id);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to delete income"); }
});

const incomeSlice = createSlice({
  name: "income",
  initialState: { items: [], loading: false, error: null },
  reducers: { clearIncomeError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b
      .addCase(getIncomes.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(getIncomes.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data || a.payload; })
      .addCase(getIncomes.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createIncome.fulfilled, (s, a) => { s.items.unshift(a.payload.data || a.payload); })
      .addCase(editIncome.fulfilled, (s, a) => {
        const updated = a.payload.data || a.payload;
        const idx = s.items.findIndex((i) => i._id === updated._id);
        if (idx !== -1) s.items[idx] = updated;
      })
      .addCase(removeIncome.fulfilled, (s, a) => { s.items = s.items.filter((i) => i._id !== a.payload); });
  },
});

export const { clearIncomeError } = incomeSlice.actions;
export default incomeSlice.reducer;
