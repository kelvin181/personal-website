"use client";

import { useAppDispatch } from "@/store/hooks";
import { AppWindow, focusWindow, minimizeWindow } from "@/store/windowsSlice";

interface TaskbarButtonProps {
  window: AppWindow;
  isFocused: boolean;
}

const APP_ICONS: Record<string, string> = {
  terminal: ">_",
  "file-manager": "📁",
  "text-viewer": "📄",
  settings: "⚙️",
};

export default function TaskbarButton({ window: win, isFocused }: TaskbarButtonProps) {
  const dispatch = useAppDispatch();

  const handleClick = () => {
    if (isFocused && win.state !== "minimized") {
      dispatch(minimizeWindow(win.id));
    } else {
      dispatch(focusWindow(win.id));
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded transition-colors max-w-[160px] truncate ${
        isFocused
          ? "bg-terminal-fg/10 text-terminal-fg border border-terminal-fg/30"
          : "text-terminal-dim hover:text-terminal-fg hover:bg-white/5 border border-transparent"
      } ${win.state === "minimized" ? "opacity-50" : ""}`}
    >
      <span>{APP_ICONS[win.appType] || "?"}</span>
      <span className="truncate">{win.title}</span>
    </button>
  );
}
