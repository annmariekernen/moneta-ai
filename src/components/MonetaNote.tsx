// A note from Moneta inside a screen (not the chat): the goose and its name
// on top, so it's clearly Moneta talking, then the message at reading size.
// An optional action sits under the message (e.g. "View draft").
import type { ReactNode } from "react";
import goose from "../assets/goose-glasses-circle.svg";

export function MonetaNote({ children, action, className = "" }: { children: ReactNode; action?: ReactNode; className?: string }) {
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
