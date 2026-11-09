// Chat messages. You: a gray bubble on the right. Moneta: plain text on the
// left with a small goose mark and no bubble, so it reads like an answer.
import type { ReactNode } from "react";
import goose from "../assets/goose-glasses-circle.svg";

export function UserMessage({ children }: { children: ReactNode }) {
  return (
    <div className="ml-auto max-w-[80%] rounded-card rounded-br-[6px] bg-subtle px-3.5 py-2.5 text-body text-fg">
      {children}
    </div>
  );
}

export function MonetaMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <img src={goose} alt="" className="mt-0.5 size-5 shrink-0" />
      <div className="text-body text-fg [&_strong]:font-medium">{children}</div>
    </div>
  );
}
