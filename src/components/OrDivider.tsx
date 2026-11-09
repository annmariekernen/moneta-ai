// A line, "or", a line: between a recommended option and the alternatives
export function OrDivider({ className = "my-5" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-caption text-fg-3 ${className}`} role="separator">
      <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
    </div>
  );
}
