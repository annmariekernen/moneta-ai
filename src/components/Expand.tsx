// Accordion pieces for budget tables. Expand: content that slides open
// (animated grid rows, same motion as the category picker in the transaction
// sheet). Hidden content can't be tabbed into while closed.
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function Expand({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

// The chevron on an accordion row: points right when closed, down when open
export function ExpandChevron({ open }: { open: boolean }) {
  return <ChevronRight size={16} className={`shrink-0 text-fg-3 transition-transform duration-300 ${open ? "rotate-90" : ""}`} aria-hidden="true" />;
}
