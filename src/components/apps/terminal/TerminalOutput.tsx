"use client";

import { OutputLine } from "@/lib/terminal/commands";

interface TerminalOutputProps {
  lines: OutputLine[];
}

const TYPE_COLORS: Record<string, string> = {
  output: "text-terminal-fg",
  error: "text-terminal-error",
  success: "text-terminal-fg",
  info: "text-terminal-accent",
  prompt: "text-terminal-dim",
  heading: "text-terminal-fg font-bold",
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
          className={`${TYPE_COLORS[line.type] || "text-terminal-fg"} whitespace-pre-wrap break-words leading-relaxed`}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
}
