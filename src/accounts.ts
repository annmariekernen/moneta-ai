// Her accounts as the Accounts tab shows them: the demo accounts plus any she
// "linked", with her own names, icons and hidden-from-totals choices applied
// (from the edits store).
import { accountIcons, defaultAccountIcon, type AccountIconId } from "./accountIcons";
import { accounts as baseAccounts } from "./data";
import { useEdits, type Edits } from "./store";

// In the order the Accounts tab shows them: what she has, then what she owes.
// Retirement = 401(k)s and IRAs; Investments = everything else she invests in
// (regular brokerage accounts), not retirement accounts.
export type Group = "cash" | "retirement" | "investments" | "debt";
export const groupOrder: Group[] = ["cash", "retirement", "investments", "debt"];
export const groupLabels: Record<Group, string> = {
  cash: "Cash",
  retirement: "Retirement",
  investments: "Investments",
  debt: "Credit cards & loans",
};
// For an empty group: "No investment accounts linked yet"
export const groupEmpty: Record<Group, string> = {
  cash: "No cash accounts linked yet",
  retirement: "No retirement accounts linked yet",
  investments: "No investment accounts linked yet",
  debt: "No credit cards or loans linked yet",
};

export type AccountView = {
  id: string;
  name: string;
  originalName: string;
  institution: string;
  mask: string;
  group: Group;
  balance: number; // what she has (cash, retirement) or owes (negative: cards, loans)
  icon: AccountIconId;
  hidden: boolean;
  linked: boolean; // added through "Link an account" (demo only)
  joint?: string;
};

const groupOfType = (type: string): Group =>
  type === "credit" || type === "loan" ? "debt" : type === "retirement" ? "retirement" : type === "brokerage" ? "investments" : "cash";

export function accountList(e: Edits): AccountView[] {
  const base = baseAccounts.map((a) => ({
    id: a.id,
    originalName: a.name,
    institution: a.institution,
    mask: a.mask,
    group: a.group,
    balance: a.balance ?? 0,
    joint: "joint" in a ? (a.joint as string) : undefined,
    linked: false,
  }));
  const linked = e.linkedAccounts.map((a) => ({
    id: a.id,
    originalName: a.name,
    institution: a.institution,
    mask: a.mask,
    group: groupOfType(a.type),
    balance: a.balance,
    joint: undefined,
    linked: true,
  }));
  return [...base, ...linked].filter((a) => !e.unlinkedAccounts.includes(a.id)).map((a) => ({
    ...a,
    name: e.accountNames[a.id] || a.originalName,
    icon: ((e.accountIcons[a.id] as AccountIconId) in accountIcons ? e.accountIcons[a.id] : defaultAccountIcon[a.id] ?? (a.group === "debt" ? "card" : a.group === "investments" ? "sprout" : "bank")) as AccountIconId,
    hidden: e.hiddenAccounts.includes(a.id),
  }));
}

export function useAccounts() {
  const e = useEdits();
  const list = accountList(e);
  const counted = list.filter((a) => !a.hidden);
  const total = (g: Group) => counted.filter((a) => a.group === g).reduce((s, a) => s + a.balance, 0);
  const totals = { cash: total("cash"), retirement: total("retirement"), investments: total("investments"), debt: total("debt") };
  return { list, totals, net: totals.cash + totals.retirement + totals.investments + totals.debt };
}

export const formatMoney = (n: number) =>
  `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
