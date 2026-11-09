// "Link an account": a pretend flow, clearly labeled as a demo. Pick a
// (fictional) bank, pick the kind of account, a short "connecting" moment,
// and the account appears in Accounts. Nothing real is connected.
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Landmark, X } from "lucide-react";
import { Button } from "../components/Button";
import { DemoNote } from "../components/DemoNote";
import { edit } from "../store";

const banks = ["Metropolis Credit Union", "Kord Financial", "Smallville Savings & Loan", "Gotham Trust", "Star City Bank", "Coast City Federal"];
const kinds = [
  { type: "checking", label: "Checking", name: "Checking", balance: () => 600 + Math.round(Math.random() * 2400) },
  { type: "savings", label: "Savings", name: "Savings", balance: () => 1000 + Math.round(Math.random() * 6000) },
  { type: "retirement", label: "Retirement (IRA)", name: "IRA", balance: () => 2000 + Math.round(Math.random() * 8000) },
  { type: "brokerage", label: "Investments (brokerage)", name: "Investments", balance: () => 500 + Math.round(Math.random() * 4500) },
  { type: "credit", label: "Credit card", name: "Credit card", balance: () => -(50 + Math.round(Math.random() * 800)) },
];

type Step = { at: "bank" } | { at: "kind"; bank: string } | { at: "connecting"; bank: string; kind: (typeof kinds)[number] } | { at: "done"; name: string };

export function LinkAccount({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>({ at: "bank" });

  // The pretend connection: a short pause, then the account is added
  useEffect(() => {
    if (step.at !== "connecting") return;
    const timer = setTimeout(() => {
      const mask = String(1000 + Math.floor(Math.random() * 9000));
      const name = `${step.bank.split(" ")[0]} ${step.kind.name}`;
      edit((e) => ({
        ...e,
        linkedAccounts: [
          ...e.linkedAccounts,
          { id: `linked-${Date.now()}`, name, institution: step.bank, mask, type: step.kind.type, balance: step.kind.balance() },
        ],
      }));
      setStep({ at: "done", name });
    }, 1400);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div className="filters-page absolute inset-0 z-10 flex flex-col bg-page" role="dialog" aria-label="Link an account">
      <div className="flex items-center justify-between px-4 pt-2 pb-2">
        {step.at === "kind" ? (
          <button className="grid size-9 place-items-center rounded-control text-fg-2 hover:bg-subtle" onClick={() => setStep({ at: "bank" })} aria-label="Back">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <span className="size-9" />
        )}
        <button className="grid size-9 place-items-center rounded-control text-fg-2 hover:bg-subtle" onClick={onClose} aria-label="Close">
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <DemoNote id="link-account" className="mb-4">these banks are fictional, and nothing real gets connected.</DemoNote>

        {step.at === "bank" && (
          <>
            <h2 className="text-title font-medium">Link an account</h2>
            <p className="mt-1 mb-4 text-label text-fg-3">Choose your bank.</p>
            <div className="divide-y divide-line rounded-card border border-line bg-surface px-3.5">
              {banks.map((b) => (
                <button key={b} className="flex w-full items-center gap-3 py-3 text-left" onClick={() => setStep({ at: "kind", bank: b })}>
                  <span className="grid size-9 place-items-center rounded-control bg-subtle text-fg-2"><Landmark size={18} /></span>
                  <span className="flex-1 text-label font-medium">{b}</span>
                  <ChevronRight size={16} className="text-fg-4" />
                </button>
              ))}
            </div>
          </>
        )}

        {step.at === "kind" && (
          <>
            <h2 className="text-title font-medium">{step.bank}</h2>
            <p className="mt-1 mb-4 text-label text-fg-3">Which account do you want to add?</p>
            <div className="divide-y divide-line rounded-card border border-line bg-surface px-3.5">
              {kinds.map((k) => (
                <button key={k.type} className="flex w-full items-center justify-between py-3 text-left text-label font-medium" onClick={() => setStep({ at: "connecting", bank: step.bank, kind: k })}>
                  {k.label}
                  <ChevronRight size={16} className="text-fg-4" />
                </button>
              ))}
            </div>
          </>
        )}

        {step.at === "connecting" && (
          <div className="grid place-items-center gap-4 pt-24 text-center">
            <span className="size-10 animate-spin rounded-full border-[3px] border-subtle border-t-accent" aria-hidden="true" />
            <p className="text-label text-fg-2">Connecting to {step.bank}…</p>
          </div>
        )}

        {step.at === "done" && (
          <div className="grid place-items-center gap-3 pt-20 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-positive-soft text-positive"><Check size={24} /></span>
            <p className="text-headline font-medium">{step.name} is linked</p>
            <p className="text-label text-fg-3">It’s in your accounts now, marked “Demo.”</p>
            <Button variant="primary" className="mt-4" onClick={onClose}>Done</Button>
          </div>
        )}
      </div>
    </div>
  );
}
