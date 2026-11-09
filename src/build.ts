// Build my budget: the logic behind the flow on the Budget tab
// (src/screens/BuildBudget.tsx).
// 1. Sort your spending (teach Moneta): one question per merchant, into the
//    common categories (or her sheet's rows). Unsure ones first (a merchant
//    whose charges land in more than one category, or one Moneta couldn't
//    place), then confident guesses to confirm. Each answer is a merchant rule.
// 2. Her categories: Moneta pre-selects the common ones her sorted spending
//    uses; she renames, restyles, deletes or adds. (Her sheet's rows skip this.)
// 3. Draft: an amount per category, from her last 6 full months (or her sheet).
// Also the demo starting points (?start=budget, ?start=done).
// No runtime imports from the store or budget.ts (the store imports this).
import {
  BUDGET_CATEGORIES, categories, categoryOf, defaultCategoryOfKind, merchantName,
  type BuiltinId, type CategoryId, type CustomCategory, type KindId, type Rules,
} from "./categories";
import { importedBudget, months, today, transactions, type Transaction } from "./data";
import type { Edits } from "./store";

const thisMonth = today.slice(0, 7);
const recentMonths = months.filter((m) => m < thisMonth).slice(0, 6); // last 6 full months
const isSpending = (t: Transaction) => t.amount < 0 && t.kind !== "transfer" && t.kind !== "income";
const spending = transactions.filter(isSpending);

// Her average a month per category over the last 6 full months
function monthlyAverages(rules: Rules) {
  const totals: Record<CategoryId, number> = {};
  for (const t of spending) {
    if (!recentMonths.some((m) => t.date.startsWith(m))) continue;
    const c = categoryOf(t, rules);
    totals[c] = (totals[c] ?? 0) - t.amount / recentMonths.length;
  }
  return totals;
}

/* ---------- 1. Pick categories ---------- */

// Common categories she's spent in over the past year, with her answers so
// far (Misc is always on)
export const suggestedCategories = (rules: Rules = { merchants: {}, moves: {} }): CategoryId[] => {
  const used = new Set(spending.map((t) => categoryOf(t, rules)));
  return BUDGET_CATEGORIES.filter((c) => c === "misc" || used.has(c));
};

// Where each kind goes, given the common categories she picked: its default
// category if she picked it, otherwise Misc
export function kindsFor(picked: CategoryId[]): Partial<Record<KindId, CategoryId>> {
  const out: Partial<Record<KindId, CategoryId>> = {};
  for (const [k, c] of Object.entries(defaultCategoryOfKind) as [KindId, BuiltinId][]) {
    if (c === "income" || c === "transfer") continue;
    out[k] = picked.includes(c) ? c : "misc";
  }
  return out;
}

// Her sheet's rows, as-is: each row is a category of hers (borrowing the icon
// of the category its first kind goes to), and each kind goes to the first row
// that lists it. Kinds no row lists go to the last row ("Everything else").
export function fromSheet() {
  const custom: CustomCategory[] = importedBudget.rows.map((r, i) => ({
    id: `sheet-${i}`,
    label: r.name,
    look: defaultCategoryOfKind[r.mapsTo[0] as KindId] ?? "misc",
    hue: categories[defaultCategoryOfKind[r.mapsTo[0] as KindId] ?? "misc"].hue,
  }));
  const kinds: Partial<Record<KindId, CategoryId>> = {};
  importedBudget.rows.forEach((r, i) => r.mapsTo.forEach((k) => (kinds[k as KindId] ??= `sheet-${i}`)));
  const last = custom[custom.length - 1].id;
  for (const k of Object.keys(defaultCategoryOfKind) as KindId[]) if (k !== "income" && k !== "transfer") kinds[k] ??= last;
  const amounts = Object.fromEntries(importedBudget.rows.map((r, i) => [`sheet-${i}`, r.monthly]));
  return { custom, categories: custom.map((c) => c.id), kinds, amounts };
}

/* ---------- 2. Teach Moneta ---------- */

export type Question = {
  merchant: string; // without the demo's notes, e.g. "Amazon"
  count: number;
  total: number; // all-time spending there
  examples: Transaction[]; // a few recent charges
  guess: CategoryId | null; // Moneta's confident guess, or null when unsure
  options: CategoryId[]; // where its charges land today (unsure ones)
  suggested: CategoryId; // what Moneta recommends: its guess, or where most of the money went
};

// Every merchant she's spent at, unsure ones first, then by how much she spent
export function questions(rules: Rules): Question[] {
  const by: Record<string, Transaction[]> = {};
  for (const t of spending) (by[merchantName(t.merchant)] ??= []).push(t);
  const list = Object.entries(by).map(([merchant, ts]): Question => {
    const base = { ...rules, merchants: {}, moves: {} };
    const spent: Record<CategoryId, number> = {};
    for (const t of ts) spent[categoryOf(t, base)] = (spent[categoryOf(t, base)] ?? 0) - t.amount;
    const cats = Object.keys(spent).sort((a, b) => spent[b] - spent[a]); // most money first
    const unsure = cats.length > 1 || ts.every((t) => t.kind === "other");
    return {
      merchant,
      count: ts.length,
      total: -ts.reduce((s, t) => s + t.amount, 0),
      examples: ts.slice(0, 3),
      guess: unsure ? null : cats[0],
      options: unsure ? cats.filter((c) => c !== "misc" || ts.every((t) => t.kind === "other")) : [],
      suggested: cats[0],
    };
  });
  return list.sort((a, b) => (a.guess === null) !== (b.guess === null) ? (a.guess === null ? -1 : 1) : b.total - a.total);
}

// Categories by how much of her spending lands in them over the year (Moneta's
// default mapping): the likely runner-ups when she sorts a merchant
export const popularCategories: CategoryId[] = (() => {
  const totals: Record<CategoryId, number> = {};
  for (const t of spending) totals[categoryOf(t)] = (totals[categoryOf(t)] ?? 0) - t.amount;
  return Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
})();

// How many questions make a first draft, and each "keep going" set
export const SET_SIZE = 10;

/* ---------- 3. Draft ---------- */

// Her average, rounded up a little so it's realistic (bills to the nearest $5)
const BILLS: CategoryId[] = ["rent", "bills", "loans"];
const roundUp = (n: number, bill: boolean) => (bill ? Math.ceil(n / 5) * 5 : n >= 200 ? Math.ceil(n / 25) * 25 : Math.ceil(n / 10) * 10);
export function draftAmounts(cats: CategoryId[], rules: Rules) {
  const avg = monthlyAverages(rules);
  return Object.fromEntries(cats.map((c) => [c, roundUp(avg[c] ?? 0, BILLS.includes(c))]));
}

/* ---------- Demo starting points ---------- */

export type StartPoint = "budget" | "done";

// Lois's answers for "Fully set up" (her unsure merchants; null = It varies)
const loisAnswers: Record<string, CategoryId | null> = {
  Amazon: "shopping",
  Target: "shopping",
  Etsy: null,
  "Galaxy Mall": "shopping",
  "Bibbo's Ace o' Clubs": null,
  "SQ *MKT STALL 22": "groceries",
  "PAYPAL *JK8823": "misc",
};

export function startingPoint(point: StartPoint): Partial<Edits> {
  if (point === "budget") return {}; // accounts linked, no budget yet
  // Fully set up: the first set of questions answered, Moneta's picks, the draft saved
  const rules: Rules = { merchants: {}, moves: {}, kinds: {} };
  for (const q of questions(rules).slice(0, SET_SIZE)) {
    const answer = q.merchant in loisAnswers ? loisAnswers[q.merchant] : q.guess;
    if (answer) rules.merchants[q.merchant] = answer;
  }
  const picked = suggestedCategories(rules);
  rules.kinds = kindsFor(picked);
  return { categories: picked, rules, amounts: draftAmounts(picked, rules), budgetSource: "moneta" };
}
