"use client";

import { Rnd } from "react-rnd";
import { useAppDispatch } from "@/store/hooks";
import {
  AppWindow,
  closeWindow,
  focusWindow,
  minimizeWindow,
  maximizeWindow,
  updateWindowPosition,
  updateWindowSize,
} from "@/store/windowsSlice";
import WindowTitleBar from "./WindowTitleBar";

interface WindowProps {
  window: AppWindow;
  children: React.ReactNode;
}

export default function Window({ window: win, children }: WindowProps) {
  const dispatch = useAppDispatch();

  const isMaximized = win.state === "maximized";
  const isMinimized = win.state === "minimized";

  if (isMinimized) return null;

  const handleClose = () => dispatch(closeWindow(win.id));
  const handleMinimize = () => dispatch(minimizeWindow(win.id));
  const handleMaximize = () => dispatch(maximizeWindow(win.id));
  const handleFocus = () => {
    dispatch(focusWindow(win.id));
  };

  if (isMaximized) {
    return (
      <div
        className="fixed inset-0 bottom-10 flex flex-col border border-window-border bg-window-bg shadow-2xl"
        style={{ zIndex: win.zIndex }}
        onMouseDown={handleFocus}
      >
        <WindowTitleBar
          title={win.title}
          isMaximized={true}
          onClose={handleClose}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
        />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    );
  }

  return (
    <Rnd
      position={win.position}
      size={win.size}
      minWidth={300}
      minHeight={200}
      style={{ zIndex: win.zIndex }}
      dragHandleClassName="window-title-bar"
      onDragStart={() => {
        handleFocus();
      }}
      onDragStop={(_e, d) => {
        dispatch(updateWindowPosition({ id: win.id, position: { x: d.x, y: d.y } }));
      }}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        dispatch(
          updateWindowSize({
            id: win.id,
            size: { width: ref.offsetWidth, height: ref.offsetHeight },
          })
        );
        dispatch(updateWindowPosition({ id: win.id, position }));
      }}
      onMouseDown={handleFocus}
      bounds="parent"
      className="flex flex-col border border-window-border rounded-lg overflow-hidden shadow-2xl"
    >
      <div className="flex flex-col h-full bg-window-bg rounded-lg overflow-hidden">
        <WindowTitleBar
          title={win.title}
          isMaximized={false}
          onClose={handleClose}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
        />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </Rnd>
  );
}
