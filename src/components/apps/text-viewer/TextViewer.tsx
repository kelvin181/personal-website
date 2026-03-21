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
  const [draft, setDraft] = useState("");
  const [mdMode, setMdMode] = useState<"preview" | "raw">("preview");
  const [prevFileId, setPrevFileId] = useState(fileId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCursorRef = useRef<string | null>(null);

  const node = fileId ? fs.nodes[fileId] : undefined;
  const validNode = node && isFile(node) ? node : undefined;

  // Reset state when switching files
  if (prevFileId !== fileId) {
    setPrevFileId(fileId);
    setDraft(validNode?.content ?? "");
    setMdMode("preview");
  }

  // Initialise draft when first loading a file
  useEffect(() => {
    if (validNode && draft === "" && validNode.content !== "") {
      setDraft(validNode.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  // Auto-save: debounce 500 ms after last keystroke
  useEffect(() => {
    if (!fileId || !validNode) return;
    if (draft === validNode.content) return;

    const timer = setTimeout(() => {
      dispatch(updateFileContent({ nodeId: fileId, content: draft }));
    }, 500);

    return () => clearTimeout(timer);
  }, [draft, fileId, dispatch, validNode]);

  // Focus textarea and position cursor when switching to raw mode
  useEffect(() => {
    if (mdMode !== "raw") return;
    const search = pendingCursorRef.current;
    pendingCursorRef.current = null;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    if (search) {
      const idx = draft.indexOf(search);
      if (idx !== -1) textarea.setSelectionRange(idx, idx);
    }
  }, [mdMode, draft]);

  function handlePreviewDoubleClick() {
    const selected = window.getSelection()?.toString().trim() ?? "";
    pendingCursorRef.current = selected || null;
    setMdMode("raw");
  }

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
            <div className="p-4 cursor-text" onDoubleClick={handlePreviewDoubleClick}>
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
