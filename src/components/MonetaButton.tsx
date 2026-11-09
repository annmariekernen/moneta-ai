// The Moneta tab in the bottom nav: the goose icon in a circle (in full color, in the
// same 32px slot as the other icons), labeled "Moneta". It sits inside the bar
// like any other tab; the color is what marks it as the AI. Opens the chat.
import type { ButtonHTMLAttributes } from "react";
import goose from "../assets/goose-glasses-circle.svg";

export function MonetaButton({ className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`group flex w-16 flex-col items-center gap-1 text-caption font-medium text-fg-3 hover:text-fg ${className}`} aria-label="Chat with Moneta" {...rest}>
      <span className="grid h-8 w-14 place-items-center transition-transform group-hover:-translate-y-px group-active:scale-95">
        <img src={goose} alt="" className="size-8" />
      </span>
      Moneta
    </button>
  );
}
