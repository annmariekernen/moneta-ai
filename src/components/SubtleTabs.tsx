// Quiet tabs: text labels on a hairline, the selected one in the accent with
// a short underline. For filtering one list within a page (Budget: All /
// Bills / Spending / Income). Tabs.tsx is the louder segmented control.
export function SubtleTabs<T extends string>({ options, value, onChange, className = "" }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={`flex gap-5 border-b border-line ${className}`}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(o.value)}
            className={`-mb-px h-9 border-b-2 text-label font-medium transition-colors ${
              selected ? "border-accent text-accent" : "border-transparent text-fg-3 hover:text-fg"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
