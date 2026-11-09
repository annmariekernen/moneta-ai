// An account's icon: a dark tile with a white line icon (categories use soft
// tints instead, so the two read differently at a glance).
import { accountIcons, type AccountIconId } from "../accountIcons";

export function AccountIcon({ id, size = 36 }: { id: AccountIconId; size?: 28 | 36 | 48 }) {
  const Icon = accountIcons[id].icon;
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-control bg-fg text-white"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={1.75} />
    </span>
  );
}
