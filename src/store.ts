// Lois's edits to the demo: her categories, her rules (merchant → category,
// and single transactions she moved), budget amounts per category, what she
// renamed or re-iconed in Accounts, and accounts she hid or "linked".
// Saved in this browser (local storage), like the chat, so there's no
// database. Screens read them with useEdits() and change them with edit().
// resetDemo() puts everything back to the original demo data.
import { useSyncExternalStore } from "react";
import { clearMemory } from "./moneta";
import { DEFAULT_CATEGORIES, defaultCategoryOfKind, setCustomCategories, type CategoryId, type CustomCategory, type KindId, type Rules } from "./categories";
import { startingPoint, type StartPoint } from "./build";

export type Edits = {
  categories: CategoryId[]; // her budget categories (the common list until she builds a budget)
  custom: CustomCategory[]; // her own categories (her sheet's rows, as-is)
  rules: Rules;
  amounts: Partial<Record<CategoryId, number>>; // monthly budget per category
  // Charges whose category she deleted: they wait in Misc for Moneta
  // to ask about (transaction ids), and the names of the deleted categories
  review: string[];
  removed: string[];
  // A note from the nav goose waiting to be seen ("first-draft": she just
  // built her first budget draft); null once she's opened or closed it
  nudge: "first-draft" | null;
  budgetSource?: "import" | "moneta" | "scratch"; // set once she's built a budget
  accountNames: Record<string, string>;
  accountIcons: Record<string, string>;
  hiddenAccounts: string[];
  unlinkedAccounts: string[]; // demo accounts she unlinked (Reset demo brings them back)
  linkedAccounts: { id: string; name: string; institution: string; mask: string; type: string; balance: number }[];
};

// v2: one layer of categories. v1 budgets reset; everything else carries over.
const KEY = "moneta-edits-v2";
const OLD_KEY = "moneta-edits-v1";
const empty: Edits = {
  categories: DEFAULT_CATEGORIES,
  custom: [],
  rules: { merchants: {}, moves: {}, kinds: {} },
  amounts: {},
  review: [],
  removed: [],
  nudge: null,
  accountNames: {},
  accountIcons: {},
  hiddenAccounts: [],
  unlinkedAccounts: [],
  linkedAccounts: [],
};

// Every read and write is wrapped: storage can be off (private browsing), and
// the app should still work, just without remembering.
function read(): Edits {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...empty, ...JSON.parse(raw) };
    const old = localStorage.getItem(OLD_KEY);
    if (old) return fromV1(JSON.parse(old));
  } catch { /* storage off */ }
  return empty;
}

// v1 edits: keep her account edits, turn the transactions she recategorized
// (old category ids, now kinds) into single-transaction moves
function fromV1(v1: Record<string, unknown>): Edits {
  const { categoryOverrides, ...rest } = v1 as Partial<Edits> & { categoryOverrides?: Record<string, KindId> };
  delete (rest as { budget?: unknown }).budget; // v1 budgets reset
  delete rest.budgetSource;
  const moves: Record<string, CategoryId> = {};
  for (const [id, kind] of Object.entries(categoryOverrides ?? {})) if (defaultCategoryOfKind[kind]) moves[id] = defaultCategoryOfKind[kind];
  return { ...empty, ...rest, rules: { merchants: {}, moves } };
}

// A demo starting point from the link (?start=budget or ?start=done), e.g.
// the buttons under the Live prototype card: replaces her edits and the chat
export let openedAt: StartPoint | null = null; // the app opens on the Budget tab for these
function fromLink(): Edits | null {
  try {
    const url = new URL(location.href);
    const point = url.searchParams.get("start") as StartPoint | null;
    if (point !== "budget" && point !== "done") return null;
    openedAt = point;
    url.searchParams.delete("start");
    history.replaceState(null, "", url);
    clearMemory();
    const next = { ...empty, ...startingPoint(point) };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage off */ }
    return next;
  } catch { return null; }
}

let state = fromLink() ?? read();
setCustomCategories(state.custom);
const listeners = new Set<() => void>();

export function edit(change: (e: Edits) => Edits) {
  state = change(state);
  setCustomCategories(state.custom);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage off */ }
  listeners.forEach((l) => l());
}

// The current edits, outside React (e.g. when sending a chat message)
export const getEdits = () => state;

export function useEdits(): Edits {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
  );
}

// Jump to a demo starting point (the in-app links next to the phone)
export function startFrom(point: StartPoint) {
  const url = new URL(location.href);
  url.searchParams.set("start", point);
  location.href = url.toString();
}

// Back to the original demo: forget her edits and the chat
export function resetDemo() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); } catch { /* storage off */ }
  clearMemory();
  state = empty;
  listeners.forEach((l) => l());
  location.reload(); // the chat keeps its own state, so start fresh
}
