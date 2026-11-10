// Budget: one amount per category, month by month.
// - No budget yet: Build with Moneta, or import a budget (BuildBudget.tsx).
// - With a budget: the month (short, flush left), then quiet tabs: All /
//   Income / Expenses (BudgetTabs.tsx; from the layout deep dive, see
//   DECISIONS.md). Tap a category for its page (CategoryPage.tsx). A quiet
//   "Add category" at the bottom. Changes are mostly made with Moneta;
//   editing by hand is there but not pushed.
// No "left to spend" hero for now (pay cycles make it tricky; PRD Later).
// Copy marked PLACEHOLDER is for Ann Marie to reword.
import { useState } from "react";
import { ChevronRight, Plus, Sparkles, Table2 } from "lucide-react";
import { budgetMonths, monthSplit } from "../budget";
import { addCategory, newCategoryId } from "../budgetActions";
import type { CategoryId, CustomCategory } from "../categories";
import { MonthStepper } from "../components/MonthStepper";
import { Button } from "../components/Button";
import goose from "../assets/goose-glasses-circle.svg";
import { PageHeader } from "../components/PageHeader";
import { edit, useEdits } from "../store";
import { BudgetTabs } from "./BudgetTabs";
import { BuildBudget, type BuildMode } from "./BuildBudget";
import { CategoryPage } from "./CategoryPage";
import { NewCategory } from "./CategoryEditor";
import { OrDivider } from "../components/OrDivider";

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
  return (
    <>
      {/* The month: short and flush left; tap to pick another */}
      <div className="mt-1">
        <MonthStepper compact months={budgetMonths} index={monthIndex} onChange={setMonthIndex} />
      </div>

      <BudgetTabs s={monthSplit(e, month)} onOpen={onOpen} />

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
