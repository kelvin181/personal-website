"use client";

import { useAppSelector } from "@/store/hooks";
import Window from "@/components/window/Window";
import Taskbar from "@/components/taskbar/Taskbar";
import DesktopIcon from "./DesktopIcon";
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

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-desktop-bg pb-10">
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

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}
