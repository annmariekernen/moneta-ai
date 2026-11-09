// The basic container: white, hairline border, card radius. Optional title
// row with a chevron when the whole card opens something.
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function Card({ title, action, children, className = "" }: {
  title?: string;
  action?: boolean; // shows a chevron after the title
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-card border border-line bg-surface p-4 shadow-card ${className}`}>
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-headline font-medium text-fg">{title}</h3>
          {action && <ChevronRight size={18} className="text-fg-4" aria-hidden="true" />}
        </div>
      )}
      {children}
    </section>
  );
}
