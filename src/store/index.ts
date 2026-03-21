import { configureStore } from "@reduxjs/toolkit";
import filesystemReducer from "./filesystemSlice";
import windowsReducer from "./windowsSlice";
import sessionReducer from "./sessionSlice";
import desktopReducer from "./desktopSlice";
import clipboardReducer from "./clipboardSlice";

export const store = configureStore({
  reducer: {
    filesystem: filesystemReducer,
    windows: windowsReducer,
    session: sessionReducer,
    desktop: desktopReducer,
    clipboard: clipboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
