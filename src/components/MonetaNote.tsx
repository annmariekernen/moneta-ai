// A note from Moneta inside a screen (not the chat): the goose and its name
// on top, so it's clearly Moneta talking, then the message at reading size.
// An optional action sits under the message (e.g. "View draft").
// compact: one row (goose and Moneta on the left; the message sits just left
// of the action on the right), for a note
// she's already seen that should stay within reach without taking the screen
// (e.g. "Your budget is ready!" after she keeps going).
import type { ReactNode } from "react";
import goose from "../assets/goose-glasses-circle.svg";

export function MonetaNote({ children, action, compact = false, className = "" }: { children: ReactNode; action?: ReactNode; compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <div className={`flex items-center gap-2.5 rounded-card border border-accent/20 bg-accent-soft py-2 pr-2 pl-2.5 ${className}`}>
        <img src={goose} alt="" className="size-7 shrink-0" />
        <span className="flex-1 text-label font-medium text-accent">Moneta</span>
        <div className="min-w-0 truncate text-right text-label text-fg [&_strong]:font-medium">{children}</div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }
  return (
    <div className={`rounded-card border border-accent/20 bg-accent-soft p-4 ${className}`}>
      <p className="flex items-center gap-2 text-label font-medium text-accent">
        <img src={goose} alt="" className="size-7 shrink-0" />
        Moneta
      </p>
      <div className="mt-2 text-body text-fg [&_strong]:font-medium">{children}</div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
