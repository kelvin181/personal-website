import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FileSystem, NodeId } from "@/lib/filesystem/types";
import { createInitialFileSystem } from "@/lib/filesystem/seed";
import {
  createFile as fsCreateFile,
  createDirectory as fsCreateDir,
  deleteNode as fsDeleteNode,
  updateFileContent as fsUpdateContent,
  renameNode as fsRenameNode,
  moveNode as fsMoveNode,
  copyNode as fsCopyNode,
} from "@/lib/filesystem/operations";

const initialState: FileSystem = createInitialFileSystem();

const filesystemSlice = createSlice({
  name: "filesystem",
  initialState,
  reducers: {
    createFile(state, action: PayloadAction<{ parentId: NodeId; name: string; content?: string }>) {
      const { parentId, name, content } = action.payload;
      const result = fsCreateFile(state, parentId, name, content || "");
      state.nodes = result.nodes;
    },
    createDirectory(state, action: PayloadAction<{ parentId: NodeId; name: string }>) {
      const { parentId, name } = action.payload;
      const result = fsCreateDir(state, parentId, name);
      state.nodes = result.nodes;
    },
    deleteNode(state, action: PayloadAction<NodeId>) {
      const result = fsDeleteNode(state, action.payload);
      state.nodes = result.nodes;
    },
    updateFileContent(state, action: PayloadAction<{ nodeId: NodeId; content: string }>) {
      const { nodeId, content } = action.payload;
      const result = fsUpdateContent(state, nodeId, content);
      state.nodes = result.nodes;
    },
    renameNode(state, action: PayloadAction<{ nodeId: NodeId; newName: string }>) {
      const { nodeId, newName } = action.payload;
      const result = fsRenameNode(state, nodeId, newName);
      state.nodes = result.nodes;
    },
    moveNode(state, action: PayloadAction<{ nodeId: NodeId; newParentId: NodeId }>) {
      const { nodeId, newParentId } = action.payload;
      const result = fsMoveNode(state, nodeId, newParentId);
      state.nodes = result.nodes;
    },
    copyNode(state, action: PayloadAction<{ nodeId: NodeId; newParentId: NodeId }>) {
      const { nodeId, newParentId } = action.payload;
      const result = fsCopyNode(state, nodeId, newParentId);
      state.nodes = result.nodes;
    },
    resetFilesystem() {
      return createInitialFileSystem();
    },
  },
});

export const {
  createFile,
  createDirectory,
  deleteNode,
  updateFileContent,
  renameNode,
  moveNode,
  copyNode,
  resetFilesystem,
} = filesystemSlice.actions;

export default filesystemSlice.reducer;
