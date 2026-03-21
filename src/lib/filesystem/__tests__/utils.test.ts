import { describe, it, expect } from "vitest";
import {
  normalizePath,
  getNodeByPath,
  getNodePath,
  getParentPath,
  getBasename,
  getExtension,
} from "../utils";
import { FileSystem, FSDirectory, FSFile, isFile, isDirectory } from "../types";

/** Minimal filesystem fixture:
 *  root/
 *    home/
 *      user/
 *        notes.txt
 *    etc/
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
        childIds: ["home", "etc"],
        createdAt: 0,
        modifiedAt: 0,
      } as FSDirectory,
      home: {
        id: "home",
        name: "home",
        parentId: "root",
        type: "directory",
        childIds: ["user"],
        createdAt: 0,
        modifiedAt: 0,
      } as FSDirectory,
      user: {
        id: "user",
        name: "user",
        parentId: "home",
        type: "directory",
        childIds: ["notes"],
        createdAt: 0,
        modifiedAt: 0,
      } as FSDirectory,
      etc: {
        id: "etc",
        name: "etc",
        parentId: "root",
        type: "directory",
        childIds: [],
        createdAt: 0,
        modifiedAt: 0,
      } as FSDirectory,
      notes: {
        id: "notes",
        name: "notes.txt",
        parentId: "user",
        type: "file",
        content: "hello",
        extension: "txt",
        size: 5,
        createdAt: 0,
        modifiedAt: 0,
      } as FSFile,
    },
  };
}

const fs = buildFs();

// ---------------------------------------------------------------------------
// normalizePath
// ---------------------------------------------------------------------------
describe("normalizePath", () => {
  it("returns '/' for the root path", () => {
    expect(normalizePath("/")).toBe("/");
  });

  it("normalizes a simple absolute path", () => {
    expect(normalizePath("/home/user")).toBe("/home/user");
  });

  it("resolves single-dot segments", () => {
    expect(normalizePath("/home/./user")).toBe("/home/user");
  });

  it("resolves double-dot segments", () => {
    expect(normalizePath("/home/user/..")).toBe("/home");
  });

  it("resolves multiple double-dots", () => {
    expect(normalizePath("/home/user/../../etc")).toBe("/etc");
  });

  it("collapses consecutive slashes", () => {
    expect(normalizePath("/home//user")).toBe("/home/user");
  });

  it("removes trailing slash", () => {
    expect(normalizePath("/home/user/")).toBe("/home/user");
  });

  it("handles a path that is just dot-dot", () => {
    expect(normalizePath("/..")).toBe("/");
  });

  it("handles empty string as root", () => {
    expect(normalizePath("")).toBe("/");
  });

  it("handles a path with chained parent traversals", () => {
    expect(normalizePath("/a/b/c/../..")).toBe("/a");
  });

  it("handles a path with only dot segments", () => {
    expect(normalizePath("/./././")).toBe("/");
  });

  it("treats a relative path (no leading slash) as if it were absolute", () => {
    // split("/").filter(Boolean) discards the empty first segment, so relative
    // paths are promoted to absolute ones — document this behavior
    expect(normalizePath("home/user")).toBe("/home/user");
  });
});

// ---------------------------------------------------------------------------
// getNodeByPath
// ---------------------------------------------------------------------------
describe("getNodeByPath", () => {
  it("returns the root node for '/'", () => {
    expect(getNodeByPath(fs, "/")).toBe(fs.nodes["root"]);
  });

  it("returns a top-level directory", () => {
    expect(getNodeByPath(fs, "/home")).toBe(fs.nodes["home"]);
  });

  it("returns a deeply nested file", () => {
    expect(getNodeByPath(fs, "/home/user/notes.txt")).toBe(fs.nodes["notes"]);
  });

  it("returns undefined for a non-existent path", () => {
    expect(getNodeByPath(fs, "/home/user/missing.txt")).toBeUndefined();
  });

  it("returns undefined when traversing through a file", () => {
    expect(getNodeByPath(fs, "/home/user/notes.txt/sub")).toBeUndefined();
  });

  it("resolves paths with dot segments", () => {
    expect(getNodeByPath(fs, "/home/./user/notes.txt")).toBe(fs.nodes["notes"]);
  });

  it("resolves paths with double-dot segments", () => {
    expect(getNodeByPath(fs, "/home/user/../user/notes.txt")).toBe(fs.nodes["notes"]);
  });

  it("returns undefined when a directory has a stale childId that does not match the sought name", () => {
    // The child && guard in the find callback skips dangling IDs silently.
    const withStale: FileSystem = {
      ...fs,
      nodes: {
        ...fs.nodes,
        user: {
          ...(fs.nodes["user"] as FSDirectory),
          childIds: ["stale-id", "notes"],
        },
      },
    };
    // "stale-id" is not in nodes; lookup should skip it and still find notes.txt
    expect(getNodeByPath(withStale, "/home/user/notes.txt")).toBe(withStale.nodes["notes"]);
    // A name that only a stale node would have returns undefined (no crash)
    expect(getNodeByPath(withStale, "/home/user/ghost.txt")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getNodePath
// ---------------------------------------------------------------------------
describe("getNodePath", () => {
  it("returns '/' for the root node", () => {
    expect(getNodePath(fs, "root")).toBe("/");
  });

  it("returns the correct path for a top-level directory", () => {
    expect(getNodePath(fs, "home")).toBe("/home");
  });

  it("returns the correct path for a nested directory", () => {
    expect(getNodePath(fs, "user")).toBe("/home/user");
  });

  it("returns the correct path for a deeply nested file", () => {
    expect(getNodePath(fs, "notes")).toBe("/home/user/notes.txt");
  });

  it("returns '/' for a non-existent node id", () => {
    // current is undefined → while loop never runs → returns "/"
    expect(getNodePath(fs, "nonexistent")).toBe("/");
  });

  it("stops traversal when a node's parentId points to a non-existent node", () => {
    // Build a filesystem where a node's parent chain is broken
    const broken: FileSystem = {
      rootId: "root",
      nodes: {
        root: {
          id: "root",
          name: "/",
          parentId: null,
          type: "directory",
          childIds: [],
          createdAt: 0,
          modifiedAt: 0,
        } as FSDirectory,
        orphan: {
          id: "orphan",
          name: "orphan.txt",
          parentId: "missing-parent", // points to a node that doesn't exist
          type: "file",
          content: "",
          extension: "txt",
          size: 0,
          createdAt: 0,
          modifiedAt: 0,
        } as FSFile,
      },
    };
    // The while loop exits when `current` becomes undefined (missing parent)
    // and returns "/" + [] = "/"
    expect(getNodePath(broken, "orphan")).toBe("/orphan.txt");
  });
});

// ---------------------------------------------------------------------------
// getParentPath
// ---------------------------------------------------------------------------
describe("getParentPath", () => {
  it("returns '/' for a top-level path", () => {
    expect(getParentPath("/home")).toBe("/");
  });

  it("returns the parent directory path", () => {
    expect(getParentPath("/home/user")).toBe("/home");
  });

  it("returns the parent for a deeply nested path", () => {
    expect(getParentPath("/home/user/notes.txt")).toBe("/home/user");
  });

  it("returns '/' for the root path itself", () => {
    expect(getParentPath("/")).toBe("/");
  });
});

// ---------------------------------------------------------------------------
// getBasename
// ---------------------------------------------------------------------------
describe("getBasename", () => {
  it("returns the last segment of a path", () => {
    expect(getBasename("/home/user/notes.txt")).toBe("notes.txt");
  });

  it("returns the directory name for a directory path", () => {
    expect(getBasename("/home/user")).toBe("user");
  });

  it("returns '/' for the root path", () => {
    expect(getBasename("/")).toBe("/");
  });

  it("handles trailing slashes", () => {
    expect(getBasename("/home/user/")).toBe("user");
  });
});

// ---------------------------------------------------------------------------
// getExtension
// ---------------------------------------------------------------------------
describe("getExtension", () => {
  it("returns the extension for a normal filename", () => {
    expect(getExtension("notes.txt")).toBe("txt");
  });

  it("returns the extension after the last dot for multiple dots", () => {
    expect(getExtension("archive.tar.gz")).toBe("gz");
  });

  it("returns empty string for a filename with no extension", () => {
    expect(getExtension("Makefile")).toBe("");
  });

  it("returns empty string for dotfiles (leading dot only)", () => {
    expect(getExtension(".gitignore")).toBe("");
  });

  it("returns the extension for dotfiles with an extension", () => {
    expect(getExtension(".hidden.md")).toBe("md");
  });

  it("returns empty string for an empty filename", () => {
    expect(getExtension("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// isFile / isDirectory type guards
// ---------------------------------------------------------------------------
describe("isFile", () => {
  it("returns true for a file node", () => {
    expect(isFile(fs.nodes["notes"])).toBe(true);
  });

  it("returns false for a directory node", () => {
    expect(isFile(fs.nodes["user"])).toBe(false);
  });
});

describe("isDirectory", () => {
  it("returns true for a directory node", () => {
    expect(isDirectory(fs.nodes["user"])).toBe(true);
  });

  it("returns false for a file node", () => {
    expect(isDirectory(fs.nodes["notes"])).toBe(false);
  });
});
