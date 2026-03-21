import { describe, it, expect, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import filesystemReducer, {
  createFile,
  createDirectory,
  deleteNode,
  updateFileContent,
  renameNode,
  moveNode,
  copyNode,
  resetFilesystem,
} from "../filesystemSlice";
import clipboardReducer, { clipboardCopy, clipboardCut, clipboardClear } from "../clipboardSlice";
import { FSDirectory, FSFile } from "@/lib/filesystem/types";
import { resolvePathToId } from "@/lib/filesystem/operations";

function makeStore() {
  return configureStore({
    reducer: {
      filesystem: filesystemReducer,
      clipboard: clipboardReducer,
    },
  });
}

type Store = ReturnType<typeof makeStore>;

let store: Store;

beforeEach(() => {
  store = makeStore();
  store.dispatch(resetFilesystem());
});

function fs() {
  return store.getState().filesystem;
}

/** Helper: resolve an absolute path to a node id in the current store state. */
function nodeAt(path: string) {
  return resolvePathToId(fs(), path);
}

// ---------------------------------------------------------------------------
// createFile
// ---------------------------------------------------------------------------
describe("filesystemSlice — createFile", () => {
  it("creates a file at the expected path", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "hello.txt", content: "hi" }));

    const id = nodeAt("/home/user/hello.txt");
    expect(id).toBeDefined();

    const node = fs().nodes[id!] as FSFile;
    expect(node.type).toBe("file");
    expect(node.content).toBe("hi");
    expect(node.name).toBe("hello.txt");
  });

  it("adds the new id to the parent's childIds", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "newfile.txt" }));

    const id = nodeAt("/home/user/newfile.txt")!;
    const parent = fs().nodes[homeId] as FSDirectory;
    expect(parent.childIds).toContain(id);
  });

  it("sets size to content length", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "sized.txt", content: "hello" }));
    const id = nodeAt("/home/user/sized.txt")!;
    expect((fs().nodes[id] as FSFile).size).toBe(5);
  });

  it("defaults to empty content when omitted", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "empty.txt" }));
    const id = nodeAt("/home/user/empty.txt")!;
    const node = fs().nodes[id] as FSFile;
    expect(node.content).toBe("");
    expect(node.size).toBe(0);
  });

  it("is a no-op for a duplicate name", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "dup.txt" }));
    const before = (fs().nodes[homeId] as FSDirectory).childIds.length;
    store.dispatch(createFile({ parentId: homeId, name: "dup.txt" }));
    expect((fs().nodes[homeId] as FSDirectory).childIds).toHaveLength(before);
  });

  it("is a no-op for a non-existent parentId", () => {
    const nodesBefore = Object.keys(fs().nodes).length;
    store.dispatch(createFile({ parentId: "nonexistent-id", name: "ghost.txt" }));
    expect(Object.keys(fs().nodes).length).toBe(nodesBefore);
  });
});

// ---------------------------------------------------------------------------
// createDirectory
// ---------------------------------------------------------------------------
describe("filesystemSlice — createDirectory", () => {
  it("creates a directory at the expected path", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createDirectory({ parentId: homeId, name: "downloads" }));

    const id = nodeAt("/home/user/downloads");
    expect(id).toBeDefined();
    expect(fs().nodes[id!].type).toBe("directory");
  });

  it("adds the new id to the parent's childIds", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createDirectory({ parentId: homeId, name: "downloads" }));
    const id = nodeAt("/home/user/downloads")!;
    expect((fs().nodes[homeId] as FSDirectory).childIds).toContain(id);
  });

  it("starts with empty childIds", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createDirectory({ parentId: homeId, name: "downloads" }));
    const id = nodeAt("/home/user/downloads")!;
    expect((fs().nodes[id] as FSDirectory).childIds).toEqual([]);
  });

  it("is a no-op for a duplicate name", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createDirectory({ parentId: homeId, name: "downloads" }));
    const before = (fs().nodes[homeId] as FSDirectory).childIds.length;
    store.dispatch(createDirectory({ parentId: homeId, name: "downloads" }));
    expect((fs().nodes[homeId] as FSDirectory).childIds).toHaveLength(before);
  });

  it("is a no-op for a non-existent parentId", () => {
    const nodesBefore = Object.keys(fs().nodes).length;
    store.dispatch(createDirectory({ parentId: "nonexistent-id", name: "ghost" }));
    expect(Object.keys(fs().nodes).length).toBe(nodesBefore);
  });
});

// ---------------------------------------------------------------------------
// deleteNode
// ---------------------------------------------------------------------------
describe("filesystemSlice — deleteNode", () => {
  it("removes the node from state", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "temp.txt" }));
    const id = nodeAt("/home/user/temp.txt")!;

    store.dispatch(deleteNode(id));

    expect(fs().nodes[id]).toBeUndefined();
    expect(nodeAt("/home/user/temp.txt")).toBeUndefined();
  });

  it("removes the id from the parent's childIds", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "temp.txt" }));
    const id = nodeAt("/home/user/temp.txt")!;

    store.dispatch(deleteNode(id));

    const parent = fs().nodes[homeId] as FSDirectory;
    expect(parent.childIds).not.toContain(id);
  });

  it("recursively removes a directory and all its descendants", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createDirectory({ parentId: homeId, name: "workspace" }));
    const wsId = nodeAt("/home/user/workspace")!;
    store.dispatch(createFile({ parentId: wsId, name: "file.txt" }));
    const fileId = nodeAt("/home/user/workspace/file.txt")!;

    store.dispatch(deleteNode(wsId));

    expect(fs().nodes[wsId]).toBeUndefined();
    expect(fs().nodes[fileId]).toBeUndefined();
  });

  it("recursively removes 3-level deep descendants", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createDirectory({ parentId: homeId, name: "a" }));
    const aId = nodeAt("/home/user/a")!;
    store.dispatch(createDirectory({ parentId: aId, name: "b" }));
    const bId = nodeAt("/home/user/a/b")!;
    store.dispatch(createFile({ parentId: bId, name: "deep.txt" }));
    const deepId = nodeAt("/home/user/a/b/deep.txt")!;

    store.dispatch(deleteNode(aId));

    expect(fs().nodes[aId]).toBeUndefined();
    expect(fs().nodes[bId]).toBeUndefined();
    expect(fs().nodes[deepId]).toBeUndefined();
    expect((fs().nodes[homeId] as FSDirectory).childIds).not.toContain(aId);
  });

  it("is a no-op for a non-existent node id", () => {
    const nodesBefore = Object.keys(fs().nodes).length;
    store.dispatch(deleteNode("nonexistent-id"));
    expect(Object.keys(fs().nodes).length).toBe(nodesBefore);
  });

  it("is a no-op when trying to delete root", () => {
    const rootId = fs().rootId;
    const nodesBefore = Object.keys(fs().nodes).length;
    store.dispatch(deleteNode(rootId));
    expect(Object.keys(fs().nodes).length).toBe(nodesBefore);
    expect(fs().nodes[rootId]).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// renameNode
// ---------------------------------------------------------------------------
describe("filesystemSlice — renameNode", () => {
  it("node is accessible at the new path after rename", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "old.txt" }));
    const id = nodeAt("/home/user/old.txt")!;

    store.dispatch(renameNode({ nodeId: id, newName: "new.md" }));

    expect(nodeAt("/home/user/new.md")).toBe(id);
    expect(nodeAt("/home/user/old.txt")).toBeUndefined();
  });

  it("updates the extension on rename", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "doc.txt" }));
    const id = nodeAt("/home/user/doc.txt")!;

    store.dispatch(renameNode({ nodeId: id, newName: "doc.md" }));

    expect((fs().nodes[id] as FSFile).extension).toBe("md");
  });

  it("sets extension to empty string when renamed to an extensionless name", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "doc.txt" }));
    const id = nodeAt("/home/user/doc.txt")!;

    store.dispatch(renameNode({ nodeId: id, newName: "README" }));

    expect((fs().nodes[id] as FSFile).extension).toBe("");
  });

  it("renames a directory correctly", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createDirectory({ parentId: homeId, name: "old-dir" }));
    const id = nodeAt("/home/user/old-dir")!;

    store.dispatch(renameNode({ nodeId: id, newName: "new-dir" }));

    expect(nodeAt("/home/user/new-dir")).toBe(id);
    expect(nodeAt("/home/user/old-dir")).toBeUndefined();
  });

  it("allows renaming to an existing sibling name (no collision guard)", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "a.txt" }));
    store.dispatch(createFile({ parentId: homeId, name: "b.txt" }));
    const aId = nodeAt("/home/user/a.txt")!;

    store.dispatch(renameNode({ nodeId: aId, newName: "b.txt" }));

    expect(fs().nodes[aId].name).toBe("b.txt");
  });
});

// ---------------------------------------------------------------------------
// moveNode
// ---------------------------------------------------------------------------
describe("filesystemSlice — moveNode", () => {
  it("node appears under new parent after move", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "move-me.txt" }));
    store.dispatch(createDirectory({ parentId: homeId, name: "dest" }));
    const fileId = nodeAt("/home/user/move-me.txt")!;
    const destId = nodeAt("/home/user/dest")!;

    store.dispatch(moveNode({ nodeId: fileId, newParentId: destId }));

    expect(nodeAt("/home/user/dest/move-me.txt")).toBe(fileId);
    expect(nodeAt("/home/user/move-me.txt")).toBeUndefined();
  });

  it("node is absent from old parent's childIds", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "move-me.txt" }));
    store.dispatch(createDirectory({ parentId: homeId, name: "dest" }));
    const fileId = nodeAt("/home/user/move-me.txt")!;
    const destId = nodeAt("/home/user/dest")!;

    store.dispatch(moveNode({ nodeId: fileId, newParentId: destId }));

    const home = fs().nodes[homeId] as FSDirectory;
    expect(home.childIds).not.toContain(fileId);
  });

  it("node is present in new parent's childIds", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "move-me.txt" }));
    store.dispatch(createDirectory({ parentId: homeId, name: "dest" }));
    const fileId = nodeAt("/home/user/move-me.txt")!;
    const destId = nodeAt("/home/user/dest")!;

    store.dispatch(moveNode({ nodeId: fileId, newParentId: destId }));

    const dest = fs().nodes[destId] as FSDirectory;
    expect(dest.childIds).toContain(fileId);
  });

  it("updates parentId of the moved node", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "move-me.txt" }));
    store.dispatch(createDirectory({ parentId: homeId, name: "dest" }));
    const fileId = nodeAt("/home/user/move-me.txt")!;
    const destId = nodeAt("/home/user/dest")!;

    store.dispatch(moveNode({ nodeId: fileId, newParentId: destId }));

    expect(fs().nodes[fileId].parentId).toBe(destId);
  });

  it("is a no-op when a name collision exists at destination", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "clash.txt" }));
    store.dispatch(createDirectory({ parentId: homeId, name: "dest" }));
    const fileId = nodeAt("/home/user/clash.txt")!;
    const destId = nodeAt("/home/user/dest")!;
    store.dispatch(createFile({ parentId: destId, name: "clash.txt" }));

    store.dispatch(moveNode({ nodeId: fileId, newParentId: destId }));

    expect(nodeAt("/home/user/clash.txt")).toBe(fileId);
  });

  it("moves a directory and its children to a new parent", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createDirectory({ parentId: homeId, name: "src" }));
    store.dispatch(createDirectory({ parentId: homeId, name: "dest" }));
    const srcId = nodeAt("/home/user/src")!;
    const destId = nodeAt("/home/user/dest")!;
    store.dispatch(createFile({ parentId: srcId, name: "child.txt" }));

    store.dispatch(moveNode({ nodeId: srcId, newParentId: destId }));

    expect(nodeAt("/home/user/dest/src")).toBe(srcId);
    expect(nodeAt("/home/user/src")).toBeUndefined();
    expect(fs().nodes[srcId].parentId).toBe(destId);
    // child is still inside src after the move
    const childId = nodeAt("/home/user/dest/src/child.txt");
    expect(childId).toBeDefined();
  });

  it("is a no-op when moving a node to its current parent", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "stay.txt" }));
    const fileId = nodeAt("/home/user/stay.txt")!;

    store.dispatch(moveNode({ nodeId: fileId, newParentId: homeId }));

    // file is still under homeId and parentId is unchanged
    expect(nodeAt("/home/user/stay.txt")).toBe(fileId);
    expect(fs().nodes[fileId].parentId).toBe(homeId);
  });

  it("is a no-op when destination does not exist", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "nomove.txt" }));
    const fileId = nodeAt("/home/user/nomove.txt")!;
    const nodesBefore = Object.keys(fs().nodes).length;

    store.dispatch(moveNode({ nodeId: fileId, newParentId: "nonexistent-id" }));

    expect(nodeAt("/home/user/nomove.txt")).toBe(fileId);
    expect(Object.keys(fs().nodes).length).toBe(nodesBefore);
  });

  it("is a no-op when trying to move root", () => {
    const rootId = fs().rootId;
    const homeId = nodeAt("/home/user")!;
    const rootChildCountBefore = (fs().nodes[rootId] as FSDirectory).childIds.length;

    store.dispatch(moveNode({ nodeId: rootId, newParentId: homeId }));

    expect((fs().nodes[rootId] as FSDirectory).childIds).toHaveLength(rootChildCountBefore);
  });

  it("is a no-op when the destination node is a file", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "source.txt" }));
    store.dispatch(createFile({ parentId: homeId, name: "target.txt" }));
    const sourceId = nodeAt("/home/user/source.txt")!;
    const targetId = nodeAt("/home/user/target.txt")!;

    store.dispatch(moveNode({ nodeId: sourceId, newParentId: targetId }));

    // source is still under homeId, not inside the file
    expect(nodeAt("/home/user/source.txt")).toBe(sourceId);
    expect(fs().nodes[sourceId].parentId).toBe(homeId);
  });
});

// ---------------------------------------------------------------------------
// copyNode
// ---------------------------------------------------------------------------
describe("filesystemSlice — copyNode", () => {
  it("original still exists at source path after copy", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "orig.txt", content: "abc" }));
    store.dispatch(createDirectory({ parentId: homeId, name: "dest" }));
    const fileId = nodeAt("/home/user/orig.txt")!;
    const destId = nodeAt("/home/user/dest")!;

    store.dispatch(copyNode({ nodeId: fileId, newParentId: destId }));

    expect(nodeAt("/home/user/orig.txt")).toBe(fileId);
  });

  it("copy appears at the destination path with a new id", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "orig.txt", content: "abc" }));
    store.dispatch(createDirectory({ parentId: homeId, name: "dest" }));
    const fileId = nodeAt("/home/user/orig.txt")!;
    const destId = nodeAt("/home/user/dest")!;

    store.dispatch(copyNode({ nodeId: fileId, newParentId: destId }));

    const copyId = nodeAt("/home/user/dest/orig.txt");
    expect(copyId).toBeDefined();
    expect(copyId).not.toBe(fileId);
  });

  it("copy preserves file content", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "orig.txt", content: "abc" }));
    store.dispatch(createDirectory({ parentId: homeId, name: "dest" }));
    const fileId = nodeAt("/home/user/orig.txt")!;
    const destId = nodeAt("/home/user/dest")!;

    store.dispatch(copyNode({ nodeId: fileId, newParentId: destId }));

    const copyId = nodeAt("/home/user/dest/orig.txt")!;
    expect((fs().nodes[copyId] as FSFile).content).toBe("abc");
  });

  it("deep-copies a directory with all descendants", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createDirectory({ parentId: homeId, name: "src-dir" }));
    const srcDirId = nodeAt("/home/user/src-dir")!;
    store.dispatch(createFile({ parentId: srcDirId, name: "child.txt", content: "data" }));
    store.dispatch(createDirectory({ parentId: homeId, name: "dest" }));
    const destId = nodeAt("/home/user/dest")!;

    store.dispatch(copyNode({ nodeId: srcDirId, newParentId: destId }));

    const copyDirId = nodeAt("/home/user/dest/src-dir");
    expect(copyDirId).toBeDefined();
    expect(copyDirId).not.toBe(srcDirId);
    const copyChildId = nodeAt("/home/user/dest/src-dir/child.txt");
    expect(copyChildId).toBeDefined();
    expect((fs().nodes[copyChildId!] as FSFile).content).toBe("data");
  });

  it("is a no-op when a name collision exists at destination", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "clash.txt" }));
    store.dispatch(createDirectory({ parentId: homeId, name: "dest" }));
    const fileId = nodeAt("/home/user/clash.txt")!;
    const destId = nodeAt("/home/user/dest")!;
    store.dispatch(createFile({ parentId: destId, name: "clash.txt" }));
    const destChildCountBefore = (fs().nodes[destId] as FSDirectory).childIds.length;

    store.dispatch(copyNode({ nodeId: fileId, newParentId: destId }));

    expect((fs().nodes[destId] as FSDirectory).childIds).toHaveLength(destChildCountBefore);
  });

  it("is a no-op when the source node does not exist", () => {
    const homeId = nodeAt("/home/user")!;
    const nodeCountBefore = Object.keys(fs().nodes).length;

    store.dispatch(copyNode({ nodeId: "nonexistent-id", newParentId: homeId }));

    expect(Object.keys(fs().nodes).length).toBe(nodeCountBefore);
  });

  it("deep-copies a 3-level directory hierarchy", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createDirectory({ parentId: homeId, name: "top" }));
    const topId = nodeAt("/home/user/top")!;
    store.dispatch(createDirectory({ parentId: topId, name: "mid" }));
    const midId = nodeAt("/home/user/top/mid")!;
    store.dispatch(createFile({ parentId: midId, name: "leaf.txt", content: "deep" }));
    store.dispatch(createDirectory({ parentId: homeId, name: "dest" }));
    const destId = nodeAt("/home/user/dest")!;

    store.dispatch(copyNode({ nodeId: topId, newParentId: destId }));

    const copyTopId = nodeAt("/home/user/dest/top");
    expect(copyTopId).toBeDefined();
    expect(copyTopId).not.toBe(topId);

    const copyMidId = nodeAt("/home/user/dest/top/mid");
    expect(copyMidId).toBeDefined();
    expect(copyMidId).not.toBe(midId);

    const copyLeafId = nodeAt("/home/user/dest/top/mid/leaf.txt");
    expect(copyLeafId).toBeDefined();
    expect((fs().nodes[copyLeafId!] as FSFile).content).toBe("deep");

    // originals untouched
    expect(nodeAt("/home/user/top")).toBe(topId);
    expect(nodeAt("/home/user/top/mid")).toBe(midId);
  });
});

// ---------------------------------------------------------------------------
// updateFileContent
// ---------------------------------------------------------------------------
describe("filesystemSlice — updateFileContent", () => {
  it("updates the content of a file", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "edit.txt", content: "old" }));
    const id = nodeAt("/home/user/edit.txt")!;

    store.dispatch(updateFileContent({ nodeId: id, content: "new content" }));

    expect((fs().nodes[id] as FSFile).content).toBe("new content");
  });

  it("updates size to match new content length", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "edit.txt", content: "old" }));
    const id = nodeAt("/home/user/edit.txt")!;

    store.dispatch(updateFileContent({ nodeId: id, content: "hi" }));

    expect((fs().nodes[id] as FSFile).size).toBe(2);
  });

  it("does not change other file metadata", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "edit.txt", content: "old" }));
    const id = nodeAt("/home/user/edit.txt")!;
    const before = fs().nodes[id] as FSFile;

    store.dispatch(updateFileContent({ nodeId: id, content: "new" }));

    const after = fs().nodes[id] as FSFile;
    expect(after.name).toBe(before.name);
    expect(after.extension).toBe(before.extension);
    expect(after.parentId).toBe(before.parentId);
  });

  it("is a no-op for a non-existent node id", () => {
    const nodesBefore = Object.keys(fs().nodes).length;
    store.dispatch(updateFileContent({ nodeId: "nonexistent-id", content: "data" }));
    expect(Object.keys(fs().nodes).length).toBe(nodesBefore);
  });

  it("is a no-op when the node is a directory", () => {
    const homeId = nodeAt("/home/user")!;
    const nameBefore = fs().nodes[homeId].name;
    store.dispatch(updateFileContent({ nodeId: homeId, content: "data" }));
    expect(fs().nodes[homeId].name).toBe(nameBefore);
    expect((fs().nodes[homeId] as FSDirectory).childIds).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// resetFilesystem
// ---------------------------------------------------------------------------
describe("filesystemSlice — resetFilesystem", () => {
  it("restores the initial filesystem state after mutations", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "temp.txt" }));
    expect(nodeAt("/home/user/temp.txt")).toBeDefined();

    store.dispatch(resetFilesystem());

    expect(nodeAt("/home/user/temp.txt")).toBeUndefined();
  });

  it("rootId is present after reset", () => {
    store.dispatch(resetFilesystem());
    expect(fs().rootId).toBeDefined();
    expect(fs().nodes[fs().rootId]).toBeDefined();
  });

  it("restores expected seeded paths after mutations", () => {
    const homeId = nodeAt("/home/user")!;
    store.dispatch(createFile({ parentId: homeId, name: "temp.txt" }));
    store.dispatch(deleteNode(nodeAt("/home/user/about")!));

    store.dispatch(resetFilesystem());

    expect(nodeAt("/home/user/about/bio.md")).toBeDefined();
    expect(nodeAt("/home/user/.bashrc")).toBeDefined();
    expect(nodeAt("/home/user/temp.txt")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// clipboardSlice
// ---------------------------------------------------------------------------
describe("clipboardSlice", () => {
  it("clipboardCopy sets nodeIds, operation=copy, and sourceDirectoryId", () => {
    store.dispatch(clipboardCopy({ nodeIds: ["a", "b"], sourceDirectoryId: "parent-dir" }));

    const clip = store.getState().clipboard;
    expect(clip.nodeIds).toEqual(["a", "b"]);
    expect(clip.operation).toBe("copy");
    expect(clip.sourceDirectoryId).toBe("parent-dir");
  });

  it("clipboardCut sets operation=cut", () => {
    store.dispatch(clipboardCut({ nodeIds: ["a"], sourceDirectoryId: "parent-dir" }));

    const clip = store.getState().clipboard;
    expect(clip.operation).toBe("cut");
  });

  it("clipboardClear resets all fields", () => {
    store.dispatch(clipboardCopy({ nodeIds: ["a"], sourceDirectoryId: "dir" }));
    store.dispatch(clipboardClear());

    const clip = store.getState().clipboard;
    expect(clip.nodeIds).toEqual([]);
    expect(clip.operation).toBeNull();
    expect(clip.sourceDirectoryId).toBeNull();
  });

  it("overwriting a copy with a cut replaces the operation", () => {
    store.dispatch(clipboardCopy({ nodeIds: ["a"], sourceDirectoryId: "dir" }));
    store.dispatch(clipboardCut({ nodeIds: ["b"], sourceDirectoryId: "dir2" }));

    const clip = store.getState().clipboard;
    expect(clip.operation).toBe("cut");
    expect(clip.nodeIds).toEqual(["b"]);
    expect(clip.sourceDirectoryId).toBe("dir2");
  });
});
