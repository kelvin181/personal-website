"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { pushHistory, setHistoryIndex, setCwd } from "@/store/sessionSlice";
import { openWindow } from "@/store/windowsSlice";
import {
  createFile,
  createDirectory,
  deleteNode,
  copyNode,
  renameNode,
  moveNode,
} from "@/store/filesystemSlice";
import { executeCommand, OutputLine } from "@/lib/terminal/commands";
import { MOTD } from "@/lib/terminal/motd";
import TerminalOutput from "./TerminalOutput";
import TerminalInput from "./TerminalInput";

export default function Terminal() {
  const [outputLines, setOutputLines] = useState<OutputLine[]>(MOTD);
  const [isPending, setIsPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  const cwd = useAppSelector((s) => s.session.cwd);
  const username = useAppSelector((s) => s.session.username);
  const hostname = useAppSelector((s) => s.session.hostname);
  const fs = useAppSelector((s) => s.filesystem);
  const terminalHistory = useAppSelector((s) => s.session.terminalHistory);
  const historyIndex = useAppSelector((s) => s.session.historyIndex);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [outputLines]);

  const handleCommand = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed || isPending) return;

      dispatch(pushHistory(trimmed));

      const promptLine: OutputLine = {
        text: `${username}@${hostname}:${cwd}$ ${trimmed}`,
        type: "prompt",
      };

      if (trimmed === "clear") {
        setOutputLines([]);
        return;
      }

      setOutputLines((prev) => [...prev, promptLine]);
      setIsPending(true);

      try {
        const result = await executeCommand(trimmed, {
          fs,
          cwd,
          dispatch,
          setCwd: (path: string) => dispatch(setCwd(path)),
          openWindow: (appType, props) => dispatch(openWindow({ appType, appProps: props })),
          createFile: (parentId, name, content) =>
            dispatch(createFile({ parentId, name, content })),
          createDirectory: (parentId, name) => dispatch(createDirectory({ parentId, name })),
          deleteNode: (nodeId) => dispatch(deleteNode(nodeId)),
          copyNode: (nodeId, newParentId) => dispatch(copyNode({ nodeId, newParentId })),
          renameNode: (nodeId, newName) => dispatch(renameNode({ nodeId, newName })),
          moveNode: (nodeId, newParentId) => dispatch(moveNode({ nodeId, newParentId })),
        });
        setOutputLines((prev) => [...prev, ...result]);
      } finally {
        setIsPending(false);
      }
    },
    [cwd, username, hostname, fs, dispatch, isPending]
  );

  const navigateHistory = useCallback(
    (direction: "up" | "down") => {
      if (terminalHistory.length === 0) return "";

      let newIndex = historyIndex;
      if (direction === "up") {
        newIndex = Math.max(0, historyIndex - 1);
      } else {
        newIndex = Math.min(terminalHistory.length, historyIndex + 1);
      }

      dispatch(setHistoryIndex(newIndex));
      return newIndex < terminalHistory.length ? terminalHistory[newIndex] : "";
    },
    [terminalHistory, historyIndex, dispatch]
  );

  return (
    <div className="flex flex-col h-full bg-terminal-bg font-mono text-sm">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
        <TerminalOutput lines={outputLines} />
        <TerminalInput
          prompt={`${username}@${hostname}:${cwd}$`}
          onSubmit={handleCommand}
          onNavigateHistory={navigateHistory}
          disabled={isPending}
        />
      </div>
    </div>
  );
}
