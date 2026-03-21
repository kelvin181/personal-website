import { describe, it, expect } from "vitest";
import { createInitialFileSystem } from "../seed";
import { getNodeByPath } from "../utils";
import { FSDirectory, FSFile } from "../types";

const fs = createInitialFileSystem();

function nodeAt(path: string) {
  return getNodeByPath(fs, path);
}

describe("createInitialFileSystem — structure", () => {
  it("rootId is 'root'", () => {
    expect(fs.rootId).toBe("root");
    expect(fs.nodes["root"]).toBeDefined();
  });

  it("/home/user exists and is a directory", () => {
    const node = nodeAt("/home/user");
    expect(node).toBeDefined();
    expect(node!.type).toBe("directory");
  });

  it("/home/user/about/bio.md exists as a file with non-empty content", () => {
    const node = nodeAt("/home/user/about/bio.md");
    expect(node).toBeDefined();
    expect(node!.type).toBe("file");
    expect((node as FSFile).content.length).toBeGreaterThan(0);
  });

  it("/home/user/about/contact.md exists", () => {
    expect(nodeAt("/home/user/about/contact.md")).toBeDefined();
  });

  it("/home/user/projects/README.md exists", () => {
    expect(nodeAt("/home/user/projects/README.md")).toBeDefined();
  });

  it("/home/user/projects has at least one project .md file besides README", () => {
    const projectsDir = nodeAt("/home/user/projects") as FSDirectory;
    expect(projectsDir).toBeDefined();
    const childFiles = projectsDir.childIds
      .map((id) => fs.nodes[id])
      .filter((n) => n && n.type === "file" && n.name !== "README.md");
    expect(childFiles.length).toBeGreaterThan(0);
  });

  it("/home/user/experience/README.md exists", () => {
    expect(nodeAt("/home/user/experience/README.md")).toBeDefined();
  });

  it("/home/user/education/README.md exists", () => {
    expect(nodeAt("/home/user/education/README.md")).toBeDefined();
  });

  it("/home/user/skills/README.md exists", () => {
    expect(nodeAt("/home/user/skills/README.md")).toBeDefined();
  });

  it("/home/user/interests/README.md exists", () => {
    expect(nodeAt("/home/user/interests/README.md")).toBeDefined();
  });

  it("/home/user/resume/resume.md exists with non-empty content", () => {
    const node = nodeAt("/home/user/resume/resume.md");
    expect(node).toBeDefined();
    expect((node as FSFile).content.length).toBeGreaterThan(0);
  });

  it("/home/user/Pictures exists and is an empty directory", () => {
    const node = nodeAt("/home/user/Pictures");
    expect(node).toBeDefined();
    expect(node!.type).toBe("directory");
    expect((node as FSDirectory).childIds).toHaveLength(0);
  });

  it("/home/user/.bashrc exists as a file with empty extension (dotfile)", () => {
    const node = nodeAt("/home/user/.bashrc");
    expect(node).toBeDefined();
    expect(node!.type).toBe("file");
    expect((node as FSFile).extension).toBe("");
    expect((node as FSFile).content.length).toBeGreaterThan(0);
  });
});
