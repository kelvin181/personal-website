"use client";

import { useState, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { WALLPAPERS } from "@/store/desktopSlice";
import Window from "@/components/window/Window";
import Taskbar from "@/components/taskbar/Taskbar";
import DesktopIcon from "./DesktopIcon";
import DesktopContextMenu from "./DesktopContextMenu";
import WallpaperPicker from "./WallpaperPicker";
import Terminal from "@/components/apps/terminal/Terminal";
import FileManager from "@/components/apps/file-manager/FileManager";
import TextViewer from "@/components/apps/text-viewer/TextViewer";

function AppContent({
  appType,
  appProps,
}: {
  appType: string;
  appProps?: Record<string, unknown>;
}) {
  switch (appType) {
    case "terminal":
      return <Terminal />;
    case "file-manager":
      return <FileManager initialPath={appProps?.initialPath as string | undefined} />;
    case "text-viewer":
      return <TextViewer fileId={appProps?.fileId as string | undefined} />;
    default:
      return <div className="p-4 text-terminal-error">Unknown app: {appType}</div>;
  }
}

export default function Desktop() {
  const windows = useAppSelector((s) => s.windows.windows);
  const wallpaperKey = useAppSelector((s) => s.desktop.wallpaper);
  const wallpaperNodeId = useAppSelector((s) => s.desktop.wallpaperNodeId);
  const filesystem = useAppSelector((s) => s.filesystem);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);

  let backgroundStyle: string;
  if (wallpaperKey === "custom" && wallpaperNodeId) {
    const node = filesystem.nodes[wallpaperNodeId];
    backgroundStyle =
      node?.type === "file" ? `url(${node.content}) center/cover no-repeat` : WALLPAPERS[0].style;
  } else {
    const wallpaper = WALLPAPERS.find((w) => w.key === wallpaperKey) ?? WALLPAPERS[0];
    backgroundStyle = wallpaper.style;
  }

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Only open context menu when clicking on the desktop itself, not on child elements like windows
    if (e.target === e.currentTarget) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  return (
    <div
      className="relative h-screen w-screen overflow-hidden pb-10"
      style={{ background: backgroundStyle }}
      onContextMenu={handleContextMenu}
    >
      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 flex flex-col gap-1">
        <DesktopIcon appType="terminal" label="Terminal" icon=">_" />
        <DesktopIcon appType="file-manager" label="Files" icon="📁" />
      </div>

      {/* Windows */}
      {windows.map((win) => (
        <Window key={win.id} window={win}>
          <AppContent appType={win.appType} appProps={win.appProps} />
        </Window>
      ))}

      {/* Context Menu */}
      {contextMenu && (
        <DesktopContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onChangeWallpaper={() => {
            setShowWallpaperPicker(true);
            setContextMenu(null);
          }}
        />
      )}

      {/* Wallpaper Picker */}
      {showWallpaperPicker && <WallpaperPicker onClose={() => setShowWallpaperPicker(false)} />}

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}
