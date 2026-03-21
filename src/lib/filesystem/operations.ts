import { v4 as uuidv4 } from "uuid";
import { FileSystem, FSFile, FSDirectory, FSNode, NodeId, isDirectory, isFile } from "./types";
import { getExtension, getNodeByPath } from "./utils";

export function createFile(
  fs: FileSystem,
  parentId: NodeId,
  name: string,
  content: string = ""
): FileSystem {
  const parent = fs.nodes[parentId];
  if (!parent || !isDirectory(parent)) return fs;

  // Check if name already exists
  const exists = parent.childIds.some((id) => fs.nodes[id]?.name === name);
  if (exists) return fs;

  const now = Date.now();
  const id = uuidv4();
  const file: FSFile = {
    id,
    name,
    parentId,
    type: "file",
    content,
    extension: getExtension(name),
    size: content.length,
    createdAt: now,
    modifiedAt: now,
  };

  return {
    ...fs,
    nodes: {
      ...fs.nodes,
      [id]: file,
      [parentId]: {
        ...parent,
        childIds: [...parent.childIds, id],
      },
    },
  };
}

export function createDirectory(fs: FileSystem, parentId: NodeId, name: string): FileSystem {
  const parent = fs.nodes[parentId];
  if (!parent || !isDirectory(parent)) return fs;

  const exists = parent.childIds.some((id) => fs.nodes[id]?.name === name);
  if (exists) return fs;

  const now = Date.now();
  const id = uuidv4();
  const dir: FSDirectory = {
    id,
    name,
    parentId,
    type: "directory",
    childIds: [],
    createdAt: now,
    modifiedAt: now,
  };

  return {
    ...fs,
    nodes: {
      ...fs.nodes,
      [id]: dir,
      [parentId]: {
        ...parent,
        childIds: [...parent.childIds, id],
      },
    },
  };
}

export function deleteNode(fs: FileSystem, nodeId: NodeId): FileSystem {
  const node = fs.nodes[nodeId];
  if (!node || !node.parentId) return fs; // Can't delete root

  const newNodes = { ...fs.nodes };

  // Recursively collect all descendant IDs
  function collectIds(id: NodeId): NodeId[] {
    const n = newNodes[id];
    if (!n) return [id];
    if (isDirectory(n)) {
      return [id, ...n.childIds.flatMap(collectIds)];
    }
    return [id];
  }

  const idsToDelete = collectIds(nodeId);
  for (const id of idsToDelete) {
    delete newNodes[id];
  }

  // Remove from parent's childIds
  const parent = newNodes[node.parentId];
  if (parent && isDirectory(parent)) {
    newNodes[node.parentId] = {
      ...parent,
      childIds: parent.childIds.filter((id) => id !== nodeId),
    };
  }

  return { ...fs, nodes: newNodes };
}

export function updateFileContent(fs: FileSystem, nodeId: NodeId, content: string): FileSystem {
  const node = fs.nodes[nodeId];
  if (!node || !isFile(node)) return fs;

  return {
    ...fs,
    nodes: {
      ...fs.nodes,
      [nodeId]: {
        ...node,
        content,
        size: content.length,
        modifiedAt: Date.now(),
      },
    },
  };
}

export function renameNode(fs: FileSystem, nodeId: NodeId, newName: string): FileSystem {
  const node = fs.nodes[nodeId];
  if (!node) return fs;

  const updated: FSNode = isFile(node)
    ? { ...node, name: newName, extension: getExtension(newName), modifiedAt: Date.now() }
    : { ...node, name: newName, modifiedAt: Date.now() };

  return {
    ...fs,
    nodes: {
      ...fs.nodes,
      [nodeId]: updated,
    },
  };
}

export function moveNode(fs: FileSystem, nodeId: NodeId, newParentId: NodeId): FileSystem {
  const node = fs.nodes[nodeId];
  if (!node || !node.parentId) return fs;

  const oldParent = fs.nodes[node.parentId];
  const newParent = fs.nodes[newParentId];
  if (!oldParent || !isDirectory(oldParent)) return fs;
  if (!newParent || !isDirectory(newParent)) return fs;

  // Check for name collision
  const exists = newParent.childIds.some((id) => fs.nodes[id]?.name === node.name);
  if (exists) return fs;

  return {
    ...fs,
    nodes: {
      ...fs.nodes,
      [nodeId]: { ...node, parentId: newParentId },
      [node.parentId]: {
        ...oldParent,
        childIds: oldParent.childIds.filter((id) => id !== nodeId),
      },
      [newParentId]: {
        ...newParent,
        childIds: [...newParent.childIds, nodeId],
      },
    },
  };
}

export function copyNode(fs: FileSystem, nodeId: NodeId, newParentId: NodeId): FileSystem {
  const node = fs.nodes[nodeId];
  if (!node) return fs;

  const newParent = fs.nodes[newParentId];
  if (!newParent || !isDirectory(newParent)) return fs;

  // Check for name collision
  const exists = newParent.childIds.some((id) => fs.nodes[id]?.name === node.name);
  if (exists) return fs;

  const newNodes = { ...fs.nodes };

  function deepCopy(srcId: NodeId, destParentId: NodeId): NodeId {
    const src = fs.nodes[srcId];
    if (!src) return srcId;

    const now = Date.now();
    const newId = uuidv4();

    if (isFile(src)) {
      const copy: FSFile = {
        ...src,
        id: newId,
        parentId: destParentId,
        createdAt: now,
        modifiedAt: now,
      };
      newNodes[newId] = copy;
    } else if (isDirectory(src)) {
      const newChildIds = src.childIds.map((childId) => deepCopy(childId, newId));
      const copy: FSDirectory = {
        ...src,
        id: newId,
        parentId: destParentId,
        childIds: newChildIds,
        createdAt: now,
        modifiedAt: now,
      };
      newNodes[newId] = copy;
    }

    return newId;
  }

  const copiedId = deepCopy(nodeId, newParentId);

  // Add to new parent's childIds
  newNodes[newParentId] = {
    ...newParent,
    childIds: [...newParent.childIds, copiedId],
  };

  return { ...fs, nodes: newNodes };
}

export function getChildren(fs: FileSystem, dirId: NodeId): FSNode[] {
  const dir = fs.nodes[dirId];
  if (!dir || !isDirectory(dir)) return [];
  return dir.childIds
    .map((id) => fs.nodes[id])
    .filter(Boolean)
    .sort((a, b) => {
      // Directories first, then alphabetical
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export function resolvePathToId(fs: FileSystem, path: string): NodeId | undefined {
  const node = getNodeByPath(fs, path);
  return node?.id;
}
