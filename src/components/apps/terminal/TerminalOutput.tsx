"use client";

import { OutputLine } from "@/lib/terminal/commands";

interface TerminalOutputProps {
  lines: OutputLine[];
}

const TYPE_COLORS: Record<string, string> = {
  output: "text-terminal-input",
  error: "text-terminal-error",
  success: "text-terminal-input",
  info: "text-terminal-accent",
  prompt: "text-terminal-fg",
  command: "text-terminal-input",
  heading: "text-terminal-accent font-bold",
  dim: "text-terminal-dim",
  link: "text-terminal-accent",
  warning: "text-terminal-warning",
};

export default function TerminalOutput({ lines }: TerminalOutputProps) {
  return (
    <div>
      {lines.map((line, i) => (
        <div
          key={i}
          className={`${!line.parts ? TYPE_COLORS[line.type] || "text-terminal-input" : ""} whitespace-pre-wrap break-words leading-relaxed`}
        >
          {line.parts
            ? line.parts.map((part, j) => (
                <span key={j} className={TYPE_COLORS[part.type] || "text-terminal-input"}>
                  {part.text}
                </span>
              ))
            : line.text}
        </div>
      ))}
    </div>
  );
}
