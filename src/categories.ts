// Categories, in two layers:
// - Her categories (what every screen shows): the budget category and the
//   transaction's category are the same thing. Each has a Lucide icon, a hue
//   from the tokens (--color-cat-*) and a short explanation. No emoji.
// - A hidden `kind` behind each transaction: Moneta's fixed "kind of place"
//   (restaurant, pharmacy...), the `category` field in src/demo-data.json.
//   Never shown. Insights can use it for specifics ("you ate out less").
// categoryOf(t, rules) turns a transaction into her category: her rules first,
// then Moneta's default mapping (src/category-map.json, shared with the Worker).
import {
  ArrowLeftRight, Banknote, Car, Gift, GraduationCap, HeartPulse, House,
  PartyPopper, PawPrint, PiggyBank, Plane, Receipt, Shapes, ShoppingBag,
  ShoppingBasket, TramFront, Tv, Utensils, type LucideIcon,
} from "lucide-react";
import map from "./category-map.json";

export type Hue = "blue" | "teal" | "green" | "amber" | "orange" | "rose" | "violet" | "slate";

export type Category = { id: string; label: string; icon: LucideIcon; hue: Hue; about?: string };

const L = map.labels;

// Explanations: Fun, Shopping, Gifts & giving, Health and Bills are Ann
// Marie's (DECISIONS.md); the others are PLACEHOLDER copy for her to replace.
export const categories = {
  rent: { id: "rent", label: L.rent, icon: House, hue: "blue", about: "Rent or mortgage, plus HOA fees" }, // PLACEHOLDER
  bills: { id: "bills", label: L.bills, icon: Receipt, hue: "amber", about: "Renters / car insurance, utilities, internet, phone" },
  groceries: { id: "groceries", label: L.groceries, icon: ShoppingBasket, hue: "green", about: "Food and household basics" }, // PLACEHOLDER
  restaurants: { id: "restaurants", label: L.restaurants, icon: Utensils, hue: "orange", about: "Eating out, coffee, delivery" }, // PLACEHOLDER
  fun: { id: "fun", label: L.fun, icon: PartyPopper, hue: "rose", about: "Movie and concert tickets" },
  transit: { id: "transit", label: L.transit, icon: TramFront, hue: "teal", about: "Transit, rideshare, bikeshare" }, // PLACEHOLDER
  car: { id: "car", label: L.car, icon: Car, hue: "blue", about: "Gas, parking, car payments, repairs" }, // PLACEHOLDER
  subscriptions: { id: "subscriptions", label: L.subscriptions, icon: Tv, hue: "violet", about: "Streaming, apps, memberships" }, // PLACEHOLDER
  loans: { id: "loans", label: L.loans, icon: GraduationCap, hue: "slate", about: "Student loan payments" }, // PLACEHOLDER
  health: { id: "health", label: L.health, icon: HeartPulse, hue: "rose", about: "Health insurance, prescriptions, co-pays" },
  pets: { id: "pets", label: L.pets, icon: PawPrint, hue: "teal", about: "Food, vet visits, supplies" }, // PLACEHOLDER
  shopping: { id: "shopping", label: L.shopping, icon: ShoppingBag, hue: "rose", about: "Clothes, Amazon, makeup & skincare" },
  gifts: { id: "gifts", label: L.gifts, icon: Gift, hue: "amber", about: "Donations, holiday shopping" },
  travel: { id: "travel", label: L.travel, icon: Plane, hue: "blue", about: "Flights, hotels, trips" }, // PLACEHOLDER
  savings: { id: "savings", label: L.savings, icon: PiggyBank, hue: "violet", about: "Money toward a goal, like the wedding" }, // PLACEHOLDER
  misc: { id: "misc", label: L.misc, icon: Shapes, hue: "slate", about: "Anything that doesn't fit elsewhere" }, // PLACEHOLDER
  // Outside the budget
  income: { id: "income", label: L.income, icon: Banknote, hue: "green" },
  transfer: { id: "transfer", label: L.transfer, icon: ArrowLeftRight, hue: "slate" },
} satisfies Record<keyof typeof L, Category>;

// Moneta's built-in categories (the common list, plus Income and Transfer)
export type BuiltinId = keyof typeof categories;
// Any of her categories: a built-in one, or one of her own (e.g. a row from
// her imported sheet, "Food & fun"). Look one up with cat(id).
export type CategoryId = string;

// Her own categories, or a built-in one she renamed or restyled (same id):
// a name, an icon borrowed from a built-in category, and a hue
export type CustomCategory = { id: string; label: string; look: BuiltinId; hue: Hue };
const builtin = categories as Record<string, Category>;
let custom: Record<string, Category> = {};
// The store calls this whenever her custom categories change
export function setCustomCategories(list: CustomCategory[]) {
  custom = Object.fromEntries(list.map((c) => [c.id, { about: builtin[c.id]?.about, id: c.id, label: c.label, icon: categories[c.look].icon, hue: c.hue }]));
}
export const cat = (id: CategoryId): Category => custom[id] ?? builtin[id] ?? categories.misc;
// Icons she can pick for a category: the built-in categories' icons
export const LOOKS = Object.keys(categories).filter((c) => c !== "income" && c !== "transfer") as BuiltinId[];
export const HUES: Hue[] = ["blue", "teal", "green", "amber", "orange", "rose", "violet", "slate"];

// The common list (everything but income and transfers), in order.
// Until she builds a budget, this is her list.
export const BUDGET_CATEGORIES = (Object.keys(categories) as BuiltinId[]).filter((c) => c !== "income" && c !== "transfer");
export const DEFAULT_CATEGORIES: CategoryId[] = BUDGET_CATEGORIES;

// The hidden kinds (never shown)
export type KindId = keyof typeof map.kindToCategory;
export const defaultCategoryOfKind = map.kindToCategory as Record<KindId, BuiltinId>;

// A merchant's name without the demo's notes ("Amazon (gift)" is Amazon)
export const merchantName = (m: string) => m.replace(/\s*\([^)]*\)\s*$/, "");

// Her rules, strongest first:
// - moves: one transaction she moved by hand
// - merchants: every charge from a merchant ("Amazon → Shopping"), from her
//   teach-Moneta answers
// - kinds: where each kind goes in her budget, set when she builds it (a kind
//   whose default category she didn't pick goes to Misc; with her
//   sheet, to the row it belongs to). Empty = Moneta's default mapping.
export type Rules = { merchants: Record<string, CategoryId>; moves: Record<string, CategoryId>; kinds?: Partial<Record<KindId, CategoryId>> };
export const noRules: Rules = { merchants: {}, moves: {}, kinds: {} };

// The one place a transaction gets her category. Income and transfers stay
// outside the budget, whatever the rules say.
export function categoryOf(t: { id: string; merchant: string; kind: KindId }, rules: Rules = noRules): CategoryId {
  const fallback = defaultCategoryOfKind[t.kind] ?? "misc";
  if (fallback === "income" || fallback === "transfer") return fallback;
  return rules.moves[t.id] ?? rules.merchants[merchantName(t.merchant)] ?? rules.kinds?.[t.kind] ?? fallback;
}

// Tailwind only generates classes it can find spelled out in the source,
// so each hue's classes are written in full here
export const hueClasses: Record<Hue, { fg: string; bg: string; solid: string }> = {
  blue: { fg: "text-cat-blue", bg: "bg-cat-blue-soft", solid: "bg-cat-blue" },
  teal: { fg: "text-cat-teal", bg: "bg-cat-teal-soft", solid: "bg-cat-teal" },
  green: { fg: "text-cat-green", bg: "bg-cat-green-soft", solid: "bg-cat-green" },
  amber: { fg: "text-cat-amber", bg: "bg-cat-amber-soft", solid: "bg-cat-amber" },
  orange: { fg: "text-cat-orange", bg: "bg-cat-orange-soft", solid: "bg-cat-orange" },
  rose: { fg: "text-cat-rose", bg: "bg-cat-rose-soft", solid: "bg-cat-rose" },
  violet: { fg: "text-cat-violet", bg: "bg-cat-violet-soft", solid: "bg-cat-violet" },
  slate: { fg: "text-cat-slate", bg: "bg-cat-slate-soft", solid: "bg-cat-slate" },
};
