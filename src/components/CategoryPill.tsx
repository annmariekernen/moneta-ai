// A category as a small pill (e.g. "Your top expenses"). selected = filled.
import { cat, hueClasses, type CategoryId } from "../categories";

export function CategoryPill({ id, selected = false }: { id: CategoryId; selected?: boolean }) {
  const c = cat(id);
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-label font-medium ${
        selected ? "border-fg bg-fg text-white" : "border-line bg-surface text-fg"
      }`}
    >
      <Icon size={14} strokeWidth={1.75} className={selected ? "" : hueClasses[c.hue].fg} aria-hidden="true" />
      {c.label}
    </span>
  );
}
