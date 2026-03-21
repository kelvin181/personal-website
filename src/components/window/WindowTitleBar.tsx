"use client";

interface WindowTitleBarProps {
  title: string;
  isMaximized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}

export default function WindowTitleBar({
  title,
  isMaximized,
  onClose,
  onMinimize,
  onMaximize,
}: WindowTitleBarProps) {
  return (
    <div className="window-title-bar flex items-center justify-between bg-titlebar-bg px-3 py-1.5 border-b border-window-border select-none cursor-move">
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">
          <button
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
            title="Close"
          />
          <button
            onClick={onMinimize}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors"
            title="Minimize"
          />
          <button
            onClick={onMaximize}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          />
        </div>
      </div>
      <span className="text-xs text-terminal-dim font-mono truncate mx-4">{title}</span>
      <div className="w-[54px]" />
    </div>
  );
}
