import { configureStore } from "@reduxjs/toolkit";
import filesystemReducer from "./filesystemSlice";
import windowsReducer from "./windowsSlice";
import sessionReducer from "./sessionSlice";
import desktopReducer from "./desktopSlice";
import clipboardReducer from "./clipboardSlice";
import settingsReducer from "./settingsSlice";

function loadPersistedState() {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("kelvin-os-state");
    if (!raw) return undefined;
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function persistState(state: ReturnType<typeof store.getState>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      "kelvin-os-state",
      JSON.stringify({
        settings: state.settings,
        session: {
          username: state.session.username,
          hostname: state.session.hostname,
          cwd: state.session.cwd,
        },
        desktop: {
          wallpaper: state.desktop.wallpaper,
          wallpaperNodeId: state.desktop.wallpaperNodeId,
        },
      })
    );
  } catch {
    // ignore
  }
}

const persisted = loadPersistedState();

export const store = configureStore({
  reducer: {
    filesystem: filesystemReducer,
    windows: windowsReducer,
    session: sessionReducer,
    desktop: desktopReducer,
    clipboard: clipboardReducer,
    settings: settingsReducer,
  },
  preloadedState: persisted,
});

store.subscribe(() => persistState(store.getState()));

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
