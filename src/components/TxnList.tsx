// Transactions grouped by day ("Yesterday", "Thursday, Nov 5"), each day in a
// card of rows. Rows are tappable when onSelect is given (opens the detail
// sheet). Each shows her category (her rules first, then Moneta's guess).
import { Fragment } from "react";
import { categoryOf } from "../categories";
import { dayHeading, recurringMerchants, type Transaction } from "../data";
import { useEdits } from "../store";
import { TransactionRow } from "./TransactionRow";

export function TxnList({ items, onSelect }: { items: Transaction[]; onSelect?: (t: Transaction) => void }) {
  const { rules } = useEdits();
  const days: { date: string; items: Transaction[] }[] = [];
  for (const t of items) {
    const last = days[days.length - 1];
    if (last?.date === t.date) last.items.push(t);
    else days.push({ date: t.date, items: [t] });
  }
  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => (
        <section key={day.date}>
          <h3 className="mb-1 text-caption font-medium text-fg-3">{dayHeading(day.date)}</h3>
          <div className="divide-y divide-line rounded-card border border-line bg-surface px-3.5 shadow-card">
            {day.items.map((t) => (
              <Fragment key={t.id}>
                <button className="block w-full text-left disabled:cursor-default" onClick={() => onSelect?.(t)} disabled={!onSelect}>
                  <TransactionRow
                    category={categoryOf(t, rules)}
                    merchant={t.merchant}
                    account={t.label}
                    amount={t.amount}
                    recurring={recurringMerchants.has(t.merchant)}
                  />
                </button>
              </Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
