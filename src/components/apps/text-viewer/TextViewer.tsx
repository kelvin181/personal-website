"use client";

import { useAppSelector } from "@/store/hooks";
import { isFile } from "@/lib/filesystem/types";
import MarkdownRenderer from "./MarkdownRenderer";
import PlainTextView from "./PlainTextView";

interface TextViewerProps {
  fileId?: string;
}

export default function TextViewer({ fileId }: TextViewerProps) {
  const fs = useAppSelector((s) => s.filesystem);

  if (!fileId) {
    return (
      <div className="flex items-center justify-center h-full text-terminal-dim text-sm">
        No file selected
      </div>
    );
  }

  const node = fs.nodes[fileId];
  if (!node || !isFile(node)) {
    return (
      <div className="flex items-center justify-center h-full text-terminal-error text-sm">
        File not found
      </div>
    );
  }

  const isMarkdown = node.extension === "md";

  return (
    <div className="h-full overflow-y-auto bg-terminal-bg p-4 font-mono">
      {isMarkdown ? (
        <MarkdownRenderer content={node.content} />
      ) : (
        <PlainTextView content={node.content} />
      )}
    </div>
  );
}
