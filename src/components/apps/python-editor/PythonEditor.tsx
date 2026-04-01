"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { isFile } from "@/lib/filesystem/types";
import { updateFileContent } from "@/store/filesystemSlice";
import { runPython, isPyodideLoaded } from "@/lib/python/pyodide";

interface PythonEditorProps {
  fileId?: string;
}

export default function PythonEditor({ fileId }: PythonEditorProps) {
  const fs = useAppSelector((s) => s.filesystem);
  const dispatch = useAppDispatch();

  const validNode = useMemo(() => {
    const node = fileId ? fs.nodes[fileId] : undefined;
    return node && isFile(node) ? node : undefined;
  }, [fs.nodes, fileId]);

  const [draft, setDraft] = useState(validNode?.content ?? "");
  const [output, setOutput] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const savedContent = validNode?.content;

  // Resync draft if the file content is changed externally (e.g. from terminal).
  useEffect(() => {
    if (savedContent !== undefined && savedContent !== draft) {
      setDraft(savedContent);
    }
    // Intentionally omitting `draft` — only sync when Redux content changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedContent]);

  // Auto-save: debounce 500 ms after last keystroke
  useEffect(() => {
    if (!fileId || savedContent === undefined) return;
    if (draft === savedContent) return;

    const timer = setTimeout(() => {
      dispatch(updateFileContent({ nodeId: fileId, content: draft }));
    }, 500);

    return () => clearTimeout(timer);
  }, [draft, fileId, dispatch, savedContent]);

  async function handleRun() {
    if (!fileId) return;
    // Flush save immediately before running
    dispatch(updateFileContent({ nodeId: fileId, content: draft }));
    setIsRunning(true);
    setOutput(null);
    setRunError(null);
    const result = await runPython(draft);
    setIsRunning(false);
    if (result.error) {
      setRunError(result.error);
    } else {
      setOutput(result.output);
    }
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

  return (
    <div className="flex flex-col h-full bg-terminal-bg font-mono">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-terminal-border shrink-0">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-0.5 text-xs rounded bg-terminal-accent/20 text-terminal-accent hover:bg-terminal-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isRunning ? "Running..." : "▶ Run"}
        </button>
        <span className="text-terminal-dim text-xs">{validNode.name}</span>
      </div>

      {/* Editor */}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="flex-1 min-h-0 w-full p-4 bg-transparent text-terminal-text text-sm resize-none outline-none"
        spellCheck={false}
        autoFocus
      />

      {/* Output panel */}
      <div className="shrink-0 h-32 border-t border-terminal-border flex flex-col">
        <div className="px-3 py-1 text-xs text-terminal-dim border-b border-terminal-border">
          Output
        </div>
        <div className="flex-1 overflow-y-auto p-3 text-sm">
          {output === null && runError === null && !isRunning && (
            <span className="text-terminal-dim">Run your script to see output here.</span>
          )}
          {isRunning && (
            <span className="text-terminal-dim">
              {isPyodideLoaded() ? "Running..." : "Loading Python runtime..."}
            </span>
          )}
          {output !== null && (
            <pre className="text-terminal-text whitespace-pre-wrap">{output || "(no output)"}</pre>
          )}
          {runError !== null && (
            <pre className="text-terminal-error whitespace-pre-wrap">{runError}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
