// Transaction detail, in a bottom sheet: amount, merchant, date, account and
// category. Lois can change the category (the pencil; saved in the edits store) or ask
// Moneta about it (opens the chat with a question ready to send).
import { useEffect, useState } from "react";
import { Check, MessageCircle, Pencil, Repeat } from "lucide-react";
import { cat, categoryOf, hueClasses, type CategoryId } from "../categories";
import { Button } from "../components/Button";
import { CategoryIcon } from "../components/CategoryIcon";
import { Sheet } from "../components/Sheet";
import { recurringMerchants, type Transaction } from "../data";
import { edit, useEdits } from "../store";


export function TransactionSheet({ txn, onClose, onAsk }: { txn: Transaction | null; onClose: () => void; onAsk: (question: string) => void }) {
  const { rules, categories: mine } = useEdits();
  const [editing, setEditing] = useState(false);
  useEffect(() => setEditing(false), [txn?.id]); // closed again for each transaction
  const current: CategoryId = txn ? categoryOf(txn, rules) : "misc";
  // Her categories (not income or transfers), plus this one's if she dropped it
  const choices = mine.includes(current) || current === "income" || current === "transfer" ? mine : [...mine, current];
  const [pending, setPending] = useState<CategoryId>(current); // picked, not saved yet
  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1600);
    return () => clearTimeout(t);
  }, [justSaved]);
  useEffect(() => setJustSaved(false), [txn?.id]);
  const setCategory = (c: CategoryId) =>
    txn && edit((e) => ({ ...e, rules: { ...e.rules, moves: { ...e.rules.moves, [txn.id]: c } } }));
  const date = txn && new Date(txn.date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  const canRecategorize = txn && txn.amount < 0 && txn.kind !== "transfer";

  return (
    <Sheet open={!!txn} onClose={onClose}>
      {txn && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <CategoryIcon id={current} size={40} />
            <div className="min-w-0">
              <p className="truncate text-headline font-medium">{txn.merchant}</p>
              <p className="text-caption text-fg-3">{date}</p>
            </div>
          </div>
          <p className={`tabular text-display font-medium ${txn.amount > 0 ? "text-positive" : ""}`}>
            {txn.amount > 0 ? "+" : "−"}${Math.abs(txn.amount).toFixed(2)}
          </p>
          <dl className="divide-y divide-line rounded-card border border-line text-label">
            <div className="flex justify-between px-3.5 py-2.5"><dt className="text-fg-3">Account</dt><dd>{txn.label}</dd></div>
            <div className="px-3.5 py-2.5">
              <div className="flex items-center justify-between">
                <dt className="text-fg-3">Category</dt>
                <dd className="flex items-center gap-1.5">
                  {/* A quick "Saved" check after saving, then the new category */}
                  {justSaved && (
                    <span className="inline-flex items-center gap-1 text-caption font-medium text-positive saved-flash">
                      <Check size={13} strokeWidth={2.5} /> Saved
                    </span>
                  )}
                  <span key={current} className="category-swap">{cat(current).label}</span>
                  {/* The pencil opens the category picker right here */}
                  {canRecategorize && (
                    <button
                      className={`-my-1 grid size-7 place-items-center rounded-[8px] transition-colors duration-200 hover:bg-subtle ${editing ? "bg-subtle text-fg" : "text-fg-3"}`}
                      onClick={() => {
                        setPending(current);
                        setEditing(!editing);
                      }}
                      aria-label="Change category"
                      aria-expanded={editing}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </dd>
              </div>
              {/* Pick a category, then Save (or Cancel to leave it as it was).
                  Always rendered, so it can slide open and closed smoothly */}
              {canRecategorize && (
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${editing ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                aria-hidden={!editing}
                inert={!editing}
              >
              <div className="min-h-0 overflow-hidden">
              <div className="pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {choices.map((c) => {
                    const Icon = cat(c).icon;
                    const on = c === pending;
                    return (
                      <button
                        key={c}
                        onClick={() => setPending(c)}
                        aria-pressed={on}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-label transition-colors duration-150 active:scale-[0.97] ${on ? "border-fg bg-fg text-white" : "border-line text-fg hover:bg-subtle"}`}
                      >
                        <Icon size={14} strokeWidth={1.75} className={on ? "" : hueClasses[cat(c).hue].fg} aria-hidden="true" />
                        {cat(c).label}
                      </button>
                    );
                  })}
                </div>
                {/* Full-width pair across the row */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button className="w-full" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button
                    className="w-full"
                    variant="primary"
                    disabled={pending === current}
                    onClick={() => {
                      setCategory(pending);
                      setEditing(false);
                      setJustSaved(true);
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
              </div>
              </div>
              )}
            </div>
          </dl>

          {/* Moneta's read: this charge comes back every month */}
          {recurringMerchants.has(txn.merchant) && (
            <p className="-mt-2 flex items-center gap-1.5 text-caption text-fg-3">
              <Repeat size={13} strokeWidth={2} aria-hidden="true" />
              Moneta thinks this is a recurring charge.
            </p>
          )}

          <Button
            variant="secondary"
            icon={<MessageCircle size={16} />}
            onClick={() => onAsk(`Tell me about the ${txn.merchant} charge on ${txn.date} (${txn.amount < 0 ? "−" : "+"}$${Math.abs(txn.amount).toFixed(2)})`)}
          >
            Ask Moneta about this
          </Button>
        </div>
      )}
    </Sheet>
  );
}
