"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setWallpaper, WALLPAPERS } from "@/store/desktopSlice";

interface WallpaperPickerProps {
  onClose: () => void;
}

export default function WallpaperPicker({ onClose }: WallpaperPickerProps) {
  const dispatch = useAppDispatch();
  const currentWallpaper = useAppSelector((s) => s.desktop.wallpaper);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-80 rounded border border-terminal-dim/30 bg-window-bg font-mono shadow-lg">
        <div className="flex items-center justify-between border-b border-terminal-dim/30 px-4 py-2">
          <span className="text-sm text-terminal-text">Change Wallpaper</span>
          <button className="text-terminal-dim hover:text-terminal-text" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          {WALLPAPERS.map((wp) => (
            <button
              key={wp.key}
              className={`flex h-20 items-end rounded border p-2 transition-colors ${
                currentWallpaper === wp.key
                  ? "border-terminal-green"
                  : "border-terminal-dim/30 hover:border-terminal-dim"
              }`}
              style={{ background: wp.style }}
              onClick={() => {
                dispatch(setWallpaper(wp.key));
                onClose();
              }}
            >
              <span className="text-xs text-terminal-text/70">{wp.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
