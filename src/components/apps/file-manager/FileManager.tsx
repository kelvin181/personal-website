"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { openWindow } from "@/store/windowsSlice";
import {
  createFile,
  createDirectory,
  deleteNode,
  renameNode,
  moveNode,
  copyNode,
} from "@/store/filesystemSlice";
import { clipboardCopy, clipboardCut, clipboardClear } from "@/store/clipboardSlice";
import { FSNode, NodeId, isDirectory, isFile } from "@/lib/filesystem/types";
import { getNodeByPath } from "@/lib/filesystem/utils";
import { getChildren } from "@/lib/filesystem/operations";
import Breadcrumb from "./Breadcrumb";
import FileList from "./FileList";
import FileManagerContextMenu from "./FileManagerContextMenu";
import type { MenuItemDef } from "./FileManagerContextMenu";
import ConfirmDialog from "./ConfirmDialog";

function ParentDirEntry({
  currentPath,
  currentNode,
  onNavigate,
  onDrop,
}: {
  currentPath: string;
  currentNode: FSNode | undefined;
  onNavigate: (path: string) => void;
  onDrop: (draggedNodeIds: string[], targetNodeId: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const parentId = currentNode?.parentId;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-1.5 cursor-pointer text-terminal-dim ${
        isDragOver
          ? "bg-terminal-accent/20 border border-terminal-accent/50"
          : "border border-transparent hover:bg-white/5"
      }`}
      onDoubleClick={() => {
        const parts = currentPath.split("/").filter(Boolean);
        parts.pop();
        onNavigate("/" + parts.join("/") || "/");
      }}
      onDragOver={(e) => {
        if (!parentId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!parentId) return;
        let draggedIds: string[] = [];
        try {
          draggedIds = JSON.parse(e.dataTransfer.getData("text/plain") || "[]");
        } catch {
          return;
        }
        if (draggedIds.length > 0) {
          onDrop(draggedIds, parentId);
        }
      }}
    >
      <span className="text-sm">📁</span>
      <span className="text-sm">..</span>
    </div>
  );
}

interface FileManagerProps {
  initialPath?: string;
}

export default function FileManager({ initialPath }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState(initialPath || "/home/user");
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string | null;
  } | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastClickedId = useRef<string | null>(null);
  const displayedNodesRef = useRef<FSNode[]>([]);

  const fs = useAppSelector((s) => s.filesystem);
  const clipboard = useAppSelector((s) => s.clipboard);
  const dispatch = useAppDispatch();

  const currentNode = getNodeByPath(fs, currentPath);
  const children = useMemo(
    () => (currentNode && isDirectory(currentNode) ? getChildren(fs, currentNode.id) : []),
    [fs, currentNode]
  );

  const cutNodeIds = new Set(clipboard.operation === "cut" ? clipboard.nodeIds : []);

  useEffect(() => {
    displayedNodesRef.current = children;
  }, [children]);

  // Clear selection when navigating — use the setter callback form
  const setCurrentPathAndClearSelection = useCallback((path: string) => {
    setCurrentPath(path);
    setSelectedNodeIds(new Set());
    setRenamingNodeId(null);
    lastClickedId.current = null;
  }, []);

  const handleDoubleClick = useCallback(
    (node: FSNode) => {
      if (isDirectory(node)) {
        const newPath = currentPath === "/" ? `/${node.name}` : `${currentPath}/${node.name}`;
        setCurrentPathAndClearSelection(newPath);
      } else if (isFile(node)) {
        const filePath = currentPath === "/" ? `/${node.name}` : `${currentPath}/${node.name}`;
        dispatch(
          openWindow({
            appType: "text-viewer",
            title: node.name,
            appProps: { fileId: node.id, filePath },
          })
        );
      }
    },
    [currentPath, dispatch, setCurrentPathAndClearSelection]
  );

  const handleNavigate = useCallback(
    (path: string) => {
      setCurrentPathAndClearSelection(path);
    },
    [setCurrentPathAndClearSelection]
  );

  const handleSelect = useCallback((nodeId: string, multi: boolean, shift: boolean) => {
    if (!nodeId) {
      // Clicked empty space — clear selection
      setSelectedNodeIds(new Set());
      return;
    }

    if (shift && lastClickedId.current) {
      const nodes = displayedNodesRef.current;
      const anchorIdx = nodes.findIndex((n) => n.id === lastClickedId.current);
      const targetIdx = nodes.findIndex((n) => n.id === nodeId);
      if (anchorIdx !== -1 && targetIdx !== -1) {
        const [from, to] = anchorIdx < targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
        const rangeIds = new Set(nodes.slice(from, to + 1).map((n) => n.id));
        setSelectedNodeIds(multi ? (prev) => new Set([...prev, ...rangeIds]) : rangeIds);
        return; // anchor stays fixed on shift-click
      }
    }

    // Non-shift path — update anchor
    lastClickedId.current = nodeId;

    if (multi) {
      setSelectedNodeIds((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
    } else {
      setSelectedNodeIds(new Set([nodeId]));
    }
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, nodeId: string | null) => {
      e.preventDefault();
      if (nodeId && !selectedNodeIds.has(nodeId)) {
        setSelectedNodeIds(new Set([nodeId]));
      }
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
    },
    [selectedNodeIds]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // --- Actions ---

  const handleNewFile = useCallback(() => {
    if (!currentNode || !isDirectory(currentNode)) return;
    // Find a unique name
    let name = "untitled.txt";
    let i = 1;
    const existingNames = new Set(children.map((c) => c.name));
    while (existingNames.has(name)) {
      name = `untitled (${i}).txt`;
      i++;
    }
    dispatch(createFile({ parentId: currentNode.id, name }));
  }, [currentNode, children, dispatch]);

  const handleNewFolder = useCallback(() => {
    if (!currentNode || !isDirectory(currentNode)) return;
    let name = "New Folder";
    let i = 1;
    const existingNames = new Set(children.map((c) => c.name));
    while (existingNames.has(name)) {
      name = `New Folder (${i})`;
      i++;
    }
    dispatch(createDirectory({ parentId: currentNode.id, name }));
  }, [currentNode, children, dispatch]);

  const handleDelete = useCallback(() => {
    if (selectedNodeIds.size === 0) return;
    setConfirmDelete(true);
  }, [selectedNodeIds]);

  const confirmDeleteAction = useCallback(() => {
    for (const nodeId of selectedNodeIds) {
      dispatch(deleteNode(nodeId));
    }
    setSelectedNodeIds(new Set());
    setConfirmDelete(false);
  }, [selectedNodeIds, dispatch]);

  const handleCopy = useCallback(() => {
    if (selectedNodeIds.size === 0 || !currentNode) return;
    dispatch(
      clipboardCopy({
        nodeIds: Array.from(selectedNodeIds),
        sourceDirectoryId: currentNode.id,
      })
    );
  }, [selectedNodeIds, currentNode, dispatch]);

  const handleCut = useCallback(() => {
    if (selectedNodeIds.size === 0 || !currentNode) return;
    dispatch(
      clipboardCut({
        nodeIds: Array.from(selectedNodeIds),
        sourceDirectoryId: currentNode.id,
      })
    );
  }, [selectedNodeIds, currentNode, dispatch]);

  const handlePaste = useCallback(() => {
    if (!currentNode || !isDirectory(currentNode)) return;
    if (clipboard.operation === null || clipboard.nodeIds.length === 0) return;

    if (clipboard.operation === "copy") {
      for (const nodeId of clipboard.nodeIds) {
        if (fs.nodes[nodeId]) {
          dispatch(copyNode({ nodeId, newParentId: currentNode.id }));
        }
      }
    } else if (clipboard.operation === "cut") {
      for (const nodeId of clipboard.nodeIds) {
        if (fs.nodes[nodeId]) {
          dispatch(moveNode({ nodeId, newParentId: currentNode.id }));
        }
      }
      dispatch(clipboardClear());
    }
  }, [currentNode, clipboard, fs.nodes, dispatch]);

  const handleRenameStart = useCallback(() => {
    if (selectedNodeIds.size === 1) {
      setRenamingNodeId(Array.from(selectedNodeIds)[0]);
    }
  }, [selectedNodeIds]);

  const handleRenameSubmit = useCallback(
    (nodeId: string, newName: string) => {
      dispatch(renameNode({ nodeId: nodeId as NodeId, newName }));
      setRenamingNodeId(null);
    },
    [dispatch]
  );

  const handleRenameCancel = useCallback(() => {
    setRenamingNodeId(null);
  }, []);

  const handleOpen = useCallback(
    (nodeId: string) => {
      const node = fs.nodes[nodeId];
      if (!node) return;
      handleDoubleClick(node);
    },
    [fs.nodes, handleDoubleClick]
  );

  // --- Drag and drop ---

  const handleDrop = useCallback(
    (draggedNodeIds: string[], targetNodeId: string) => {
      const targetNode = fs.nodes[targetNodeId];
      if (!targetNode || !isDirectory(targetNode)) return;

      for (const draggedNodeId of draggedNodeIds) {
        if (!fs.nodes[draggedNodeId]) continue;
        if (draggedNodeId === targetNodeId) continue;

        // Check if target is a descendant of dragged node
        let current = fs.nodes[targetNodeId];
        let isDescendant = false;
        while (current && current.parentId) {
          if (current.parentId === draggedNodeId) {
            isDescendant = true;
            break;
          }
          current = fs.nodes[current.parentId];
        }
        if (isDescendant) continue;

        dispatch(
          moveNode({ nodeId: draggedNodeId as NodeId, newParentId: targetNodeId as NodeId })
        );
      }
    },
    [fs.nodes, dispatch]
  );

  // --- Keyboard shortcuts ---

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle if renaming
      if (renamingNodeId) return;

      const isMod = e.metaKey || e.ctrlKey;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeIds.size > 0) {
          e.preventDefault();
          handleDelete();
        }
      } else if (e.key === "F2") {
        e.preventDefault();
        handleRenameStart();
      } else if (isMod && e.key === "c") {
        if (selectedNodeIds.size > 0) {
          e.preventDefault();
          handleCopy();
        }
      } else if (isMod && e.key === "x") {
        if (selectedNodeIds.size > 0) {
          e.preventDefault();
          handleCut();
        }
      } else if (isMod && e.key === "v") {
        e.preventDefault();
        handlePaste();
      } else if (e.key === "Escape") {
        setSelectedNodeIds(new Set());
        setContextMenu(null);
        lastClickedId.current = null;
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [
    renamingNodeId,
    selectedNodeIds,
    handleDelete,
    handleRenameStart,
    handleCopy,
    handleCut,
    handlePaste,
  ]);

  // --- Context menu items ---

  const hasClipboard = clipboard.operation !== null && clipboard.nodeIds.length > 0;

  function getContextMenuItems(): MenuItemDef[] {
    if (contextMenu?.nodeId) {
      const node = fs.nodes[contextMenu.nodeId];
      if (!node) return [];

      return [
        {
          label: "Open",
          action: () => handleOpen(contextMenu.nodeId!),
        },
        { label: "---", action: () => {} },
        {
          label: "Rename",
          action: () => {
            setSelectedNodeIds(new Set([contextMenu.nodeId!]));
            setRenamingNodeId(contextMenu.nodeId);
          },
        },
        { label: "Copy", action: handleCopy },
        { label: "Cut", action: handleCut },
        { label: "---", action: () => {} },
        {
          label: "Paste",
          action: handlePaste,
          disabled: !hasClipboard,
        },
        { label: "---", action: () => {} },
        { label: "Delete", action: handleDelete },
      ];
    }

    // Empty space context menu
    return [
      { label: "New File", action: handleNewFile },
      { label: "New Folder", action: handleNewFolder },
      { label: "---", action: () => {} },
      {
        label: "Paste",
        action: handlePaste,
        disabled: !hasClipboard,
      },
    ];
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-terminal-bg font-mono text-sm"
      tabIndex={0}
      style={{ outline: "none" }}
    >
      <Breadcrumb path={currentPath} onNavigate={handleNavigate} />
      {currentPath !== "/" && (
        <ParentDirEntry
          currentPath={currentPath}
          currentNode={currentNode}
          onNavigate={setCurrentPathAndClearSelection}
          onDrop={handleDrop}
        />
      )}
      <FileList
        items={children}
        selectedNodeIds={selectedNodeIds}
        cutNodeIds={cutNodeIds}
        renamingNodeId={renamingNodeId}
        nodes={fs.nodes}
        onDoubleClick={handleDoubleClick}
        onSelect={handleSelect}
        onContextMenu={handleContextMenu}
        onRenameSubmit={handleRenameSubmit}
        onRenameCancel={handleRenameCancel}
        onDrop={handleDrop}
      />
      {contextMenu && (
        <FileManagerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={closeContextMenu}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          message={`Delete ${selectedNodeIds.size} item${selectedNodeIds.size > 1 ? "s" : ""}? This cannot be undone.`}
          onConfirm={confirmDeleteAction}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
