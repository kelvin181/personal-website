"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface MenuItemDef {
  label: string;
  action: () => void;
  disabled?: boolean;
}

interface FileManagerContextMenuProps {
  x: number;
  y: number;
  items: MenuItemDef[];
  onClose: () => void;
}

export type { MenuItemDef };

export default function FileManagerContextMenu({
  x,
  y,
  items,
  onClose,
}: FileManagerContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Clamp menu position to viewport
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const rect = menu.getBoundingClientRect();
    const clampedX = Math.min(x, window.innerWidth - rect.width - 4);
    const clampedY = Math.min(y, window.innerHeight - rect.height - 4);

    menu.style.left = `${Math.max(0, clampedX)}px`;
    menu.style.top = `${Math.max(0, clampedY)}px`;
  }, [x, y]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
  }, [onClose]);

  function handleItemClick(item: MenuItemDef) {
    if (item.disabled) return;
    item.action();
    onClose();
  }

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-48 rounded border border-terminal-dim/30 bg-window-bg py-1 font-mono text-sm text-terminal-text shadow-lg"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) =>
        item.label === "---" ? (
          <div key={i} className="my-1 border-t border-terminal-dim/20" />
        ) : (
          <button
            key={i}
            className={`block w-full px-4 py-1.5 text-left ${
              item.disabled ? "text-terminal-dim/40 cursor-default" : "hover:bg-terminal-dim/20"
            }`}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
          >
            {item.label}
          </button>
        )
      )}
    </div>,
    document.body
  );
}
