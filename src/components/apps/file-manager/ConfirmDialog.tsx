"use client";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
      <div className="min-w-72 rounded border border-terminal-dim/30 bg-window-bg p-4 font-mono text-sm text-terminal-text shadow-lg">
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            className="rounded border border-terminal-dim/30 px-3 py-1 hover:bg-terminal-dim/20"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="rounded border border-red-500/50 bg-red-500/10 px-3 py-1 text-red-400 hover:bg-red-500/20"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
