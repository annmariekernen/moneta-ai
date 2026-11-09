// Step through months: ‹ October 2026 ›. Tap the month to open a month
// picker (a year at a time; months without data are greyed out).
// compact: just the short month ("Nov ⌄", with the year when it isn't the
// newest year), flush left, no arrows; the picker does the stepping. `index`
// counts back from the newest month (0 = newest), the way `months` in data.ts
// is ordered.
import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "../data";

const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthStepper({ months, index, onChange, compact = false }: { months: string[]; index: number; onChange: (i: number) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const current = months[index];
  const [year, setYear] = useState(Number(current.slice(0, 4)));
  const years = [...new Set(months.map((m) => Number(m.slice(0, 4))))].sort();
  const ref = useRef<HTMLDivElement>(null);

  // Close on a tap outside or Escape
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const toggle = () => {
    setYear(Number(current.slice(0, 4)));
    setOpen((o) => !o);
  };

  const newestYear = months[0].slice(0, 4);
  const short = `${SHORT[Number(current.slice(5, 7)) - 1]}${current.slice(0, 4) === newestYear ? "" : ` ${current.slice(0, 4)}`}`;

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      {compact ? (
        <button
          className={`-ml-2 flex h-8 items-center gap-1 rounded-control px-2 text-label font-medium hover:bg-subtle ${open ? "bg-subtle" : ""}`}
          onClick={toggle}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`${monthLabel(current, { year: true })}, choose a month`}
        >
          {short}
          <ChevronDown size={14} className="text-fg-3" aria-hidden="true" />
        </button>
      ) : (
      <>
      <button
        className="grid size-8 place-items-center rounded-control text-fg-2 hover:bg-subtle disabled:text-fg-4"
        onClick={() => onChange(index + 1)}
        disabled={index >= months.length - 1}
        aria-label="Previous month"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        className={`flex h-8 w-36 items-center justify-center gap-1.5 rounded-control text-label font-medium hover:bg-subtle ${open ? "bg-subtle" : ""}`}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${monthLabel(current, { year: true })}, choose a month`}
      >
        <CalendarDays size={14} className="text-fg-3" aria-hidden="true" />
        {monthLabel(current, { year: true })}
      </button>
      <button
        className="grid size-8 place-items-center rounded-control text-fg-2 hover:bg-subtle disabled:text-fg-4"
        onClick={() => onChange(index - 1)}
        disabled={index <= 0}
        aria-label="Next month"
      >
        <ChevronRight size={18} />
      </button>
      </>
      )}

      {open && (
        <div role="dialog" aria-label="Choose a month" className={`month-picker absolute top-10 ${compact ? "left-0" : "right-0"} z-30 w-64 rounded-card border border-line bg-surface p-3 shadow-float`}>
          <div className="mb-2 flex items-center justify-between">
            <button
              className="grid size-8 place-items-center rounded-control text-fg-2 hover:bg-subtle disabled:text-fg-4"
              onClick={() => setYear((y) => y - 1)}
              disabled={year <= years[0]}
              aria-label="Previous year"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-label font-medium">{year}</span>
            <button
              className="grid size-8 place-items-center rounded-control text-fg-2 hover:bg-subtle disabled:text-fg-4"
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= years[years.length - 1]}
              aria-label="Next year"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {SHORT.map((label, i) => {
              const m = `${year}-${String(i + 1).padStart(2, "0")}`;
              const at = months.indexOf(m);
              const selected = m === current;
              return (
                <button
                  key={m}
                  disabled={at < 0}
                  onClick={() => {
                    onChange(at);
                    setOpen(false);
                  }}
                  aria-pressed={selected}
                  className={`h-9 rounded-control text-label ${selected ? "bg-accent font-medium text-white" : "text-fg hover:bg-subtle"} disabled:text-fg-4 disabled:hover:bg-transparent`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
