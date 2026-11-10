// The Budget tab, once a budget is set up: quiet tabs under the month.
// - All: two summary cards, Income and Expenses (tap one to open its tab)
// - Income: paychecks and other money in, plus the next paycheck Moneta expects
// - Expenses: bills still to come this month ("Coming up"), then every
//   category with its progress (over budget is amber)
// No separate Bills vs Spending (Ann Marie's call): what counts as a bill is
// fuzzy (subscriptions, a power bill that varies), so bills just show up in
// Expenses as "Coming up". Why this layout: DECISIONS.md (Budget tab layout).
// Tapping a category or a bill opens the category's page.
// All copy here is PLACEHOLDER for Ann Marie to reword.
import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import type { CategoryStatus, MonthSplit } from "../budget";
import { cat, type CategoryId } from "../categories";
import { BudgetBar } from "../components/BudgetBar";
import { CategoryIcon } from "../components/CategoryIcon";
import { SubtleTabs } from "../components/SubtleTabs";

const usd = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
const shortDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const label = (c: CategoryId) => cat(c).label;

type Tab = "all" | "income" | "expenses";

export function BudgetTabs({ s, onOpen }: { s: MonthSplit; onOpen: (c: CategoryId) => void }) {
  const [tab, setTab] = useState<Tab>("all");
  return (
    <>
      <SubtleTabs
        className="mt-2"
        value={tab}
        onChange={setTab}
        options={[{ value: "all", label: "All" }, { value: "income", label: "Income" }, { value: "expenses", label: "Expenses" }]}
      />
      <div className="mt-4">
        {tab === "all" && <AllTab s={s} onGo={setTab} />}
        {tab === "income" && <IncomeTab s={s} />}
        {tab === "expenses" && <ExpensesTab s={s} onOpen={onOpen} />}
      </div>
    </>
  );
}

function SummaryCard({ title, figure, sub, children, onClick }: { title: string; figure: ReactNode; sub: string; children?: ReactNode; onClick: () => void }) {
  return (
    <button className="block w-full rounded-card border border-line bg-surface p-4 text-left shadow-card" onClick={onClick}>
      <span className="flex items-center justify-between text-label text-fg-3">
        {title}
        <ChevronRight size={16} className="text-fg-4" aria-hidden="true" />
      </span>
      <span className="tabular mt-1 block text-title font-medium">{figure}</span>
      {children}
      <span className="mt-1 block text-caption text-fg-3">{sub}</span>
    </button>
  );
}

/* ---------- All ---------- */

function AllTab({ s, onGo }: { s: MonthSplit; onGo: (t: Tab) => void }) {
  const due = s.billItems.filter((i) => !i.paid);
  const over = s.rows.filter((r) => r.left < 0);
  const expensesNote = [
    over.length ? `${over.length} over budget` : "",
    due.length ? `${due.length} bill${due.length > 1 ? "s" : ""} coming up, next ${shortDate(due[0].date)}` : "",
  ].filter(Boolean);
  return (
    <div className="space-y-3 pb-2">
      <SummaryCard
        title="Income"
        onClick={() => onGo("income")}
        figure={<span className="text-positive">+{usd(s.income.received)}</span>}
        sub={s.income.next ? `About ${usd(s.income.expected)} this month. Next paycheck about ${shortDate(s.income.next.date)}` : `${s.income.items.length} deposits`}
      />
      <SummaryCard
        title="Expenses"
        onClick={() => onGo("expenses")}
        figure={<>{usd(s.totalSpent)} <span className="text-headline text-fg-3">of {usd(s.total)}</span></>}
        sub={expensesNote.length ? expensesNote.join(" · ") : "Everything on track"}
      >
        <BudgetBar spent={s.totalSpent} total={s.total} className="mt-2" />
      </SummaryCard>
    </div>
  );
}

/* ---------- Income ---------- */

function IncomeTab({ s }: { s: MonthSplit }) {
  return (
    <>
      <p className="mb-2 flex justify-between text-label text-fg-2">
        <span>{usd(s.income.received)} in so far</span>
        {s.income.next && <span className="text-fg-3">About {usd(s.income.expected)} expected</span>}
      </p>
      <div className="divide-y divide-line rounded-card border border-line bg-surface px-3.5 shadow-card">
        {s.income.items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 py-2.5">
            <CategoryIcon id="income" size={32} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-label">{i.merchant}</span>
              <span className="block text-caption text-fg-3">{i.received ? shortDate(i.date) : `Expected about ${shortDate(i.date)}`}</span>
            </span>
            <span className={`tabular shrink-0 text-label ${i.received ? "text-positive" : "text-fg-4"}`}>+{usd(i.amount)}</span>
          </div>
        ))}
        {!s.income.items.length && <p className="py-3 text-caption text-fg-3">Nothing in yet this month.</p>}
      </div>
    </>
  );
}

/* ---------- Expenses ---------- */

// Bills still to come this month first (so nothing surprises her), then
// every category with its progress
function ExpensesTab({ s, onOpen }: { s: MonthSplit; onOpen: (c: CategoryId) => void }) {
  const due = s.billItems.filter((i) => !i.paid);
  const dueFor = (c: CategoryId) => due.filter((i) => i.category === c).length;
  return (
    <div className="space-y-5 pb-2">
      {due.length > 0 && (
        <section>
          <h2 className="mb-2 flex justify-between text-label font-medium text-fg-2">
            Coming up
            <span className="tabular font-normal text-fg-3">{usd(due.reduce((sum, i) => sum + i.amount, 0))}</span>
          </h2>
          <div className="divide-y divide-line rounded-card border border-line bg-surface px-3.5 shadow-card">
            {due.map((it) => (
              <button key={it.id} className="flex w-full items-center gap-3 py-2.5 text-left" onClick={() => onOpen(it.category)}>
                <span className="grid size-5 shrink-0 place-items-center rounded-full border border-dashed border-line-strong" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label">{it.merchant}</span>
                  <span className="block text-caption text-fg-3">{label(it.category)} · Due {shortDate(it.date)}</span>
                </span>
                <span className="tabular shrink-0 text-label">{usd(it.amount)}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="mb-2 flex justify-between text-label font-medium text-fg-2">
          Categories
          <span className="tabular font-normal text-fg-3">{usd(s.totalSpent)} of {usd(s.total)}</span>
        </h2>
        <div className="divide-y divide-line rounded-card border border-line bg-surface px-3.5 shadow-card">
          {s.rows.map((r) => (
            <CategoryRow key={r.category} r={r} sub={dueFor(r.category) ? `${dueFor(r.category)} coming up` : undefined} onClick={() => onOpen(r.category)} />
          ))}
        </div>
      </section>
    </div>
  );
}

// A category: icon, name, spent of its amount (amber when over), a thin bar
function CategoryRow({ r, sub, onClick }: { r: CategoryStatus; sub?: string; onClick: () => void }) {
  return (
    <button className="flex w-full items-center gap-3 py-2.5 text-left" onClick={onClick}>
      <CategoryIcon id={r.category} size={24} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-label">{label(r.category)}</span>
          <span className="tabular shrink-0 text-label">
            <span className={r.left < 0 ? "text-warning" : ""}>{usd(r.spent)}</span>
            <span className="text-fg-3"> of {usd(r.amount)}</span>
          </span>
        </span>
        <BudgetBar spent={r.spent} total={r.amount} className="mt-1.5 h-1.5" />
        {sub && <span className="mt-0.5 block text-caption text-fg-3">{sub}</span>}
      </span>
    </button>
  );
}
