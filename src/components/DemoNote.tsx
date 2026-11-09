// The "Demo only" note on pretend flows (linking an account, bringing in a
// budget): an outlined box with "Demo only:" in medium weight and an X to
// dismiss it. Once dismissed it stays hidden until the page is reloaded
// (remembered per note, by `id`).
import { useState, type ReactNode } from "react";
import { X } from "lucide-react";

const dismissed = new Set<string>();

export function DemoNote({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  const [hidden, setHidden] = useState(() => dismissed.has(id));
  if (hidden) return null;
  return (
    <div className={`flex items-start gap-2 rounded-control border border-line-strong py-2 pr-1.5 pl-3 text-caption text-fg-2 ${className}`}>
      <p className="min-w-0 flex-1 pt-0.5">
        <span className="font-medium text-fg">Demo only:</span> {children}
      </p>
      <button
        className="grid size-6 shrink-0 place-items-center rounded-[6px] text-fg-3 hover:bg-subtle hover:text-fg"
        onClick={() => {
          dismissed.add(id);
          setHidden(true);
        }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
