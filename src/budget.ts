// Budget: how each of her categories is doing in a month, which ones are
// bills (paid / coming up), and the summary of her edits that's sent to
// Moneta with each message. Everything uses her categories and rules
// (categoryOf). Changing the budget: src/budgetActions.ts.
import { cat, categoryOf, defaultCategoryOfKind, type CategoryId, type KindId, type Rules } from "./categories";
import { accountList } from "./accounts";
import { monthLabel, months, recurringMerchants, today, transactions, type Transaction } from "./data";
import type { Edits } from "./store";

export const thisMonth = today.slice(0, 7);
// Months the Budget tab can step through, newest first
export const budgetMonths = months;
export { categoryOf };

// A month's spending in each category
export function spentByCategory(m: string, rules: Rules) {
  const totals: Partial<Record<CategoryId, number>> = {};
  for (const t of transactions) {
    if (!t.date.startsWith(m) || t.amount >= 0) continue;
    const c = categoryOf(t, rules);
    if (c === "transfer" || c === "income") continue;
    totals[c] = (totals[c] ?? 0) - t.amount;
  }
  return totals;
}

export type CategoryStatus = { category: CategoryId; amount: number; spent: number; left: number };

// Everything the Budget tab shows for one month, from her categories and amounts
export function categoryMonth(e: Edits, m: string) {
  const spent = spentByCategory(m, e.rules);
  const rows: CategoryStatus[] = e.categories.map((c) => {
    const amount = e.amounts[c] ?? 0;
    return { category: c, amount, spent: spent[c] ?? 0, left: amount - (spent[c] ?? 0) };
  });
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const totalSpent = Object.values(spent).reduce<number>((s, v) => s + (v ?? 0), 0);
  const [y, mo] = m.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const daysLeft = m === thisMonth ? daysInMonth - Number(today.slice(8, 10)) + 1 : 0;
  return { rows, total, totalSpent, left: total - totalSpent, daysLeft };
}

/* ---------- Bills: paid or coming up ---------- */

// A category is bills when everything that lands there by kind is a bill kind
// (rent, utilities, insurance, loans): Rent / mortgage, Bills, Student loans,
// or a sheet row like "Rent + bills". Moneta works it out; no checkbox.
const BILL_KINDS: KindId[] = ["rent", "utilities", "insurance", "loans"];
export function isBill(e: Pick<Edits, "rules">, c: CategoryId) {
  const kinds = (Object.keys(defaultCategoryOfKind) as KindId[]).filter((k) => (e.rules.kinds?.[k] ?? defaultCategoryOfKind[k]) === c);
  return kinds.length > 0 && kinds.every((k) => BILL_KINDS.includes(k));
}

export type BillItem = { id: string; merchant: string; amount: number; date: string; paid: boolean; txn?: Transaction };

// Each recurring merchant's latest charge (to guess the next one)
const lastCharge = (() => {
  const out: Record<string, Transaction> = {};
  for (const t of transactions) if (recurringMerchants.has(t.merchant) && t.amount < 0 && !out[t.merchant]) out[t.merchant] = t; // newest first
  return out;
})();

// A bill category's charges in a month: what's been paid, plus recurring
// charges that haven't come through yet ("due Nov 15", same day as last time)
export function billItems(c: CategoryId, m: string, rules: Rules): BillItem[] {
  const inIt = (t: Transaction) => categoryOf(t, rules) === c;
  const paid = transactions.filter((t) => t.date.startsWith(m) && t.amount < 0 && inIt(t));
  const items: BillItem[] = paid.map((t) => ({ id: t.id, merchant: t.merchant, amount: -t.amount, date: t.date, paid: true, txn: t }));
  if (m === thisMonth) {
    for (const last of Object.values(lastCharge)) {
      if (!inIt(last) || paid.some((t) => t.merchant === last.merchant)) continue;
      items.push({ id: `due-${last.merchant}`, merchant: last.merchant, amount: -last.amount, date: `${m}-${last.date.slice(8, 10)}`, paid: false });
    }
  }
  return items.sort((a, b) => (a.date < b.date ? -1 : 1));
}

/* ---------- What Moneta should know about her edits ---------- */
// Sent with each chat message, so Moneta's answers match the screens.

const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;

export function contextForMoneta(e: Edits): string {
  const lines: string[] = [];
  if (e.budgetSource) {
    const b = categoryMonth(e, thisMonth);
    lines.push(`Her budget in Moneta (built ${e.budgetSource === "import" ? "from her Google Sheet's rows" : "with Moneta"}; this replaces the Google Sheet as her budget). ${monthLabel(thisMonth)} so far (${b.daysLeft} days left):`);
    for (const r of b.rows) lines.push(`- ${cat(r.category).label}${isBill(e, r.category) ? " (bills)" : ""}: ${money(r.amount)}/month, spent ${money(r.spent)}, ${r.left >= 0 ? `${money(r.left)} left` : `over by ${money(-r.left)}`}`);
    lines.push(`Total: ${money(b.totalSpent)} spent of ${money(b.total)}.`);
    if (e.budgetSource === "moneta") lines.push("This budget started as Moneta's draft: Moneta picked her categories and set each amount from her average over the last 6 full months, rounded up a little. She may want to adjust it; help her think it through (which amounts look high or low for her). She can change things by hand on each category's page (Budget tab, tap a category), or ask Moneta, who proposes changes as action cards she applies.");
  } else {
    lines.push("She hasn't built a budget in Moneta yet (the Budget tab offers Build with Moneta: answer a few questions about merchants, or skip, and Moneta makes a draft; or import her existing budget). Her Google Sheet budget is listed above. Until then, her transactions use Moneta's common categories.");
  }

  const accounts = accountList(e);
  const renamed = accounts.filter((a) => a.name !== a.originalName);
  if (renamed.length) lines.push(`Accounts she renamed: ${renamed.map((a) => `"${a.originalName}" is now "${a.name}"`).join("; ")}.`);
  const hidden = accounts.filter((a) => a.hidden);
  if (hidden.length) lines.push(`Hidden from her net worth and totals: ${hidden.map((a) => a.name).join(", ")}.`);
  if (e.unlinkedAccounts.length) lines.push(`Accounts she unlinked (don't mention their balances): ${e.unlinkedAccounts.join(", ")}.`);
  const linked = accounts.filter((a) => a.linked);
  if (linked.length) lines.push(`Pretend accounts she linked in the demo: ${linked.map((a) => `${a.name} (${a.institution}) ${money(a.balance)}`).join("; ")}.`);

  const label = (c: CategoryId) => cat(c)?.label ?? c;
  // Always listed, with ids, so Moneta's action cards can point at them
  lines.push(`Her categories (use only these names; id in brackets, for changes): ${e.categories.map((c) => `${label(c)} [${c}]`).join(", ")}.`);
  const merchantRules = Object.entries(e.rules.merchants);
  if (merchantRules.length) lines.push(`Her rules (every charge from this merchant goes here): ${merchantRules.map(([m, c]) => `${m} → ${label(c)}`).join("; ")}.`);
  const moves = Object.entries(e.rules.moves);
  if (moves.length) {
    const byId = new Map(transactions.map((t) => [t.id, t]));
    const list = moves.map(([id, c]) => byId.get(id) && `${byId.get(id)!.date} ${byId.get(id)!.merchant} → ${label(c)}`).filter(Boolean);
    lines.push(`Single transactions she moved to another category (use her category): ${list.join("; ")}.`);
  }
  if (merchantRules.length || moves.length) {
    // Totals with her rules, so Moneta doesn't have to redo the math
    const done = months.filter((m) => m <= thisMonth).slice(0, 3);
    for (const m of done) {
      const spent = spentByCategory(m, e.rules);
      lines.push(`Spending in ${monthLabel(m, { year: true })} with her rules: ${(Object.entries(spent) as [CategoryId, number][]).sort((a, b) => b[1] - a[1]).map(([c, v]) => `${label(c)} ${money(v)}`).join(", ")}.`);
    }
  }
  if (e.removed.length) {
    const byId = new Map(transactions.map((t) => [t.id, t]));
    const waiting = e.review.filter((id) => !e.rules.moves[id]).map((id) => byId.get(id)).filter(Boolean);
    lines.push(`She deleted these categories: ${e.removed.join(", ")}. Their charges moved to Misc${waiting.length ? `, and she hasn't said where these go yet (when it fits, offer to help sort them): ${waiting.slice(0, 30).map((t) => `${t!.date} ${t!.merchant} ${money(t!.amount)}`).join("; ")}` : ""}.`);
  }
  const amounts = (Object.entries(e.amounts) as [CategoryId, number][]).filter(([, v]) => v > 0);
  if (amounts.length) lines.push(`Her monthly budget per category: ${amounts.map(([c, v]) => `${label(c)} ${money(v)}`).join(", ")}.`);
  return lines.join("\n").slice(0, 4000);
}

/* ---------- Money in: received, and paychecks Moneta expects ---------- */
// Used by the Budget tab layouts that show income next to spending.

export type IncomeItem = { id: string; merchant: string; amount: number; date: string; received: boolean };

// Paychecks repeat on a steady gap (Lois: every 14 days). A source counts as
// a paycheck once it's come in 3+ times; the next one is the last date plus
// the gap between the last two. Only the current month gets expected ones.
const paychecks = (() => {
  const by: Record<string, Transaction[]> = {};
  for (const t of transactions) if (t.kind === "income" && t.amount > 0) (by[t.merchant] ??= []).push(t); // newest first
  return Object.values(by).filter((list) => list.length >= 3);
})();

const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function incomeMonth(m: string) {
  const items: IncomeItem[] = transactions
    .filter((t) => t.date.startsWith(m) && t.kind === "income" && t.amount > 0)
    .map((t) => ({ id: t.id, merchant: t.merchant, amount: t.amount, date: t.date, received: true }));
  if (m === thisMonth) {
    for (const [last, before] of paychecks) {
      const gap = Math.round((Date.parse(last.date) - Date.parse(before.date)) / 86400000);
      if (gap < 5) continue;
      for (let d = addDays(last.date, gap); d.startsWith(m); d = addDays(d, gap)) {
        if (d > today) items.push({ id: `expected-${last.merchant}-${d}`, merchant: last.merchant, amount: last.amount, date: d, received: false });
      }
    }
  }
  items.sort((a, b) => (a.date < b.date ? -1 : 1));
  const received = items.filter((i) => i.received).reduce((s, i) => s + i.amount, 0);
  const expected = items.reduce((s, i) => s + i.amount, 0);
  const next = items.find((i) => !i.received);
  return { items, received, expected, next };
}

/* ---------- One month, the way the Budget tab shows it ---------- */
// Every category's progress, each bill (paid or coming up, across all bill
// categories, by date), and money in (BudgetTabs.tsx)

export function monthSplit(e: Edits, m: string) {
  const b = categoryMonth(e, m);
  const bills = b.rows.filter((r) => isBill(e, r.category));
  const items = bills.flatMap((r) => billItems(r.category, m, e.rules).map((it) => ({ ...it, category: r.category })));
  return {
    ...b,
    billItems: items.sort((a, z) => (a.date < z.date ? -1 : 1)),
    income: incomeMonth(m),
  };
}
export type MonthSplit = ReturnType<typeof monthSplit>;
