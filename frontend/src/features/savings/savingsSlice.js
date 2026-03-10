import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchSavings, upsertSavings, deleteSavings } from "../../services/api";

export const getSavings = createAsyncThunk("savings/getAll", async (_, { rejectWithValue }) => {
  try {
    const res = await fetchSavings();
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch savings"); }
});

export const setSavings = createAsyncThunk("savings/upsert", async (data, { rejectWithValue }) => {
  try {
    const res = await upsertSavings(data);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to update savings"); }
});

export const removeSavings = createAsyncThunk("savings/delete", async (id, { rejectWithValue }) => {
  try {
    await deleteSavings(id);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to delete savings"); }
});

const savingsSlice = createSlice({
  name: "savings",
  initialState: { items: [], loading: false, error: null },
  reducers: { clearSavingsError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b
      .addCase(getSavings.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(getSavings.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data || a.payload; })
      .addCase(getSavings.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(setSavings.fulfilled, (s, a) => {
        const updated = a.payload.data || a.payload;
        const idx = s.items.findIndex((i) => i._id === updated._id);
        if (idx !== -1) s.items[idx] = updated;
        else s.items.unshift(updated);
      })
      .addCase(removeSavings.fulfilled, (s, a) => { s.items = s.items.filter((i) => i._id !== a.payload); });
  },
});

export const { clearSavingsError } = savingsSlice.actions;
export default savingsSlice.reducer;
