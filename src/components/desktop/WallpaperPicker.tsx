"use client";

import { useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setWallpaper, setWallpaperNode, WALLPAPERS } from "@/store/desktopSlice";
import { createFile } from "@/store/filesystemSlice";
import { getNodeByPath } from "@/lib/filesystem/utils";
import { getChildren } from "@/lib/filesystem/operations";
import { isFile } from "@/lib/filesystem/types";

interface WallpaperPickerProps {
  onClose: () => void;
}

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "svg", "bmp"]);
const MAX_SIZE = 5 * 1024 * 1024;

export default function WallpaperPicker({ onClose }: WallpaperPickerProps) {
  const dispatch = useAppDispatch();
  const filesystem = useAppSelector((s) => s.filesystem);
  const currentWallpaper = useAppSelector((s) => s.desktop.wallpaper);
  const currentNodeId = useAppSelector((s) => s.desktop.wallpaperNodeId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const picturesDir = getNodeByPath(filesystem, "/home/user/Pictures");
  const picturesDirId = picturesDir?.id;

  const imageFiles = picturesDirId
    ? getChildren(filesystem, picturesDirId).filter(
        (n) => isFile(n) && IMAGE_EXTENSIONS.has(n.extension.toLowerCase())
      )
    : [];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setError("Image must be under 5 MB");
      e.target.value = "";
      return;
    }
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (!picturesDirId) return;
      dispatch(
        createFile({
          parentId: picturesDirId,
          name: file.name,
          content: reader.result as string,
        })
      );
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function selectPreset(key: string) {
    dispatch(setWallpaper(key));
    onClose();
  }

  function selectImage(nodeId: string) {
    dispatch(setWallpaperNode(nodeId));
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-96 max-h-[80vh] flex-col rounded border border-terminal-dim/30 bg-window-bg font-mono shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-terminal-dim/30 px-4 py-2">
          <span className="text-sm text-terminal-text">Change Wallpaper</span>
          <button className="text-terminal-dim hover:text-terminal-text" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          {/* Preset swatches */}
          <div>
            <p className="mb-2 text-xs text-terminal-dim">Presets</p>
            <div className="grid grid-cols-2 gap-3">
              {WALLPAPERS.map((wp) => (
                <button
                  key={wp.key}
                  className={`flex h-20 items-end rounded border p-2 transition-colors ${
                    currentWallpaper === wp.key && !currentNodeId
                      ? "border-terminal-green"
                      : "border-terminal-dim/30 hover:border-terminal-dim"
                  }`}
                  style={{ background: wp.style }}
                  onClick={() => selectPreset(wp.key)}
                >
                  <span className="text-xs text-terminal-text/70">{wp.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* My Wallpapers */}
          <div>
            <p className="mb-2 text-xs text-terminal-dim">My Wallpapers</p>
            {imageFiles.length === 0 ? (
              <p className="text-xs text-terminal-dim/60 italic">
                No images yet — upload one below.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {imageFiles.map((node) => {
                  if (!isFile(node)) return null;
                  return (
                    <button
                      key={node.id}
                      className={`relative flex h-20 items-end overflow-hidden rounded border p-2 transition-colors ${
                        currentNodeId === node.id
                          ? "border-terminal-green"
                          : "border-terminal-dim/30 hover:border-terminal-dim"
                      }`}
                      onClick={() => selectImage(node.id)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={node.content}
                        alt={node.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <span className="relative z-10 truncate rounded bg-black/50 px-1 text-xs text-white">
                        {node.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Upload button */}
            <div className="mt-3">
              {error && <p className="mb-2 text-xs text-terminal-error">{error}</p>}
              <button
                className="w-full rounded border border-dashed border-terminal-dim/40 py-2 text-xs text-terminal-dim hover:border-terminal-dim hover:text-terminal-text transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                + Upload Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
