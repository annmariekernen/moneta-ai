// Editing a category's look: name, icon (borrowed from a built-in category)
// and color, plus its monthly amount where it applies.
// - LookFields: the fields themselves (inline on the category page).
// - NewCategory: a bottom sheet for a new category (from sorting, or the
//   Budget tab's quiet "Add category").
// - AmountField: the "$" amount input.
import { useState } from "react";
import { Button } from "../components/Button";
import { Sheet } from "../components/Sheet";
import { categories, HUES, hueClasses, LOOKS, type CustomCategory } from "../categories";

export function LookFields({ value, onChange }: { value: CustomCategory; onChange: (v: CustomCategory) => void }) {
  return (
    <>
      <label className="block">
        <span className="mb-1 block text-caption text-fg-3">Name</span>
        <input
          value={value.label}
          onChange={(ev) => onChange({ ...value, label: ev.target.value.slice(0, 40) })}
          placeholder="Category name"
          className="h-10 w-full rounded-control border border-line-strong bg-surface px-3 text-label outline-none focus:border-accent"
        />
      </label>

      <p className="mt-4 mb-2 text-caption text-fg-3">Icon</p>
      <div className="grid grid-cols-8 gap-1.5">
        {LOOKS.map((l) => {
          const Icon = categories[l].icon;
          const on = value.look === l;
          return (
            <button
              key={l}
              onClick={() => onChange({ ...value, look: l })}
              aria-pressed={on}
              aria-label={categories[l].label}
              className={`grid aspect-square place-items-center rounded-control ${on ? `${hueClasses[value.hue].bg} ${hueClasses[value.hue].fg} ring-2 ring-fg` : "text-fg-2 hover:bg-subtle"}`}
            >
              <Icon size={16} strokeWidth={1.75} />
            </button>
          );
        })}
      </div>

      <p className="mt-4 mb-2 text-caption text-fg-3">Color</p>
      <div className="flex gap-2">
        {HUES.map((h) => (
          <button
            key={h}
            onClick={() => onChange({ ...value, hue: h })}
            aria-pressed={value.hue === h}
            aria-label={h}
            className={`size-7 rounded-full ${hueClasses[h].solid} ${value.hue === h ? "ring-2 ring-fg ring-offset-2 ring-offset-surface" : ""}`}
          />
        ))}
      </div>
    </>
  );
}

export function AmountField({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <span className="flex h-10 w-full items-center rounded-control border border-line-strong bg-surface px-3 focus-within:border-accent">
      <span className="text-label text-fg-3">$</span>
      <input
        inputMode="numeric"
        value={value ? String(value) : ""}
        onChange={(ev) => onChange(Number(ev.target.value.replace(/\D/g, "").slice(0, 6)))}
        placeholder="0"
        aria-label={label}
        className="tabular w-full min-w-0 bg-transparent pl-1 text-label outline-none"
      />
    </span>
  );
}

// A new category in a bottom sheet. withAmount: also ask for a monthly amount.
export function NewCategory({ value, withAmount = false, onClose, onSave }: {
  value: CustomCategory | null;
  withAmount?: boolean;
  onClose: () => void;
  onSave: (v: CustomCategory, amount: number) => void;
}) {
  const [v, setV] = useState<CustomCategory | null>(value);
  const [amount, setAmount] = useState(0);
  return (
    <Sheet open={!!value} onClose={onClose} title="New category">
      {v && (
        <>
          <LookFields value={v} onChange={setV} />
          {withAmount && (
            <label className="mt-4 block">
              <span className="mb-1 block text-caption text-fg-3">Monthly budget</span>
              <AmountField value={amount} onChange={setAmount} label="Monthly budget" />
            </label>
          )}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button className="w-full" onClick={onClose}>Cancel</Button>
            <Button variant="primary" className="w-full" disabled={!v.label.trim()} onClick={() => onSave({ ...v, label: v.label.trim() }, amount)}>Save</Button>
          </div>
        </>
      )}
    </Sheet>
  );
}
