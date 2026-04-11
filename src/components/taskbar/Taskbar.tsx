"use client";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { openWindow } from "@/store/windowsSlice";
import TaskbarButton from "./TaskbarButton";
import SystemClock from "./SystemClock";

export default function Taskbar() {
  const windows = useAppSelector((s) => s.windows.windows);
  const maxZIndex = useAppSelector((s) => s.windows.maxZIndex);
  const dispatch = useAppDispatch();

  const focusedId = windows.length
    ? windows.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id
    : null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-10 bg-taskbar-bg border-t border-window-border flex items-center px-2 gap-1"
      style={{ zIndex: maxZIndex + 100 }}
    >
      <div className="flex items-center gap-1 mr-2">
        <button
          onClick={() => dispatch(openWindow({ appType: "terminal" }))}
          className="px-2 py-1 text-xs text-terminal-dim hover:text-terminal-fg hover:bg-white/5 rounded transition-colors"
          title="Open Terminal"
        >
          {">_"}
        </button>
        <button
          onClick={() => dispatch(openWindow({ appType: "file-manager" }))}
          className="px-2 py-1 text-xs hover:bg-white/5 rounded transition-colors"
          title="Open File Manager"
        >
          📁
        </button>
        <button
          onClick={() => dispatch(openWindow({ appType: "settings" }))}
          className="px-2 py-1 text-xs hover:bg-white/5 rounded transition-colors"
          title="Open Settings"
        >
          ⚙️
        </button>
      </div>

      <div className="h-4 w-px bg-window-border" />

      <div className="flex items-center gap-1 flex-1 overflow-x-auto mx-2">
        {windows.map((win) => (
          <TaskbarButton key={win.id} window={win} isFocused={win.id === focusedId} />
        ))}
      </div>

      <div className="h-4 w-px bg-window-border" />

      <div className="px-2">
        <SystemClock />
      </div>
    </div>
  );
}
