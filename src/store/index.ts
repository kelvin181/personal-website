import { configureStore } from "@reduxjs/toolkit";
import filesystemReducer from "./filesystemSlice";
import windowsReducer from "./windowsSlice";
import sessionReducer from "./sessionSlice";
import desktopReducer from "./desktopSlice";

export const store = configureStore({
  reducer: {
    filesystem: filesystemReducer,
    windows: windowsReducer,
    session: sessionReducer,
    desktop: desktopReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
