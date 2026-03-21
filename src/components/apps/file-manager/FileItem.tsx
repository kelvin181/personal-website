"use client";

import { FSNode, isDirectory, isFile } from "@/lib/filesystem/types";

interface FileItemProps {
  node: FSNode;
  onDoubleClick: (node: FSNode) => void;
}

function getFileIcon(node: FSNode): string {
  if (isDirectory(node)) return "📁";
  if (isFile(node)) {
    switch (node.extension) {
      case "md":
        return "📝";
      case "txt":
        return "📄";
      case "json":
        return "📋";
      case "ts":
      case "tsx":
      case "js":
      case "jsx":
        return "⚙️";
      default:
        return "📄";
    }
  }
  return "📄";
}

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileItem({ node, onDoubleClick }: FileItemProps) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-1.5 hover:bg-white/5 cursor-pointer rounded transition-colors group"
      onDoubleClick={() => onDoubleClick(node)}
    >
      <span className="text-sm">{getFileIcon(node)}</span>
      <span
        className={`flex-1 text-sm truncate ${
          isDirectory(node) ? "text-terminal-accent" : "text-terminal-fg"
        }`}
      >
        {node.name}
        {isDirectory(node) && "/"}
      </span>
      {isFile(node) && <span className="text-xs text-terminal-dim">{formatSize(node.size)}</span>}
    </div>
  );
}
