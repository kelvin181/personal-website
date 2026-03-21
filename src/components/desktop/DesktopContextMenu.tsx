"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/store/hooks";
import { openWindow } from "@/store/windowsSlice";

interface DesktopContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onChangeWallpaper: () => void;
}

interface MenuItem {
  label: string;
  action: () => void;
}

export default function DesktopContextMenu({
  x,
  y,
  onClose,
  onChangeWallpaper,
}: DesktopContextMenuProps) {
  const dispatch = useAppDispatch();
  const menuRef = useRef<HTMLDivElement>(null);

  const items: MenuItem[] = [
    {
      label: "Open Terminal",
      action: () => dispatch(openWindow({ appType: "terminal" })),
    },
    {
      label: "Open File Manager",
      action: () => dispatch(openWindow({ appType: "file-manager" })),
    },
    {
      label: "Change Wallpaper",
      action: onChangeWallpaper,
    },
  ];

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

  function handleItemClick(action: () => void) {
    action();
    onClose();
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-48 rounded border border-terminal-dim/30 bg-window-bg py-1 font-mono text-sm text-terminal-text shadow-lg"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          className="block w-full px-4 py-1.5 text-left hover:bg-terminal-dim/20"
          onClick={() => handleItemClick(item.action)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
