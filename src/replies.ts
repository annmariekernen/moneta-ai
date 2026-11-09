// Canned ("scripted") Moneta replies: the backup when live replies from
// Claude (moneta.ts) aren't available, e.g. before the API key is set.
//
// Formatting: **bold**, lines starting with "- " become bullets, and a blank
// line starts a new paragraph.
//
// Copy marked FROM FIGMA is verbatim from Prototype 6.14.
// Copy marked PLACEHOLDER was written for the rebuild so every suggestion chip
// gets an answer. Ann Marie: replace these with your own words.

import { questions } from "./build";
import { cat } from "./categories";
import type { Edits } from "./store";
import { parseAction, type Action } from "./monetaActions";

export type Reply = {
  text: string;
  followUps?: string[];
  actions?: Action[]; // changes Moneta proposes (action cards)
};

export const suggestedPrompts = [
  "How much have I spent on groceries this month?",
  "Show me all of my subscription services",
  "Let’s review my credit card transactions from the past week",
  "What else can I ask Moneta?",
];

// Numbers below match Lois's demo data (src/demo-data.json) as of "today",
// November 8, 2026. If you regenerate the data, update them here too.

// Structure FROM FIGMA (frame "Budget Overview_no type_response"); numbers
// and stores updated for Lois
const groceries: Reply = {
  text: `Based on the transaction history of your linked accounts (Checking, Planet Rewards Visa, Skyline Mastercard), you’ve spent **$107.24** on groceries since November 1st.

Here’s where it went:
- Metro Fresh Market: **$84.52**
- Hob’s Bay Co-op: **$22.72**

For reference, you spent **$413.90** on groceries in October. Would you like me to list the transactions?`,
  // Figma has "budgert"; typo fixed here.
  followUps: ["What’s a good amount to aim for in my budget?"],
};

// FROM FIGMA (frame "Budget Overview_no type_typing", second reply); the
// facts about her updated for Lois
const budgetAmount: Reply = {
  text: `While I can’t give financial advice - ultimately, how much you want to spend on groceries is **up to you and your personal financial goals** - I can say that based on what I know about you:
- 28 years old
- Lives with a roommate in Metropolis
- Engaged, no kids

A typical range for a grocery budget might be between **$300-450 per month.** Your own budget sheet sets aside **$650** for “Food & fun,” which covers groceries and eating out.

Again, **it’s ultimately your choice,** and will depend on other factors too. Would you like me to run some budget scenarios for different amounts?`,
};

// PLACEHOLDER
const subscriptions: Reply = {
  text: `Here are the subscriptions I found in the past 30 days:
- ClassPass: **$49.00**
- Netflix: **$15.49**
- Duolingo Super: **$12.99**
- Spotify: **$11.99**
- iCloud+: **$2.99**

That’s **$92.46** a month in total. Duolingo Super started in March - still using it?`,
  followUps: ["How much do I spend on subscriptions in a year?"],
};

// PLACEHOLDER
const creditCard: Reply = {
  text: `Here’s your Planet Rewards Visa (4422) since November 1st:
- Metro Fresh Market: **$84.52**
- ClassPass: **$49.00**
- Little Bohemia Pizza: **$47.51**
- Bibbo’s Ace o’ Clubs: **$32.76**
- Metropolis Animal Rescue: **$25.00**
- Hob’s Bay Co-op: **$22.72**
- Lemonade renters insurance: **$14.00**
- Spotify: **$11.99**

That’s **$287.50** total.`,
};

// PLACEHOLDER
const whatElse: Reply = {
  text: `You can ask me things like:
- How much did I spend on restaurants last month?
- How does my spending compare to my budget sheet?
- How much have Clark and I saved for the wedding?
- Which subscriptions could I cancel?`,
};

// PLACEHOLDER: shown for anything typed that doesn't match a keyword below.
const fallback: Reply = {
  text: `I’m in offline demo mode right now, so I only know a few answers. Try one of these:`,
  followUps: suggestedPrompts.slice(0, 3),
};

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'");

/* ---------- Right after her first budget ---------- */

// Moneta's message when she opens the chat after building her first budget
// (Ann Marie's copy), with suggestions picked for Lois's budget: a place
// Moneta still isn't sure about, an amount to sanity-check, how the month is
// going, and the wedding.
export function firstBudgetReply(e: Pick<Edits, "categories" | "rules">): Reply {
  const unsure = questions({ merchants: {}, moves: {}, kinds: e.rules.kinds }).find((q) => q.guess === null && !e.rules.merchants[q.merchant]);
  const amountFor = e.categories.includes("groceries") ? "groceries" : e.categories[0];
  // PLACEHOLDER copy (the suggestions)
  const followUps = [
    unsure && `I’m not sure how to categorize my ${unsure.merchant} charges`,
    amountFor && `What’s a good amount to aim for on ${cat(amountFor).label.toLowerCase()}?`,
    "Am I on track with my budget this month?",
    e.categories.includes("savings") && "How much should I set aside for the wedding each month?",
  ].filter((x): x is string => !!x);
  return {
    text: "Congrats on making your first budget! Feel free to ask any questions here. I can edit your budget, assign expense items to categories, or answer any questions.",
    followUps,
  };
}

// PLACEHOLDER (the canned answers to those suggestions, for offline mode)
const categorize: Reply = {
  text: `Good question! Some places sell all kinds of things, so one category doesn’t always fit. A couple of easy ways to handle them:

- **Pick the usual one:** if it’s mostly everyday shopping, send it all to Shopping.
- **Leave it as “it depends”:** I’ll keep my best guess for each charge, and you can move any single one.

Either way, you can change your mind later.`,
};
const onTrack: Reply = {
  text: `You’re off to a good start! It’s early in the month, so most of your budget is still ahead of you. Your big bills like rent and student loans come out early, so the rest of the month is mostly everyday spending.

Want me to check on a specific category?`,
};
const wedding: Reply = {
  text: `You’re already moving money into your wedding fund every month, and Clark matches what you put in, which really adds up.

A simple way to pick an amount: take what you still want to save, and divide it by the months left before the wedding. Want me to work that out with you?`,
};

// Offline, Moneta can still propose changes for a few requests, so the
// action cards work without the live chat (PLACEHOLDER copy)
function cannedAction(q: string, e: Edits, original: string): Reply | null {
  // "I'm not sure how to categorize my Amazon charges": suggest where most of it went
  const unsure = q.match(/categori[sz]e my (.+?) charges/);
  if (unsure) {
    const merchant = questions({ merchants: {}, moves: {}, kinds: e.rules.kinds }).find((x) => norm(x.merchant) === unsure[1]);
    if (merchant && e.categories.includes(merchant.suggested)) {
      const where = cat(merchant.suggested).label;
      return {
        text: `Most of what you spend at **${merchant.merchant}** looks like **${where}** to me, so that's where I'd put it. If some of it is really something else, you can still move single charges later.`,
        actions: [{ kind: "merchant", merchant: merchant.merchant, category: merchant.suggested }],
      };
    }
  }
  // "What's a good amount to aim for on groceries?": the usual answer, plus a card
  if (/good amount|aim for/.test(q) && /grocer/.test(q) && e.categories.includes("groceries")) {
    return { ...budgetAmount, actions: [{ kind: "amount", category: "groceries", amount: 400 }] };
  }
  // "Set restaurants to $300" / "change fun to 150"
  const set = q.match(/(?:set|change|make) (?:my )?(.+?) (?:budget )?(?:to|at) \$?([\d,]+)/);
  if (set) {
    const action = parseAction(`! amount ${set[1]} ${set[2]}`, e);
    if (action) return { text: "Here's that change. Tap Apply and I'll update your budget.", actions: [action] };
  }
  // "Rename bills to utilities"
  const rename = original.match(/rename (?:my )?(.+?) (?:category )?to (.+)/i); // her capitals for the new name
  if (rename) {
    const action = parseAction(`! rename ${rename[1]} -> ${rename[2].replace(/[.!?]$/, "")}`, e);
    if (action) return { text: "Sure! Tap Apply to rename it.", actions: [action] };
  }
  return null;
}

export function replyFor(question: string, e?: Edits): Reply {
  const q = norm(question);
  const acted = e && cannedAction(q, e, question);
  if (acted) return acted;
  if (/categori/.test(q)) return categorize;
  if (/on track/.test(q)) return onTrack;
  if (/wedding|set aside/.test(q)) return wedding;
  if (/budge|aim for|good amount/.test(q)) return budgetAmount;
  if (/grocer/.test(q)) return groceries;
  if (/subscri/.test(q)) return subscriptions;
  if (/credit|card|past week/.test(q)) return creditCard;
  if (/what else|help|can i ask/.test(q)) return whatElse;
  return fallback;
}
