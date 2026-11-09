// Generates src/demo-data.json: 12 months of made-up finances for Lois Lane,
// the prototype's demo user. Both the app's screens and Moneta (the Worker)
// read that one file, so what you see always matches what Moneta knows.
//
// Run:  node scripts/generate-demo-data.mjs
// It's seeded, so it makes the same data every time; change SEED for a new
// shuffle. Edit the amounts and merchants below, then re-run.
//
// Who Lois is (the prose version lives in worker/demo-data.md):
// 28, marketing coordinator at the Daily Planet in Metropolis, paid every two
// weeks, renter with a roommate, no car, a cat, engaged to Clark, $12k of
// student loans left, a 401(k) at work, starting a jewelry side business with
// her mom. "Cool as a cucumber" about money, plus a bit of "if it ain't
// broke": she's kept a Google Sheet budget since Mint shut down.
import { writeFileSync } from "node:fs";

const SEED = 34;
const START = "2025-11-01";
const TODAY = "2026-11-08"; // frozen "today" (data runs through the day before)

// ---------- helpers ----------

let s = SEED;
const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); // small LCG
const between = (a, b) => Math.round((a + rand() * (b - a)) * 100) / 100;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;

const d = (iso) => new Date(iso + "T12:00:00Z");
const iso = (date) => date.toISOString().slice(0, 10);
const days = [];
for (let t = d(START); iso(t) < TODAY; t.setUTCDate(t.getUTCDate() + 1)) days.push(iso(t));
const dow = (day) => d(day).getUTCDay(); // 0 = Sunday
const dom = (day) => Number(day.slice(8, 10));
const month = (day) => day.slice(0, 7);

const txns = [];
const add = (date, merchant, amount, account, category) => {
  if (date < START || date >= TODAY) return;
  txns.push({ date, merchant, amount: Math.round(amount * 100) / 100, account, category });
};

// ---------- accounts ----------

const accounts = [
  { id: "checking", name: "Checking", institution: "Metropolis Credit Union", mask: "1234", type: "checking" },
  { id: "debit", name: "Debit card", institution: "Metropolis Credit Union", mask: "1234", type: "debit", linkedTo: "checking" },
  { id: "visa", name: "Planet Rewards Visa", institution: "Metropolis Credit Union", mask: "4422", type: "credit" },
  { id: "mc", name: "Skyline Mastercard", institution: "Kord Financial", mask: "3456", type: "credit" },
  { id: "savings", name: "Savings", institution: "Metropolis Credit Union", mask: "7788", type: "savings" },
  { id: "wedding", name: "Lois & Clark wedding fund", institution: "Metropolis Credit Union", mask: "2027", type: "savings", joint: "Clark Kent" },
  { id: "retirement", name: "Daily Planet 401(k)", institution: "Fidelity", mask: "0401", type: "retirement" },
  { id: "loan", name: "Student loan", institution: "Federal Student Aid", mask: "9310", type: "loan" },
];

// ---------- income ----------

// Paychecks every other Friday (after 401(k) 6% and health insurance)
for (const day of days) {
  const sinceFirst = (d(day) - d("2025-11-07")) / 864e5;
  if (sinceFirst >= 0 && sinceFirst % 14 === 0) {
    add(day, "Daily Planet payroll", 1962.4, "checking", "income");
    add(day, "Transfer to savings", -100, "checking", "transfer");
  }
}
add("2025-12-19", "Daily Planet payroll (year-end bonus)", 1180, "checking", "income");
add("2026-04-10", "IRS tax refund", 864, "checking", "income");

// ---------- fixed monthly bills ----------

for (const day of days) {
  const m = month(day);
  const n = Number(m.slice(5));
  if (dom(day) === 1) {
    add(day, "Hob's Bay Property Mgmt (rent)", -1650, "checking", "rent");
    add(day, "Transfer to wedding fund", -300, "checking", "transfer");
    add(day, "Metropolis Animal Rescue", -25, "visa", "charity");
  }
  if (dom(day) === 2) add(day, "ClassPass", -49, "visa", "subscriptions");
  if (dom(day) === 3) add(day, "Lemonade renters insurance", -14, "visa", "insurance");
  if (dom(day) === 5) add(day, "Spotify", -11.99, "visa", "subscriptions");
  if (dom(day) === 8) add(day, "RxMail (birth control)", -15, "visa", "health");
  if (dom(day) === 10) add(day, "Metro Pharmacy (inhaler)", -35, "debit", "health");
  if (dom(day) === 12) add(day, "Netflix", -15.49, "visa", "subscriptions");
  if (dom(day) === 15) {
    // Her half of the electric bill: highest with summer AC and winter heat
    const half = { 12: 52, 1: 58, 2: 55, 3: 41, 4: 33, 5: 36, 6: 54, 7: 63, 8: 61, 9: 44, 10: 35, 11: 39 }[n];
    add(day, "Metropolis Power & Light", -between(half - 4, half + 4), "visa", "utilities");
  }
  if (dom(day) === 16) add(day, "Krypto's Pet Supply (cat food autoship)", -48.5, "visa", "pets");
  if (dom(day) === 18) add(day, "iCloud+", -2.99, "visa", "subscriptions");
  if (dom(day) === 20) add(day, "Fiberlink Internet", -40, "visa", "utilities");
  if (dom(day) === 22) add(day, "Signal Wireless", -45, "visa", "utilities");
  if (dom(day) === 25) add(day, "Federal Student Aid", -235, "checking", "loans");
  // The forgotten subscription: started in March, never used
  if (dom(day) === 14 && day >= "2026-03-14") add(day, "Duolingo Super", -12.99, "visa", "subscriptions");
}

// ---------- everyday spending ----------

// Restaurants were up a bit in September, then noticeably down in October
// (with SEED 34: about 29% lower; the Home insight reads the real number)
const restaurantMood = { "2026-09": 1.1, "2026-10": 0.85 };

for (const day of days) {
  const w = dow(day);
  const m = month(day);
  const mood = restaurantMood[m] ?? 1;
  const weekday = w >= 1 && w <= 5;
  const summer = day.slice(5) >= "04-15" && day.slice(5) <= "10-31";

  // Coffee before work, lunch near the office
  if (weekday && chance(0.5 * mood)) add(day, "Planet Perk", -between(4.5, 6.75), "debit", "restaurants");
  if (weekday && chance(0.3 * mood)) add(day, pick(["Siegel & Shuster Deli", "Daily Planet Café", "Centennial Salad Co."]), -between(11, 17), "debit", "restaurants");
  // Groceries once a week, plus the farmers market on summer Saturdays
  if (w === 0) add(day, "Metro Fresh Market", -between(48, 96), "visa", "groceries");
  if (w === 6 && summer && chance(0.6)) add(day, "Centennial Park Farmers Market", -between(14, 32), "debit", "groceries");
  if (w === 3 && chance(0.25)) add(day, "Hob's Bay Co-op", -between(12, 28), "visa", "groceries");
  // Dinners out and takeout, more on weekends
  if ((w === 5 || w === 6) && chance(0.55 * mood)) add(day, pick(["Big Belly Burger", "Bibbo's Ace o' Clubs (dinner)", "Suicide Slum Noodle Bar", "Little Bohemia Pizza"]), -between(24, 58), "visa", "restaurants");
  if (weekday && chance(0.12 * mood)) add(day, "DoorDash", -between(22, 41), "visa", "restaurants");
  // Going out
  if ((w === 4 || w === 5 || w === 6) && chance(0.22)) add(day, "Bibbo's Ace o' Clubs", -between(21, 54), "visa", "fun");
  if (chance(0.025)) add(day, pick(["Metropolis Arena", "Centennial Park Cinema", "Hob's Bay Comedy Club"]), -between(18, 115), "mc", "fun");
  // Getting around without a car
  if (dom(day) % 10 === 4) add(day, "Metropolis Metro (card reload)", -40, "debit", "transit");
  if (chance(0.09)) add(day, "Uber", -between(12, 31), "mc", "transit");
  // Shopping
  if (chance(0.08)) add(day, "Amazon", -between(14, 62), "visa", "shopping");
  if (chance(0.035)) add(day, "Target", -between(22, 78), "visa", "shopping");
  if (chance(0.015)) add(day, pick(["Galaxy Mall", "Metropolis Outfitters"]), -between(38, 120), "mc", "shopping");
  // Friends paying her back for dinners
  if (chance(0.03)) add(day, pick(["Venmo from Jimmy O.", "Venmo from Chloe S.", "Venmo from Ron T."]), between(18, 46), "checking", "income");
}

// ---------- once-in-a-while ----------

add("2026-04-01", "Metropolis Bikeshare (annual)", -95, "visa", "transit");
add("2026-02-09", "Amazon Prime (annual)", -139, "visa", "subscriptions");
add("2026-01-14", "Metro Pharmacy (albuterol)", -18, "debit", "health");
add("2026-06-11", "Metro Pharmacy (albuterol)", -18, "debit", "health");
add("2026-03-19", "Metropolis General Clinic (copay)", -40, "visa", "health");
add("2026-09-23", "Metropolis General Clinic (copay)", -40, "visa", "health");
add("2026-05-06", "Hob's River Animal Hospital (annual checkup)", -186, "visa", "pets");

// Holidays: December gifts
for (const [day, who, amt] of [
  ["2025-12-03", "Galaxy Mall", -84], ["2025-12-07", "Amazon", -62.4], ["2025-12-11", "Etsy", -38.5],
  ["2025-12-14", "Metropolis Books", -46.2], ["2025-12-18", "Amazon", -71.15], ["2025-12-20", "Target", -54.9],
]) add(day, `${who} (gift)`, amt, "visa", "gifts");
add("2026-03-27", "Metropolis Books (gift for Mom)", -32, "visa", "gifts");
add("2026-08-12", "Etsy (gift)", -45, "visa", "gifts");

// Engaged: wedding things she paid for herself (the venue comes out of the joint fund)
add("2026-02-21", "Centennial Park Pavilion (engagement party deposit)", -400, "visa", "wedding");
add("2026-03-08", "Lens & Light Studio (engagement photos)", -200, "visa", "wedding");
add("2026-09-12", "Bridal Row Boutique (dress deposit)", -250, "mc", "wedding");

// A friend's wedding in Smallville in July
add("2026-05-14", "SkyLine Air (flights to Smallville)", -286.4, "mc", "travel");
add("2026-07-17", "Smallville Inn (2 nights)", -342, "mc", "travel");
add("2026-07-18", "Kent Farm Stand", -22.5, "debit", "travel");
add("2026-07-18", "Smallville Diner", -31.75, "mc", "travel");
add("2026-07-15", "Amazon (wedding gift)", -110, "visa", "gifts");

// The jewelry side business: just supplies so far
add("2026-08-03", "Beadworks Metropolis", -64.2, "visa", "business");
add("2026-08-21", "Etsy (jewelry supplies)", -38, "visa", "business");
add("2026-09-15", "Michaels", -27.6, "visa", "business");
add("2026-10-09", "Beadworks Metropolis", -51.35, "visa", "business");

// Halloween party week: a little over her usual
add("2026-10-29", "Party City", -42.5, "visa", "fun");
add("2026-10-31", "Bibbo's Ace o' Clubs", -68.4, "visa", "fun");

// A return, and two charges she hasn't categorized yet
add("2026-10-03", "Amazon (refund)", 34.99, "visa", "shopping");
add("2026-09-30", "PAYPAL *JK8823", -42, "visa", "other");
add("2026-10-18", "SQ *MKT STALL 22", -18, "debit", "other");

// ---------- paying off the credit cards ----------

// Each card is paid in full on the 26th for the previous month's charges
for (const card of ["visa", "mc"]) {
  for (const day of days.filter((x) => dom(x) === 26)) {
    const prev = d(day);
    prev.setUTCMonth(prev.getUTCMonth() - 1);
    const owed = -txns
      .filter((t) => t.account === card && month(t.date) === month(iso(prev)))
      .reduce((sum, t) => sum + t.amount, 0);
    if (owed > 0) {
      const name = card === "visa" ? "Planet Rewards Visa" : "Skyline Mastercard";
      add(day, `Payment to ${name}`, -Math.round(owed * 100) / 100, "checking", "transfer");
    }
  }
}

// ---------- balances (as of "today") ----------

const total = (acct) => txns.filter((t) => t.account === acct || (acct === "checking" && t.account === "debit")).reduce((s2, t) => s2 + t.amount, 0);
const round = (n) => Math.round(n * 100) / 100;
const savingsIn = -txns.filter((t) => t.merchant === "Transfer to savings").reduce((s2, t) => s2 + t.amount, 0);
const weddingIn = -txns.filter((t) => t.merchant === "Transfer to wedding fund").reduce((s2, t) => s2 + t.amount, 0);
const balances = {
  checking: round(2650 + total("checking")),
  visa: round(-txns.filter((t) => t.account === "visa" && t.date >= "2026-10-01").reduce((s2, t) => s2 + t.amount, 0) * -1),
  mc: round(-txns.filter((t) => t.account === "mc" && t.date >= "2026-10-01").reduce((s2, t) => s2 + t.amount, 0) * -1),
  savings: round(3100 + savingsIn),
  wedding: round(2400 + weddingIn * 2), // Clark puts in the same amount
  retirement: 18450.32,
  loan: -12040.18,
};
for (const a of accounts) if (a.id in balances) a.balance = balances[a.id];

// ---------- her existing budget (Google Sheets) ----------

// Kept since Mint shut down, in her own words. Ready for an "import your
// budget" flow: each of her rows maps to Moneta's categories.
const importedBudget = {
  source: "Google Sheets",
  name: "Lois budget 2026 (FINAL final)",
  rows: [
    { name: "Rent + bills", monthly: 2050, mapsTo: ["rent", "utilities", "insurance"] },
    { name: "Loans :(", monthly: 235, mapsTo: ["loans"] },
    { name: "Food & fun", monthly: 650, mapsTo: ["groceries", "restaurants", "fun"] },
    { name: "Getting around", monthly: 140, mapsTo: ["transit"] },
    { name: "Kitty", monthly: 60, mapsTo: ["pets"] },
    { name: "Self care", monthly: 120, mapsTo: ["health", "subscriptions"] },
    { name: "Wedding $$$", monthly: 300, mapsTo: ["wedding"] },
    { name: "Jewelry biz", monthly: 50, mapsTo: ["business"] },
    { name: "Everything else", monthly: 200, mapsTo: ["shopping", "gifts", "charity", "travel", "other"] },
  ],
};

// ---------- write ----------

txns.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
txns.forEach((t, i) => (t.id = `t${String(txns.length - i).padStart(4, "0")}`));

const out = {
  note: "Made-up demo data for the Moneta prototype. Generated by scripts/generate-demo-data.mjs; edit that, not this.",
  today: TODAY,
  user: { name: "Lois Lane", firstName: "Lois", initials: "LL" },
  accounts,
  importedBudget,
  transactions: txns.map(({ id, date, merchant, amount, account, category }) => ({ id, date, merchant, amount, account, category })),
};
writeFileSync(new URL("../src/demo-data.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log(`${txns.length} transactions, ${START} to ${TODAY}`);
