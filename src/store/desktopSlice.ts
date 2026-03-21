import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface WallpaperOption {
  key: string;
  label: string;
  style: string;
}

export const WALLPAPERS: WallpaperOption[] = [
  { key: "dark", label: "Dark", style: "#0a0e14" },
  { key: "midnight", label: "Midnight", style: "linear-gradient(135deg, #0a0e14, #0d1b4b)" },
  { key: "forest", label: "Forest", style: "linear-gradient(135deg, #0a1f0e, #0a0e14)" },
  { key: "aurora", label: "Aurora", style: "linear-gradient(135deg, #0a0e14, #1a0a2e)" },
];

interface DesktopState {
  wallpaper: string;
  wallpaperNodeId: string | null;
}

const initialState: DesktopState = {
  wallpaper: "dark",
  wallpaperNodeId: null,
};

const desktopSlice = createSlice({
  name: "desktop",
  initialState,
  reducers: {
    setWallpaper(state, action: PayloadAction<string>) {
      state.wallpaper = action.payload;
      state.wallpaperNodeId = null;
    },
    setWallpaperNode(state, action: PayloadAction<string>) {
      state.wallpaper = "custom";
      state.wallpaperNodeId = action.payload;
    },
  },
});

export const { setWallpaper, setWallpaperNode } = desktopSlice.actions;

export default desktopSlice.reducer;
