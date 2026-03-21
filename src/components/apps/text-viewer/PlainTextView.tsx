"use client";

interface PlainTextViewProps {
  content: string;
}

export default function PlainTextView({ content }: PlainTextViewProps) {
  return (
    <pre className="text-terminal-fg/80 text-xs leading-relaxed whitespace-pre-wrap break-words">
      {content}
    </pre>
  );
}
