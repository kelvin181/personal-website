export type NodeId = string;

export interface FSBase {
  id: NodeId;
  name: string;
  parentId: NodeId | null;
  createdAt: number;
  modifiedAt: number;
}

export interface FSFile extends FSBase {
  type: "file";
  content: string;
  extension: string;
  size: number;
}

export interface FSDirectory extends FSBase {
  type: "directory";
  childIds: NodeId[];
}

export type FSNode = FSFile | FSDirectory;

export interface FileSystem {
  nodes: Record<NodeId, FSNode>;
  rootId: NodeId;
}

export function isFile(node: FSNode): node is FSFile {
  return node.type === "file";
}

export function isDirectory(node: FSNode): node is FSDirectory {
  return node.type === "directory";
}
