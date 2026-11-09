// The top bar on every main tab: the page title on the left; notifications
// and her profile (avatar) on the right, so they're always in the same spot.
// `extra` is for something page-specific, like the Live prototype badge on
// Home. Sub-pages (like Transaction history) use a back button instead.
import { Bell } from "lucide-react";
import type { ReactNode } from "react";
import { user } from "../data";

export function PageHeader({ title, extra }: { title: string; extra?: ReactNode }) {
  return (
    <header className="flex items-center gap-2 py-2">
      <h1 className="flex-1 text-title font-medium">{title}</h1>
      {extra}
      <button className="grid size-9 place-items-center rounded-control text-fg-2 hover:bg-subtle" aria-label="Notifications">
        <Bell size={20} strokeWidth={1.75} />
      </button>
      <button
        className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-label font-medium text-accent"
        aria-label={`${user.firstName}'s profile`}
      >
        {user.initials}
      </button>
    </header>
  );
}
