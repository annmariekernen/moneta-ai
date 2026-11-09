// A budget group's progress: how much of its monthly amount is spent.
// Over budget turns the bar amber (gentle, not an error red).
export function BudgetBar({ spent, total, className = "" }: { spent: number; total: number; className?: string }) {
  const over = spent > total;
  const share = total > 0 ? Math.min(spent / total, 1) : spent > 0 ? 1 : 0;
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-subtle ${className}`}
      role="img"
      aria-label={`$${Math.round(spent)} of $${Math.round(total)} spent`}
    >
      <span className={`block h-full rounded-full transition-[width] duration-300 ${over ? "bg-warning" : "bg-accent"}`} style={{ width: `${share * 100}%` }} />
    </div>
  );
}
