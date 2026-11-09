// Under a Moneta message: the changes Moneta proposes, as one card. Apply
// makes them (every screen updates); then the card says so, with Undo.
// Nothing changes until she taps Apply. Copy is PLACEHOLDER.
import { Check, Undo2 } from "lucide-react";
import { Button } from "./Button";

export function ActionCard({ lines, status, onApply, onUndo }: {
  lines: string[]; // what each change does, in words
  status?: "applied" | "undone";
  onApply: () => void;
  onUndo: () => void;
}) {
  const applied = status === "applied";
  return (
    <div className={`ml-7 rounded-card border p-3.5 ${applied ? "border-positive/30 bg-positive-soft/40" : "border-line bg-surface shadow-card"}`}>
      <ul className="space-y-1.5">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2 text-label text-fg">
            <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${applied ? "bg-positive" : "bg-accent"}`} aria-hidden="true" />
            {l}
          </li>
        ))}
      </ul>
      {applied ? (
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-label font-medium text-positive">
            <Check size={15} strokeWidth={2.25} aria-hidden="true" /> Done
          </span>
          <Button size="sm" variant="ghost" icon={<Undo2 size={14} />} onClick={onUndo}>Undo</Button>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={onApply}>{status === "undone" ? "Apply again" : lines.length > 1 ? "Apply all" : "Apply"}</Button>
          {status === "undone" && <span className="text-caption text-fg-3">Undone</span>}
        </div>
      )}
    </div>
  );
}
