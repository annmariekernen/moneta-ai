// Live Moneta replies from Claude, through this project's Worker
// (POST /api/moneta in worker/index.js, which holds the API key,
// Moneta's personality doc and the demo data). The reply streams in as
// plain text.
//
// If the endpoint isn't there (no API key set yet, or running the prototype
// on its own), ask() throws Offline and the chat uses the canned replies in
// replies.ts instead.
//
// Also here: the chat's memory and daily limit, both kept in the visitor's
// own browser (local storage), so there's no database. See PRD.md.

export type Turn = { role: "user" | "assistant"; content: string };

export class Offline extends Error {}
export class Busy extends Error {}

// Moneta re-reads only the most recent messages (the rest stay visible in the
// thread). Matches the Worker's limit.
export const WINDOW = 20;
// Messages a visitor can send per day (counted in the browser)
export const DAILY_LIMIT = 30;
// Opening Moneta after this long away starts a new session (greeting by name)
const SESSION_GAP_MS = 3 * 60 * 60 * 1000;

export async function ask(history: Turn[], onText: (soFar: string) => void, opts: { newSession?: boolean; context?: string } = {}): Promise<string> {
  // Only the recent window, starting with one of the user's messages
  let recent = history.slice(-WINDOW);
  while (recent.length && recent[0].role !== "user") recent = recent.slice(1);
  let res: Response;
  try {
    res = await fetch("/api/moneta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: recent, newSession: !!opts.newSession, context: opts.context }),
    });
  } catch {
    throw new Offline();
  }
  if (res.status === 429) throw new Busy();
  // 404/405: no Worker here (e.g. plain `vite` or a static host). 503: no key.
  if (res.status === 404 || res.status === 405 || res.status === 503 || !res.body) throw new Offline();
  if (!res.ok) throw new Error(`Moneta ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onText(text);
  }
  return text;
}

// Moneta ends a reply with up to 2 next steps, each on a line starting with
// "> ", and may propose changes, each on a line starting with "! " (action
// cards, src/monetaActions.ts). Split both off. While a reply is still
// streaming, those lines are hidden so a half-written one never shows up.
export function splitReply(raw: string): { text: string; followUps: string[]; actionLines: string[] } {
  const lines = raw.split("\n");
  const followUps = lines.filter((l) => l.startsWith(">")).map((l) => l.replace(/^>\s*/, "").trim()).filter(Boolean);
  const actionLines = lines.filter((l) => l.startsWith("!")).map((l) => l.trim());
  const text = lines.filter((l) => !l.startsWith(">") && !l.startsWith("!")).join("\n").trim();
  return { text, followUps: followUps.slice(0, 2), actionLines };
}

/* ---------- Memory (local storage) ---------- */

// Every read and write is wrapped: storage can be off (private browsing),
// and the chat should still work, just without remembering.
const KEY = "moneta-chat-v1";

export type Stored<M> = { messages: M[]; lastActive: number; day: string; sentToday: number };

export function load<M>(): Stored<M> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Stored<M>;
  } catch { /* storage off */ }
  return { messages: [], lastActive: 0, day: "", sentToday: 0 };
}

export function save<M>(data: Stored<M>) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage off */ }
}

export function clearMemory() {
  try { localStorage.removeItem(KEY); } catch { /* storage off */ }
}

// A new session: first visit, or back after a few hours away
export const isNewSession = (lastActive: number) => Date.now() - lastActive > SESSION_GAP_MS;

export const todayKey = () => new Date().toISOString().slice(0, 10);
