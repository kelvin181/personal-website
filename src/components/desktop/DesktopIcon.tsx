"use client";

import { useAppDispatch } from "@/store/hooks";
import { AppType, openWindow } from "@/store/windowsSlice";

interface DesktopIconProps {
  appType: AppType;
  label: string;
  icon: string;
}

export default function DesktopIcon({ appType, label, icon }: DesktopIconProps) {
  const dispatch = useAppDispatch();

  const handleDoubleClick = () => {
    dispatch(openWindow({ appType }));
  };

  return (
    <button
      onDoubleClick={handleDoubleClick}
      className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer select-none group w-20"
    >
      <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-[10px] text-terminal-dim group-hover:text-terminal-fg transition-colors text-center leading-tight">
        {label}
      </span>
    </button>
  );
}
