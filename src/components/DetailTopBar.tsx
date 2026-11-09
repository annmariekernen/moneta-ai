// The top of a detail page (an account, a budget group): back on the left,
// the settings gear on the right.
import { ChevronLeft, Settings } from "lucide-react";

export function DetailTopBar({ backLabel, onBack, onSettings, settingsLabel }: { backLabel: string; onBack: () => void; onSettings: () => void; settingsLabel: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <button className="grid size-9 place-items-center rounded-control text-fg-2 hover:bg-subtle" onClick={onBack} aria-label={backLabel}>
        <ChevronLeft size={22} />
      </button>
      <button className="grid size-9 place-items-center rounded-control text-fg-2 hover:bg-subtle" onClick={onSettings} aria-label={settingsLabel}>
        <Settings size={20} />
      </button>
    </div>
  );
}
