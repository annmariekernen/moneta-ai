// Cloudflare Worker for the Moneta AI prototype. It serves the built app
// (dist/) and runs the chat: POST /api/moneta takes the conversation so far
// and streams Moneta's reply back as plain text.
//
// Moneta's instructions, sent as the system prompt on every message:
// personality.md (who Moneta is and how it talks), demo-data.md (who Lois is,
// in prose), and her accounts, budget sheet and 12 months of transactions
// from src/demo-data.json, the same file the app's screens read. Edit those,
// not this file, to change what Moneta says or knows.
//
// Config: wrangler.jsonc.
//
// Costs money per message, so it's fenced in:
// - Off until the ANTHROPIC_API_KEY secret is set (Cloudflare dashboard, or
//   `npx wrangler secret put ANTHROPIC_API_KEY`). Until then it answers 503
//   and the prototype falls back to its canned replies.
// - Only the prototype's own page (and localhost) can call it.
// - Rate limit per visitor: MONETA_LIMITER in wrangler.jsonc.
// - Recent messages only (LIMITS below), short messages, and a cap on reply
//   length. The 30-messages-a-day limit is counted in the app (src/moneta.ts).
// Also set a monthly spend limit for the key's workspace in the Claude Console.
import Anthropic from '@anthropic-ai/sdk';
import personality from './personality.md';
import demoData from './demo-data.md';
import demo from '../src/demo-data.json';
// Her categories, and Moneta's default guess from each transaction's hidden
// kind (the `category` field in demo-data.json). Same file the app uses.
import categoryMap from '../src/category-map.json';

// The model behind Moneta: Haiku 5.5, the small, fast, inexpensive one.
// Plenty for short chat answers about a year of transactions, and about
// 1/40th of Opus's price per message. (claude-opus-5-5 for smarter replies.)
const MODEL = 'claude-haiku-5-5';
// messages: the app sends only the most recent 20 of the running chat
// (src/moneta.ts WINDOW); the daily 30-message limit is counted in the app
const LIMITS = { messages: 20, chars: 500, replyTokens: 4000, context: 4000 };

// HTML comments in the docs are notes for people, not for Moneta
const strip = (md) => md.replace(/<!--[\s\S]*?-->/g, '').trim();
const SYSTEM = `${strip(personality)}\n\n${strip(demoData)}\n\n${dataForMoneta(demo)}`;

// Lois's data as plain text: accounts, her own budget sheet, monthly totals
// by category (worked out here, so Moneta doesn't have to add up hundreds of
// rows), then every transaction.
function dataForMoneta(data) {
  const money = (n) => `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2)}`;
  const categoryOf = (kind) => categoryMap.labels[categoryMap.kindToCategory[kind] ?? 'misc'];
  const label = { checking: 'Checking 1234', debit: 'Debit card 1234 (from checking)', visa: 'Planet Rewards Visa 4422', mc: 'Skyline Mastercard 3456' };
  const lines = ['## Her accounts (balances as of today)', ''];
  for (const a of data.accounts) {
    if (a.balance === undefined) continue;
    lines.push(`- ${a.name} (${a.institution}, ${a.mask})${a.joint ? `, shared with ${a.joint}` : ''}: ${money(a.balance)}`);
  }
  lines.push('', `## Her own budget (imported from ${data.importedBudget.source}: "${data.importedBudget.name}")`, '');
  for (const r of data.importedBudget.rows) lines.push(`- ${r.name}: ${money(r.monthly)}/month (her categories: ${[...new Set(r.mapsTo.map(categoryOf))].join(', ')})`);

  // Spending by month and category (transfers between her accounts aren't spending)
  const totals = {};
  for (const t of data.transactions) {
    if (t.category === 'transfer' || t.amount >= 0) continue;
    const m = t.date.slice(0, 7);
    totals[m] ??= {};
    const c = categoryOf(t.category);
    totals[m][c] = (totals[m][c] ?? 0) - t.amount;
  }
  lines.push('', `## Her categories (use only these names; income and transfers aren't in the budget)`, '', Object.values(categoryMap.labels).filter((l) => l !== 'Income' && l !== 'Transfer').join(', '));
  lines.push('', '## Spending by month and category (already added up: use these instead of adding rows yourself)', '');
  for (const m of Object.keys(totals).sort()) {
    const cats = Object.entries(totals[m]).sort((a, b) => b[1] - a[1]);
    const sum = cats.reduce((s, [, v]) => s + v, 0);
    const soFar = m === data.today.slice(0, 7) ? ' (month so far)' : '';
    lines.push(`- ${m}${soFar}: total ${money(sum)}; ${cats.map(([c, v]) => `${c} ${money(v)}`).join(', ')}`);
  }

  lines.push('', '## Every transaction, newest first (id | date | merchant | account | category | amount)', '');
  for (const t of data.transactions) lines.push(`${t.id} | ${t.date} | ${t.merchant} | ${label[t.account] ?? t.account} | ${categoryOf(t.category)} | ${money(t.amount)}`);
  return lines.join('\n');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/moneta') {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
      return handleMoneta(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleMoneta(request, env) {
  if (!env.ANTHROPIC_API_KEY) return new Response('Moneta is offline', { status: 503 });
  if (!sameSite(request)) return new Response('Forbidden', { status: 403 });

  if (env.MONETA_LIMITER) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const { success } = await env.MONETA_LIMITER.limit({ key: ip });
    if (!success) return new Response('Too many messages', { status: 429 });
  }

  let messages, newSession, context;
  try {
    const body = await request.json();
    messages = validate(body?.messages);
    newSession = body?.newSession === true;
    // Her edits in the app (budget, account names, categories she fixed),
    // summarized by the page (contextForMoneta in src/budget.ts)
    context = typeof body?.context === 'string' ? body.context.slice(0, LIMITS.context) : '';
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  if (!messages) return new Response('Bad request', { status: 400 });
  // Start of a new session (first visit, or back after a few hours): a note
  // after her message so Moneta greets her by name. Added as a system
  // message at the end, so the cached system prompt stays the same.
  if (newSession) {
    messages.push({ role: 'system', content: `This message starts a new session. Greet ${demo.user.firstName} by her first name briefly at the start of your reply.` });
  }
  // What she's set up or changed in the app right now (same place, same
  // reason: the cached system prompt stays the same). Her edits win over the
  // original data where they differ.
  if (context) {
    messages.push({ role: 'system', content: `What ${demo.user.firstName} sees in the app right now (her own edits; use these over the original data where they differ):\n${context}` });
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: LIMITS.replyTokens,
    // Chat: keep thinking short so replies start fast and cost less
    output_config: { effort: 'low' },
    // The system prompt is the same every time, so cache it
    cache_control: { type: 'ephemeral' },
    system: SYSTEM,
    messages,
  });

  // Pass the reply's text through to the page as it's written
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  (async () => {
    try {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          await writer.write(encoder.encode(event.delta.text));
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === 'refusal') {
        await writer.write(encoder.encode('\n\nSorry, I can’t help with that one. Want to ask me something about your spending?'));
      }
    } catch (err) {
      console.error('Moneta reply failed', err?.status, err?.message);
      await writer.abort(err).catch(() => {});
      return;
    }
    await writer.close();
  })();

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// Pages on this site send their own origin; so does local dev.
function sameSite(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try {
    const o = new URL(origin);
    return o.host === new URL(request.url).host || o.hostname === 'localhost' || o.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

// A short back-and-forth of plain text, starting and ending with the visitor
function validate(list) {
  if (!Array.isArray(list) || list.length === 0 || list.length > LIMITS.messages) return null;
  const out = [];
  for (const [i, m] of list.entries()) {
    const role = i % 2 === 0 ? 'user' : 'assistant';
    if (m?.role !== role || typeof m.content !== 'string') return null;
    const content = m.content.trim();
    // Moneta's own earlier replies can be longer than a visitor's message
    if (!content || (role === 'user' && content.length > LIMITS.chars) || content.length > 4000) return null;
    out.push({ role, content });
  }
  return out[out.length - 1].role === 'user' ? out : null;
}
