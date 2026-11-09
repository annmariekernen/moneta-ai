// Transaction history: the full, richer view of all her activity. Search,
// filters (money in/out, account, category, show transfers). Shows the last 30
// days from today, with "Show 30 more days" reaching back to the start of her
// data.
import { useMemo, useState } from "react";
import { ChevronLeft, Search, SlidersHorizontal, X } from "lucide-react";
import { cat, categoryOf, type CategoryId } from "../categories";
import { Button } from "../components/Button";
import { Tabs } from "../components/Tabs";
import { TxnList } from "../components/TxnList";
import { monthLabel, months, today, transactions, type Transaction } from "../data";

// An ISO date n days before another ("2026-11-08", 30 → "2026-10-09")
const daysBefore = (iso: string, n: number) => {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
import { useEdits } from "../store";

type Flow = "all" | "out" | "in";
const accountFilters = [
  { id: "all", label: "All accounts" },
  { id: "checking", label: "Checking" },
  { id: "visa", label: "Visa 4422" },
  { id: "mc", label: "Mastercard 3456" },
];

export function Transactions({ onBack, onSelect }: { onBack: () => void; onSelect: (t: Transaction) => void }) {
  const { rules, categories: mine } = useEdits();
  const [query, setQuery] = useState("");
  const [flow, setFlow] = useState<Flow>("all");
  const [account, setAccount] = useState("all");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [showTransfers, setShowTransfers] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Starts with the last 30 days; "Show 30 more days" reaches further back
  const [windows, setWindows] = useState(1);
  const since = daysBefore(today, 30 * windows);

  const searching = query.trim().length > 0;
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (!searching && t.date < since) return false; // search looks through everything
      if (!showTransfers && t.kind === "transfer") return false;
      if (flow === "out" && t.amount > 0) return false;
      if (flow === "in" && t.amount < 0) return false;
      if (account === "checking" ? !["checking", "debit"].includes(t.account) : account !== "all" && t.account !== account) return false;
      if (category !== "all" && categoryOf(t, rules) !== category) return false;
      if (q && !t.merchant.toLowerCase().includes(q)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, flow, account, category, showTransfers, since, rules]);

  const activeFilters = (account !== "all" ? 1 : 0) + (category !== "all" ? 1 : 0) + (showTransfers ? 1 : 0);
  const moreDays = !searching && since > transactions[transactions.length - 1].date;
  const pill = (on: boolean) =>
    `inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-label ${on ? "border-fg bg-fg text-white" : "border-line bg-surface text-fg hover:bg-subtle"}`;

  return (
    <div className="relative h-full">
    <div className="scroll px-4 pt-2">
      <div className="flex items-center gap-2 py-2">
        <button className="grid size-9 place-items-center rounded-control text-fg-2 hover:bg-subtle" onClick={onBack} aria-label="Back">
          <ChevronLeft size={22} />
        </button>
        <label className="flex h-9 flex-1 items-center gap-2 rounded-control bg-subtle px-3 text-fg-3">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all transactions"
            className="min-w-0 flex-1 bg-transparent text-label text-fg outline-none placeholder:text-fg-4"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="text-fg-4 hover:text-fg">
              <X size={14} />
            </button>
          )}
        </label>
        <button
          className={`relative grid size-9 place-items-center rounded-control hover:bg-subtle ${filtersOpen || activeFilters ? "text-accent" : "text-fg-2"}`}
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-label="Filters"
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal size={18} />
          {activeFilters > 0 && <span className="absolute top-1 right-1 size-2 rounded-full bg-accent" />}
        </button>
      </div>

      <h2 className="mt-4 text-title font-medium">Transaction history</h2>
      {searching && (
        <p className="mt-0.5 text-caption text-fg-3">
          {results.length} result{results.length === 1 ? "" : "s"} for “{query.trim()}”
        </p>
      )}

      <div className="mt-4">
        <Tabs options={[{ value: "all", label: "All" }, { value: "out", label: "Money out" }, { value: "in", label: "Money in" }]} value={flow} onChange={setFlow} />
      </div>

      <div className="mt-4">
        {results.length ? (
          <TxnList items={results} onSelect={onSelect} />
        ) : (
          <p className="py-10 text-center text-label text-fg-3">Nothing matches. Try a different search or filter.</p>
        )}
      </div>

      {moreDays && (
        <button
          className="mt-4 w-full rounded-control border border-line bg-surface py-2.5 text-label font-medium text-fg hover:bg-subtle"
          onClick={() => setWindows((n) => n + 1)}
        >
          Show 30 more days
        </button>
      )}
      {!searching && !moreDays && <p className="mt-4 text-center text-caption text-fg-4">That’s everything since {monthLabel(months[months.length - 1], { year: true })}.</p>}
    </div>

    {/* Filters: a full page over the screen, × to close. Changes apply as
        you tap; the button at the bottom shows how many match. */}
    {filtersOpen && (
      <div className="filters-page absolute inset-0 z-10 flex flex-col bg-page" role="dialog" aria-label="Filters">
        <div className="flex items-center justify-between px-4 pt-2 pb-2">
          <h2 className="text-title font-medium">Filters</h2>
          <button className="grid size-9 place-items-center rounded-control text-fg-2 hover:bg-subtle" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
            <X size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="flex flex-col gap-6 pt-2">
            <section>
              <h3 className="mb-2 text-label font-medium">Account</h3>
              <div className="flex flex-wrap gap-1.5">
                {accountFilters.map((a) => (
                  <button key={a.id} className={pill(account === a.id)} onClick={() => setAccount(a.id)}>{a.label}</button>
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-2 text-label font-medium">Category</h3>
              <div className="flex flex-wrap gap-1.5">
                <button className={pill(category === "all")} onClick={() => setCategory("all")}>All</button>
                {[...mine, "income" as const].map((c) => (
                  <button key={c} className={pill(category === c)} onClick={() => setCategory(c)}>{cat(c).label}</button>
                ))}
              </div>
            </section>
            <label className="flex items-center gap-2.5 text-label">
              <input type="checkbox" checked={showTransfers} onChange={(e) => setShowTransfers(e.target.checked)} className="size-4 shrink-0 accent-[var(--color-accent)]" />
              Show transfers between my accounts
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-line bg-surface px-4 py-3">
          <Button variant="ghost" disabled={!activeFilters} onClick={() => { setAccount("all"); setCategory("all"); setShowTransfers(false); }}>
            Clear all
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => setFiltersOpen(false)}>
            Show {results.length} transaction{results.length === 1 ? "" : "s"}
          </Button>
        </div>
      </div>
    )}
    </div>
  );
}
