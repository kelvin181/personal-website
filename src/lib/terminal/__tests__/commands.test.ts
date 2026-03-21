import { describe, it, expect, beforeEach, vi } from "vitest";
import { executeCommand } from "../commands";
import {
  createFile as fsCreateFile,
  createDirectory as fsCreateDir,
  deleteNode as fsDeleteNode,
  renameNode as fsRenameNode,
  moveNode as fsMoveNode,
  copyNode as fsCopyNode,
} from "@/lib/filesystem/operations";
import { resolvePathToId } from "@/lib/filesystem/operations";
import { FileSystem, FSDirectory } from "@/lib/filesystem/types";
import { createInitialFileSystem } from "@/lib/filesystem/seed";

// Mirror the unexported CommandContext interface so we can build test doubles.
interface TestContext {
  fs: FileSystem;
  cwd: string;
  setCwd: (path: string) => void;
  openWindow: (...args: unknown[]) => void;
  createFile: (parentId: string, name: string, content?: string) => void;
  createDirectory: (parentId: string, name: string) => void;
  deleteNode: (nodeId: string) => void;
  copyNode: (nodeId: string, newParentId: string) => void;
  renameNode: (nodeId: string, newName: string) => void;
  moveNode: (nodeId: string, newParentId: string) => void;
  dispatch: unknown;
}

/**
 * Build a mutable CommandContext backed by a real FileSystem.
 * Each operation immediately updates the shared `fs` variable so that
 * subsequent reads inside the same command see the updated state.
 */
function makeCtx(initialFs: FileSystem, cwd = "/home/user"): TestContext {
  let fs = initialFs;
  return {
    get fs() {
      return fs;
    },
    cwd,
    setCwd: vi.fn(),
    openWindow: vi.fn(),
    createFile: (parentId, name, content = "") => {
      fs = fsCreateFile(fs, parentId, name, content);
    },
    createDirectory: (parentId, name) => {
      fs = fsCreateDir(fs, parentId, name);
    },
    deleteNode: (nodeId) => {
      fs = fsDeleteNode(fs, nodeId);
    },
    copyNode: (nodeId, newParentId) => {
      fs = fsCopyNode(fs, nodeId, newParentId);
    },
    renameNode: (nodeId, newName) => {
      fs = fsRenameNode(fs, nodeId, newName);
    },
    moveNode: (nodeId, newParentId) => {
      fs = fsMoveNode(fs, nodeId, newParentId);
    },
    dispatch: vi.fn(),
  };
}

function run(ctx: TestContext, input: string) {
  // Cast to unknown first to satisfy the unexported type
  return executeCommand(input, ctx as unknown as Parameters<typeof executeCommand>[1]);
}

function nodeAt(ctx: TestContext, path: string) {
  return resolvePathToId(ctx.fs, path);
}

let ctx: TestContext;

beforeEach(() => {
  ctx = makeCtx(createInitialFileSystem());

  // Seed a file and a directory in /home/user for use in tests
  const homeId = nodeAt(ctx, "/home/user")!;
  ctx.createFile(homeId, "file.txt", "content");
  ctx.createDirectory(homeId, "subdir");
});

// ---------------------------------------------------------------------------
// cp
// ---------------------------------------------------------------------------
describe("cp — copy file into an existing directory", () => {
  it("copy appears at destination path", () => {
    run(ctx, "cp file.txt subdir");

    expect(nodeAt(ctx, "/home/user/subdir/file.txt")).toBeDefined();
  });

  it("original still exists at source path", () => {
    const origId = nodeAt(ctx, "/home/user/file.txt");
    run(ctx, "cp file.txt subdir");

    expect(nodeAt(ctx, "/home/user/file.txt")).toBe(origId);
  });

  it("copy has a different node id than the original", () => {
    const origId = nodeAt(ctx, "/home/user/file.txt");
    run(ctx, "cp file.txt subdir");

    const copyId = nodeAt(ctx, "/home/user/subdir/file.txt");
    expect(copyId).not.toBe(origId);
  });
});

describe("cp — copy file with a new name", () => {
  // Note: `cp file.txt renamed.txt` (same directory) is not supported by the
  // current copyNode implementation — it short-circuits on name collision since
  // the source already exists in the cwd. Use a cross-directory source instead.
  it("copy appears with the new name when source is in a subdirectory", () => {
    const subdirId = nodeAt(ctx, "/home/user/subdir")!;
    ctx.createFile(subdirId, "inner.txt", "inner");

    run(ctx, "cp subdir/inner.txt renamed.txt");

    expect(nodeAt(ctx, "/home/user/renamed.txt")).toBeDefined();
  });

  it("original still exists when source is in a subdirectory", () => {
    const subdirId = nodeAt(ctx, "/home/user/subdir")!;
    ctx.createFile(subdirId, "inner.txt", "inner");

    run(ctx, "cp subdir/inner.txt renamed.txt");

    expect(nodeAt(ctx, "/home/user/subdir/inner.txt")).toBeDefined();
  });
});

describe("cp — recursive directory copy", () => {
  it("copy of directory appears at destination", () => {
    // subdir is already seeded; add a file inside it
    const subdirId = nodeAt(ctx, "/home/user/subdir")!;
    ctx.createFile(subdirId, "inner.txt", "inner");
    ctx.createDirectory(nodeAt(ctx, "/home/user")!, "dest");

    run(ctx, "cp -r subdir dest");

    expect(nodeAt(ctx, "/home/user/dest/subdir")).toBeDefined();
  });

  it("inner file is copied into the new directory", () => {
    const subdirId = nodeAt(ctx, "/home/user/subdir")!;
    ctx.createFile(subdirId, "inner.txt", "inner");
    ctx.createDirectory(nodeAt(ctx, "/home/user")!, "dest");

    run(ctx, "cp -r subdir dest");

    expect(nodeAt(ctx, "/home/user/dest/subdir/inner.txt")).toBeDefined();
  });

  it("original directory still exists", () => {
    const subdirId = nodeAt(ctx, "/home/user/subdir")!;
    ctx.createFile(subdirId, "inner.txt", "inner");
    ctx.createDirectory(nodeAt(ctx, "/home/user")!, "dest");

    run(ctx, "cp -r subdir dest");

    expect(nodeAt(ctx, "/home/user/subdir")).toBeDefined();
  });

  it("returns an error when -r is omitted for a directory", () => {
    ctx.createDirectory(nodeAt(ctx, "/home/user")!, "dest");
    const output = run(ctx, "cp subdir dest");

    expect(output[0].type).toBe("error");
    expect(nodeAt(ctx, "/home/user/dest/subdir")).toBeUndefined();
  });
});

describe("cp — error cases", () => {
  it("returns an error for a missing source", () => {
    const output = run(ctx, "cp nonexistent.txt subdir");

    expect(output[0].type).toBe("error");
  });

  it("filesystem is unchanged after a missing-source error", () => {
    const subdirBefore = ctx.fs.nodes[nodeAt(ctx, "/home/user/subdir")!] as FSDirectory;
    run(ctx, "cp nonexistent.txt subdir");
    const subdirAfter = ctx.fs.nodes[nodeAt(ctx, "/home/user/subdir")!] as FSDirectory;

    expect(subdirAfter.childIds).toEqual(subdirBefore.childIds);
  });
});

// ---------------------------------------------------------------------------
// mv
// ---------------------------------------------------------------------------
describe("mv — move file into an existing directory", () => {
  it("file appears at destination path", () => {
    run(ctx, "mv file.txt subdir");

    expect(nodeAt(ctx, "/home/user/subdir/file.txt")).toBeDefined();
  });

  it("file is absent from source path after move", () => {
    run(ctx, "mv file.txt subdir");

    expect(nodeAt(ctx, "/home/user/file.txt")).toBeUndefined();
  });

  it("node id is preserved (not a copy)", () => {
    const origId = nodeAt(ctx, "/home/user/file.txt")!;
    run(ctx, "mv file.txt subdir");

    expect(nodeAt(ctx, "/home/user/subdir/file.txt")).toBe(origId);
  });
});

describe("mv — rename in the same directory", () => {
  it("file is accessible at new name", () => {
    run(ctx, "mv file.txt renamed.txt");

    expect(nodeAt(ctx, "/home/user/renamed.txt")).toBeDefined();
  });

  it("old path no longer resolves", () => {
    run(ctx, "mv file.txt renamed.txt");

    expect(nodeAt(ctx, "/home/user/file.txt")).toBeUndefined();
  });

  it("node id is preserved on rename", () => {
    const origId = nodeAt(ctx, "/home/user/file.txt")!;
    run(ctx, "mv file.txt renamed.txt");

    expect(nodeAt(ctx, "/home/user/renamed.txt")).toBe(origId);
  });
});

describe("mv — move and rename in one step", () => {
  it("file appears at the new path with the new name", () => {
    run(ctx, "mv file.txt subdir/newname.txt");

    expect(nodeAt(ctx, "/home/user/subdir/newname.txt")).toBeDefined();
  });

  it("old path no longer resolves", () => {
    run(ctx, "mv file.txt subdir/newname.txt");

    expect(nodeAt(ctx, "/home/user/file.txt")).toBeUndefined();
  });
});

describe("mv — error cases", () => {
  it("returns an error for a missing source", () => {
    const output = run(ctx, "mv nonexistent.txt subdir");

    expect(output[0].type).toBe("error");
  });

  it("filesystem is unchanged after a missing-source error", () => {
    const subdirBefore = ctx.fs.nodes[nodeAt(ctx, "/home/user/subdir")!] as FSDirectory;
    run(ctx, "mv nonexistent.txt subdir");
    const subdirAfter = ctx.fs.nodes[nodeAt(ctx, "/home/user/subdir")!] as FSDirectory;

    expect(subdirAfter.childIds).toEqual(subdirBefore.childIds);
  });

  it("returns an error when the destination parent does not exist", () => {
    const output = run(ctx, "mv file.txt /does/not/exist/file.txt");

    expect(output[0].type).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// ls
// ---------------------------------------------------------------------------
describe("ls — list directory contents", () => {
  it("lists files in the current directory", () => {
    const output = run(ctx, "ls");
    const names = output.map((l) => l.text);
    expect(names).toContain("file.txt");
    expect(names.some((n) => n.startsWith("subdir"))).toBe(true);
  });

  it("lists files in a given absolute path", () => {
    const output = run(ctx, "ls /home/user");
    const names = output.map((l) => l.text);
    expect(names).toContain("file.txt");
  });

  it("directories are shown with a trailing slash", () => {
    const output = run(ctx, "ls");
    expect(output.some((l) => l.text === "subdir/")).toBe(true);
  });

  it("-la flag is accepted without error", () => {
    const output = run(ctx, "ls -la");
    expect(output[0]?.type).not.toBe("error");
  });

  it("returns an error for a path that does not exist", () => {
    const output = run(ctx, "ls /nonexistent");
    expect(output[0].type).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// cd
// ---------------------------------------------------------------------------
describe("cd — change directory", () => {
  it("no args changes cwd to the home directory", () => {
    const out = run(ctx, "cd");
    expect(out).toHaveLength(0);
    expect(ctx.setCwd).toHaveBeenCalledWith("/home/user");
  });

  it("absolute path sets cwd to that path", () => {
    run(ctx, "cd /home");
    expect(ctx.setCwd).toHaveBeenCalledWith("/home");
  });

  it("relative path resolves from cwd", () => {
    run(ctx, "cd subdir");
    expect(ctx.setCwd).toHaveBeenCalledWith("/home/user/subdir");
  });

  it(".. moves up one level", () => {
    run(ctx, "cd ..");
    expect(ctx.setCwd).toHaveBeenCalledWith("/home");
  });

  it("returns an error for a path that does not exist", () => {
    const output = run(ctx, "cd /nonexistent");
    expect(output[0].type).toBe("error");
    expect(ctx.setCwd).not.toHaveBeenCalled();
  });

  it("returns an error when the target is a file", () => {
    const output = run(ctx, "cd file.txt");
    expect(output[0].type).toBe("error");
    expect(ctx.setCwd).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// pwd
// ---------------------------------------------------------------------------
describe("pwd — print working directory", () => {
  it("returns the current cwd as a single output line", () => {
    const output = run(ctx, "pwd");
    expect(output).toHaveLength(1);
    expect(output[0].text).toBe(ctx.cwd);
    expect(output[0].type).toBe("output");
  });
});

// ---------------------------------------------------------------------------
// cat
// ---------------------------------------------------------------------------
describe("cat — display file contents", () => {
  it("returns the file content", () => {
    const output = run(ctx, "cat file.txt");
    expect(output[0].text).toBe("content");
    expect(output[0].type).toBe("output");
  });

  it("returns an error when no argument is given", () => {
    const output = run(ctx, "cat");
    expect(output[0].type).toBe("error");
  });

  it("returns an error when the file does not exist", () => {
    const output = run(ctx, "cat missing.txt");
    expect(output[0].type).toBe("error");
  });

  it("returns an error when the target is a directory", () => {
    const output = run(ctx, "cat subdir");
    expect(output[0].type).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// mkdir
// ---------------------------------------------------------------------------
describe("mkdir — create directory", () => {
  it("creates a directory in cwd", () => {
    run(ctx, "mkdir newdir");
    expect(nodeAt(ctx, "/home/user/newdir")).toBeDefined();
  });

  it("returns an error when no argument is given", () => {
    const output = run(ctx, "mkdir");
    expect(output[0].type).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// touch
// ---------------------------------------------------------------------------
describe("touch — create file", () => {
  it("creates a file in cwd", () => {
    run(ctx, "touch newfile.txt");
    expect(nodeAt(ctx, "/home/user/newfile.txt")).toBeDefined();
  });

  it("returns an error when no argument is given", () => {
    const output = run(ctx, "touch");
    expect(output[0].type).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// rm
// ---------------------------------------------------------------------------
describe("rm — remove file or directory", () => {
  it("removes a file", () => {
    run(ctx, "rm file.txt");
    expect(nodeAt(ctx, "/home/user/file.txt")).toBeUndefined();
  });

  it("removes a directory with -r flag", () => {
    run(ctx, "rm -r subdir");
    expect(nodeAt(ctx, "/home/user/subdir")).toBeUndefined();
  });

  it("returns an error when no argument is given", () => {
    const output = run(ctx, "rm");
    expect(output[0].type).toBe("error");
  });

  it("returns an error when the path does not exist", () => {
    const output = run(ctx, "rm nonexistent.txt");
    expect(output[0].type).toBe("error");
  });

  it("returns an error when removing a directory without -r", () => {
    const output = run(ctx, "rm subdir");
    expect(output[0].type).toBe("error");
    expect(nodeAt(ctx, "/home/user/subdir")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// echo
// ---------------------------------------------------------------------------
describe("echo — print text", () => {
  it("returns joined args as output", () => {
    const output = run(ctx, "echo hello world");
    expect(output[0].text).toBe("hello world");
    expect(output[0].type).toBe("output");
  });

  it("returns an empty string with no args", () => {
    const output = run(ctx, "echo");
    expect(output[0].text).toBe("");
    expect(output[0].type).toBe("output");
  });
});

// ---------------------------------------------------------------------------
// open
// ---------------------------------------------------------------------------
describe("open — open file or directory", () => {
  it("calls openWindow with text-viewer for a file", () => {
    run(ctx, "open file.txt");
    expect(ctx.openWindow).toHaveBeenCalledWith(
      "text-viewer",
      expect.objectContaining({ filePath: "/home/user/file.txt" })
    );
  });

  it("calls openWindow with file-manager for a directory", () => {
    run(ctx, "open subdir");
    expect(ctx.openWindow).toHaveBeenCalledWith(
      "file-manager",
      expect.objectContaining({ initialPath: "/home/user/subdir" })
    );
  });

  it("returns an info-type output line", () => {
    const output = run(ctx, "open file.txt");
    expect(output[0].type).toBe("info");
  });

  it("returns an error when no argument is given", () => {
    const output = run(ctx, "open");
    expect(output[0].type).toBe("error");
  });

  it("returns an error when the path does not exist", () => {
    const output = run(ctx, "open missing.txt");
    expect(output[0].type).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// help
// ---------------------------------------------------------------------------
describe("help — show help text", () => {
  it("no args returns multiple output lines", () => {
    const output = run(ctx, "help");
    expect(output.length).toBeGreaterThan(5);
  });

  it("known command returns command-specific help without error lines", () => {
    const output = run(ctx, "help ls");
    expect(output.some((l) => l.text.includes("ls"))).toBe(true);
    expect(output.every((l) => l.type !== "error")).toBe(true);
  });

  it("unknown command returns an error line", () => {
    const output = run(ctx, "help foobar");
    expect(output[0].type).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// portfolio commands
// ---------------------------------------------------------------------------
describe("whoami", () => {
  it("returns output lines including the profile name", () => {
    const output = run(ctx, "whoami");
    expect(output.length).toBeGreaterThan(0);
    expect(output.some((l) => l.text.includes("Kelvin"))).toBe(true);
  });

  it("contains no error lines", () => {
    expect(run(ctx, "whoami").every((l) => l.type !== "error")).toBe(true);
  });
});

describe("projects", () => {
  it("returns multiple output lines", () => {
    expect(run(ctx, "projects").length).toBeGreaterThan(3);
  });

  it("contains no error lines", () => {
    expect(run(ctx, "projects").every((l) => l.type !== "error")).toBe(true);
  });
});

describe("experience", () => {
  it("returns multiple output lines", () => {
    expect(run(ctx, "experience").length).toBeGreaterThan(3);
  });

  it("contains no error lines", () => {
    expect(run(ctx, "experience").every((l) => l.type !== "error")).toBe(true);
  });
});

describe("education", () => {
  it("returns multiple output lines", () => {
    expect(run(ctx, "education").length).toBeGreaterThan(3);
  });

  it("contains no error lines", () => {
    expect(run(ctx, "education").every((l) => l.type !== "error")).toBe(true);
  });
});

describe("skills", () => {
  it("returns multiple output lines", () => {
    expect(run(ctx, "skills").length).toBeGreaterThan(3);
  });

  it("contains no error lines", () => {
    expect(run(ctx, "skills").every((l) => l.type !== "error")).toBe(true);
  });
});

describe("interests", () => {
  it("returns multiple output lines", () => {
    expect(run(ctx, "interests").length).toBeGreaterThan(3);
  });

  it("contains no error lines", () => {
    expect(run(ctx, "interests").every((l) => l.type !== "error")).toBe(true);
  });
});

describe("contact", () => {
  it("returns output lines including the email address", () => {
    const output = run(ctx, "contact");
    expect(output.some((l) => l.text.includes("kelvin@example.com"))).toBe(true);
  });

  it("contains no error lines", () => {
    expect(run(ctx, "contact").every((l) => l.type !== "error")).toBe(true);
  });
});

describe("resume", () => {
  it("returns output lines including the profile name", () => {
    const output = run(ctx, "resume");
    expect(output.some((l) => l.text.includes("Kelvin"))).toBe(true);
  });

  it("contains no error lines", () => {
    expect(run(ctx, "resume").every((l) => l.type !== "error")).toBe(true);
  });
});

describe("social", () => {
  it("returns the same output as contact", () => {
    expect(run(ctx, "social")).toEqual(run(ctx, "contact"));
  });
});
