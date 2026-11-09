// Dialogs inside the phone, over a dimmed screen (tap outside to cancel).
// - Dialog: a small form, like editing an account or a budget group. Full-
//   width Cancel / Save at the bottom.
// - ConfirmDialog: "are you sure?" before something you can't take back
//   (unlink, delete, start over). The confirm button is red when it's
//   destructive.
import type { ReactNode } from "react";
import { Button } from "./Button";

function Scrim({ onCancel, children, className = "" }: { onCancel: () => void; children: ReactNode; className?: string }) {
  return (
    // Centered on screen, like iOS alerts (Apple's HIG); with the keyboard
    // up, centered in the space above it
    <div className={`absolute inset-0 z-20 grid grid-rows-[1fr_auto_1fr] justify-items-center bg-fg/20 p-4 ${className}`} onClick={onCancel}>
      <div className="row-start-2 w-full">{children}</div>
    </div>
  );
}

export function Dialog({ title, children, onCancel, onSave, saveLabel = "Save" }: {
  title: string;
  children: ReactNode;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
}) {
  return (
    <Scrim onCancel={onCancel}>
      <div role="dialog" aria-label={title} className="max-h-full w-full overflow-y-auto rounded-card bg-surface p-5 shadow-float" onClick={(e) => e.stopPropagation()}>
        <p className="text-headline font-medium">{title}</p>
        {children}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button className="w-full" onClick={onCancel}>Cancel</Button>
          <Button className="w-full" variant="primary" onClick={onSave}>{saveLabel}</Button>
        </div>
      </div>
    </Scrim>
  );
}

export function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel, destructive = true, className = "" }: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  className?: string;
}) {
  return (
    <Scrim onCancel={onCancel} className={`p-6 ${className}`}>
      <div role="alertdialog" aria-label={title} className="w-full rounded-card bg-surface p-5 shadow-float" onClick={(e) => e.stopPropagation()}>
        <p className="text-headline font-medium">{title}</p>
        <p className="mt-1 text-label text-fg-2">{body}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button className="w-full" onClick={onCancel}>Cancel</Button>
          <Button className={`w-full ${destructive ? "bg-negative hover:bg-negative" : ""}`} variant="primary" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Scrim>
  );
}
