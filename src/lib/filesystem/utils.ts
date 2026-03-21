import { FileSystem, FSNode, isDirectory, NodeId } from "./types";

export function normalizePath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return "/" + resolved.join("/");
}

export function getNodeByPath(fs: FileSystem, path: string): FSNode | undefined {
  const normalized = normalizePath(path);
  if (normalized === "/") {
    return fs.nodes[fs.rootId];
  }

  const parts = normalized.split("/").filter(Boolean);
  let current = fs.nodes[fs.rootId];

  for (const part of parts) {
    if (!isDirectory(current)) return undefined;
    const childId = current.childIds.find((id) => {
      const child = fs.nodes[id];
      return child && child.name === part;
    });
    if (!childId) return undefined;
    current = fs.nodes[childId];
  }

  return current;
}

export function getNodePath(fs: FileSystem, nodeId: NodeId): string {
  const parts: string[] = [];
  let current = fs.nodes[nodeId];

  while (current && current.parentId !== null) {
    parts.unshift(current.name);
    current = fs.nodes[current.parentId];
  }

  return "/" + parts.join("/");
}

export function getParentPath(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split("/").filter(Boolean);
  parts.pop();
  return "/" + parts.join("/");
}

export function getBasename(path: string): string {
  const parts = normalizePath(path).split("/").filter(Boolean);
  return parts[parts.length - 1] || "/";
}

export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0) return "";
  return filename.slice(lastDot + 1);
}
