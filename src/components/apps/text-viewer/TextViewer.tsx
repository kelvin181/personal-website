"use client";

import { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { isFile } from "@/lib/filesystem/types";
import { updateFileContent } from "@/store/filesystemSlice";
import MarkdownRenderer from "./MarkdownRenderer";

interface TextViewerProps {
  fileId?: string;
}

export default function TextViewer({ fileId }: TextViewerProps) {
  const fs = useAppSelector((s) => s.filesystem);
  const dispatch = useAppDispatch();

  const node = fileId ? fs.nodes[fileId] : undefined;
  const validNode = node && isFile(node) ? node : undefined;

  const [draft, setDraft] = useState(validNode?.content ?? "");
  const [mdMode, setMdMode] = useState<"preview" | "raw">("preview");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-save: debounce 500 ms after last keystroke
  useEffect(() => {
    if (!fileId || !validNode) return;
    if (draft === validNode.content) return;

    const timer = setTimeout(() => {
      dispatch(updateFileContent({ nodeId: fileId, content: draft }));
    }, 500);

    return () => clearTimeout(timer);
  }, [draft, fileId, dispatch, validNode]);

  // Manual double-click detection via mousedown — more reliable than dblclick,
  // which can be silently swallowed by inline elements or the React runtime.
  useEffect(() => {
    if (mdMode !== "preview") return;

    let lastTime = 0;
    let lastX = 0;
    let lastY = 0;

    function handleMouseDown(e: MouseEvent) {
      if (!previewRef.current?.contains(e.target as Node)) return;

      const now = Date.now();
      const dx = Math.abs(e.clientX - lastX);
      const dy = Math.abs(e.clientY - lastY);
      const isDoubleClick = now - lastTime < 400 && dx < 5 && dy < 5;

      if (isDoubleClick) {
        lastTime = 0;
        setMdMode("raw");
      } else {
        lastTime = now;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    }

    document.addEventListener("mousedown", handleMouseDown, true);
    return () => document.removeEventListener("mousedown", handleMouseDown, true);
  }, [mdMode]);

  // Focus textarea when switching to raw mode.
  useEffect(() => {
    if (mdMode !== "raw") return;
    textareaRef.current?.focus();
  }, [mdMode]);

  if (!fileId) {
    return (
      <div className="flex items-center justify-center h-full text-terminal-dim text-sm">
        No file selected
      </div>
    );
  }

  if (!validNode) {
    return (
      <div className="flex items-center justify-center h-full text-terminal-error text-sm">
        File not found
      </div>
    );
  }

  const isMarkdown = validNode.extension === "md";

  if (isMarkdown) {
    return (
      <div className="flex flex-col h-full bg-terminal-bg font-mono">
        {/* Toolbar: Preview / Raw toggle */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-terminal-border shrink-0">
          <button
            onClick={() => setMdMode("preview")}
            className={`px-2.5 py-0.5 text-xs rounded transition-all cursor-pointer ${
              mdMode === "preview"
                ? "bg-terminal-dim/20 text-terminal-text"
                : "text-terminal-dim hover:text-terminal-text"
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setMdMode("raw")}
            className={`px-2.5 py-0.5 text-xs rounded transition-all cursor-pointer ${
              mdMode === "raw"
                ? "bg-terminal-dim/20 text-terminal-text"
                : "text-terminal-dim hover:text-terminal-text"
            }`}
          >
            Raw
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {mdMode === "preview" ? (
            <div ref={previewRef} className="p-4 cursor-text min-h-full">
              <MarkdownRenderer content={validNode.content} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-full p-4 bg-transparent text-terminal-text text-sm resize-none outline-none"
              spellCheck={false}
            />
          )}
        </div>
      </div>
    );
  }

  // Plain text: always editable, no toolbar
  return (
    <div className="h-full bg-terminal-bg font-mono">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full h-full p-4 bg-transparent text-terminal-text text-sm resize-none outline-none"
        spellCheck={false}
      />
    </div>
  );
}
