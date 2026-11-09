// A category's icon on a soft tile of its hue (replaces the old emoji).
import { cat, hueClasses, type CategoryId } from "../categories";

export function CategoryIcon({ id, size = 32 }: { id: CategoryId; size?: 24 | 32 | 40 }) {
  const c = cat(id);
  const Icon = c.icon;
  const hue = hueClasses[c.hue];
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-control ${hue.bg} ${hue.fg}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={1.75} />
    </span>
  );
}
