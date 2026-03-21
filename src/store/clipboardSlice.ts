import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NodeId } from "@/lib/filesystem/types";

interface ClipboardState {
  nodeIds: NodeId[];
  operation: "copy" | "cut" | null;
  sourceDirectoryId: NodeId | null;
}

const initialState: ClipboardState = {
  nodeIds: [],
  operation: null,
  sourceDirectoryId: null,
};

const clipboardSlice = createSlice({
  name: "clipboard",
  initialState,
  reducers: {
    clipboardCopy(state, action: PayloadAction<{ nodeIds: NodeId[]; sourceDirectoryId: NodeId }>) {
      state.nodeIds = action.payload.nodeIds;
      state.operation = "copy";
      state.sourceDirectoryId = action.payload.sourceDirectoryId;
    },
    clipboardCut(state, action: PayloadAction<{ nodeIds: NodeId[]; sourceDirectoryId: NodeId }>) {
      state.nodeIds = action.payload.nodeIds;
      state.operation = "cut";
      state.sourceDirectoryId = action.payload.sourceDirectoryId;
    },
    clipboardClear(state) {
      state.nodeIds = [];
      state.operation = null;
      state.sourceDirectoryId = null;
    },
  },
});

export const { clipboardCopy, clipboardCut, clipboardClear } = clipboardSlice.actions;

export default clipboardSlice.reducer;
