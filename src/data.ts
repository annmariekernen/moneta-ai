// What the screens show, all computed from src/demo-data.json (the same file
// Moneta reads), so the numbers on screen always match Moneta's answers.
// The data itself comes from scripts/generate-demo-data.mjs.
import demo from "./demo-data.json";
import { cat, categoryOf, merchantName, type CategoryId, type KindId, type Rules } from "./categories";

// demo-data.json's `category` is Moneta's hidden kind (see src/categories.ts)
type Json = { id: string; date: string; merchant: string; amount: number; account: string; category: string };
type Raw = Omit<Json, "category"> & { kind: KindId };
const all: Raw[] = (demo.transactions as Json[]).map(({ category, ...t }) => ({ ...t, kind: category as KindId }));

export const user = demo.user;
export const today = demo.today;

const accountLabel: Record<string, string> = {
  checking: "Checking 1234",
  debit: "Debit 1234",
  visa: "Visa 4422",
  mc: "Mastercard 3456",
};
// Money moving between her own accounts isn't spending, so screens skip it
const real = all.filter((t) => t.kind !== "transfer");

// Totals by her category for a month ("2026-10"), with her rules
const monthTotals = (m: string, rules?: Rules) => {
  const totals: Partial<Record<CategoryId, number>> = {};
  for (const t of real) {
    if (!t.date.startsWith(m) || t.amount >= 0) continue;
    const c = categoryOf(t, rules);
    if (c === "income") continue;
    totals[c] = (totals[c] ?? 0) - t.amount;
  }
  return totals;
};
// Totals by hidden kind (for findings about specific kinds of places)
const kindTotals = (m: string) => {
  const totals: Partial<Record<KindId, number>> = {};
  for (const t of real) if (t.date.startsWith(m) && t.amount < 0) totals[t.kind] = (totals[t.kind] ?? 0) - t.amount;
  return totals;
};

/* ---------- Queries the screens use ---------- */
// One place that answers questions about the demo data. Screens ask these
// instead of filtering demo-data.json themselves.

export type Transaction = Raw & { label: string };

// Every transaction, newest first, with a display label for its account
export const transactions: Transaction[] = all.map((t) => ({ ...t, label: accountLabel[t.account] ?? t.account }));

// Recurring charges (money out only): a merchant that charges exactly once a
// month, every month in a row (at least 3), on the same day of the month each
// time. Simple on purpose; see PRD.md for the edge cases a real version needs
// (weekends, short months, amounts that change, letting her confirm it).
export const recurringMerchants = (() => {
  const seen: Record<string, string[]> = {};
  for (const t of all) {
    if (t.kind === "transfer" || t.amount > 0) continue;
    (seen[t.merchant] ??= []).push(t.date);
  }
  const monthIndex = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7));
  return new Set(
    Object.entries(seen)
      .filter(([, dates]) => {
        if (dates.length < 3) return false;
        const sorted = [...dates].sort();
        const sameDay = sorted.every((d) => d.slice(8, 10) === sorted[0].slice(8, 10));
        const everyMonthInARow = sorted.every((d, i) => i === 0 || monthIndex(d) === monthIndex(sorted[i - 1]) + 1);
        return sameDay && everyMonthInARow;
      })
      .map(([merchant]) => merchant),
  );
})();

// Months that have data, newest first ("2026-11", "2026-10", ...)
export const months: string[] = [...new Set(all.map((t) => t.date.slice(0, 7)))];

export const monthLabel = (m: string, opts: { year?: boolean } = {}) =>
  new Date(m + "-15T12:00:00Z").toLocaleDateString("en-US", { month: "long", ...(opts.year ? { year: "numeric" } : {}), timeZone: "UTC" });

// Everything in one month (any account), optionally only spending
export const inMonth = (m: string, opts: { spendingOnly?: boolean } = {}) =>
  transactions.filter((t) => t.date.startsWith(m) && (!opts.spendingOnly || (t.amount < 0 && t.kind !== "transfer")));

// Spending by category for a month, biggest first, with the change vs. the
// month before (null when there's nothing to compare)
export function spendingByCategory(m: string, rules: Rules) {
  const prev = months[months.indexOf(m) + 1];
  const now = monthTotals(m, rules);
  const before = prev ? monthTotals(prev, rules) : {};
  return (Object.entries(now) as [CategoryId, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([id, total]) => ({
      category: id,
      total,
      change: before[id] ? (total - before[id]!) / before[id]! : null,
    }));
}

// A category's monthly spending over the whole year, oldest first (for trends)
export const categoryTrend = (category: CategoryId, rules: Rules) =>
  [...months].reverse().map((m) => ({ month: m, total: monthTotals(m, rules)[category] ?? 0 }));

// Transactions for one account, newest first
export const forAccount = (accountId: string) =>
  transactions.filter((t) => t.account === accountId || (accountId === "checking" && t.account === "debit"));

// Accounts with balances, grouped the way the Accounts tab shows them
export type Account = (typeof demo.accounts)[number];
const groupOf: Record<string, "cash" | "retirement" | "investments" | "debt"> = {
  checking: "cash", savings: "cash", wedding: "cash", retirement: "retirement", visa: "debt", mc: "debt", loan: "debt",
};
export const accounts = demo.accounts
  .filter((a) => a.type !== "debit") // the debit card belongs to checking
  .map((a) => ({ ...a, group: groupOf[a.id] }));

// Her existing budget sheet (Google Sheets), for the Budget import flow
export const importedBudget = demo.importedBudget;

/* ---------- Home: this month so far vs. her usual ---------- */

const thisMonth = today.slice(0, 7);
const dayOfMonth = Number(today.slice(8, 10)) - 1; // days with data so far (today has none yet)
const spendingIn = (m: string) => real.filter((t) => t.date.startsWith(m) && t.amount < 0);

// "Usual" = the average of her last 6 full months
const pastMonths = months.filter((m) => m < thisMonth).slice(0, 6);

/* ---------- Home (MVP): everyday spending, bills set aside ---------- */

// Bills that land once a month and would swamp the number (rent especially).
// Kinds, not her categories: Moneta recognizes these itself.
export const BILL_KINDS: KindId[] = ["rent", "utilities", "insurance", "loans"];
const sum = (list: Raw[]) => -list.reduce((s, t) => s + t.amount, 0);
const everydayBy = (m: string, day: number) =>
  sum(spendingIn(m).filter((t) => !BILL_KINDS.includes(t.kind) && Number(t.date.slice(8, 10)) <= day));
const everydayNow = everydayBy(thisMonth, dayOfMonth);
const everydayUsual = pastMonths.reduce((s, m) => s + everydayBy(m, dayOfMonth), 0) / pastMonths.length;

export const homeSummary = {
  monthName: monthLabel(thisMonth),
  everyday: everydayNow,
  bills: sum(spendingIn(thisMonth).filter((t) => BILL_KINDS.includes(t.kind))),
  vsUsual: everydayNow - everydayUsual, // negative = less than usual by this point
};

// Home → "Activity": the latest transactions across all accounts (not transfers)
export const latestActivity = (n = 8) => transactions.filter((t) => t.kind !== "transfer").slice(0, n);
export const dayHeading = (iso: string) => {
  const diffDays = Math.round((new Date(today + "T12:00:00Z").getTime() - new Date(iso + "T12:00:00Z").getTime()) / 864e5);
  if (diffDays === 1) return "Yesterday";
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
};

/* ---------- Insights: what Moneta noticed ---------- */
// Each finding is computed from the data, so the numbers stay true if the
// data is regenerated. `ask` is the question "Ask Moneta" puts in the chat.

export type Finding = {
  id: string;
  icon: CategoryId;
  title: string;
  detail: string;
  ask: string;
  // Transactions the card can show (e.g. the ones that need a category)
  items?: Transaction[];
};

const usd = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
const usdCents = (n: number) => `$${Math.abs(n).toFixed(2)}`;
const shortDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const [lastFull, beforeThat] = pastMonths; // e.g. "2026-10", "2026-09"

function restaurantsFinding(): Finding | null {
  const now = kindTotals(lastFull).restaurants ?? 0;
  const before = kindTotals(beforeThat).restaurants ?? 0;
  if (!before) return null;
  const change = Math.round((now / before - 1) * 100);
  if (Math.abs(change) < 10) return null;
  return {
    id: "restaurants",
    icon: "restaurants",
    title: `Restaurants were ${change < 0 ? "down" : "up"} ${Math.abs(change)}% in ${monthLabel(lastFull)}`,
    detail: `${usd(now)}, compared with ${usd(before)} in ${monthLabel(beforeThat)}.`,
    ask: `How did my restaurant spending change in ${monthLabel(lastFull)}?`,
  };
}

function subscriptionsFinding(): Finding | null {
  // What she paid for each subscription in her last full month
  const subs = inMonth(lastFull, { spendingOnly: true }).filter((t) => t.kind === "subscriptions");
  if (!subs.length) return null;
  const total = -subs.reduce((s, t) => s + t.amount, 0);
  // A subscription that started recently is worth a second look
  const firstSeen = (merchant: string) => [...transactions].reverse().find((t) => t.merchant === merchant)?.date ?? "";
  const newest = subs.map((t) => ({ t, since: firstSeen(t.merchant) })).sort((a, b) => (a.since < b.since ? 1 : -1))[0];
  const recent = newest && newest.since > months[months.length - 1] + "-31";
  return {
    id: "subscriptions",
    icon: "subscriptions",
    title: `About ${usd(total)} a month on subscriptions`,
    detail: `${subs.length} subscriptions${recent ? `, including ${newest.t.merchant} (${usdCents(newest.t.amount)}), which started in ${monthLabel(newest.since.slice(0, 7))}` : ""}. Worth a quick check for any you don’t use.`,
    ask: "Which subscriptions am I paying for, and since when?",
  };
}

// Charges still waiting for a category (her own recategorizations count)
// (charges Moneta couldn't place, and charges from a category she deleted,
// still in Misc with no rule or move of hers)
export function uncategorizedFinding(rules: Rules, review: string[] = []): Finding | null {
  const waiting = new Set(review);
  const items = transactions.filter(
    (t) => (t.kind === "other" || waiting.has(t.id)) && !rules.moves[t.id] && !rules.merchants[merchantName(t.merchant)],
  );
  if (!items.length) return null;
  return {
    id: "uncategorized",
    icon: "misc",
    title: `${items.length} charge${items.length === 1 ? "" : "s"} need${items.length === 1 ? "s" : ""} a category`,
    detail: "Tap one to sort it, so your spending totals stay accurate.",
    ask: "Which of my transactions are uncategorized?",
    items,
  };
}

function bigWeekFinding(): Finding | null {
  // Everyday spending (bills set aside) per week, Sunday to Saturday
  const weekOf = (iso: string) => {
    const d = new Date(iso + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    return d.toISOString().slice(0, 10);
  };
  const weeks: Record<string, Raw[]> = {};
  for (const t of real) {
    if (t.amount >= 0 || BILL_KINDS.includes(t.kind)) continue;
    (weeks[weekOf(t.date)] ??= []).push(t);
  }
  // The last 8 full weeks
  const recent = Object.keys(weeks).filter((w) => w < weekOf(today)).sort().slice(-8);
  if (recent.length < 4) return null;
  const totals = recent.map((w) => ({ w, total: sum(weeks[w]) }));
  const top = [...totals].sort((a, b) => b.total - a.total)[0];
  const typical = totals.filter((x) => x !== top).reduce((s, x) => s + x.total, 0) / (totals.length - 1);
  if (top.total < typical * 1.2) return null;
  const topCats = Object.entries(byCategoryTotals(weeks[top.w])).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([c]) => c as CategoryId);
  const cats = topCats.map((c) => cat(c).label);
  return {
    id: "big-week",
    icon: topCats[0] ?? "misc",
    title: `The week of ${shortDate(top.w)} was your biggest in a while`,
    detail: `${usd(top.total)} in everyday spending, vs. about ${usd(typical)} in a typical week. Mostly ${cats.join(" and ").toLowerCase()}.`,
    ask: `What did I spend on the week of ${shortDate(top.w)}?`,
  };
}
// Findings below don't depend on her edits, so they use Moneta's default mapping
const byCategoryTotals = (list: Raw[]) => {
  const totals: Record<string, number> = {};
  for (const t of list) totals[categoryOf(t)] = (totals[categoryOf(t)] ?? 0) - t.amount;
  return totals;
};

function annualFinding(): Finding | null {
  // Yearly charges (marked "(annual)" in the data), next one coming up
  const yearly = transactions.filter((t) => /\(annual\)/i.test(t.merchant) && t.amount < 0);
  const next = yearly
    .map((t) => ({ t, due: String(Number(t.date.slice(0, 4)) + 1) + t.date.slice(4) }))
    .filter((x) => x.due > today)
    .sort((a, b) => (a.due < b.due ? -1 : 1))[0];
  if (!next) return null;
  const name = next.t.merchant.replace(/\s*\(annual\)/i, "");
  return {
    id: "annual",
    icon: categoryOf(next.t),
    title: `${name} renews around ${shortDate(next.due)}`,
    detail: `It’s a yearly charge: ${usdCents(next.t.amount)} last time, on your ${next.t.label}.`,
    ask: "What yearly charges do I have coming up?",
  };
}

function weddingFinding(): Finding | null {
  const fund = demo.accounts.find((a) => a.id === "wedding");
  if (!fund || fund.balance === undefined) return null;
  const monthly = -inMonth(lastFull).filter((t) => t.merchant === "Transfer to wedding fund").reduce((s, t) => s + t.amount, 0);
  return {
    id: "wedding",
    icon: "savings",
    title: `${usd(fund.balance)} saved in the wedding fund`,
    detail: `You add ${usd(monthly)} a month, and Clark matches it. That’s ${usd(monthly * 2)} a month together.`,
    ask: "How is our wedding fund doing?",
  };
}

// Findings that don't depend on her edits, in the order they're shown
export const findings: Finding[] = [restaurantsFinding(), subscriptionsFinding(), bigWeekFinding(), annualFinding(), weddingFinding()].filter(
  (f): f is Finding => f !== null,
);
