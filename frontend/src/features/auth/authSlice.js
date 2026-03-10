import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { registerUser, loginUser, getMe, updateProfileAPI } from "../../services/api";

export const register = createAsyncThunk("auth/register", async (data, { rejectWithValue }) => {
  try {
    const res = await registerUser(data);
    localStorage.setItem("token", res.data.token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Registration failed");
  }
});

export const login = createAsyncThunk("auth/login", async (data, { rejectWithValue }) => {
  try {
    const res = await loginUser(data);
    localStorage.setItem("token", res.data.token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Login failed");
  }
});

export const loadUser = createAsyncThunk("auth/loadUser", async (_, { rejectWithValue }) => {
  try {
    const res = await getMe();
    return res.data;
  } catch (_err) {
    localStorage.removeItem("token");
    return rejectWithValue("Session expired");
  }
});

export const updateProfile = createAsyncThunk("auth/updateProfile", async (data, { rejectWithValue }) => {
  try {
    const res = await updateProfileAPI(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update profile");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("token") || null,
    loading: false,
    error: null,
    isAuthenticated: false,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(register.fulfilled, (s, a) => { s.loading = false; s.token = a.payload.token; s.user = a.payload.user; s.isAuthenticated = true; })
      .addCase(register.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      // Login
      .addCase(login.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.loading = false; s.token = a.payload.token; s.user = a.payload.user; s.isAuthenticated = true; })
      .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      // Load user
      .addCase(loadUser.pending, (s) => { s.loading = true; })
      .addCase(loadUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user || a.payload.data; s.isAuthenticated = true; })
      .addCase(loadUser.rejected, (s) => { s.loading = false; s.isAuthenticated = false; s.user = null; s.token = null; })
      // Update profile
      .addCase(updateProfile.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(updateProfile.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; })
      .addCase(updateProfile.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
