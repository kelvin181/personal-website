import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SessionState {
  username: string;
  hostname: string;
  cwd: string;
  terminalHistory: string[];
  historyIndex: number;
}

const initialState: SessionState = {
  username: "visitor",
  hostname: "kelvin-os",
  cwd: "/home/user",
  terminalHistory: [],
  historyIndex: -1,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setCwd(state, action: PayloadAction<string>) {
      state.cwd = action.payload;
    },
    pushHistory(state, action: PayloadAction<string>) {
      state.terminalHistory.push(action.payload);
      state.historyIndex = state.terminalHistory.length;
    },
    setHistoryIndex(state, action: PayloadAction<number>) {
      state.historyIndex = action.payload;
    },
    setUsername(state, action: PayloadAction<string>) {
      state.username = action.payload;
    },
    setHostname(state, action: PayloadAction<string>) {
      state.hostname = action.payload;
    },
  },
});

export const { setCwd, pushHistory, setHistoryIndex, setUsername, setHostname } =
  sessionSlice.actions;

export default sessionSlice.reducer;
