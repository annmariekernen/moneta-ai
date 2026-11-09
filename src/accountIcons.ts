// Icons for accounts: a separate set from spending categories. Accounts are
// shown as dark tiles with white line icons (categories are soft tints with
// colored icons), so the two never get mixed up. Lois can pick her own.
import {
  Banknote, Briefcase, Building2, CreditCard, Gem, GraduationCap, Landmark,
  PiggyBank, Plane, Sprout, Store, Wallet, type LucideIcon,
} from "lucide-react";

export const accountIcons = {
  bank: { label: "Bank", icon: Landmark },
  card: { label: "Card", icon: CreditCard },
  piggy: { label: "Savings", icon: PiggyBank },
  ring: { label: "Ring", icon: Gem },
  cap: { label: "School", icon: GraduationCap },
  sprout: { label: "Growth", icon: Sprout },
  wallet: { label: "Wallet", icon: Wallet },
  cash: { label: "Cash", icon: Banknote },
  building: { label: "Building", icon: Building2 },
  briefcase: { label: "Work", icon: Briefcase },
  travel: { label: "Travel", icon: Plane },
  shop: { label: "Business", icon: Store },
} satisfies Record<string, { label: string; icon: LucideIcon }>;

export type AccountIconId = keyof typeof accountIcons;

// What each account starts with, before she changes it
export const defaultAccountIcon: Record<string, AccountIconId> = {
  checking: "bank",
  savings: "piggy",
  wedding: "ring",
  visa: "card",
  mc: "card",
  loan: "cap",
  retirement: "sprout",
};
