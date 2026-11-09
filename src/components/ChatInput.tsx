// The chat box: a hairline field, with an accent send button once there's
// text. No glow or inner shadow. Works on its own (the design system page)
// or controlled by the chat (value + onValueChange, inside a <form>).
import { ArrowUp, Mic } from "lucide-react";
import { useState, type Ref } from "react";

export function ChatInput({
  placeholder = "Ask Moneta about your money",
  defaultValue = "",
  value,
  onValueChange,
  disabled = false,
  inputRef,
}: {
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const [own, setOwn] = useState(defaultValue);
  const text = value ?? own;
  const set = onValueChange ?? setOwn;
  return (
    <div className="flex items-center gap-2 rounded-card border border-line-strong bg-surface py-1.5 pr-1.5 pl-4 focus-within:border-accent">
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={500}
        aria-label="Message Moneta"
        className="h-9 min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-4"
      />
      {text.trim() ? (
        <button type="submit" className="grid size-9 shrink-0 place-items-center rounded-control bg-accent text-white" aria-label="Send">
          <ArrowUp size={18} />
        </button>
      ) : (
        <button type="button" className="grid size-9 shrink-0 place-items-center rounded-control text-fg-3 hover:bg-subtle" aria-label="Voice input (not in prototype)">
          <Mic size={18} />
        </button>
      )}
    </div>
  );
}
