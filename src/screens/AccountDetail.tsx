// One account, as a page: its icon, name (the pencil next to it edits name +
// icon in a modal) and balance, and its transactions from the last 30 days.
// The gear (top right) holds the more serious settings: include in net worth,
// and unlink (asks first).
import { useState } from "react";
import { Pencil, Unlink } from "lucide-react";
import { accountIcons, type AccountIconId } from "../accountIcons";
import { formatMoney, groupLabels, useAccounts } from "../accounts";
import { AccountIcon } from "../components/AccountIcon";
import { ConfirmDialog, Dialog } from "../components/Dialog";
import { DetailTopBar } from "../components/DetailTopBar";
import { Sheet } from "../components/Sheet";
import { Switch } from "../components/Switch";
import { TxnList } from "../components/TxnList";
import { forAccount, today, type Transaction } from "../data";
import { edit } from "../store";

const thirtyDaysAgo = (() => {
  const d = new Date(today + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 30);
  return d.toISOString().slice(0, 10);
})();

export function AccountDetail({ id, onBack, onSelect }: { id: string; onBack: () => void; onSelect: (t: Transaction) => void }) {
  const { list } = useAccounts();
  const a = list.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<AccountIconId>("bank");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  if (!a) return null;

  const recent = forAccount(a.id).filter((t) => t.date >= thirtyDaysAgo && t.kind !== "transfer");
  // One Edit button: a modal for the name and icon, saved together
  const startEdit = () => {
    setName(a.name);
    setIcon(a.icon);
    setEditing(true);
  };
  const save = () => {
    const trimmed = name.trim();
    edit((e) => ({
      ...e,
      accountNames: { ...e.accountNames, [a.id]: trimmed && trimmed !== a.originalName ? trimmed : "" },
      accountIcons: { ...e.accountIcons, [a.id]: icon },
    }));
    setEditing(false);
  };
  const toggleHidden = () =>
    edit((e) => ({
      ...e,
      hiddenAccounts: a.hidden ? e.hiddenAccounts.filter((x) => x !== a.id) : [...e.hiddenAccounts, a.id],
    }));
  // Unlink: demo-linked accounts are removed; the original demo accounts are
  // set aside (Reset demo brings them back)
  const remove = () => {
    edit((e) =>
      a.linked
        ? { ...e, linkedAccounts: e.linkedAccounts.filter((x) => x.id !== a.id) }
        : { ...e, unlinkedAccounts: [...e.unlinkedAccounts, a.id] },
    );
    onBack();
  };

  return (
    <div className="relative h-full">
      <div className="scroll px-4 pt-2">
        <DetailTopBar backLabel="Back to accounts" onBack={onBack} settingsLabel="Account settings" onSettings={() => setSettingsOpen(true)} />

        {/* Icon, name (with the edit pencil right next to it) and balance */}
        <section className="mt-2 flex flex-col items-start gap-3">
          <AccountIcon id={a.icon} size={48} />
          <div className="flex items-center gap-1">
            <h1 className="text-title font-medium">{a.name}</h1>
            <button className="grid size-8 place-items-center rounded-[8px] text-fg-3 hover:bg-subtle hover:text-fg" onClick={startEdit} aria-label="Edit name and icon">
              <Pencil size={15} />
            </button>
          </div>
          <p className="-mt-2 text-label text-fg-3">
            {a.institution} ••{a.mask} · {groupLabels[a.group]}
            {a.name !== a.originalName ? ` · originally “${a.originalName}”` : ""}
          </p>
          <p className="tabular text-display font-medium">{formatMoney(a.balance)}</p>
        </section>

        {/* Recent activity */}
        <section className="mt-8">
          <h2 className="mb-3 text-headline font-medium">Last 30 days</h2>
          {recent.length ? (
            <TxnList items={recent} onSelect={onSelect} />
          ) : (
            <p className="text-label text-fg-3">{a.linked ? "This demo account has no transactions." : "No activity in the last 30 days."}</p>
          )}
        </section>
      </div>

      {/* Edit name + icon */}
      {editing && (
        <Dialog title="Edit account" onCancel={() => setEditing(false)} onSave={save}>
          <label className="mt-4 block text-caption font-medium text-fg-3" htmlFor="account-name">Name</label>
          <input
            id="account-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            maxLength={40}
            placeholder={a.originalName}
            className="mt-1.5 h-10 w-full rounded-control border border-line-strong bg-surface px-3 text-body outline-none focus:border-accent"
          />
          <p className="mt-4 mb-2 text-caption font-medium text-fg-3">Icon</p>
          <div className="grid grid-cols-6 gap-2">
            {(Object.keys(accountIcons) as AccountIconId[]).map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`grid place-items-center rounded-control p-1 ${ic === icon ? "ring-2 ring-accent ring-offset-2" : "hover:bg-subtle"}`}
                aria-label={accountIcons[ic].label}
                aria-pressed={ic === icon}
              >
                <AccountIcon id={ic} />
              </button>
            ))}
          </div>
        </Dialog>
      )}

      {/* Account settings (the gear) */}
      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Account settings">
        <div className="flex flex-col gap-3">
          <div className="rounded-card border border-line p-3.5">
            <Switch
              checked={!a.hidden}
              onChange={toggleHidden}
              label="Include in net worth and totals"
              hint="Turn off to keep it connected but leave it out of your totals."
            />
          </div>
          <button
            className="flex items-center gap-2 rounded-card border border-line px-3.5 py-3 text-left text-label font-medium text-negative hover:bg-negative-soft"
            onClick={() => { setSettingsOpen(false); setConfirmRemove(true); }}
          >
            <Unlink size={16} /> Unlink account
          </button>
        </div>
      </Sheet>

      {/* Unlinking asks first */}
      {confirmRemove && (
        <ConfirmDialog
          title={`Unlink ${a.name}?`}
          body="Moneta will stop showing this account and its balance. You can link it again later."
          confirmLabel="Unlink"
          onConfirm={remove}
          onCancel={() => setConfirmRemove(false)}
        />
      )}
    </div>
  );
}
