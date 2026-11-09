# Moneta AI: coded prototype (2026 rebuild)

Clickable rebuild of a Figma prototype. All account data is mock data. Moneta's chat replies come from one of two
places:

- **Live (Claude):** the chat sends the conversation to `POST /api/moneta`
  and streams Claude's reply in. That endpoint is this project's Cloudflare
  Worker (`worker/index.js`), which holds the API key, Moneta's personality
  and the demo data.
- **Canned (backup):** if the Worker isn't there (plain `npm run dev`, a
  static host, or no API key set yet), the chat quietly falls back to the
  scripted replies in `src/replies.ts`.

## Run it

    npm install      # first time only
    npm run dev      # http://localhost:5173 (canned replies); also on your phone via the Network address it prints

For live replies, put your own Claude API key in a `.dev.vars` file (it's
git-ignored, never commit it):

    ANTHROPIC_API_KEY=sk-ant-...

then run the Worker, which builds the app and serves it with the chat:

    npm run worker   # http://localhost:8787, or <your Mac's IP>:8787 on your phone

(`npm run dev` also forwards `/api` to port 8787, so you can keep Vite's hot
reload with the Worker running in a second terminal.) Without a key the
Worker answers 503 and the chat uses canned replies.

This runs your own local copy of the Worker; it never connects to the live
prototype, and live replies are billed to your own API key.

## Click-through

1. Home (Budget Overview): tap the **Recent Transactions** card → Transaction History
2. Transaction History: OUTGOING / INCOMING toggle, back chevron → Home
3. Tap Moneta (the goose) in the bottom nav → Moneta chat sheet
4. Tap a suggested prompt (or type, then press Enter). Moneta "types", then replies.
   Follow-up chips appear under replies (live replies can suggest up to 2).
5. **–** minimizes the chat and keeps the conversation; **×** closes and clears it.

A conversation is capped at 11 questions (the same limit the Worker uses),
after which Moneta says the demo is over. If the Worker's rate limit kicks in,
Moneta asks you to wait a minute.

## Changing what Moneta says

- **Live replies:** edit `worker/personality.md` (voice and rules) and
  `worker/demo-data.md` (the made-up person and transactions). Both are sent
  to the model as its instructions on every message. The model and limits
  are set at the top of `worker/index.js`.
- **Canned replies:** edit `src/replies.ts`. Copy is marked FROM FIGMA
  (verbatim from Prototype 6.14) or PLACEHOLDER (written for the rebuild,
  still to be replaced with Ann Marie's own words).
- **Status messages** (rate limited, error, end of demo): `src/App.tsx`, near
  the chat code.

## Where things live

- `src/App.tsx`: screens and chat
- `src/moneta.ts`: live replies (calls the Worker, splits off follow-up chips)
- `src/replies.ts`: canned replies, used when the Worker isn't available
- `src/data.ts`: mock transactions and insights (copy from Figma)
- `src/index.css`: styles (Figma values)
- `src/assets/`: assets exported from the Figma file
- `worker/`: the Cloudflare Worker (serves the app, runs the chat) and
  Moneta's two instruction docs
- `wrangler.jsonc`: Worker config, including the per-visitor rate limit

## Deploy

Deployed on Cloudflare Workers (`npm run deploy`, or Cloudflare's GitHub
integration on push). The API key is a Worker secret,
`ANTHROPIC_API_KEY`, set in the Cloudflare dashboard or with
`npx wrangler secret put ANTHROPIC_API_KEY`. It is never in this repo.

Because each message costs money, the chat endpoint only answers the
prototype's own page, rate limits each visitor (8 messages a minute), caps
conversations at 11 questions and replies at 4,000 tokens, and is off
entirely until the key is set. The key's workspace also has a monthly spend
limit in the Claude Console.

`npm run build` alone gives a static site in `dist/` (relative paths, works
from any folder) that uses the canned replies.

## License

Code is MIT licensed (see `LICENSE`). 

Design, Moneta name, logo and other assets in `src/assets/`, the written copy 
(Moneta's personality in `worker/personality.md` and the replies in `src/replies.ts`) 
are © 2026 Ann Marie Kernen, all rights reserved
