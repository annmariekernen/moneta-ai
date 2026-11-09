// One transaction: category icon, merchant + account, amount (green when
// money comes in). `recurring` adds a small repeat icon after the merchant
// for charges that come back regularly (subscriptions, bills, paychecks).
import { Repeat } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import type { CategoryId } from "../categories";

export function TransactionRow({ category, merchant, account, amount, recurring = false }: {
  category: CategoryId;
  merchant: string;
  account: string;
  amount: number; // negative = money out
  recurring?: boolean;
}) {
  const incoming = amount > 0;
  const formatted = `${incoming ? "+" : "−"}$${Math.abs(amount).toFixed(2)}`;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <CategoryIcon id={category} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-label font-medium text-fg">{merchant}</span>
          {recurring && (
            <span className="shrink-0 text-fg-4" title="Recurring">
              <Repeat size={12} strokeWidth={2} aria-hidden="true" />
              <span className="sr-only">Recurring</span>
            </span>
          )}
        </div>
        <div className="text-caption text-fg-3">{account}</div>
      </div>
      <div className={`tabular text-label font-medium ${incoming ? "text-positive" : "text-fg"}`}>{formatted}</div>
    </div>
  );
}
