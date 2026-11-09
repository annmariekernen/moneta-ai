// Accounts: a simple overview (what she has, what she owes) and her accounts
// grouped as Cash, Retirement, Investments, and Credit cards & loans. Tap one for its page.
// "Link an account" is a pretend flow (demo only).
import { ChevronRight, Plus } from "lucide-react";
import { formatMoney, groupEmpty, groupLabels, groupOrder, useAccounts } from "../accounts";
import { AccountIcon } from "../components/AccountIcon";
import { PageHeader } from "../components/PageHeader";


export function Accounts({ onOpen, onLink }: { onOpen: (id: string) => void; onLink: () => void }) {
  const { list, totals, net } = useAccounts();
  const hidden = list.filter((a) => a.hidden);

  return (
    <div className="scroll px-4 pt-2">
      <PageHeader title="Accounts" />

      {/* Overview */}
      <section className="mt-4 rounded-card border border-line bg-surface p-4 shadow-card">
        <p className="text-label text-fg-3">Net worth</p>
        <p className="tabular mt-1 text-[32px] leading-[38px] font-medium tracking-tight">{formatMoney(net)}</p>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-3 text-label">
          {groupOrder.map((g) => (
            <div key={g}>
              <dt className="text-caption text-fg-3">{groupLabels[g]}</dt>
              <dd className="tabular font-medium">{formatMoney(totals[g])}</dd>
            </div>
          ))}
        </dl>
      </section>

      {groupOrder.map((g) => {
        const items = list.filter((a) => a.group === g && !a.hidden);
        return (
          <section key={g} className="mt-6">
            <h2 className="mb-2 text-headline font-medium">{groupLabels[g]}</h2>
            {items.length ? (
              <AccountRows items={items} onOpen={onOpen} />
            ) : (
              <button
                className="flex w-full items-center justify-between rounded-card border border-dashed border-line-strong px-3.5 py-3 text-left text-label text-fg-3 hover:bg-surface"
                onClick={onLink}
              >
                {groupEmpty[g]}
                <span className="font-medium text-accent">Link one</span>
              </button>
            )}
          </section>
        );
      })}

      {hidden.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-1 text-headline font-medium text-fg-2">Hidden from totals</h2>
          <p className="mb-2 text-caption text-fg-3">Still connected, just left out of your net worth.</p>
          <AccountRows items={hidden} onOpen={onOpen} dim />
        </section>
      )}

      <button
        className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-control border border-dashed border-line-strong py-3 text-label font-medium text-fg-2 hover:bg-surface hover:text-fg"
        onClick={onLink}
      >
        <Plus size={16} /> Link an account
      </button>
    </div>
  );
}

function AccountRows({ items, onOpen, dim = false }: { items: ReturnType<typeof useAccounts>["list"]; onOpen: (id: string) => void; dim?: boolean }) {
  return (
    <div className={`divide-y divide-line rounded-card border border-line bg-surface px-3.5 shadow-card ${dim ? "opacity-60" : ""}`}>
      {items.map((a) => (
        <button key={a.id} className="flex w-full items-center gap-3 py-3 text-left" onClick={() => onOpen(a.id)}>
          <AccountIcon id={a.icon} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-label font-medium">
              {a.name}
              {a.linked && <span className="rounded-full bg-subtle px-1.5 text-[10px] leading-4 font-medium text-fg-3">Demo</span>}
            </p>
            <p className="truncate text-caption text-fg-3">
              {a.institution} ••{a.mask}
              {a.joint ? ` · shared with ${a.joint.split(" ")[0]}` : ""}
            </p>
          </div>
          <span className="tabular text-label font-medium">{formatMoney(a.balance)}</span>
          <ChevronRight size={16} className="text-fg-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
