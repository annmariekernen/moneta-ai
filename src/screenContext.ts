// Where she is in the app right now, sent to Moneta with each message, so
// "move this to Fun" or "is this a lot?" means the screen she's looking at.
// Screens describe themselves with setScreen(part, text) and clear it with
// null when they close; the parts are joined into one line for Moneta.
const parts = new Map<string, string>();

export function setScreen(part: "tab" | "page" | "transaction", text: string | null) {
  if (text) parts.set(part, text);
  else parts.delete(part);
}

export function screenContext() {
  const order = ["tab", "page", "transaction"];
  const now = order.map((p) => parts.get(p)).filter(Boolean);
  return now.length ? `Where she is in the app right now: ${now.join("; ")}.` : "";
}
