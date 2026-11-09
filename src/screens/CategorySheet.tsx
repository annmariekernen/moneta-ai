// A category's detail, in a bottom sheet: its spending over the last 12
// months (simple bars, the chosen month highlighted) and that month's
// transactions.
import { MessageCircle } from "lucide-react";
import { cat, categoryOf, hueClasses, type CategoryId } from "../categories";
import { Button } from "../components/Button";
import { CategoryIcon } from "../components/CategoryIcon";
import { Sheet } from "../components/Sheet";
import { TxnList } from "../components/TxnList";
import { categoryTrend, monthLabel, transactions, type Transaction } from "../data";
import { useEdits } from "../store";

export function CategorySheet({ pick, onClose, onAsk, onSelect }: {
  pick: { category: CategoryId; month: string } | null;
  onClose: () => void;
  onAsk: (question: string) => void;
  onSelect: (t: Transaction) => void;
}) {
  const { rules } = useEdits();
  if (!pick) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  const c = cat(pick.category);
  const trend = categoryTrend(pick.category, rules).slice(-12);
  const max = Math.max(...trend.map((x) => x.total), 1);
  const items = transactions.filter(
    (t) => t.date.startsWith(pick.month) && t.amount < 0 && categoryOf(t, rules) === pick.category,
  );
  const monthTotal = trend.find((x) => x.month === pick.month)?.total ?? 0;
  return (
    <Sheet open onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <CategoryIcon id={pick.category} size={40} />
          <div>
            <p className="text-headline font-medium">{c.label}</p>
            <p className="text-caption text-fg-3">
              <span className="tabular">${monthTotal.toFixed(2)}</span> in {monthLabel(pick.month, { year: true })}
            </p>
          </div>
        </div>

        {/* The last 12 months, the chosen one in the category's color */}
        <div>
          <div className="flex h-24 items-end gap-1" role="img" aria-label={`${c.label} spending, last 12 months`}>
            {trend.map((x) => (
              <span
                key={x.month}
                className={`flex-1 rounded-t-[4px] ${x.month === pick.month ? hueClasses[c.hue].solid : "bg-subtle"}`}
                style={{ height: `${Math.max(3, (x.total / max) * 100)}%` }}
                title={`${monthLabel(x.month)}: $${x.total.toFixed(2)}`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-caption text-fg-4">
            <span>{monthLabel(trend[0].month).slice(0, 3)}</span>
            <span>{monthLabel(trend[trend.length - 1].month).slice(0, 3)}</span>
          </div>
        </div>

        {items.length ? <TxnList items={items} onSelect={onSelect} /> : <p className="text-label text-fg-3">No {c.label.toLowerCase()} spending this month.</p>}

        <Button icon={<MessageCircle size={16} />} onClick={() => onAsk(`How does my ${c.label.toLowerCase()} spending in ${monthLabel(pick.month)} compare with usual?`)}>
          Ask Moneta about {c.label.toLowerCase()}
        </Button>
      </div>
    </Sheet>
  );
}
