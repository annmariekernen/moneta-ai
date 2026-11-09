// Moneta's action cards: changes Moneta proposes in a reply, which she
// applies (or undoes) with one tap. Moneta writes each one on its own line
// starting with "! " (like "> " for the next-step chips; see
// worker/personality.md for the format it's taught):
//   ! amount <category> <dollars>       set a category's monthly budget
//   ! rename <category> -> <new name>   rename a category
//   ! add <name> <dollars>              add a category
//   ! delete <category>                 delete a category (charges to Misc)
//   ! merchant <merchant> -> <category> every charge from a merchant
//   ! move <transaction id> -> <category>  one charge
// <category> can be the id ("restaurants") or her name for it ("Restaurants").
// Applying uses src/budgetActions.ts, the same changes she makes by hand.
import {
  addCategory, deleteCategory, moveTransaction, newCategoryId, restyleCategory, setAmount, setMerchantRule,
} from "./budgetActions";
import { cat, categories, type BuiltinId, type CategoryId } from "./categories";
import { transactions } from "./data";
import type { Edits } from "./store";

export type Action =
  | { kind: "amount"; category: CategoryId; amount: number }
  | { kind: "rename"; category: CategoryId; name: string }
  | { kind: "add"; name: string; amount: number }
  | { kind: "delete"; category: CategoryId }
  | { kind: "merchant"; merchant: string; category: CategoryId }
  | { kind: "move"; id: string; category: CategoryId };

// Her category from an id or a name (case doesn't matter)
function findCategory(e: Pick<Edits, "categories">, ref: string): CategoryId | null {
  const r = ref.trim().toLowerCase();
  return e.categories.find((c) => c.toLowerCase() === r || cat(c).label.toLowerCase() === r) ?? null;
}
const dollars = (s: string) => {
  const n = Number(s.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

// One "! ..." line to an action, or null if it doesn't make sense for her
// budget (unknown category, missing amount...): those are quietly dropped.
export function parseAction(line: string, e: Pick<Edits, "categories">): Action | null {
  const body = line.replace(/^!\s*/, "").trim();
  const [verb, ...restWords] = body.split(/\s+/);
  const rest = restWords.join(" ");
  const arrow = rest.split(/\s*->\s*/);
  switch (verb.toLowerCase()) {
    case "amount": {
      const m = rest.match(/^(.*\S)\s+\$?([\d,.]+)$/);
      const category = m && findCategory(e, m[1]);
      const amount = m && dollars(m[2]);
      return category && amount !== null ? { kind: "amount", category, amount } : null;
    }
    case "rename": {
      const category = arrow.length === 2 ? findCategory(e, arrow[0]) : null;
      const name = arrow[1]?.trim().slice(0, 40);
      return category && name ? { kind: "rename", category, name } : null;
    }
    case "add": {
      const m = rest.match(/^(.*\S)\s+\$?([\d,.]+)$/);
      const name = (m ? m[1] : rest).trim().slice(0, 40);
      if (!name || findCategory(e, name)) return null;
      return { kind: "add", name, amount: (m && dollars(m[2])) ?? 0 };
    }
    case "delete": {
      const category = findCategory(e, rest);
      return category && category !== "misc" ? { kind: "delete", category } : null;
    }
    case "merchant": {
      const category = arrow.length === 2 ? findCategory(e, arrow[1]) : null;
      const merchant = arrow[0]?.trim();
      return category && merchant ? { kind: "merchant", merchant, category } : null;
    }
    case "move": {
      const category = arrow.length === 2 ? findCategory(e, arrow[1]) : null;
      const id = arrow[0]?.trim();
      return category && transactions.some((t) => t.id === id) ? { kind: "move", id, category } : null;
    }
  }
  return null;
}

// What the card says for each action. PLACEHOLDER copy.
export function describe(a: Action): string {
  const name = (c: CategoryId) => cat(c).label;
  switch (a.kind) {
    case "amount": return `Set ${name(a.category)} to $${a.amount.toLocaleString("en-US")} a month`;
    case "rename": return `Rename ${name(a.category)} to “${a.name}”`;
    case "add": return `Add a ${a.name} category${a.amount ? ` with $${a.amount.toLocaleString("en-US")} a month` : ""}`;
    case "delete": return `Delete ${name(a.category)} (its charges go to Misc)`;
    case "merchant": return `Always put ${a.merchant} in ${name(a.category)}`;
    case "move": {
      const t = transactions.find((x) => x.id === a.id);
      return `Move ${t ? `${t.merchant} ($${(-t.amount).toFixed(2)})` : "this charge"} to ${name(a.category)}`;
    }
  }
}

// A new category's icon: borrow the built-in one whose name it shares a word
// with, else Misc's
function lookFor(name: string): BuiltinId {
  const words = name.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const hit = (Object.keys(categories) as BuiltinId[]).find((c) => words.some((w) => categories[c].label.toLowerCase().includes(w)));
  return hit && hit !== "income" && hit !== "transfer" ? hit : "misc";
}

export function applyAction(e: Edits, a: Action): Edits {
  switch (a.kind) {
    case "amount": return setAmount(e, a.category, a.amount);
    case "rename": {
      const c = cat(a.category);
      const own = e.custom.find((x) => x.id === a.category);
      return restyleCategory(e, { id: a.category, label: a.name, look: own?.look ?? ((a.category in categories ? a.category : "misc") as BuiltinId), hue: c.hue });
    }
    case "add": {
      const look = lookFor(a.name);
      return addCategory(e, { id: newCategoryId(), label: a.name, look, hue: categories[look].hue }, a.amount);
    }
    case "delete": return deleteCategory(e, a.category);
    case "merchant": return setMerchantRule(e, a.merchant, a.category);
    case "move": return moveTransaction(e, a.id, a.category);
  }
}

// The parts of her edits a card can change: saved before applying, put back
// on Undo
export type BudgetPart = Pick<Edits, "categories" | "custom" | "amounts" | "rules" | "review" | "removed">;
export const budgetPart = (e: Edits): BudgetPart => ({
  categories: e.categories, custom: e.custom, amounts: e.amounts, rules: e.rules, review: e.review, removed: e.removed,
});
