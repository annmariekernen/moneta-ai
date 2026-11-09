// The Moneta chat sheet: one running conversation, remembered in this browser.
import { Fragment, useEffect, useRef, useState } from "react";
import { CalendarX2, EllipsisVertical, Minus, Trash2 } from "lucide-react";
import { ChatInput } from "../components/ChatInput";
import { ConfirmDialog } from "../components/Dialog";
import { Chip } from "../components/Chip";
import { MonetaMessage, UserMessage } from "../components/ChatMessage";
import { Wordmark } from "../components/Wordmark";
import { user } from "../data";
import { contextForMoneta } from "../budget";
import { edit, getEdits } from "../store";
import { ActionCard } from "../components/ActionCard";
import { applyAction, budgetPart, describe, parseAction, type BudgetPart } from "../monetaActions";
import { screenContext } from "../screenContext";
import { firstBudgetReply, replyFor, suggestedPrompts, type Reply } from "../replies";
import { ask as askMoneta, Busy, clearMemory, DAILY_LIMIT, isNewSession, load, Offline, save, splitReply, todayKey, type Turn } from "../moneta";


// One running conversation, remembered in this browser (see PRD.md):
// minimizing keeps it, the ⋮ menu can clear it. `at` is when it was sent.
type Msg =
  | { from: "user"; text: string; at: number }
  // raw: the reply exactly as Moneta wrote it, sent back as history.
  // status / before: its action card, applied or undone, and her budget
  // as it was before applying (put back on Undo)
  | { from: "moneta"; reply: Reply; raw: string; at: number; status?: "applied" | "undone"; before?: BudgetPart; fresh?: boolean; typedFrom?: number };
// fresh: still typing itself out; typedFrom: how much was already shown
// while it streamed in live (it carries on from there)

// Shown when something goes wrong. PLACEHOLDER copy, Ann Marie: reword freely.
const busyReply: Reply = { text: "Whoa, that’s a lot of questions at once! Give me a minute, then try again." };
const errorReply: Reply = { text: "Hmm, I couldn’t reach your accounts just now. Try again in a sec?" };

// Once the live endpoint says it's offline, stop asking it (until reload)
let offline = false;

// "Today", "Yesterday" or "Nov 3", for the date dividers in the thread
function dayLabel(at: number) {
  const d = new Date(at), now = new Date();
  const days = Math.round((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 864e5);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// prefill: a question to put in the input, ready to send (e.g. from "Ask
// Moneta about this"); `n` changes each time so the same question can repeat
export function Chat({ open, onMinimize, prefill }: { open: boolean; onMinimize: () => void; prefill?: { text: string; n: number } }) {
  // Replies type out only when they're new (not when the chat reloads)
  const [memory, setMemory] = useState(() => {
    const m = load<Msg>();
    return { ...m, messages: m.messages.map((x) => (x.from === "moneta" && x.fresh ? { ...x, fresh: false } : x)) };
  });
  // Suggestion chips wait a beat after Moneta finishes; a tap skips the typing
  const [chipsReady, setChipsReady] = useState(true);
  const [skipN, setSkipN] = useState(0);
  const chipsSoon = () => {
    setChipsReady(false);
    setTimeout(() => setChipsReady(true), 350);
  };
  const messages = memory.messages;
  const [typing, setTyping] = useState(false);
  const [live, setLive] = useState<string | null>(null); // reply streaming in
  // How much of the streaming reply is on screen: it comes in at the same
  // steady word pace as every reply, however fast the stream arrives
  const [liveShown, setLiveShown] = useState(0);
  const liveShownRef = useRef(0);
  liveShownRef.current = liveShown;
  const [draft, setDraft] = useState("");
  // "Ask Moneta about this" buttons: the chat opens and the question is sent
  // for her (once the chat has slid up), then Moneta answers
  const asking = useRef<string | null>(null);
  const askRef = useRef<(q: string) => void>(() => {});
  useEffect(() => {
    if (!prefill?.text) return;
    asking.current = prefill.text;
    const timer = setTimeout(() => {
      const q = asking.current;
      asking.current = null;
      if (q) askRef.current(q);
    }, 380);
    return () => clearTimeout(timer);
  }, [prefill?.n, prefill?.text]);
  const [menu, setMenu] = useState<"closed" | "open" | "confirm">("closed");
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save the conversation whenever it changes
  useEffect(() => save(memory), [memory]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, live, open]);

  useEffect(() => {
    if (!open) setMenu("closed");
  }, [open]);

  // Typing: when the field is focused and the phone's keyboard comes up (the
  // chat gets shorter), keep the conversation scrolled to the latest message
  useEffect(() => {
    const toBottom = () => {
      if (document.activeElement !== inputRef.current) return;
      bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
    };
    const input = inputRef.current;
    const onFocus = () => { toBottom(); setTimeout(toBottom, 300); };
    input?.addEventListener("focus", onFocus);
    window.visualViewport?.addEventListener("resize", toBottom);
    return () => {
      input?.removeEventListener("focus", onFocus);
      window.visualViewport?.removeEventListener("resize", toBottom);
    };
  }, []);

  // Opened with nothing in it: Moneta says hello first (typed out), and the
  // starter suggestions come after it. PLACEHOLDER copy
  useEffect(() => {
    if (!open || messages.length > 0 || getEdits().nudge === "first-draft" || asking.current) return;
    setTyping(true);
    const timer = setTimeout(() => {
      setTyping(false);
      addReply({ text: `Hi ${user.firstName}! Ask me anything about your money, or start with one of these.`, followUps: suggestedPrompts });
    }, 700);
    return () => clearTimeout(timer);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Opened right after her first budget (from the goose's speech bubble, or
  // the goose itself): Moneta types its congrats, with suggestions for her
  // budget. Once only (the nudge is cleared).
  useEffect(() => {
    if (!open || getEdits().nudge !== "first-draft") return;
    edit((x) => ({ ...x, nudge: null }));
    setTyping(true);
    const timer = setTimeout(() => {
      setTyping(false);
      const reply = firstBudgetReply(getEdits());
      setChipsReady(false);
      setMemory((m) => ({ ...m, messages: [...m.messages, { from: "moneta", reply, raw: reply.text, at: Date.now(), fresh: true }] }));
    }, 1100);
    return () => clearTimeout(timer);
  }, [open]);

  const busy = typing || live !== null;
  useEffect(() => {
    if (live === null || liveShown >= live.length) return;
    const next = live.slice(liveShown).search(/\S\s/);
    if (next < 0) return; // wait for the rest of the word
    const timer = setTimeout(() => setLiveShown(liveShown + next + 2), WORD_MS);
    return () => clearTimeout(timer);
  }, [live, liveShown]);
  useEffect(() => {
    if (live !== null) setLiveShown(live.length); // a tap skips ahead
  }, [skipN]); // eslint-disable-line react-hooks/exhaustive-deps
  const sentToday = memory.day === todayKey() ? memory.sentToday : 0;
  const atLimit = sentToday >= DAILY_LIMIT && !busy;

  // fresh: type it out (canned replies); live replies already streamed in
  const addReply = (reply: Reply, raw = reply.text, fresh = true, typedFrom = 0) => {
    if (fresh) setChipsReady(false);
    else chipsSoon();
    setMemory((m) => ({ ...m, messages: [...m.messages, { from: "moneta", reply, raw, at: Date.now(), ...(fresh ? { fresh: true, typedFrom } : {}) }] }));
  };

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || busy || sentToday >= DAILY_LIMIT) return;
    setDraft("");
    const newSession = isNewSession(memory.lastActive);
    const history: Turn[] = [
      ...messages.map((m): Turn => (m.from === "user" ? { role: "user", content: m.text } : { role: "assistant", content: m.raw })),
      { role: "user", content: text },
    ];
    setMemory((m) => ({
      messages: [...m.messages, { from: "user", text, at: Date.now() }],
      lastActive: Date.now(),
      day: todayKey(),
      sentToday: (m.day === todayKey() ? m.sentToday : 0) + 1,
    }));
    setTyping(true);

    const canned = () =>
      setTimeout(() => {
        setTyping(false);
        const reply = replyFor(text, getEdits());
        addReply(newSession ? { ...reply, text: `Hi, ${user.firstName}! ${reply.text}` } : reply);
      }, 1400);

    if (offline) return canned();
    try {
      const raw = await askMoneta(
        history,
        (soFar) => {
          const visible = splitReply(soFar).text;
          if (visible) {
            setTyping(false); // the dots stay until its first words are on screen
            setLive(visible);
          }
        },
        // Her budget and edits, so Moneta matches what the screens show
        { newSession, context: `${screenContext()}\n${contextForMoneta(getEdits())}` },
      );
      const { text: replyText, followUps, actionLines } = splitReply(raw);
      const actions = actionLines.map((l) => parseAction(l, getEdits())).filter((a) => a !== null);
      setTyping(false);
      setLive(null);
      addReply({ text: replyText || errorReply.text, followUps, ...(actions.length ? { actions } : {}) }, raw, true, replyText ? liveShownRef.current : 0);
      setLiveShown(0);
    } catch (err) {
      if (err instanceof Offline) {
        offline = true;
        return canned();
      }
      setTyping(false);
      setLive(null);
      addReply(err instanceof Busy ? busyReply : errorReply);
    }
  };
  askRef.current = ask;

  const clearHistory = () => {
    clearMemory();
    setMemory((m) => ({ ...m, messages: [], lastActive: 0 }));
    setMenu("closed");
  };
  // Only today's messages (since midnight); earlier days stay
  const startOfToday = new Date(new Date().toDateString()).getTime();
  const hasToday = messages.some((m) => m.at >= startOfToday);
  const clearToday = () => {
    setMemory((m) => ({ ...m, messages: m.messages.filter((x) => x.at < startOfToday) }));
    setMenu("closed");
  };

  // Action cards: apply every change in a message's card, or put her budget
  // back the way it was before
  const setMsg = (i: number, patch: Partial<Extract<Msg, { from: "moneta" }>>) =>
    setMemory((mem) => ({ ...mem, messages: mem.messages.map((m, j) => (j === i && m.from === "moneta" ? { ...m, ...patch } : m)) }));
  const applyCard = (i: number) => {
    const m = messages[i];
    if (m?.from !== "moneta" || !m.reply.actions) return;
    const before = budgetPart(getEdits());
    edit((e) => m.reply.actions!.reduce(applyAction, e));
    setMsg(i, { status: "applied", before });
  };
  const undoCard = (i: number) => {
    const m = messages[i];
    if (m?.from !== "moneta" || !m.before) return;
    edit((e) => ({ ...e, ...m.before }));
    setMsg(i, { status: "undone", before: undefined });
  };

  const last = messages[messages.length - 1];
  // Chips: only under the latest reply, once it's done typing plus a beat
  const followUps = !busy && !atLimit && chipsReady && last?.from === "moneta" && !last.fresh ? last.reply.followUps : undefined;
  const iconBtn = "grid size-9 place-items-center rounded-control text-fg-3 hover:bg-subtle hover:text-fg";

  return (
    <>
      {/* No dimming behind Moneta (that is for dialogs and drawers): a clear layer that still minimizes the chat on a tap */}
      <div className={`scrim scrim-clear ${open ? "is-open" : ""}`} onClick={onMinimize} />
      <section className={`chat flex flex-col bg-surface ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <header className="relative flex h-14 shrink-0 items-center gap-1 border-b border-line px-3">
          <button className={iconBtn} onClick={() => setMenu(menu === "closed" ? "open" : "closed")} aria-label="Chat options" aria-expanded={menu !== "closed"}>
            <EllipsisVertical size={20} />
          </button>
          <span className="flex flex-1 justify-center">
            <Wordmark />
          </span>
          <button className={iconBtn} onClick={onMinimize} aria-label="Minimize">
            <Minus size={20} />
          </button>

          {/* The ⋮ menu: clear today's messages right away, or everything
              (that one asks first, in a modal, since it can't be undone) */}
          {menu === "open" && (
            <div className="absolute top-12 left-3 z-10 w-60 rounded-card border border-line bg-surface p-1.5 shadow-float">
              <button
                className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-label text-fg hover:bg-subtle disabled:text-fg-4"
                onClick={clearToday}
                disabled={!hasToday}
              >
                <CalendarX2 size={16} />
                Clear today’s chat
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-label text-negative hover:bg-subtle disabled:text-fg-4"
                onClick={() => setMenu("confirm")}
                disabled={messages.length === 0}
              >
                <Trash2 size={16} />
                Clear all chat history
              </button>
            </div>
          )}
        </header>

        <div className="chat-body flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4" ref={bodyRef} onClick={() => setMenu("closed")} onPointerDown={() => setSkipN((n) => n + 1)}>
          <div className="flex-1" />
          {messages.map((m, i) => (
            <Fragment key={i}>
              {(i === 0 || dayLabel(messages[i - 1].at) !== dayLabel(m.at)) && (
                <div className="flex items-center gap-3 text-caption text-fg-4">
                  <span className="h-px flex-1 bg-line" />
                  {dayLabel(m.at)}
                  <span className="h-px flex-1 bg-line" />
                </div>
              )}
              {m.from === "user" ? (
                <UserMessage>{m.text}</UserMessage>
              ) : (
                <>
                  <MonetaMessage>
                    {m.fresh ? (
                      <TypedText text={m.reply.text} from={m.typedFrom ?? 0} skipN={skipN} onGrow={() => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })} onDone={() => { setMsg(i, { fresh: false }); chipsSoon(); }} />
                    ) : (
                      <RichText text={m.reply.text} />
                    )}
                  </MonetaMessage>
                  {m.reply.actions?.length && !m.fresh ? (
                    <ActionCard
                      lines={m.reply.actions.map(describe)}
                      status={m.status}
                      onApply={() => applyCard(i)}
                      onUndo={() => undoCard(i)}
                    />
                  ) : null}
                </>
              )}
            </Fragment>
          ))}
          {live !== null && liveShown > 0 && (
            <MonetaMessage>
              <RichText text={closeBold(live.slice(0, liveShown))} />
            </MonetaMessage>
          )}
          {(typing || (live !== null && liveShown === 0)) && (
            <div className="typing" aria-label="Moneta is typing">
              <span /><span /><span />
            </div>
          )}
          {followUps && (
            <div className="chips-in flex flex-wrap gap-2">
              {followUps.map((p) => (
                <Chip key={p} onClick={() => ask(p)}>{p}</Chip>
              ))}
            </div>
          )}
          {/* PLACEHOLDER copy, Ann Marie: reword freely */}
          {atLimit && (
            <p className="text-center text-caption text-fg-3">
              That’s today’s {DAILY_LIMIT} demo messages. Moneta will be back tomorrow!
            </p>
          )}
        </div>

        <form
          className="chat-input-wrap shrink-0 border-t border-line px-3 pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
        >
          <ChatInput
            value={draft}
            onValueChange={setDraft}
            inputRef={inputRef}
            disabled={atLimit}
            placeholder={atLimit ? "Back tomorrow" : "Ask Moneta about your money"}
          />
        </form>

        {/* Confirmation for clearing everything: a modal over the chat */}
        {menu === "confirm" && (
          <ConfirmDialog
            className="rounded-t-sheet"
            title="Clear all chat history?"
            body="Moneta will forget your whole conversation, not just today’s. This can’t be undone."
            confirmLabel="Clear everything"
            onConfirm={clearHistory}
            onCancel={() => setMenu("closed")}
          />
        )}
      </section>
    </>
  );
}

// Renders the tiny **bold** / "- bullet" format Moneta replies in.
// A reply typing itself out, like an AI chat. skipN: a tap in the thread
// finishes it at once. Bold that's half typed is closed so "**" never shows.
// Every reply comes in a word at a time at this steady pace (about 13 words
// a second), like a streamed AI reply
const WORD_MS = 75;
// Bold that's half typed is closed so "**" never shows
const closeBold = (part: string) => ((part.match(/\*\*/g)?.length ?? 0) % 2 === 1 ? part + "**" : part);

function TypedText({ text, from, skipN, onGrow, onDone }: { text: string; from: number; skipN: number; onGrow: () => void; onDone: () => void }) {
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [shown, setShown] = useState(reduced ? text.length : Math.min(from, text.length));
  const [firstSkip] = useState(skipN);
  useEffect(() => {
    if (skipN !== firstSkip) setShown(text.length);
  }, [skipN, firstSkip, text.length]);
  useEffect(() => {
    if (shown >= text.length) { onDone(); return; }
    const next = text.slice(shown).search(/\S\s/);
    const to = next < 0 ? text.length : shown + next + 2;
    const timer = setTimeout(() => setShown(to), WORD_MS);
    return () => clearTimeout(timer);
  }, [shown, text.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(onGrow, [shown]); // eslint-disable-line react-hooks/exhaustive-deps
  return <RichText text={closeBold(text.slice(0, shown))} />;
}

function RichText({ text }: { text: string }) {
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part));
  return (
    <div className="flex flex-col gap-2">
      {text.split("\n\n").map((para, i) => {
        const lines = para.split("\n");
        const bullets = lines.filter((l) => l.startsWith("- "));
        const prose = lines.filter((l) => !l.startsWith("- "));
        return (
          <div key={i} className="flex flex-col gap-1">
            {prose.map((l, j) => (
              <p key={j}>{inline(l)}</p>
            ))}
            {bullets.length > 0 && (
              <ul className="list-disc pl-5 marker:text-fg-4">
                {bullets.map((b, j) => (
                  <li key={j}>{inline(b.slice(2))}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
