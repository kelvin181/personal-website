import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type FontSize = "small" | "medium" | "large";

export const FONT_SIZES: Record<FontSize, string> = {
  small: "12px",
  medium: "14px",
  large: "16px",
};

interface SettingsState {
  fontSize: FontSize;
}

const initialState: SettingsState = {
  fontSize: "medium",
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setFontSize(state, action: PayloadAction<FontSize>) {
      state.fontSize = action.payload;
    },
    resetSettings() {
      return initialState;
    },
  },
});

export const { setFontSize, resetSettings } = settingsSlice.actions;

export default settingsSlice.reducer;
