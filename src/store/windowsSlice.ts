import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

export type AppType = "terminal" | "file-manager" | "text-viewer";
export type WindowState = "normal" | "minimized" | "maximized";

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface AppWindow {
  id: string;
  appType: AppType;
  title: string;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
  state: WindowState;
  appProps?: Record<string, unknown>;
}

interface WindowsState {
  windows: AppWindow[];
  maxZIndex: number;
}

const DEFAULT_SIZES: Record<AppType, WindowSize> = {
  terminal: { width: 700, height: 450 },
  "file-manager": { width: 650, height: 450 },
  "text-viewer": { width: 600, height: 500 },
};

const DEFAULT_TITLES: Record<AppType, string> = {
  terminal: "Terminal",
  "file-manager": "File Manager",
  "text-viewer": "Text Viewer",
};

let offsetCounter = 0;

const initialState: WindowsState = {
  windows: [],
  maxZIndex: 0,
};

const windowsSlice = createSlice({
  name: "windows",
  initialState,
  reducers: {
    openWindow(
      state,
      action: PayloadAction<{
        appType: AppType;
        title?: string;
        appProps?: Record<string, unknown>;
      }>
    ) {
      const { appType, title, appProps } = action.payload;
      const offset = (offsetCounter++ % 8) * 30;
      const newWindow: AppWindow = {
        id: uuidv4(),
        appType,
        title: title || DEFAULT_TITLES[appType],
        position: { x: 100 + offset, y: 60 + offset },
        size: { ...DEFAULT_SIZES[appType] },
        zIndex: state.maxZIndex + 1,
        state: "normal",
        appProps,
      };
      state.windows.push(newWindow);
      state.maxZIndex += 1;
    },
    closeWindow(state, action: PayloadAction<string>) {
      state.windows = state.windows.filter((w) => w.id !== action.payload);
    },
    focusWindow(state, action: PayloadAction<string>) {
      const win = state.windows.find((w) => w.id === action.payload);
      if (win) {
        state.maxZIndex += 1;
        win.zIndex = state.maxZIndex;
        if (win.state === "minimized") {
          win.state = "normal";
        }
      }
    },
    minimizeWindow(state, action: PayloadAction<string>) {
      const win = state.windows.find((w) => w.id === action.payload);
      if (win) {
        win.state = "minimized";
      }
    },
    maximizeWindow(state, action: PayloadAction<string>) {
      const win = state.windows.find((w) => w.id === action.payload);
      if (win) {
        win.state = win.state === "maximized" ? "normal" : "maximized";
      }
    },
    updateWindowPosition(state, action: PayloadAction<{ id: string; position: WindowPosition }>) {
      const win = state.windows.find((w) => w.id === action.payload.id);
      if (win) {
        win.position = action.payload.position;
      }
    },
    updateWindowSize(state, action: PayloadAction<{ id: string; size: WindowSize }>) {
      const win = state.windows.find((w) => w.id === action.payload.id);
      if (win) {
        win.size = action.payload.size;
      }
    },
  },
});

export const {
  openWindow,
  closeWindow,
  focusWindow,
  minimizeWindow,
  maximizeWindow,
  updateWindowPosition,
  updateWindowSize,
} = windowsSlice.actions;

export default windowsSlice.reducer;
