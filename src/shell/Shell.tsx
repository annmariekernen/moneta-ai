// The prototype's shell around the screens: the phone's status bar, the
// bottom nav, and the "Live prototype" badge, pop-up and side card.
import { ArrowLeft, ChartPie, Github, House, PiggyBank, RotateCcw, Wallet, X, type LucideIcon } from "lucide-react";

import statusCell from "../assets/status-cell.svg";
import statusWifi from "../assets/status-wifi.svg";
import statusBattery from "../assets/status-battery.svg";
import { MonetaButton } from "../components/MonetaButton";
import { Button } from "../components/Button";
import { resetDemo, startFrom } from "../store";
import type { Tab } from "../routes";

/* ---------- Live prototype badge, pop-up and side card ---------- */

export function LiveBadge({ onClick }: { onClick?: () => void }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      className="inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-2 text-caption font-medium text-fg"
    >
      <span className="size-1.5 rounded-full bg-positive shadow-[0_0_0_3px_var(--color-positive-soft)]" aria-hidden="true" />
      Live prototype
    </Tag>
  );
}

// Demo starting points (also as links: ?start=budget, ?start=done), on the
// side card and in the phone's pop-up
function DemoStarts() {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-caption text-fg-3">Jump to a point in the prototype</p>
        <button className="flex shrink-0 items-center gap-1 text-caption font-medium text-fg-3 hover:text-fg" onClick={resetDemo}>
          <RotateCcw size={12} aria-hidden="true" /> Reset
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Button size="sm" className="w-full whitespace-nowrap" onClick={() => startFrom("budget")}>Build a budget</Button>
        <Button size="sm" className="w-full whitespace-nowrap" onClick={() => startFrom("done")}>Fully set up</Button>
      </div>
    </div>
  );
}

// Opened from the "Live prototype" badge in the home header (shown when the
// About card isn't on screen: phones, narrower windows, the portfolio embed).
export function LiveNotice({ onClose }: { onClose: () => void }) {
  return (
    <>
    {/* A tap anywhere outside the pop-up closes it (clear, not dimmed) */}
    <div className="absolute inset-0 z-[79]" onClick={onClose} aria-hidden="true" />
    <div className="live-notice flex flex-col gap-2 rounded-card border border-line bg-surface p-3.5 pr-10 shadow-float" role="status">
      <LiveBadge />
      <p className="text-label text-fg-2">
        Moneta’s AI chat is hooked up to the Claude API, so its replies are written live in response to your questions. All account data is fictional for demo purposes.
      </p>
      <div className="border-t border-line pt-2.5">
        <DemoStarts />
      </div>
      <button className="absolute top-2 right-2 grid size-7 place-items-center rounded-[8px] text-fg-3 hover:bg-subtle hover:text-fg" onClick={onClose} aria-label="Close">
        <X size={16} />
      </button>
    </div>
    </>
  );
}

// A small card to the right of the phone (the two centered as a group),
// shown whenever both fit, saying this is a real, working prototype.
// Ann Marie's portfolio (the case study this prototype belongs to)
const PORTFOLIO_URL = "https://annmariekernen.com";

export function AboutCard() {
  return (
    <aside className="about-card flex-col gap-2.5 rounded-card border border-line bg-surface/90 p-4.5 shadow-float backdrop-blur" aria-label="About this prototype">
      <LiveBadge />
      <h2 className="text-headline font-medium">This is a working prototype</h2>
      <p className="text-label text-fg-2">
        Moneta’s AI chat is hooked up to the Claude API, so its replies are written live in response to your questions. All account data is fictional for demo purposes.
      </p>
      <div className="border-t border-line pt-2.5">
        <DemoStarts />
      </div>
      {/* Back to the case study, and the code */}
      <div className="flex items-center justify-between gap-2 border-t border-line pt-2.5 text-label font-medium">
        <a className="flex items-center gap-1 whitespace-nowrap text-fg no-underline hover:text-accent" href={PORTFOLIO_URL}>
          <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
          Back to portfolio
        </a>
        <a className="flex items-center gap-1.5 whitespace-nowrap text-fg no-underline hover:text-accent" href="https://github.com/annmariekernen/moneta-ai" target="_blank" rel="noopener">
          <Github size={14} strokeWidth={1.75} aria-hidden="true" />
          View on GitHub <span aria-hidden="true">↗</span>
        </a>
      </div>
    </aside>
  );
}

/* ---------- Phone chrome ---------- */

export function StatusBar() {
  return (
    <div className="status-bar">
      <span className="status-time">9:41</span>
      <span className="status-island" />
      <span className="status-levels">
        <img src={statusCell} width={19.2} height={12.2264} alt="" />
        <img src={statusWifi} width={17.1417} height={12.3283} alt="" />
        <img src={statusBattery} width={27.328} height={13} alt="" />
      </span>
    </div>
  );
}

// Tabs not built yet stay disabled (they're listed in READY in App.tsx)
export function LowerNav({ tab, ready, onTab, onMoneta }: { tab: Tab; ready: Tab[]; onTab: (t: Tab) => void; onMoneta: () => void }) {
  const go = (t: Tab) => (ready.includes(t) ? () => onTab(t) : undefined);
  return (
    <nav className="lower-nav flex items-start justify-around border-t border-line bg-surface px-2 pt-2.5">
      <NavTab icon={House} label="Home" active={tab === "home"} onClick={go("home")} />
      <NavTab icon={PiggyBank} label="Accounts" active={tab === "accounts"} onClick={go("accounts")} />
      <NavTab icon={Wallet} label="Budget" active={tab === "budget"} onClick={go("budget")} />
      <NavTab icon={ChartPie} label="Insights" active={tab === "insights"} onClick={go("insights")} />
      {/* Last slot: easy to reach with a right thumb, and there on every
          screen, so Moneta can be asked from anywhere in the app */}
      <MonetaButton onClick={onMoneta} />
    </nav>
  );
}

// A bottom-nav tab. Same shape as the Moneta tab (a 32px-tall icon slot, then
// the label) so every icon and label lines up. No onClick = not built yet.
function NavTab({ icon: Icon, label, active = false, onClick }: { icon: LucideIcon; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      title={onClick ? undefined : "Not part of this prototype"}
      className={`flex w-16 flex-col items-center gap-1 text-caption font-medium ${active ? "text-accent" : "text-fg-3"} ${onClick && !active ? "hover:text-fg" : ""}`}
    >
      <span className="grid h-8 w-14 place-items-center">
        <Icon size={22} strokeWidth={1.75} />
      </span>
      {label}
    </button>
  );
}
