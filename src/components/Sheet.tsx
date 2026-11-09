// A bottom sheet inside the phone: slides up over a dimmed screen, closes on
// the scrim, the grab handle area, or Escape. For details and quick edits
// (a transaction, later a budget group or an account).
import { useEffect, type ReactNode } from "react";

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  return (
    <>
      <div className={`scrim ${open ? "is-open" : ""}`} onClick={onClose} />
      <section className={`sheet rounded-t-sheet bg-surface ${open ? "is-open" : ""}`} aria-hidden={!open} role="dialog" aria-label={title}>
        <button className="mx-auto block w-full pt-2.5 pb-1" onClick={onClose} aria-label="Close">
          <span className="mx-auto block h-1 w-9 rounded-full bg-line-strong" />
        </button>
        <div className="sheet-body px-4 pb-8">
          {title && <h2 className="mb-3 text-headline font-medium">{title}</h2>}
          {children}
        </div>
      </section>
    </>
  );
}
