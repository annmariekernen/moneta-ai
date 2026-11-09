// Insights: what Moneta noticed (proactive findings, computed from her data),
// and spending by category for any month, with change vs. the month before.
// Tap a category for its 12-month trend and transactions.
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronRight, MessageCircle } from "lucide-react";
import { MonthStepper } from "../components/MonthStepper";
import { cat, type CategoryId } from "../categories";
import { CategoryIcon } from "../components/CategoryIcon";
import { PageHeader } from "../components/PageHeader";
import { TxnList } from "../components/TxnList";
import { findings, months, spendingByCategory, uncategorizedFinding, type Finding, type Transaction } from "../data";
import { useEdits } from "../store";

export function Insights({ onAsk, onSelect, onCategory }: {
  onAsk: (question: string) => void;
  onSelect: (t: Transaction) => void;
  onCategory: (c: CategoryId, month: string) => void;
}) {
  const { rules, review } = useEdits();
  const sorting = uncategorizedFinding(rules, review);
  const cards = sorting ? [sorting, ...findings] : findings;

  // Spending by category: newest full month first (this month is only a week in)
  const [monthIndex, setMonthIndex] = useState(1);
  const month = months[monthIndex];
  const rows = spendingByCategory(month, rules);
  const total = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="scroll px-4 pt-2">
      <PageHeader title="Insights" />

      <section className="mt-3">
        <h2 className="mb-3 text-headline font-medium">Moneta noticed</h2>
        <div className="flex flex-col gap-2.5">
          {cards.map((f) => (
            <FindingCard key={f.id} finding={f} onAsk={onAsk} onSelect={onSelect} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-headline font-medium">Spending by category</h2>
          <MonthStepper months={months} index={monthIndex} onChange={setMonthIndex} />
        </div>
        <p className="mb-3 text-caption text-fg-3">
          <span className="tabular">${Math.round(total).toLocaleString("en-US")}</span> spent{monthIndex === 0 ? " so far" : ""}, transfers between accounts left out
        </p>
        <div className="divide-y divide-line rounded-card border border-line bg-surface px-3.5 shadow-card">
          {rows.map((r) => (
            <button key={r.category} className="flex w-full items-center gap-3 py-2.5 text-left" onClick={() => onCategory(r.category, month)}>
              <CategoryIcon id={r.category} />
              <span className="flex-1 text-label font-medium">{cat(r.category).label}</span>
              {r.change !== null && Math.abs(r.change) >= 0.05 && monthIndex > 0 && (
                <span className="inline-flex items-center text-caption text-fg-3">
                  {r.change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.round(Math.abs(r.change) * 100)}%
                </span>
              )}
              <span className="tabular w-20 text-right text-label font-medium">${r.total.toFixed(2)}</span>
              <ChevronRight size={16} className="text-fg-4" aria-hidden="true" />
            </button>
          ))}
        </div>
        <p className="mt-2 text-caption text-fg-4">Change is compared with the month before.</p>
      </section>
    </div>
  );
}

function FindingCard({ finding: f, onAsk, onSelect }: { finding: Finding; onAsk: (q: string) => void; onSelect: (t: Transaction) => void }) {
  return (
    <article className="rounded-card border border-line bg-surface p-3.5 shadow-card">
      <div className="flex items-start gap-3">
        <CategoryIcon id={f.icon} />
        <div className="min-w-0 flex-1">
          <h3 className="text-label font-medium text-fg">{f.title}</h3>
          <p className="mt-0.5 text-label text-fg-2">{f.detail}</p>
        </div>
      </div>
      {f.items && (
        <div className="mt-3">
          <TxnList items={f.items} onSelect={onSelect} />
        </div>
      )}
      <button
        className="mt-3 inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-label font-medium text-accent hover:bg-accent-soft"
        onClick={() => onAsk(f.ask)}
      >
        <MessageCircle size={15} />
        Ask Moneta
      </button>
    </article>
  );
}
