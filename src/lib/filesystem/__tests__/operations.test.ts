import { describe, it, expect, beforeEach } from "vitest";
import {
  createFile,
  createDirectory,
  deleteNode,
  updateFileContent,
  renameNode,
  moveNode,
  copyNode,
  getChildren,
  resolvePathToId,
} from "../operations";
import { FileSystem, FSDirectory, FSFile } from "../types";

/** Minimal filesystem fixture:
 *  root/
 *    docs/
 *      readme.txt
 *    images/
 */
function buildFs(): FileSystem {
  return {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        name: "/",
        parentId: null,
        type: "directory",
        childIds: ["docs", "images"],
        createdAt: 0,
        modifiedAt: 0,
      } as FSDirectory,
      docs: {
        id: "docs",
        name: "docs",
        parentId: "root",
        type: "directory",
        childIds: ["readme"],
        createdAt: 0,
        modifiedAt: 0,
      } as FSDirectory,
      images: {
        id: "images",
        name: "images",
        parentId: "root",
        type: "directory",
        childIds: [],
        createdAt: 0,
        modifiedAt: 0,
      } as FSDirectory,
      readme: {
        id: "readme",
        name: "readme.txt",
        parentId: "docs",
        type: "file",
        content: "hello world",
        extension: "txt",
        size: 11,
        createdAt: 0,
        modifiedAt: 0,
      } as FSFile,
    },
  };
}

let fs: FileSystem;

beforeEach(() => {
  fs = buildFs();
});

// ---------------------------------------------------------------------------
// createFile
// ---------------------------------------------------------------------------
describe("createFile", () => {
  it("adds the new node to nodes map", () => {
    const next = createFile(fs, "images", "photo.png", "data");
    const imageDir = next.nodes["images"] as FSDirectory;
    const newId = imageDir.childIds.find((id) => next.nodes[id]?.name === "photo.png");
    expect(newId).toBeDefined();
    const file = next.nodes[newId!] as FSFile;
    expect(file.type).toBe("file");
    expect(file.content).toBe("data");
    expect(file.extension).toBe("png");
    expect(file.parentId).toBe("images");
  });

  it("adds the new id to the parent's childIds", () => {
    const next = createFile(fs, "images", "photo.png");
    const imageDir = next.nodes["images"] as FSDirectory;
    expect(imageDir.childIds).toHaveLength(1);
  });

  it("is a no-op when a file with the same name already exists", () => {
    const next = createFile(fs, "docs", "readme.txt");
    expect(next).toBe(fs); // returns same reference when unchanged
  });

  it("is a no-op when the parent does not exist", () => {
    const next = createFile(fs, "nonexistent", "file.txt");
    expect(next).toBe(fs);
  });

  it("is a no-op when the parent is a file, not a directory", () => {
    const next = createFile(fs, "readme", "nested.txt");
    expect(next).toBe(fs);
  });

  it("sets size to content.length", () => {
    const next = createFile(fs, "images", "photo.png", "data");
    const imageDir = next.nodes["images"] as FSDirectory;
    const newId = imageDir.childIds.find((id) => next.nodes[id]?.name === "photo.png")!;
    expect((next.nodes[newId] as FSFile).size).toBe(4);
  });

  it("defaults content to empty string when omitted", () => {
    const next = createFile(fs, "images", "empty.txt");
    const imageDir = next.nodes["images"] as FSDirectory;
    const newId = imageDir.childIds.find((id) => next.nodes[id]?.name === "empty.txt")!;
    const file = next.nodes[newId] as FSFile;
    expect(file.content).toBe("");
    expect(file.size).toBe(0);
  });

  it("sets extension to empty string for filenames without a dot", () => {
    const next = createFile(fs, "images", "Makefile");
    const imageDir = next.nodes["images"] as FSDirectory;
    const newId = imageDir.childIds.find((id) => next.nodes[id]?.name === "Makefile")!;
    expect((next.nodes[newId] as FSFile).extension).toBe("");
  });

  it("sets extension to empty string for dotfiles", () => {
    const next = createFile(fs, "images", ".gitignore");
    const imageDir = next.nodes["images"] as FSDirectory;
    const newId = imageDir.childIds.find((id) => next.nodes[id]?.name === ".gitignore")!;
    expect((next.nodes[newId] as FSFile).extension).toBe("");
  });

  it("sets createdAt and modifiedAt to the same value at creation", () => {
    const before = Date.now();
    const next = createFile(fs, "images", "new.txt", "hi");
    const imageDir = next.nodes["images"] as FSDirectory;
    const newId = imageDir.childIds.find((id) => next.nodes[id]?.name === "new.txt")!;
    const file = next.nodes[newId] as FSFile;
    expect(file.createdAt).toBe(file.modifiedAt);
    expect(file.createdAt).toBeGreaterThanOrEqual(before);
  });
});

// ---------------------------------------------------------------------------
// createDirectory
// ---------------------------------------------------------------------------
describe("createDirectory", () => {
  it("adds the new directory node", () => {
    const next = createDirectory(fs, "root", "downloads");
    const rootDir = next.nodes["root"] as FSDirectory;
    const newId = rootDir.childIds.find((id) => next.nodes[id]?.name === "downloads");
    expect(newId).toBeDefined();
    expect(next.nodes[newId!].type).toBe("directory");
    expect(next.nodes[newId!].parentId).toBe("root");
  });

  it("adds the new id to the parent's childIds", () => {
    const next = createDirectory(fs, "root", "downloads");
    const rootDir = next.nodes["root"] as FSDirectory;
    expect(rootDir.childIds).toContain(
      rootDir.childIds.find((id) => next.nodes[id]?.name === "downloads")
    );
  });

  it("is a no-op for a duplicate name", () => {
    const next = createDirectory(fs, "root", "docs");
    expect(next).toBe(fs);
  });

  it("is a no-op when the parent does not exist", () => {
    const next = createDirectory(fs, "nonexistent", "sub");
    expect(next).toBe(fs);
  });

  it("is a no-op when the parent is a file", () => {
    const next = createDirectory(fs, "readme", "sub");
    expect(next).toBe(fs);
  });

  it("new directory starts with empty childIds", () => {
    const next = createDirectory(fs, "root", "downloads");
    const rootDir = next.nodes["root"] as FSDirectory;
    const newId = rootDir.childIds.find((id) => next.nodes[id]?.name === "downloads")!;
    expect((next.nodes[newId] as FSDirectory).childIds).toEqual([]);
  });

  it("sets createdAt and modifiedAt to the same value at creation", () => {
    const before = Date.now();
    const next = createDirectory(fs, "root", "downloads");
    const rootDir = next.nodes["root"] as FSDirectory;
    const newId = rootDir.childIds.find((id) => next.nodes[id]?.name === "downloads")!;
    const dir = next.nodes[newId];
    expect(dir.createdAt).toBe(dir.modifiedAt);
    expect(dir.createdAt).toBeGreaterThanOrEqual(before);
  });
});

// ---------------------------------------------------------------------------
// deleteNode
// ---------------------------------------------------------------------------
describe("deleteNode", () => {
  it("removes the node from nodes map", () => {
    const next = deleteNode(fs, "readme");
    expect(next.nodes["readme"]).toBeUndefined();
  });

  it("removes the node id from its parent's childIds", () => {
    const next = deleteNode(fs, "readme");
    const docs = next.nodes["docs"] as FSDirectory;
    expect(docs.childIds).not.toContain("readme");
  });

  it("recursively removes all descendants when deleting a directory", () => {
    const next = deleteNode(fs, "docs");
    expect(next.nodes["docs"]).toBeUndefined();
    expect(next.nodes["readme"]).toBeUndefined();
    const root = next.nodes["root"] as FSDirectory;
    expect(root.childIds).not.toContain("docs");
  });

  it("is a no-op when trying to delete the root (no parentId)", () => {
    const next = deleteNode(fs, "root");
    expect(next).toBe(fs);
  });

  it("is a no-op when the node does not exist", () => {
    const next = deleteNode(fs, "nonexistent");
    expect(next).toBe(fs);
  });

  it("recursively removes deeply nested descendants", () => {
    // docs → readme; add docs/sub/deep.txt and verify all three levels are removed
    const withSub = createDirectory(fs, "docs", "sub");
    const subId = (withSub.nodes["docs"] as FSDirectory).childIds.find(
      (id) => withSub.nodes[id]?.name === "sub"
    )!;
    const withDeep = createFile(withSub, subId, "deep.txt", "");
    const deepId = (withDeep.nodes[subId] as FSDirectory).childIds[0];

    const next = deleteNode(withDeep, "docs");
    expect(next.nodes["docs"]).toBeUndefined();
    expect(next.nodes["readme"]).toBeUndefined();
    expect(next.nodes[subId]).toBeUndefined();
    expect(next.nodes[deepId]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// renameNode
// ---------------------------------------------------------------------------
describe("renameNode", () => {
  it("updates the node name", () => {
    const next = renameNode(fs, "readme", "notes.md");
    expect(next.nodes["readme"].name).toBe("notes.md");
  });

  it("updates the file extension", () => {
    const next = renameNode(fs, "readme", "notes.md");
    const file = next.nodes["readme"] as FSFile;
    expect(file.extension).toBe("md");
  });

  it("does not change the parentId", () => {
    const next = renameNode(fs, "readme", "notes.md");
    expect(next.nodes["readme"].parentId).toBe("docs");
  });

  it("updates modifiedAt", () => {
    const before = fs.nodes["readme"].modifiedAt;
    const next = renameNode(fs, "readme", "notes.md");
    expect(next.nodes["readme"].modifiedAt).toBeGreaterThanOrEqual(before);
  });

  it("preserves createdAt", () => {
    const original = fs.nodes["readme"].createdAt;
    const next = renameNode(fs, "readme", "notes.md");
    expect(next.nodes["readme"].createdAt).toBe(original);
  });

  it("updates the directory name without changing extension", () => {
    const next = renameNode(fs, "docs", "documents");
    expect(next.nodes["docs"].name).toBe("documents");
  });

  it("sets extension to empty string when renamed to an extensionless name", () => {
    const next = renameNode(fs, "readme", "README");
    expect((next.nodes["readme"] as FSFile).extension).toBe("");
  });

  it("is a no-op when the node does not exist", () => {
    const next = renameNode(fs, "nonexistent", "name.txt");
    expect(next).toBe(fs);
  });

  it("renames even when a sibling already has the new name (no collision check)", () => {
    // renameNode intentionally has no collision guard; this documents that behavior
    const next = renameNode(fs, "readme", "docs");
    expect(next.nodes["readme"].name).toBe("docs");
  });
});

// ---------------------------------------------------------------------------
// moveNode
// ---------------------------------------------------------------------------
describe("moveNode", () => {
  it("updates the node's parentId to the new parent", () => {
    const next = moveNode(fs, "readme", "images");
    expect(next.nodes["readme"].parentId).toBe("images");
  });

  it("removes the node from the old parent's childIds", () => {
    const next = moveNode(fs, "readme", "images");
    const docs = next.nodes["docs"] as FSDirectory;
    expect(docs.childIds).not.toContain("readme");
  });

  it("adds the node to the new parent's childIds", () => {
    const next = moveNode(fs, "readme", "images");
    const images = next.nodes["images"] as FSDirectory;
    expect(images.childIds).toContain("readme");
  });

  it("is a no-op when a name collision exists in the destination", () => {
    const withCollision = createFile(fs, "images", "readme.txt");
    const next = moveNode(withCollision, "readme", "images");
    const docs = next.nodes["docs"] as FSDirectory;
    expect(docs.childIds).toContain("readme");
  });

  it("is a no-op when the node does not exist", () => {
    const next = moveNode(fs, "nonexistent", "images");
    expect(next).toBe(fs);
  });

  it("is a no-op when trying to move the root", () => {
    const next = moveNode(fs, "root", "images");
    expect(next).toBe(fs);
  });

  it("is a no-op when the destination does not exist", () => {
    const next = moveNode(fs, "readme", "nonexistent");
    expect(next).toBe(fs);
  });

  it("moves a directory along with all its children", () => {
    const next = moveNode(fs, "docs", "images");
    // docs now lives under images
    const images = next.nodes["images"] as FSDirectory;
    expect(images.childIds).toContain("docs");
    // docs' parentId updated
    expect(next.nodes["docs"].parentId).toBe("images");
    // child of docs (readme) is still a child of docs
    const docs = next.nodes["docs"] as FSDirectory;
    expect(docs.childIds).toContain("readme");
    // docs removed from root
    const root = next.nodes["root"] as FSDirectory;
    expect(root.childIds).not.toContain("docs");
  });

  it("is a no-op when moving a node to its current parent", () => {
    // docs is already a child of root; moving it to root should hit a name collision and be a no-op
    const next = moveNode(fs, "docs", "root");
    expect(next).toBe(fs);
  });

  it("is a no-op when the destination is a file, not a directory", () => {
    const next = moveNode(fs, "docs", "readme");
    expect(next).toBe(fs);
  });

  it("preserves both createdAt and modifiedAt on the moved node", () => {
    const orig = fs.nodes["readme"];
    const next = moveNode(fs, "readme", "images");
    const moved = next.nodes["readme"];
    expect(moved.createdAt).toBe(orig.createdAt);
    expect(moved.modifiedAt).toBe(orig.modifiedAt);
  });

  it("moving a node into its own descendant silently creates a circular parentId chain (known limitation)", () => {
    // There is no guard against this — the operation succeeds and corrupts the tree.
    // This test documents the current behavior so any future guard is visible as a change.
    const withSub = createDirectory(fs, "docs", "sub");
    const subId = (withSub.nodes["docs"] as FSDirectory).childIds.find(
      (id) => withSub.nodes[id]?.name === "sub"
    )!;
    const next = moveNode(withSub, "docs", subId);
    // docs is moved under sub, but sub is still listed as a child of docs
    expect(next.nodes["docs"].parentId).toBe(subId);
    // sub's parentId still points to docs — circular
    expect(next.nodes[subId].parentId).toBe("docs");
  });
});

// ---------------------------------------------------------------------------
// copyNode
// ---------------------------------------------------------------------------
describe("copyNode", () => {
  it("creates a new node with a different id", () => {
    const next = copyNode(fs, "readme", "images");
    const images = next.nodes["images"] as FSDirectory;
    const copyId = images.childIds.find(
      (id) => next.nodes[id]?.name === "readme.txt" && id !== "readme"
    );
    expect(copyId).toBeDefined();
    expect(copyId).not.toBe("readme");
  });

  it("the copy appears in the destination's childIds", () => {
    const next = copyNode(fs, "readme", "images");
    const images = next.nodes["images"] as FSDirectory;
    expect(images.childIds).toHaveLength(1);
  });

  it("the original node still exists at its source location", () => {
    const next = copyNode(fs, "readme", "images");
    expect(next.nodes["readme"]).toBeDefined();
    const docs = next.nodes["docs"] as FSDirectory;
    expect(docs.childIds).toContain("readme");
  });

  it("copies file content", () => {
    const next = copyNode(fs, "readme", "images");
    const images = next.nodes["images"] as FSDirectory;
    const copyId = images.childIds[0];
    const copy = next.nodes[copyId] as FSFile;
    expect(copy.content).toBe("hello world");
  });

  it("deep-copies a directory with all descendants", () => {
    const next = copyNode(fs, "docs", "images");
    const images = next.nodes["images"] as FSDirectory;
    const copyDirId = images.childIds.find(
      (id) => next.nodes[id]?.name === "docs" && id !== "docs"
    );
    expect(copyDirId).toBeDefined();
    const copyDir = next.nodes[copyDirId!] as FSDirectory;
    expect(copyDir.childIds).toHaveLength(1);
    const copyFileId = copyDir.childIds[0];
    expect(next.nodes[copyFileId]).toBeDefined();
    expect(next.nodes[copyFileId].name).toBe("readme.txt");
    // New ids — none of the copies share ids with originals
    expect(copyDirId).not.toBe("docs");
    expect(copyFileId).not.toBe("readme");
  });

  it("is a no-op when a name collision exists in the destination", () => {
    const next = copyNode(fs, "readme", "docs");
    const docs = next.nodes["docs"] as FSDirectory;
    expect(docs.childIds).toHaveLength(1);
  });

  it("sets the correct parentId on deep-copied child nodes", () => {
    const next = copyNode(fs, "docs", "images");
    const images = next.nodes["images"] as FSDirectory;
    const copyDirId = images.childIds.find((id) => next.nodes[id]?.name === "docs")!;
    const copyDir = next.nodes[copyDirId] as FSDirectory;
    const copyFileId = copyDir.childIds[0];
    expect(next.nodes[copyFileId].parentId).toBe(copyDirId);
  });

  it("is a no-op when the destination does not exist", () => {
    const next = copyNode(fs, "readme", "nonexistent");
    expect(next).toBe(fs);
  });

  it("is a no-op when the source node does not exist", () => {
    const next = copyNode(fs, "nonexistent", "images");
    expect(next).toBe(fs);
  });

  it("is a no-op when the destination is a file, not a directory", () => {
    const next = copyNode(fs, "docs", "readme");
    expect(next).toBe(fs);
  });

  it("resets createdAt and modifiedAt on the copied node to a new time", () => {
    // The fixture uses 0 for both timestamps; copies should have newer values.
    const before = Date.now();
    const next = copyNode(fs, "readme", "images");
    const images = next.nodes["images"] as FSDirectory;
    const copyId = images.childIds.find((id) => id !== "readme")!;
    const copy = next.nodes[copyId];
    expect(copy.createdAt).toBeGreaterThanOrEqual(before);
    expect(copy.modifiedAt).toBeGreaterThanOrEqual(before);
  });

  it("does not alter the original node's timestamps after a copy", () => {
    const origCreatedAt = fs.nodes["readme"].createdAt;
    const origModifiedAt = fs.nodes["readme"].modifiedAt;
    const next = copyNode(fs, "readme", "images");
    expect(next.nodes["readme"].createdAt).toBe(origCreatedAt);
    expect(next.nodes["readme"].modifiedAt).toBe(origModifiedAt);
  });
});

// ---------------------------------------------------------------------------
// getChildren
// ---------------------------------------------------------------------------
describe("getChildren", () => {
  it("returns directories before files", () => {
    // root has docs (dir) and images (dir); add a file to root for better coverage
    const withFile = createFile(fs, "root", "readme.txt", "");
    const children = getChildren(withFile, "root");
    const types = children.map((c) => c.type);
    const firstFileIdx = types.indexOf("file");
    const lastDirIdx = types.lastIndexOf("directory");
    expect(lastDirIdx).toBeLessThan(firstFileIdx);
  });

  it("sorts entries alphabetically within each group", () => {
    const withBeta = createDirectory(fs, "root", "alpha");
    const withAlpha = createDirectory(withBeta, "root", "beta");
    const children = getChildren(withAlpha, "root");
    const dirNames = children.filter((c) => c.type === "directory").map((c) => c.name);
    expect(dirNames).toEqual([...dirNames].sort());
  });

  it("returns empty array for a non-directory node", () => {
    expect(getChildren(fs, "readme")).toEqual([]);
  });

  it("returns empty array for a non-existent node", () => {
    expect(getChildren(fs, "nonexistent")).toEqual([]);
  });

  it("returns empty array for an empty directory", () => {
    expect(getChildren(fs, "images")).toEqual([]);
  });

  it("silently filters out stale child IDs that reference non-existent nodes", () => {
    // Manually inject a dangling child ID into a directory
    const withStale: typeof fs = {
      ...fs,
      nodes: {
        ...fs.nodes,
        images: {
          ...(fs.nodes["images"] as import("../types").FSDirectory),
          childIds: ["stale-id-that-does-not-exist"],
        },
      },
    };
    expect(getChildren(withStale, "images")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// resolvePathToId
// ---------------------------------------------------------------------------
describe("resolvePathToId", () => {
  it("returns the root id for '/'", () => {
    expect(resolvePathToId(fs, "/")).toBe("root");
  });

  it("returns the correct id for a top-level directory", () => {
    expect(resolvePathToId(fs, "/docs")).toBe("docs");
  });

  it("returns the correct id for a nested file", () => {
    expect(resolvePathToId(fs, "/docs/readme.txt")).toBe("readme");
  });

  it("returns undefined for a non-existent path", () => {
    expect(resolvePathToId(fs, "/docs/missing.txt")).toBeUndefined();
  });

  it("resolves paths with dot segments", () => {
    expect(resolvePathToId(fs, "/docs/../docs/readme.txt")).toBe("readme");
  });
});

// ---------------------------------------------------------------------------
// updateFileContent
// ---------------------------------------------------------------------------
describe("updateFileContent", () => {
  it("updates the content of a file", () => {
    const next = updateFileContent(fs, "readme", "new content");
    expect((next.nodes["readme"] as FSFile).content).toBe("new content");
  });

  it("updates size to match new content length", () => {
    const next = updateFileContent(fs, "readme", "hi");
    expect((next.nodes["readme"] as FSFile).size).toBe(2);
  });

  it("updates modifiedAt", () => {
    const before = fs.nodes["readme"].modifiedAt;
    const next = updateFileContent(fs, "readme", "updated");
    expect((next.nodes["readme"] as FSFile).modifiedAt).toBeGreaterThanOrEqual(before);
  });

  it("does not change other file metadata", () => {
    const orig = fs.nodes["readme"] as FSFile;
    const next = updateFileContent(fs, "readme", "updated");
    const updated = next.nodes["readme"] as FSFile;
    expect(updated.name).toBe(orig.name);
    expect(updated.extension).toBe(orig.extension);
    expect(updated.parentId).toBe(orig.parentId);
    expect(updated.createdAt).toBe(orig.createdAt);
  });

  it("is a no-op when the node does not exist", () => {
    const next = updateFileContent(fs, "nonexistent", "data");
    expect(next).toBe(fs);
  });

  it("is a no-op when the node is a directory", () => {
    const next = updateFileContent(fs, "docs", "data");
    expect(next).toBe(fs);
  });
});
