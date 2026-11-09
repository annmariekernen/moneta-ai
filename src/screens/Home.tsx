// Home (titled "Hi, Lois!"): one headline number (everyday spending this month, with
// bills set aside), and Transaction history: the latest transactions across her
// accounts, with "See all transactions" opening the full Transaction history.
// Moneta's insights live on the Insights tab, not here.
import { ChevronRight } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { TxnList } from "../components/TxnList";
import { homeSummary, latestActivity, user, type Transaction } from "../data";
import { LiveBadge } from "../shell/Shell";

const money = (n: number, cents = true) =>
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`;

export function Home({ onOpenTransactions, onShowNotice, onSelect }: {
  onOpenTransactions: () => void;
  onShowNotice: () => void;
  onSelect: (t: Transaction) => void;
}) {
  const s = homeSummary;
  return (
    <div className="scroll px-4 pt-2">
      <PageHeader
        title={`Hi, ${user.firstName}!`}
        extra={
          <span className="live-badge">
            <LiveBadge onClick={onShowNotice} />
          </span>
        }
      />

      {/* Headline: one number answers "how am I doing?" On a card so it can
          open into settings later (what counts as everyday, which accounts) */}
      <section className="mt-4 rounded-card border border-line bg-surface p-4 shadow-card">
        <p className="text-label text-fg-3">Everyday spending in {s.monthName}</p>
        <p className="tabular mt-1 text-[40px] leading-[46px] font-medium tracking-tight">{money(s.everyday)}</p>
        <p className="mt-1.5 text-label text-fg-3">
          <span className="tabular">{money(s.bills, false)}</span> in bills paid
          {Math.abs(s.vsUsual) >= 10 && (
            <>
              {" · "}
              <span className={s.vsUsual < 0 ? "text-positive" : "text-fg-2"}>
                <span className="tabular">{money(s.vsUsual, false)}</span> {s.vsUsual < 0 ? "less" : "more"} than usual
              </span>
            </>
          )}
        </p>
      </section>

      {/* Transaction history: the latest, then the full history */}
      <section className="mt-8">
        <h2 className="mb-3 text-headline font-medium">Transaction history</h2>
        <TxnList items={latestActivity()} onSelect={onSelect} />
        <button
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-control py-2.5 text-label font-medium text-accent hover:bg-accent-soft"
          onClick={onOpenTransactions}
        >
          See all transactions <ChevronRight size={16} />
        </button>
      </section>
    </div>
  );
}
