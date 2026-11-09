// Budget: one amount per category, month by month.
// - No budget yet: Build with Moneta, or import a budget (BuildBudget.tsx).
// - With a budget: the month (short, flush left), Income (what came in),
//   Bills (paid / coming up) and Spending (each category's progress; over
//   budget is amber). A deep dive on this layout is planned (PRD Next). Tap a category for its page
//   (CategoryPage.tsx). A quiet "Add category" at the bottom. Changes are
//   mostly made with Moneta; editing by hand is there but not pushed.
// No "left to spend" hero for now (pay cycles make it tricky; PRD Later).
// Copy marked PLACEHOLDER is for Ann Marie to reword.
import { useState } from "react";
import { Check, ChevronRight, Plus, Sparkles, Table2 } from "lucide-react";
import { billItems, budgetMonths, categoryMonth, isBill, type CategoryStatus } from "../budget";
import { addCategory, newCategoryId } from "../budgetActions";
import { cat, type CategoryId, type CustomCategory } from "../categories";
import { CategoryIcon } from "../components/CategoryIcon";
import { BudgetBar } from "../components/BudgetBar";
import { MonthStepper } from "../components/MonthStepper";
import { Button } from "../components/Button";
import goose from "../assets/goose-glasses-circle.svg";
import { PageHeader } from "../components/PageHeader";
import { transactions } from "../data";
import { edit, useEdits } from "../store";
import { BuildBudget, type BuildMode } from "./BuildBudget";
import { CategoryPage } from "./CategoryPage";
import { NewCategory } from "./CategoryEditor";
import { OrDivider } from "../components/OrDivider";

const usd = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
const shortDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function Budget({ onAsk }: { onAsk: (question: string) => void }) {
  const e = useEdits();
  const [building, setBuilding] = useState<BuildMode | null>(null);
  const [monthIndex, setMonthIndex] = useState(0);
  const [open, setOpen] = useState<CategoryId | null>(null);
  const month = budgetMonths[monthIndex];

  return (
    <div className="relative h-full">
      <div className="scroll px-4 pt-2">
        <PageHeader title="Budget" />
        {e.budgetSource ? (
          <Overview month={month} monthIndex={monthIndex} setMonthIndex={setMonthIndex} onOpen={setOpen} />
        ) : (
          <Start onStart={setBuilding} />
        )}
      </div>

      {building && <BuildBudget mode={building} onClose={() => setBuilding(null)} onDone={() => { setBuilding(null); setMonthIndex(0); }} />}
      {open && e.categories.includes(open) && <CategoryPage id={open} month={month} onClose={() => setOpen(null)} onAsk={onAsk} />}
    </div>
  );
}

/* ---------- No budget yet ---------- */

function Start({ onStart }: { onStart: (mode: BuildMode) => void }) {
  return (
    <>
    {/* Ann Marie's words (from her notes, lightly tidied) */}
    <h2 className="mt-4 text-headline font-medium">You don’t have a budget yet</h2>
    <p className="mt-1 text-label text-fg-3">Choose one of the options below to get started.</p>

    <section className="mt-4 rounded-card border border-accent/40 bg-surface p-4 shadow-card ring-4 ring-accent-soft">
      <div className="flex items-center gap-3">
        <img src={goose} alt="" className="size-10 shrink-0" />
        <div className="min-w-0 flex-1">
          {/* The tag keeps to one line: on the narrowest screens it's just the sparkle */}
          <p className="@container flex items-center gap-2">
            <span className="text-headline font-medium whitespace-nowrap">Build with Moneta</span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-1.5 text-[11px] leading-5 font-medium text-accent" aria-label="Easiest">
              <Sparkles size={11} aria-hidden="true" />
              <span className="hidden pr-0.5 @min-[236px]:inline">Easiest</span>
            </span>
          </p>
          <p className="mt-0.5 text-label text-fg-2">Moneta can analyze your history to help build a budget that’s right for you.</p>
        </div>
      </div>
      <Button variant="primary" className="mt-4 w-full" onClick={() => onStart("moneta")}>Get started</Button>
    </section>

    <OrDivider />

    <button className="flex w-full items-center gap-3 rounded-card border border-line bg-surface px-3.5 py-3 text-left shadow-card" onClick={() => onStart("sheet")}>
      <span className="grid size-9 shrink-0 place-items-center rounded-control bg-subtle text-fg-2"><Table2 size={18} strokeWidth={1.75} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-label font-medium">Already have a budget?</span>
        <span className="mt-0.5 block text-caption text-fg-3">Import it here, whether it’s a spreadsheet, a Google Drive file, or even just a picture.</span>
      </span>
      <ChevronRight size={16} className="text-fg-4" aria-hidden="true" />
    </button>
    </>
  );
}

/* ---------- With a budget ---------- */

function Overview({ month, monthIndex, setMonthIndex, onOpen }: {
  month: string;
  monthIndex: number;
  setMonthIndex: (i: number) => void;
  onOpen: (c: CategoryId) => void;
}) {
  const e = useEdits();
  const [adding, setAdding] = useState<CustomCategory | null>(null);
  const b = categoryMonth(e, month);
  const bills = b.rows.filter((r) => isBill(e, r.category));
  const spending = b.rows.filter((r) => !isBill(e, r.category));
  // Money in this month (not transfers between her own accounts)
  const income = transactions.filter((t) => t.date.startsWith(month) && t.kind === "income" && t.amount > 0);
  const incomeTotal = income.reduce((s, t) => s + t.amount, 0);
  return (
    <>
      {/* The month: short and flush left; tap to pick another */}
      <div className="mt-1">
        <MonthStepper compact months={budgetMonths} index={monthIndex} onChange={setMonthIndex} />
      </div>

      {/* Income: what came in this month */}
      <section className="mt-3">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-headline font-medium">Income</h2>
          <span className="tabular text-label text-positive">+{usd(incomeTotal)}</span>
        </div>
        <div className="divide-y divide-line rounded-card border border-line bg-surface px-3.5 shadow-card">
          {income.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5">
              <CategoryIcon id="income" size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label">{t.merchant}</span>
                <span className="block text-caption text-fg-3">{shortDate(t.date)}</span>
              </span>
              <span className="tabular shrink-0 text-label text-positive">+${t.amount.toFixed(2)}</span>
            </div>
          ))}
          {/* PLACEHOLDER copy */}
          {!income.length && <p className="py-3 text-caption text-fg-3">Nothing in yet this month.</p>}
        </div>
      </section>

      {/* Bills: each with what's paid and what's coming up this month */}
      {bills.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-headline font-medium">Bills</h2>
          <div className="divide-y divide-line rounded-card border border-line bg-surface px-3.5 shadow-card">
            {bills.map((r) => <BillRow key={r.category} row={r} month={month} onOpen={() => onOpen(r.category)} />)}
          </div>
        </section>
      )}

      {/* Spending: each category's progress */}
      <section className="mt-6">
        <h2 className="mb-2 text-headline font-medium">Spending</h2>
        <div className="divide-y divide-line rounded-card border border-line bg-surface px-3.5 shadow-card">
          {spending.map((r) => (
            <button key={r.category} className="flex w-full items-center gap-3 py-3 text-left" onClick={() => onOpen(r.category)}>
              <CategoryIcon id={r.category} size={32} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-label font-medium">{cat(r.category).label}</span>
                  <span className={`tabular shrink-0 text-label ${r.left < 0 ? "text-warning" : "text-fg-2"}`}>{r.left < 0 ? `Over by ${usd(r.left)}` : `${usd(r.left)} left`}</span>
                </span>
                <BudgetBar spent={r.spent} total={r.amount} className="mt-2" />
                <span className="tabular mt-1.5 block text-caption text-fg-3">{usd(r.spent)} of {usd(r.amount)}</span>
              </span>
              <ChevronRight size={14} className="text-fg-4" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      {/* Quiet: add a category by hand (asking Moneta is the main way to change things) */}
      <div className="mt-3 mb-6 flex justify-center">
        {/* PLACEHOLDER copy */}
        <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => setAdding({ id: newCategoryId(), label: "", look: "misc", hue: "slate" })}>
          Add category
        </Button>
      </div>
      <NewCategory
        key={adding?.id ?? "none"}
        value={adding}
        withAmount
        onClose={() => setAdding(null)}
        onSave={(v, amount) => { edit((x) => addCategory(x, v, amount)); setAdding(null); }}
      />
    </>
  );
}

// A bill category: paid so far of its amount, and each bill paid or due
function BillRow({ row, month, onOpen }: { row: CategoryStatus; month: string; onOpen: () => void }) {
  const { rules } = useEdits();
  const items = billItems(row.category, month, rules);
  return (
    <button className="block w-full py-3 text-left" onClick={onOpen}>
      <span className="flex items-center gap-3">
        <CategoryIcon id={row.category} size={32} />
        <span className="min-w-0 flex-1 truncate text-label font-medium">{cat(row.category).label}</span>
        <span className="tabular shrink-0 text-label text-fg-2">{usd(row.spent)} of {usd(row.amount)}</span>
        <ChevronRight size={14} className="text-fg-4" aria-hidden="true" />
      </span>
      {items.length > 0 && (
        <span className="mt-2 ml-11 block space-y-1.5">
          {items.map((it) => (
            <span key={it.id} className="flex items-center gap-2 text-caption">
              <span className={`grid size-4 shrink-0 place-items-center rounded-full ${it.paid ? "bg-positive-soft text-positive" : "border border-dashed border-line-strong"}`} aria-hidden="true">
                {it.paid && <Check size={10} strokeWidth={2.5} />}
              </span>
              <span className="min-w-0 flex-1 truncate text-fg-2">{it.merchant}</span>
              <span className="tabular shrink-0 text-fg-3">{it.paid ? `Paid ${shortDate(it.date)}` : `Due ${shortDate(it.date)}`}</span>
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
