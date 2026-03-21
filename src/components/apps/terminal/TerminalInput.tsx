"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface TerminalInputProps {
  prompt: string;
  onSubmit: (command: string) => void;
  onNavigateHistory: (direction: "up" | "down") => string;
}

export default function TerminalInput({ prompt, onSubmit, onNavigateHistory }: TerminalInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const cmd = onNavigateHistory("up");
      setInput(cmd);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const cmd = onNavigateHistory("down");
      setInput(cmd);
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-2 cursor-text" onClick={handleContainerClick}>
      <span className="text-terminal-fg whitespace-nowrap shrink-0">{prompt}</span>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent text-terminal-fg outline-none border-none font-mono text-sm caret-terminal-fg"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
      />
    </div>
  );
}
