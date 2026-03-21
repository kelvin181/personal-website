"use client";

import { FSNode } from "@/lib/filesystem/types";
import FileItem from "./FileItem";

interface FileListProps {
  items: FSNode[];
  onDoubleClick: (node: FSNode) => void;
}

export default function FileList({ items, onDoubleClick }: FileListProps) {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-terminal-dim text-sm">
        Empty directory
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-1">
      {items.map((node) => (
        <FileItem key={node.id} node={node} onDoubleClick={onDoubleClick} />
      ))}
    </div>
  );
}
