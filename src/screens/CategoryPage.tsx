// A category's page, over the whole app (X at the top right): its name and
// monthly amount, this month's spending against it, a small 6-month trend,
// and this month's charges, each movable to another category (a drawer). The
// main action is asking Moneta; editing is there but quiet: "Edit" by the
// name opens the fields in place (name, icon, color, amount), with Delete at
// the bottom behind a strong warning. Changes go through src/budgetActions.ts,
// the same functions Moneta's action cards will use.
// Copy marked PLACEHOLDER is for Ann Marie to reword.
import { useEffect, useState } from "react";
import { setScreen } from "../screenContext";
import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";
import { deleteCategory, moveTransaction, restyleCategory, setAmount, setMerchantRule } from "../budgetActions";
import { thisMonth } from "../budget";
import { cat, categories, categoryOf, hueClasses, merchantName, type BuiltinId, type CategoryId, type CustomCategory } from "../categories";
import { BudgetBar } from "../components/BudgetBar";
import { Button } from "../components/Button";
import { CategoryIcon } from "../components/CategoryIcon";
import { ConfirmDialog } from "../components/Dialog";
import { Sheet } from "../components/Sheet";
import { categoryTrend, monthLabel, transactions, type Transaction } from "../data";
import { edit, useEdits } from "../store";
import { AmountField, LookFields } from "./CategoryEditor";

const usd = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
const shortDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function CategoryPage({ id, month, onClose, onAsk }: { id: CategoryId; month: string; onClose: () => void; onAsk: (q: string) => void }) {
  const phone = document.querySelector(".phone");
  const page = <Page id={id} month={month} onClose={onClose} onAsk={onAsk} />;
  return phone ? createPortal(page, phone) : page;
}

function Page({ id, month, onClose, onAsk }: { id: CategoryId; month: string; onClose: () => void; onAsk: (q: string) => void }) {
  const e = useEdits();
  const c = cat(id);
  // Moneta knows which category page she's on
  useEffect(() => {
    setScreen("page", `on the ${c.label} category page (id ${id}), ${month}`);
    return () => setScreen("page", null);
  }, [id, month, c.label]);
  const amount = e.amounts[id] ?? 0;
  const [editing, setEditing] = useState<{ look: CustomCategory; amount: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState<Transaction | null>(null);

  const charges = transactions.filter((t) => t.date.startsWith(month) && t.amount < 0 && categoryOf(t, e.rules) === id);
  const spent = -charges.reduce((s, t) => s + t.amount, 0);
  const left = amount - spent;
  const trend = categoryTrend(id, e.rules).filter((x) => x.month <= month).slice(-6);
  const max = Math.max(...trend.map((x) => x.total), 1);
  const startEdit = () =>
    setEditing({ look: { id, label: c.label, look: (e.custom.find((x) => x.id === id)?.look ?? (id in categories ? id : "misc")) as BuiltinId, hue: c.hue }, amount });
  const save = () => {
    if (!editing || !editing.look.label.trim()) return;
    edit((x) => setAmount(restyleCategory(x, { ...editing.look, label: editing.look.label.trim() }), id, editing.amount));
    setEditing(null);
  };

  return (
    <div className="flow-page filters-page flex flex-col bg-surface" role="dialog" aria-label={c.label}>
      <div className="flex justify-end px-4 pt-2">
        <button className="-mr-2 grid size-9 place-items-center rounded-control text-fg-2 hover:bg-subtle" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {editing ? (
          // Editing in place: name, icon, color, amount; delete at the bottom
          <section>
            <LookFields value={editing.look} onChange={(look) => setEditing({ ...editing, look })} />
            <label className="mt-4 block">
              <span className="mb-1 block text-caption text-fg-3">Monthly budget</span>
              <AmountField value={editing.amount} onChange={(n) => setEditing({ ...editing, amount: n })} label="Monthly budget" />
            </label>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button className="w-full" onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" className="w-full" disabled={!editing.look.label.trim()} onClick={save}>Save</Button>
            </div>
            {id !== "misc" && (
              <Button variant="ghost" className="mt-3 w-full text-negative hover:bg-negative-soft hover:text-negative" onClick={() => setDeleting(true)}>
                Delete category
              </Button>
            )}
          </section>
        ) : (
          <>
            {/* Name and amount, with a quiet Edit */}
            <div className="flex items-center gap-3">
              <CategoryIcon id={id} size={40} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-title font-medium">{c.label}</h2>
                <p className="tabular text-label text-fg-3">{usd(amount)} a month</p>
              </div>
              {/* PLACEHOLDER copy */}
              <Button size="sm" variant="ghost" className="text-accent" onClick={startEdit}>Edit</Button>
            </div>

            {/* This month */}
            <section className="mt-5 rounded-card border border-line bg-surface p-4 shadow-card">
              <p className="text-label text-fg-3">{monthLabel(month)}{month === thisMonth ? " so far" : ""}</p>
              <p className={`tabular mt-1 text-display font-medium ${left < 0 ? "text-warning" : ""}`}>
                {left < 0 ? `${usd(left)} over` : `${usd(left)} left`}
              </p>
              <BudgetBar spent={spent} total={amount} className="mt-3" />
              <p className="tabular mt-2 text-caption text-fg-3">{usd(spent)} of {usd(amount)} spent</p>
            </section>

            {/* The last 6 months, this one in the category's color */}
            <section className="mt-5">
              <h3 className="mb-2 text-label font-medium text-fg-2">Last 6 months</h3>
              <div className="flex h-20 items-end gap-1.5" role="img" aria-label={`${c.label} spending, last 6 months`}>
                {trend.map((x) => (
                  <span
                    key={x.month}
                    className={`flex-1 rounded-t-[4px] ${x.month === month ? hueClasses[c.hue].solid : "bg-subtle"}`}
                    style={{ height: `${Math.max(3, (x.total / max) * 100)}%` }}
                    title={`${monthLabel(x.month)}: ${usd(x.total)}`}
                  />
                ))}
              </div>
              <div className="mt-1.5 flex gap-1.5 text-caption text-fg-4">
                {trend.map((x) => <span key={x.month} className="flex-1 text-center">{monthLabel(x.month).slice(0, 3)}</span>)}
              </div>
            </section>

            {/* This month's charges, each movable */}
            <section className="mt-5">
              <h3 className="mb-2 text-label font-medium text-fg-2">Charges in {monthLabel(month)}</h3>
              {charges.length ? (
                <div className="divide-y divide-line rounded-card border border-line bg-surface px-3.5 shadow-card">
                  {charges.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-label">{t.merchant}</span>
                        <span className="block text-caption text-fg-3">{shortDate(t.date)} · {t.label}</span>
                      </span>
                      <span className="tabular shrink-0 text-label">${(-t.amount).toFixed(2)}</span>
                      {/* PLACEHOLDER copy */}
                      <button className="shrink-0 rounded-control px-2 py-1 text-caption font-medium text-accent hover:bg-accent-soft" onClick={() => setMoving(t)}>Move</button>
                    </div>
                  ))}
                </div>
              ) : (
                // PLACEHOLDER copy
                <p className="text-label text-fg-3">Nothing here in {monthLabel(month)}.</p>
              )}
            </section>
          </>
        )}
      </div>

      {!editing && (
        <div className="flow-footer border-t border-line bg-surface px-4 pt-3">
          <Button variant="primary" className="w-full" icon={<MessageCircle size={16} />} onClick={() => onAsk(`How is my ${c.label.toLowerCase()} budget looking?`)}>
            Ask Moneta about {c.label.toLowerCase()}
          </Button>
        </div>
      )}

      <MoveCharge key={moving?.id ?? "none"} txn={moving} from={id} onClose={() => setMoving(null)} />

      {deleting && (
        <ConfirmDialog
          title={`Delete ${c.label}?`}
          // PLACEHOLDER copy
          body={`This can’t be undone. ${c.label} and its budget will be removed, its charges will move to Misc, and Moneta will ask you about them later.`}
          confirmLabel="Delete"
          onConfirm={() => { edit((x) => deleteCategory(x, id)); setDeleting(false); onClose(); }}
          onCancel={() => setDeleting(false)}
        />
      )}
    </div>
  );
}

// The drawer for moving one charge: pick a category, and optionally send
// every charge from that merchant there too
function MoveCharge({ txn, from, onClose }: { txn: Transaction | null; from: CategoryId; onClose: () => void }) {
  const e = useEdits();
  const [to, setTo] = useState<CategoryId | null>(null);
  const [always, setAlways] = useState(false);
  const merchant = txn ? merchantName(txn.merchant) : "";
  const apply = () => {
    if (!txn || !to) return;
    edit((x) => (always ? moveTransaction(setMerchantRule(x, merchant, to), txn.id, to) : moveTransaction(x, txn.id, to)));
    onClose();
  };
  return (
    // PLACEHOLDER copy
    <Sheet open={!!txn} onClose={onClose} title="Move this charge">
      {txn && (
        <>
          <p className="text-label text-fg-2">
            {txn.merchant} · {shortDate(txn.date)} · <span className="tabular">${(-txn.amount).toFixed(2)}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {e.categories.filter((c) => c !== from).map((c) => {
              const k = cat(c);
              const on = to === c;
              return (
                <button
                  key={c}
                  onClick={() => setTo(on ? null : c)}
                  aria-pressed={on}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-label ${on ? "border-fg bg-fg text-white" : "border-line text-fg hover:bg-subtle"}`}
                >
                  <k.icon size={14} strokeWidth={1.75} className={on ? "" : hueClasses[k.hue].fg} aria-hidden="true" />
                  {k.label}
                </button>
              );
            })}
          </div>
          <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-label">
            <input type="checkbox" checked={always} onChange={(ev) => setAlways(ev.target.checked)} className="size-4.5 accent-accent" />
            {/* PLACEHOLDER copy */}
            Always put {merchant} here
          </label>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button className="w-full" onClick={onClose}>Cancel</Button>
            <Button variant="primary" className="w-full" disabled={!to} onClick={apply}>Move</Button>
          </div>
        </>
      )}
    </Sheet>
  );
}
