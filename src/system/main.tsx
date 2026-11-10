// The design system page (/system.html): every token and core component, live,
// so UI decisions are made once here and reused everywhere.
import { StrictMode, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Plus, SlidersHorizontal } from "lucide-react";
import "../styles/tokens.css";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CategoryIcon } from "../components/CategoryIcon";
import { CategoryPill } from "../components/CategoryPill";
import { Chip } from "../components/Chip";
import { ChatInput } from "../components/ChatInput";
import { MonetaMessage, UserMessage } from "../components/ChatMessage";
import { MonetaNote } from "../components/MonetaNote";
import { Typing } from "../components/Typing";
import { ActionCard } from "../components/ActionCard";
import { MonetaButton } from "../components/MonetaButton";
import { Tabs } from "../components/Tabs";
import { SubtleTabs } from "../components/SubtleTabs";
import { TransactionRow } from "../components/TransactionRow";
import { Wordmark } from "../components/Wordmark";
import { AccountIcon } from "../components/AccountIcon";
import { BudgetBar } from "../components/BudgetBar";
import { ConfirmDialog } from "../components/Dialog";
import { DemoNote } from "../components/DemoNote";
import { MonthStepper } from "../components/MonthStepper";
import { OrDivider } from "../components/OrDivider";
import { Switch } from "../components/Switch";
import { cat, categories, type CategoryId } from "../categories";

const colors: { group: string; tokens: [string, string][] }[] = [
  { group: "Neutrals", tokens: [["page", "#fafbfc"], ["surface", "#ffffff"], ["subtle", "#f1f3f6"], ["line", "#e4e7ec"], ["line-strong", "#d0d5dd"], ["fg", "#101828"], ["fg-2", "#475467"], ["fg-3", "#667085"], ["fg-4", "#98a2b3"]] },
  { group: "Accent", tokens: [["accent", "#2f5bea"], ["accent-hover", "#2449c7"], ["accent-soft", "#eef2fe"]] },
  { group: "Meaning", tokens: [["positive", "#067647"], ["positive-soft", "#ecfdf3"], ["negative", "#b42318"], ["negative-soft", "#fef3f2"], ["warning", "#b54708"], ["warning-soft", "#fffaeb"]] },
];

const type: [string, string, string][] = [
  ["display", "text-display font-medium", "$1,284.50"],
  ["title", "text-title font-medium", "Budget overview"],
  ["headline", "text-headline font-medium", "Recent transactions"],
  ["body", "text-body", "You’ve spent $304.77 on groceries since June 1."],
  ["label", "text-label font-medium", "Trader Joe’s"],
  ["caption", "text-caption text-fg-3", "Card 1234 · June 7"],
];

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-10">
      <h2 className="text-title font-medium text-fg">{title}</h2>
      {note && <p className="mt-1 max-w-[60ch] text-label text-fg-3">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-caption font-medium text-fg-3">{children}</div>;
}

function System() {
  const [tab, setTab] = useState<"out" | "in">("out");
  const [subtle, setSubtle] = useState<"all" | "income" | "expenses">("all");
  const [on, setOn] = useState(true);
  const [month, setMonth] = useState(1);
  return (
    <div className="min-h-full bg-page font-sans text-fg antialiased">
      <div className="mx-auto max-w-[920px] px-6 pt-14 pb-24">
        <header className="pb-8">
          <p className="text-label font-medium text-accent">Moneta</p>
          <h1 className="mt-1 text-display font-medium">Design system</h1>
          <p className="mt-2 max-w-[60ch] text-body text-fg-2">
            Quiet fintech: cool neutrals carry the UI, one blue accent marks what’s interactive, almost no shadows,
            Inter for UI text. Every value lives in <code className="text-label">src/styles/tokens.css</code>.
          </p>
        </header>

        <Section title="Color">
          <div className="grid gap-8">
            {colors.map((g) => (
              <div key={g.group}>
                <Label>{g.group}</Label>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {g.tokens.map(([name, hex]) => (
                    <div key={name} className="overflow-hidden rounded-control border border-line bg-surface">
                      <div className="h-14 border-b border-line" style={{ background: hex }} />
                      <div className="px-2.5 py-2">
                        <div className="text-caption font-medium text-fg">{name}</div>
                        <div className="text-caption text-fg-3 uppercase">{hex}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <Label>Categories (icon + hue, no emoji)</Label>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(categories) as CategoryId[]).map((id) => (
                  <div key={id} className="flex items-center gap-2 rounded-control border border-line bg-surface py-1.5 pr-3 pl-1.5">
                    <CategoryIcon id={id} size={24} />
                    <span className="text-label">{cat(id).label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="Brand" note="The goose logo with “Moneta” in Zalando Sans (regular weight, -4% letter spacing). Brand moments only, like the chat header or a landing page; never nav labels or UI text.">
          <div className="flex flex-wrap items-end gap-10 rounded-card border border-line bg-surface p-6">
            <Wordmark size="lg" />
            <Wordmark size="md" />
            <Wordmark size="sm" />
          </div>
        </Section>

        <Section title="Type" note="Inter for all UI text. Six sizes; sentence case everywhere (no all-caps labels). Money uses tabular figures.">
          <div className="divide-y divide-line rounded-card border border-line bg-surface">
            {type.map(([name, cls, sample]) => (
              <div key={name} className="flex items-baseline gap-6 px-4 py-3">
                <div className="w-24 shrink-0 text-caption text-fg-3">{name}</div>
                <div className={cls}>{sample}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Shape & depth" note="Shadows only on things that float above the page (the Moneta button, sheets). Everything else is a white surface with a hairline.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="grid h-24 place-items-center rounded-control border border-line bg-surface text-caption text-fg-3">control · 10</div>
            <div className="grid h-24 place-items-center rounded-card border border-line bg-surface text-caption text-fg-3">card · 16</div>
            <div className="grid h-24 place-items-center rounded-card border border-line bg-surface shadow-card text-caption text-fg-3">shadow-card</div>
            <div className="grid h-24 place-items-center rounded-card bg-surface shadow-float text-caption text-fg-3">shadow-float</div>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Create budget</Button>
            <Button>Edit</Button>
            <Button variant="ghost" icon={<SlidersHorizontal size={16} />}>Filters</Button>
            <Button variant="primary" size="sm" icon={<Plus size={14} />}>Add category</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <MonetaButton />
            <span className="text-label text-fg-3">The Moneta tab in the bottom nav: the goose app icon in full color</span>
          </div>
        </Section>

        <Section title="Pills, chips & tabs">
          <Label>Category pills</Label>
          <div className="flex flex-wrap gap-2">
            <CategoryPill id="rent" />
            <CategoryPill id="groceries" />
            <CategoryPill id="restaurants" />
            <CategoryPill id="subscriptions" selected />
          </div>
          <div className="mt-6"><Label>Suggested questions</Label></div>
          <div className="flex max-w-[420px] flex-wrap gap-2">
            <Chip>How much have I spent on groceries this month?</Chip>
            <Chip>Show me my subscriptions</Chip>
          </div>
          <div className="mt-6"><Label>Tabs</Label></div>
          <Tabs options={[{ value: "out", label: "Outgoing" }, { value: "in", label: "Incoming" }]} value={tab} onChange={setTab} />
          <div className="mt-6"><Label>Subtle tabs (filter one list within a page)</Label></div>
          <div className="max-w-[402px]">
            <SubtleTabs options={[{ value: "all", label: "All" }, { value: "income", label: "Income" }, { value: "expenses", label: "Expenses" }]} value={subtle} onChange={setSubtle} />
          </div>
        </Section>

        <Section title="Cards & rows">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Recent transactions" action>
              <div className="divide-y divide-line">
                <TransactionRow category="groceries" merchant="Metro Fresh Market" account="Visa 4422" amount={-72.18} />
                <TransactionRow category="income" merchant="Daily Planet payroll" account="Checking 1234" amount={1962.4} />
                <TransactionRow category="transit" merchant="Metropolis Metro (card reload)" account="Debit 1234" amount={-40} />
                <TransactionRow category="pets" merchant="Krypto’s Pet Supply" account="Visa 4422" amount={-48.5} />
              </div>
            </Card>
            <Card title="Past week’s spending" action>
              <div className="tabular text-display font-medium">$272.15</div>
              <div className="mt-1 text-caption text-fg-3">June 1 – 7</div>
              <div className="mt-4 h-24 rounded-control bg-subtle" />
            </Card>
          </div>
        </Section>

        <Section title="Controls" note="Small shared pieces. Over budget is amber (warning), never error red.">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label>Switch</Label>
              <div className="rounded-card border border-line bg-surface p-3.5">
                <Switch checked={on} onChange={setOn} label="Include in net worth and totals" hint="Turn off to keep it connected but leave it out of your totals." />
              </div>
            </div>
            <div>
              <Label>Month stepper (tap the month for a picker)</Label>
              <MonthStepper months={["2026-11", "2026-10", "2026-09", "2026-08"]} index={month} onChange={setMonth} />
            </div>
            <div>
              <Label>Month picker, compact (Budget tab): short month, flush left</Label>
              <MonthStepper compact months={["2026-11", "2026-10", "2026-09", "2026-08"]} index={month} onChange={setMonth} />
            </div>
            <div>
              <Label>Budget bar: on track, over</Label>
              <BudgetBar spent={198} total={650} />
              <BudgetBar spent={172} total={140} className="mt-3" />
            </div>
            <div>
              <Label>Account icons (dark tile)</Label>
              <div className="flex gap-2">
                <AccountIcon id="bank" /><AccountIcon id="card" /><AccountIcon id="piggy" /><AccountIcon id="ring" /><AccountIcon id="cap" />
              </div>
            </div>
            <div>
              <Label>Demo note (dismissable)</Label>
              <DemoNote id="system">these are pretend screens and Lois’s files. Nothing real opens or gets uploaded.</DemoNote>
            </div>
            <div>
              <Label>Or divider</Label>
              <OrDivider className="my-2" />
            </div>
          </div>
        </Section>

        <Section title="Overlays" note="Quick look or edit: a bottom sheet. Somewhere to explore: a page. A choice that can’t be undone: a confirm dialog with full-width buttons, red when destructive. Edit forms use the same dialog with Cancel / Save.">
          <div className="relative h-56 max-w-[402px] overflow-hidden rounded-card border border-line bg-page">
            <ConfirmDialog title="Delete Food & fun?" body="Its spending will show under Misc until you move it." confirmLabel="Delete" onConfirm={() => {}} onCancel={() => {}} />
          </div>
        </Section>

        <Section title="Chat">
          <div className="max-w-[420px] space-y-4 rounded-card border border-line bg-surface p-4">
            <UserMessage>How much have I spent on groceries this month?</UserMessage>
            <MonetaMessage>
              You’ve spent <strong>$304.77</strong> on groceries this month, mostly at Metro Fresh Market.
            </MonetaMessage>
            <ActionCard lines={["Set Restaurants to $300 a month"]} onApply={() => {}} onUndo={() => {}} />
            <ActionCard lines={["Always put Amazon in Shopping", "Set Shopping to $250 a month"]} status="applied" onApply={() => {}} onUndo={() => {}} />
            <ChatInput />
            <ChatInput defaultValue="What about restaurants?" />
          </div>
        </Section>
        <Section title="Moneta notes" note="Moneta talking inside a screen (not the chat): the goose and its name on top, the message at reading size, an optional action. Compact: one row, for a note she's seen that stays within reach.">
          <div className="max-w-[420px] space-y-3">
            <MonetaNote>
              <Typing paragraphs={[{ text: "Hi! I'm here to help build a budget that’s right for you.", className: "text-headline font-medium" }, { text: "Text can type itself out, like a chat reply (Typing).", ms: 12 }]} />
            </MonetaNote>
            <MonetaNote action={<Button size="sm" variant="primary">View draft</Button>}><strong>Your budget is ready!</strong> View your budget now, or keep going for more accurate results.</MonetaNote>
            <MonetaNote compact action={<Button size="sm" variant="primary">View draft</Button>}><strong>Your budget is ready!</strong></MonetaNote>
          </div>
        </Section>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <System />
  </StrictMode>,
);
