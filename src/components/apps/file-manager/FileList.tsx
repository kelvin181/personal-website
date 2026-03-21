"use client";

import { FSNode } from "@/lib/filesystem/types";
import FileItem from "./FileItem";

interface FileListProps {
  items: FSNode[];
  selectedNodeIds: Set<string>;
  cutNodeIds: Set<string>;
  renamingNodeId: string | null;
  nodes: Record<string, FSNode>;
  onDoubleClick: (node: FSNode) => void;
  onSelect: (nodeId: string, multi: boolean) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string | null) => void;
  onRenameSubmit: (nodeId: string, newName: string) => void;
  onRenameCancel: () => void;
  onDrop: (draggedNodeIds: string[], targetNodeId: string) => void;
}

export default function FileList({
  items,
  selectedNodeIds,
  cutNodeIds,
  renamingNodeId,
  nodes,
  onDoubleClick,
  onSelect,
  onContextMenu,
  onRenameSubmit,
  onRenameCancel,
  onDrop,
}: FileListProps) {
  if (items.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center text-terminal-dim text-sm"
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, null);
        }}
      >
        Empty directory
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-1"
      onClick={(e) => {
        // Clear selection when clicking empty space
        if (e.target === e.currentTarget) {
          onSelect("", false);
        }
      }}
      onContextMenu={(e) => {
        // Right-click on empty space
        if (e.target === e.currentTarget) {
          e.preventDefault();
          onContextMenu(e, null);
        }
      }}
    >
      {items.map((node) => (
        <FileItem
          key={node.id}
          node={node}
          isSelected={selectedNodeIds.has(node.id)}
          isCut={cutNodeIds.has(node.id)}
          isRenaming={renamingNodeId === node.id}
          selectedNodeIds={selectedNodeIds}
          nodes={nodes}
          onDoubleClick={onDoubleClick}
          onSelect={onSelect}
          onContextMenu={(e, nodeId) => {
            e.preventDefault();
            onContextMenu(e, nodeId);
          }}
          onRenameSubmit={onRenameSubmit}
          onRenameCancel={onRenameCancel}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
}
