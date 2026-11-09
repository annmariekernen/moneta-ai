// Buttons. primary: the one main action on a screen (accent fill).
// secondary: everything else (white, hairline). ghost: low-emphasis, in toolbars.
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "sm";
  icon?: ReactNode;
};

const variants = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "bg-surface text-fg border border-line hover:bg-subtle",
  ghost: "text-fg-2 hover:bg-subtle hover:text-fg",
};
const sizes = { md: "h-10 px-4 text-label", sm: "h-8 px-3 text-caption" };

export function Button({ variant = "secondary", size = "md", icon, className = "", children, ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-control font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
