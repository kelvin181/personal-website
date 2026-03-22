"use client";

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
  onBack: () => void;
  onForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

export default function Breadcrumb({
  path,
  onNavigate,
  onBack,
  onForward,
  canGoBack,
  canGoForward,
}: BreadcrumbProps) {
  const parts = path.split("/").filter(Boolean);

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-titlebar-bg/50 border-b border-window-border text-xs overflow-x-auto">
      <button
        onClick={onBack}
        disabled={!canGoBack}
        title="Back"
        className="shrink-0 px-1 text-terminal-accent disabled:text-terminal-dim/40 disabled:cursor-default hover:text-terminal-fg transition-colors"
      >
        ←
      </button>
      <button
        onClick={onForward}
        disabled={!canGoForward}
        title="Forward"
        className="shrink-0 px-1 mr-2 text-terminal-accent disabled:text-terminal-dim/40 disabled:cursor-default hover:text-terminal-fg transition-colors"
      >
        →
      </button>
      <button
        onClick={() => onNavigate("/")}
        className="text-terminal-accent hover:text-terminal-fg transition-colors shrink-0"
      >
        /
      </button>
      {parts.map((part, i) => {
        const fullPath = "/" + parts.slice(0, i + 1).join("/");
        return (
          <span key={fullPath} className="flex items-center gap-1 shrink-0">
            <span className="text-terminal-dim">/</span>
            <button
              onClick={() => onNavigate(fullPath)}
              className={`hover:text-terminal-fg transition-colors ${
                i === parts.length - 1 ? "text-terminal-fg" : "text-terminal-accent"
              }`}
            >
              {part}
            </button>
          </span>
        );
      })}
    </div>
  );
}
