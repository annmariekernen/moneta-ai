// Text typing itself out, like a chat reply (it isn't one: the text is
// fixed). Used for Moneta's notes and the nav goose's speech bubble. The box
// grows as the text comes in. Screen readers and reduced motion get it all at
// once. Each paragraph can have its own size (className) and speed (ms per
// character).
import { useEffect, useState } from "react";

export type Typed = { text: string; className?: string; ms?: number };
export function Typing({ paragraphs, instant = false, onDone }: { paragraphs: Typed[]; instant?: boolean; onDone?: () => void }) {
  const total = paragraphs.reduce((n, p) => n + p.text.length, 0);
  const reduced = instant || (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [shown, setShown] = useState(reduced ? total : 0);
  const [started, setStarted] = useState(reduced); // after the note slides in
  // The speed of the paragraph being typed
  let before = 0;
  const current = paragraphs.find((p) => (before += p.text.length) > shown);
  const ms = current?.ms ?? 18;
  // Turned instant part way through (e.g. a tap to skip): show it all now
  useEffect(() => {
    if (instant) { setStarted(true); setShown(total); }
  }, [instant, total]);
  useEffect(() => {
    if (!started) {
      const timer = setTimeout(() => setStarted(true), 120);
      return () => clearTimeout(timer);
    }
    if (shown >= total) { onDone?.(); return; }
    const timer = setTimeout(() => setShown((n) => n + 1), ms);
    return () => clearTimeout(timer);
  }, [started, shown, total, ms]); // eslint-disable-line react-hooks/exhaustive-deps
  let left = shown;
  return (
    <div aria-label={paragraphs.map((p) => p.text).join(" ")}>
      {paragraphs.map((p, i) => {
        const n = Math.max(0, Math.min(p.text.length, left));
        left -= p.text.length;
        if (n === 0 && i > 0) return null; // a paragraph appears when its typing starts
        return (
          <p key={i} className={`${i > 0 ? "mt-2" : ""} ${p.className ?? ""}`} aria-hidden="true">
            {p.text.slice(0, n)}
            {/* keeps the first line's height while it's still empty */}
            {n === 0 && "\u00a0"}
          </p>
        );
      })}
    </div>
  );
}
