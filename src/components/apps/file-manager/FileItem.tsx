"use client";

import { useState, useRef, useEffect } from "react";
import { FSNode, isDirectory, isFile } from "@/lib/filesystem/types";

interface FileItemProps {
  node: FSNode;
  isSelected: boolean;
  isCut: boolean;
  isRenaming: boolean;
  selectedNodeIds: Set<string>;
  nodes: Record<string, FSNode>;
  onDoubleClick: (node: FSNode) => void;
  onSelect: (nodeId: string, multi: boolean) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  onRenameSubmit: (nodeId: string, newName: string) => void;
  onRenameCancel: () => void;
  onDrop: (draggedNodeIds: string[], targetNodeId: string) => void;
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

export default function FileItem({
  node,
  isSelected,
  isCut,
  isRenaming,
  selectedNodeIds,
  nodes,
  onDoubleClick,
  onSelect,
  onContextMenu,
  onRenameSubmit,
  onRenameCancel,
  onDrop,
}: FileItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.value = node.name;
      inputRef.current.focus();
      // Select the name part without extension for files
      if (isFile(node) && node.extension) {
        const dotIndex = node.name.lastIndexOf(".");
        if (dotIndex > 0) {
          inputRef.current.setSelectionRange(0, dotIndex);
        } else {
          inputRef.current.select();
        }
      } else {
        inputRef.current.select();
      }
    }
  }, [isRenaming, node.name, node]);

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submitRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onRenameCancel();
    }
  }

  function submitRename() {
    const trimmed = (inputRef.current?.value ?? node.name).trim();
    if (trimmed && !trimmed.includes("/")) {
      onRenameSubmit(node.id, trimmed);
    } else {
      onRenameCancel();
    }
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-1.5 cursor-pointer rounded transition-colors group ${
        isSelected
          ? "bg-terminal-accent/10 border border-terminal-accent/30"
          : isDragOver && isDirectory(node)
            ? "bg-terminal-accent/20 border border-terminal-accent/50"
            : "border border-transparent hover:bg-white/5"
      } ${isCut ? "opacity-50" : ""}`}
      draggable={!isRenaming}
      onClick={(e) => onSelect(node.id, e.metaKey || e.ctrlKey)}
      onDoubleClick={() => onDoubleClick(node)}
      onContextMenu={(e) => onContextMenu(e, node.id)}
      onDragStart={(e) => {
        const dragIds =
          isSelected && selectedNodeIds.size > 1 ? Array.from(selectedNodeIds) : [node.id];
        e.dataTransfer.setData("text/plain", JSON.stringify(dragIds));
        e.dataTransfer.effectAllowed = "move";

        // Build a custom ghost showing only the dragged items
        const ghost = document.createElement("div");
        Object.assign(ghost.style, {
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          pointerEvents: "none",
          background: "#0a0a0a",
          border: "1px solid rgba(74,222,128,0.3)",
          borderRadius: "4px",
          padding: "4px",
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#f0f0f0",
          minWidth: "180px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        });
        dragIds.forEach((id) => {
          const n = nodes[id];
          if (!n) return;
          const row = document.createElement("div");
          Object.assign(row.style, {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "2px 8px",
          });
          row.textContent = (isDirectory(n) ? "📁 " : "📄 ") + n.name;
          ghost.appendChild(row);
        });
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 12, 12);
        ghostRef.current = ghost;
      }}
      onDragEnd={() => {
        ghostRef.current?.remove();
        ghostRef.current = null;
      }}
      onDragOver={(e) => {
        if (!isDirectory(node)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!isDirectory(node)) return;
        let draggedIds: string[] = [];
        try {
          draggedIds = JSON.parse(e.dataTransfer.getData("text/plain") || "[]");
        } catch {
          return;
        }
        const validIds = draggedIds.filter((id) => id !== node.id);
        if (validIds.length > 0) {
          onDrop(validIds, node.id);
        }
      }}
    >
      <span className="text-sm">{getFileIcon(node)}</span>
      {isRenaming ? (
        <input
          ref={inputRef}
          className="flex-1 bg-terminal-bg border border-terminal-accent/50 rounded px-1 text-sm text-terminal-fg outline-none font-mono"
          defaultValue={node.name}
          onKeyDown={handleRenameKeyDown}
          onBlur={submitRename}
        />
      ) : (
        <span
          className={`flex-1 text-sm truncate ${
            isDirectory(node) ? "text-terminal-accent" : "text-terminal-fg"
          }`}
        >
          {node.name}
          {isDirectory(node) && "/"}
        </span>
      )}
      {isFile(node) && !isRenaming && (
        <span className="text-xs text-terminal-dim">{formatSize(node.size)}</span>
      )}
    </div>
  );
}
