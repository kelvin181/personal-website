"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-terminal">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-terminal-fg text-lg font-bold mb-3 mt-4 border-b border-window-border pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-terminal-accent text-base font-bold mb-2 mt-4">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-terminal-fg text-sm font-bold mb-2 mt-3">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-terminal-fg/80 mb-2 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1 text-terminal-fg/80">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1 text-terminal-fg/80">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-terminal-fg/80">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-accent hover:underline"
            >
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-terminal-bg/50 text-terminal-accent px-1.5 py-0.5 rounded text-xs">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-terminal-bg p-3 rounded border border-window-border text-xs overflow-x-auto mb-2">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="mb-2">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-terminal-accent pl-3 my-2 text-terminal-dim italic">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="text-terminal-fg font-bold">{children}</strong>
          ),
          em: ({ children }) => <em className="text-terminal-dim italic">{children}</em>,
          hr: () => <hr className="border-window-border my-4" />,
          table: ({ children }) => (
            <table className="w-full border-collapse border border-window-border mb-2 text-xs">
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th className="border border-window-border px-2 py-1 text-terminal-accent bg-titlebar-bg text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-window-border px-2 py-1 text-terminal-fg/80">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
