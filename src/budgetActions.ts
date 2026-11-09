// Changes to her budget, as plain functions from one set of edits to the next:
// the category page uses them now, and Moneta's action cards (Stage 4) will
// use the same ones, so a change made by hand and one made by Moneta behave
// exactly alike. Use with the store: edit((e) => setAmount(e, "fun", 150)).
import { cat, categoryOf, defaultCategoryOfKind, type CategoryId, type CustomCategory, type KindId } from "./categories";
import { transactions } from "./data";
import type { Edits } from "./store";

export function setAmount(e: Edits, c: CategoryId, amount: number): Edits {
  return { ...e, amounts: { ...e.amounts, [c]: Math.max(0, Math.round(amount)) } };
}

// A new name, icon or color (built-in categories keep their id)
export function restyleCategory(e: Edits, look: CustomCategory): Edits {
  return { ...e, custom: [...e.custom.filter((c) => c.id !== look.id), look] };
}

export const newCategoryId = () => `my-${Math.random().toString(36).slice(2, 9)}`;

export function addCategory(e: Edits, look: CustomCategory, amount = 0): Edits {
  if (e.categories.includes(look.id)) return e;
  return { ...restyleCategory(e, look), categories: [...e.categories, look.id], amounts: { ...e.amounts, [look.id]: amount } };
}

// Delete a category: its charges go to Misc and wait for Moneta to ask about
// them later (review). Misc itself can't be deleted.
export function deleteCategory(e: Edits, c: CategoryId): Edits {
  if (c === "misc" || !e.categories.includes(c)) return e;
  const waiting = transactions.filter((t) => t.amount < 0 && categoryOf(t, e.rules) === c).map((t) => t.id);
  // Kinds that went there now go to Misc
  const kinds: Partial<Record<KindId, CategoryId>> = {};
  for (const k of Object.keys(defaultCategoryOfKind) as KindId[]) {
    const to = e.rules.kinds?.[k] ?? defaultCategoryOfKind[k];
    if (to === "income" || to === "transfer") continue;
    kinds[k] = to === c ? "misc" : to;
  }
  const without = (r: Record<string, CategoryId>) => Object.fromEntries(Object.entries(r).filter(([, to]) => to !== c));
  const amounts = { ...e.amounts };
  delete amounts[c];
  return {
    ...e,
    categories: e.categories.filter((x) => x !== c),
    custom: e.custom.filter((x) => x.id !== c),
    amounts,
    rules: { merchants: without(e.rules.merchants), moves: without(e.rules.moves), kinds },
    review: [...new Set([...e.review, ...waiting])],
    removed: [...e.removed, cat(c).label],
  };
}

// One charge to another category
export function moveTransaction(e: Edits, id: string, c: CategoryId): Edits {
  return { ...e, rules: { ...e.rules, moves: { ...e.rules.moves, [id]: c } } };
}

// Every charge from a merchant ("Amazon → Shopping"). Single moves of that
// merchant's charges stay as she set them.
export function setMerchantRule(e: Edits, merchant: string, c: CategoryId): Edits {
  return { ...e, rules: { ...e.rules, merchants: { ...e.rules.merchants, [merchant]: c } } };
}
