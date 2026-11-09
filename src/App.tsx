// The Moneta AI prototype: the phone frame, the tabs and their screens, and the
// Moneta chat sheet. Built from the design system (src/components,
// src/styles/tokens.css; see /system.html). Screens live in src/screens, the
// shell (status bar, nav, live prototype card) in src/shell, the chat in
// src/chat. The full app outline is in PRD.md.
import { useEffect, useState } from "react";
import { Chat } from "./chat/Chat";
import type { CategoryId } from "./categories";
import type { Transaction } from "./data";
import { AccountDetail } from "./screens/AccountDetail";
import { Accounts } from "./screens/Accounts";
import { Budget } from "./screens/Budget";
import { CategorySheet } from "./screens/CategorySheet";
import { LinkAccount } from "./screens/LinkAccount";
import { Insights } from "./screens/Insights";
import { Home } from "./screens/Home";
import { TransactionSheet } from "./screens/TransactionSheet";
import { Transactions } from "./screens/Transactions";
import { AboutCard, LiveNotice, LowerNav, StatusBar } from "./shell/Shell";
import { MonetaBubble } from "./shell/MonetaBubble";
import type { Sub, Tab } from "./routes";
import { openedAt, getEdits } from "./store";
import { setScreen } from "./screenContext";
import { cat, categoryOf } from "./categories";

// Tabs that are built (the rest are disabled in the nav for now)
const READY: Tab[] = ["home", "insights", "budget", "accounts"];

export default function App() {
  const [tab, setTab] = useState<Tab>(openedAt ? "budget" : "home"); // a demo starting point opens on Budget
  const [sub, setSub] = useState<Sub>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ text: string; n: number }>();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [categoryPick, setCategoryPick] = useState<{ category: CategoryId; month: string } | null>(null);

  // Tell Moneta where she is (sent with each chat message)
  useEffect(() => {
    const names: Record<Tab, string> = { home: "Home", insights: "Insights", budget: "Budget", accounts: "Accounts" };
    setScreen("tab", sub === "transactions" ? "Transaction history" : sub === "account" ? `Accounts, account ${accountId}` : `${names[tab]} tab`);
  }, [tab, sub, accountId]);
  useEffect(() => {
    if (!selected) return setScreen("transaction", null);
    const money = Math.abs(selected.amount).toFixed(2);
    const where = selected.amount < 0 ? `, category ${cat(categoryOf(selected, getEdits().rules)).label}` : " (money in)";
    setScreen("transaction", `looking at a transaction: id ${selected.id}, ${selected.merchant}, ${selected.date}, ${money} dollars${where}`);
  }, [selected]);
  useEffect(() => {
    setScreen("page", categoryPick ? `looking at ${cat(categoryPick.category).label} in ${categoryPick.month}` : null);
  }, [categoryPick]);

  const openTab = (t: Tab) => {
    setTab(t);
    setSub(null);
    setLinking(false);
  };
  // "Ask Moneta about this": open the chat with the question ready to send
  const askMoneta = (text: string) => {
    setSelected(null);
    setCategoryPick(null);
    setPrefill((p) => ({ text, n: (p?.n ?? 0) + 1 }));
    setChatOpen(true);
  };

  return (
    <div className="stage font-sans text-fg antialiased">
      <AboutCard />
      <div className="phone bg-page" aria-label="Moneta AI prototype">
        <StatusBar />
        <div className="screen" key={`${tab}/${sub}`}>
          {sub === "transactions" ? (
            <Transactions onBack={() => setSub(null)} onSelect={setSelected} />
          ) : sub === "account" && accountId ? (
            <AccountDetail id={accountId} onBack={() => setSub(null)} onSelect={setSelected} />
          ) : tab === "home" ? (
            <Home onOpenTransactions={() => setSub("transactions")} onShowNotice={() => setNoticeOpen(true)} onSelect={setSelected} />
          ) : tab === "insights" ? (
            <Insights onAsk={askMoneta} onSelect={setSelected} onCategory={(category, month) => setCategoryPick({ category, month })} />
          ) : tab === "budget" ? (
            <Budget onAsk={askMoneta} />
          ) : tab === "accounts" ? (
            <Accounts onOpen={(id) => { setAccountId(id); setSub("account"); }} onLink={() => setLinking(true)} />
          ) : null}
          {linking && <LinkAccount onClose={() => setLinking(false)} />}
        </div>
        <MonetaBubble hidden={chatOpen} onOpen={() => setChatOpen(true)} />
        <LowerNav tab={tab} ready={READY} onTab={openTab} onMoneta={() => setChatOpen(true)} />
        <CategorySheet pick={categoryPick} onClose={() => setCategoryPick(null)} onAsk={askMoneta} onSelect={setSelected} />
        <TransactionSheet txn={selected} onClose={() => setSelected(null)} onAsk={askMoneta} />
        <Chat open={chatOpen} onMinimize={() => setChatOpen(false)} prefill={prefill} />
        {noticeOpen && <LiveNotice onClose={() => setNoticeOpen(false)} />}
        <div className="home-indicator" />
      </div>
    </div>
  );
}
