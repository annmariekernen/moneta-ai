// A speech bubble from the goose in the lower nav: Moneta offering help at
// the right moment (for now, right after her first budget draft). It waits
// until the build flow has slid away, types itself out like a message, stays
// a few seconds, then slides away on its own. Tapping it (or the goose) opens
// the chat, where Moneta's matching message is waiting (Chat.tsx clears the
// store's `nudge` then). Gone on its own, it stays gone until a reload; the
// chat message still waits for her.
import { useEffect, useState } from "react";
import { Typing } from "../components/Typing";
import { useEdits } from "../store";

// PLACEHOLDER copy
const NUDGES = {
  "first-draft": "Your first budget draft is ready! Want to change anything? Just ask me.",
};
const START_AFTER_MS = 900; // the flow's slide-out (0.42s) plus half a second
const STAY_MS = 3000; // after it's done typing

let shownThisVisit = false; // once it has gone away on its own

export function MonetaBubble({ hidden, onOpen }: { hidden: boolean; onOpen: () => void }) {
  const { nudge } = useEdits();
  const [phase, setPhase] = useState<"waiting" | "showing" | "leaving" | "gone">(shownThisVisit ? "gone" : "waiting");

  useEffect(() => {
    if (!nudge || phase !== "waiting") return;
    const timer = setTimeout(() => setPhase("showing"), START_AFTER_MS);
    return () => clearTimeout(timer);
  }, [nudge, phase]);

  const typed = () =>
    setTimeout(() => {
      setPhase("leaving");
      setTimeout(() => { shownThisVisit = true; setPhase("gone"); }, 300);
    }, STAY_MS);

  if (!nudge || hidden || phase === "waiting" || phase === "gone") return null;
  return (
    <button className={`moneta-bubble block py-3 px-3.5 text-left text-label text-fg ${phase === "leaving" ? "is-leaving" : "slide-in"}`} onClick={onOpen}>
      <Typing paragraphs={[{ text: NUDGES[nudge], ms: 22 }]} onDone={typed} />
    </button>
  );
}
