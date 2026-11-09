// Suggested question in the chat ("How much have I spent on groceries?").
import type { ButtonHTMLAttributes } from "react";

export function Chip({ className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-control border border-line bg-surface px-3 py-2 text-left text-label text-fg transition-colors hover:border-line-strong hover:bg-subtle ${className}`}
      {...rest}
    />
  );
}
