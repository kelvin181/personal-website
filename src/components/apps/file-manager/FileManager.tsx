"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { openWindow } from "@/store/windowsSlice";
import { FSNode, isDirectory, isFile } from "@/lib/filesystem/types";
import { getNodeByPath } from "@/lib/filesystem/utils";
import { getChildren } from "@/lib/filesystem/operations";
import Breadcrumb from "./Breadcrumb";
import FileList from "./FileList";

interface FileManagerProps {
  initialPath?: string;
}

export default function FileManager({ initialPath }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState(initialPath || "/home/user");
  const fs = useAppSelector((s) => s.filesystem);
  const dispatch = useAppDispatch();

  const currentNode = getNodeByPath(fs, currentPath);
  const children = currentNode && isDirectory(currentNode) ? getChildren(fs, currentNode.id) : [];

  const handleDoubleClick = (node: FSNode) => {
    if (isDirectory(node)) {
      const newPath = currentPath === "/" ? `/${node.name}` : `${currentPath}/${node.name}`;
      setCurrentPath(newPath);
    } else if (isFile(node)) {
      const filePath = currentPath === "/" ? `/${node.name}` : `${currentPath}/${node.name}`;
      dispatch(
        openWindow({
          appType: "text-viewer",
          title: node.name,
          appProps: { fileId: node.id, filePath },
        })
      );
    }
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  return (
    <div className="flex flex-col h-full bg-terminal-bg font-mono text-sm">
      <Breadcrumb path={currentPath} onNavigate={handleNavigate} />
      {currentPath !== "/" && (
        <div
          className="flex items-center gap-3 px-3 py-1.5 hover:bg-white/5 cursor-pointer text-terminal-dim"
          onDoubleClick={() => {
            const parts = currentPath.split("/").filter(Boolean);
            parts.pop();
            setCurrentPath("/" + parts.join("/") || "/");
          }}
        >
          <span className="text-sm">📁</span>
          <span className="text-sm">..</span>
        </div>
      )}
      <FileList items={children} onDoubleClick={handleDoubleClick} />
    </div>
  );
}
