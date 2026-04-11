"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface TerminalInputProps {
  prompt: string;
  onSubmit: (command: string) => void;
  onNavigateHistory: (direction: "up" | "down") => string;
  disabled?: boolean;
}

export default function TerminalInput({
  prompt,
  onSubmit,
  onNavigateHistory,
  disabled = false,
}: TerminalInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

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
    if (!disabled) inputRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-2 cursor-text" onClick={handleContainerClick}>
      <span className="whitespace-nowrap shrink-0 text-terminal-fg">
        {disabled ? `${prompt} ...` : prompt}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`flex-1 bg-transparent outline-none border-none font-mono text-sm caret-terminal-input text-terminal-input ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
      />
    </div>
  );
}
