import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type FontSize = "small" | "medium" | "large";
export type ColorScheme = "default" | "amber" | "dracula";

export interface ColorSchemeDefinition {
  fg: string;
  accent: string;
  bg: string;
}

export const COLOR_SCHEMES: Record<ColorScheme, ColorSchemeDefinition> = {
  default: { fg: "#39ff14", accent: "#00bfff", bg: "#0d1117" },
  amber: { fg: "#ffb300", accent: "#ff8c00", bg: "#0d0a00" },
  dracula: { fg: "#f8f8f2", accent: "#bd93f9", bg: "#282a36" },
};

export const FONT_SIZES: Record<FontSize, string> = {
  small: "12px",
  medium: "14px",
  large: "16px",
};

interface SettingsState {
  fontSize: FontSize;
  colorScheme: ColorScheme;
}

const initialState: SettingsState = {
  fontSize: "medium",
  colorScheme: "default",
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setFontSize(state, action: PayloadAction<FontSize>) {
      state.fontSize = action.payload;
    },
    setColorScheme(state, action: PayloadAction<ColorScheme>) {
      state.colorScheme = action.payload;
    },
    resetSettings() {
      return initialState;
    },
  },
});

export const { setFontSize, setColorScheme, resetSettings } = settingsSlice.actions;

export default settingsSlice.reducer;
