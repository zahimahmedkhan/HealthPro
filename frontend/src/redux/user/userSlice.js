import { createSlice } from "@reduxjs/toolkit";

const getStoredUser = () => {
  if (typeof window === "undefined") return null;

  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    console.warn("Failed to parse stored user:", error);
    return null;
  }
};

const initialState = {
  currentUser: getStoredUser(),
  errorDispatch: null,
  loading: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    signInStart: (state) => {
      state.loading = true;
    },
    signInSuccess: (state, action) => {
      state.currentUser = action.payload;
      state.loading = false;
      state.errorDispatch = null;

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(action.payload));
      }
    },
    signInFailure: (state, action) => {
      state.errorDispatch = action.payload;
      state.loading = false;
    },
    signOutStart: (state) => {
      state.loading = true;
    },
    signOutSuccess: (state) => {
      state.currentUser = null;
      state.loading = false;
      state.errorDispatch = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
    },
    signOutFailure: (state, action) => {
      state.errorDispatch = action.payload;
      state.loading = false;
    },
  },
});

export const { signInFailure, signInStart, signInSuccess, signOutStart, signOutSuccess, signOutFailure } = userSlice.actions;

export default userSlice.reducer;
