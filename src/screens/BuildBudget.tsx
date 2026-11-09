// Build my budget: a full-screen flow over the whole app (lower nav too).
// Two ways in, both from the Budget tab:
// - Build my budget: sort your spending (into the common categories), or skip.
// - Use my existing budget: bring in her sheet, then sort into her rows.
// Either way it ends the same: Moneta's goose loader, then the draft is saved
// (Moneta picks the categories her spending uses and sets amounts from her
// last 6 months, or takes the sheet's) and she's back on the Budget tab, where
// the nav goose offers help. Changing the draft isn't part of this flow: it's
// mostly done with Moneta, or by hand on each category's page.
// Sorting: one merchant per screen, Moneta's recommendation preselected, the
// likely runner-ups, "Not sure / it depends / skip". After each set of 10,
// "First draft done" shows on the next question with View draft.
// The logic lives in src/build.ts. Copy marked PLACEHOLDER is for Ann Marie
// to reword.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, Lock, Plus, X } from "lucide-react";
import goose from "../assets/goose-glasses-circle.svg";
import { Button } from "../components/Button";
import { ConfirmDialog } from "../components/Dialog";
import { Expand, ExpandChevron } from "../components/Expand";
import { MonetaNote } from "../components/MonetaNote";
import { Typing } from "../components/Typing";
import {
  BUDGET_CATEGORIES, cat, categories, hueClasses,
  type CategoryId, type CustomCategory, type KindId, type Rules,
} from "../categories";
import { draftAmounts, fromSheet, kindsFor, popularCategories, questions, SET_SIZE, suggestedCategories, type Question } from "../build";
import { edit, useEdits } from "../store";
import { NewCategory } from "./CategoryEditor";
import { newCategoryId } from "../budgetActions";
import { BudgetImport, READING_MS, Reading, type ImportVia } from "./BudgetImport";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const shortDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

type Step = "import" | "intro" | "teach";
type SheetBudget = { custom: CustomCategory[]; categories: CategoryId[]; kinds: Partial<Record<KindId, CategoryId>>; amounts: Record<string, number> };
export type BuildMode = "moneta" | "sheet";
type Answer = CategoryId | "varies";

export function BuildBudget({ mode, onClose, onDone }: { mode: BuildMode; onClose: () => void; onDone: () => void }) {
  const phone = document.querySelector(".phone");
  const page = <Flow mode={mode} onClose={onClose} onDone={onDone} />;
  return phone ? createPortal(page, phone) : page;
}

function Flow({ mode, onClose: close, onDone: done }: { mode: BuildMode; onClose: () => void; onDone: () => void }) {
  // Leaving: the flow slides away and the lower nav slides back up (it's
  // tucked away while the flow is open)
  const [leavingNow, setLeavingNow] = useState(false);
  useEffect(() => {
    const phone = document.querySelector(".phone");
    phone?.classList.add("flow-open");
    return () => phone?.classList.remove("flow-open");
  }, []);
  const exit = (then: () => void) => {
    setLeavingNow(true);
    document.querySelector(".phone")?.classList.remove("flow-open");
    setTimeout(then, 420);
  };
  const onClose = () => exit(close);
  const onDone = () => exit(done);
  const e = useEdits();
  const [step, setStep] = useState<Step>(mode === "sheet" ? "import" : "intro");
  const [leaving, setLeaving] = useState(false);
  // A moment of loading between steps: a quick spinner before the first
  // question, Moneta's reading goose when she skips straight to a budget
  const [loading, setLoading] = useState<null | { kind: "spinner" | "goose"; then: () => void }>(null);
  const [introSeen, setIntroSeen] = useState(false); // back on the intro: no typing again
  const [sheet, setSheet] = useState<(SheetBudget & { via: ImportVia }) | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [at, setAt] = useState(0); // which question (= how many answered)
  const [list, setList] = useState<Question[]>(() => (mode === "moneta" ? questions({ merchants: {}, moves: {}, kinds: {} }) : []));
  const [looks, setLooks] = useState<Looks>({}); // renamed, restyled or new
  const [extra, setExtra] = useState<CategoryId[]>([]); // new categories she made while sorting

  // Where she sorts into: the common list, or her sheet's rows
  const sortInto = [...(sheet ? sheet.categories : BUDGET_CATEGORIES), ...extra];
  const answered = useMemo(() => {
    const merchants: Record<string, CategoryId> = {};
    for (const [m, c] of Object.entries(answers)) if (c !== "varies") merchants[m] = c;
    return merchants;
  }, [answers]);

  // The end of the flow, sorted or skipped: Moneta picks the categories her
  // spending uses, drafts the amounts (or takes her sheet's), saves it all,
  // and she's back on the Budget tab with the draft. Changing it is up to her
  // (by hand, or with Moneta), not part of this flow.
  const finish = () => {
    const merchants: Record<string, CategoryId> = { ...e.rules.merchants, ...answered };
    for (const [m, c] of Object.entries(answers)) if (c === "varies") delete merchants[m];
    const picked = [...new Set([...(sheet ? sheet.categories : suggestedCategories({ merchants, moves: {}, kinds: {} })), ...extra])];
    for (const [m, c] of Object.entries(merchants)) if (!picked.includes(c)) delete merchants[m];
    const rules: Rules = { merchants, moves: e.rules.moves, kinds: sheet ? sheet.kinds : kindsFor(picked) };
    edit((x) => ({
      ...x,
      categories: picked,
      custom: [...(sheet ? sheet.custom : []), ...Object.values(looks).filter((c) => picked.includes(c.id))],
      rules,
      amounts: { ...(sheet ? sheet.amounts : draftAmounts(picked, rules)) },
      review: [],
      removed: [],
      budgetSource: sheet ? "import" : "moneta",
      nudge: "first-draft",
    }));
    onDone();
  };
  // Skipping straight to a budget gets the goose (Moneta's doing the work);
  // viewing the draft after sorting is just a quick spinner
  const toBudget = (kind: "goose" | "spinner") => setLoading({ kind, then: finish });

  // PLACEHOLDER copy
  const titles: Record<Step, string> = { import: "", intro: "Budget with Moneta", teach: "Budget with Moneta" };
  // Progress counts up across sets: 1 of 10 ... 10 of 10, then 11 of 20
  // (with "First draft done" on top), 21 of 30...
  const shown = at; // the question on screen
  const number = shown + 1;
  const outOf = Math.min(Math.ceil(number / SET_SIZE) * SET_SIZE, list.length);
  const sorting = step === "teach" && shown < list.length;

  return (
    <div className={`flow-page filters-page flex flex-col bg-surface ${leavingNow ? "is-leaving" : ""}`} role="dialog" aria-label="Build my budget">
      {step === "import" ? (
        <BudgetImport
          onDone={(via) => {
            const s = fromSheet();
            setSheet({ ...s, via });
            setList(questions({ merchants: {}, moves: {}, kinds: s.kinds }));
            setStep("intro");
          }}
          onClose={onClose}
        />
      ) : (
        <>
          {/* Title, and X to leave (after a warning) */}
          <div className="px-4 pt-2 pb-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-title font-medium">{titles[step]}</h2>
              <button className="-mr-2 grid size-9 place-items-center rounded-control text-fg-2 hover:bg-subtle" onClick={() => (step === "intro" && Object.keys(answers).length === 0 ? onClose() : setLeaving(true))} aria-label="Leave">
                <X size={20} />
              </button>
            </div>
            {sorting && (
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuemin={0} aria-valuemax={outOf} aria-valuenow={number}>
                  <span className="block h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(number / outOf) * 100}%` }} />
                </div>
                <span className="tabular shrink-0 text-caption text-fg-3">{number} of {outOf}</span>
              </div>
            )}
          </div>

          {loading && <Loading kind={loading.kind} onDone={() => { loading.then(); setLoading(null); }} />}
          {!loading && step === "intro" && (
            <Intro
              sheetName={sheet?.via.name}
              onBack={sheet ? () => setStep("import") : undefined}
              animate={!introSeen}
              onStart={() => { setIntroSeen(true); setLoading({ kind: "spinner", then: () => { setAt(0); setStep("teach"); } }); }}
              onSkip={() => { setIntroSeen(true); toBudget("goose"); }}
            />
          )}
          {!loading && step === "teach" && (
            shown < list.length ? (
              <Ask
                key={list[shown].merchant}
                q={list[shown]}
                cats={sortInto}
                looks={looks}
                onCreate={(c) => { setLooks((l) => ({ ...l, [c.id]: c })); setExtra((x) => [...x, c.id]); }}
                previous={answers[list[shown].merchant]}
                firstDraftDone={at > 0 && at % SET_SIZE === 0}
                onView={() => toBudget("spinner")}
                onBack={() => (at === 0 ? setStep("intro") : setAt(at - 1))}
                onNext={(a) => { setAnswers((x) => ({ ...x, [list[shown].merchant]: a })); setAt(at + 1); }}
              />
            ) : (
              <AllSorted count={list.length} onBack={() => setAt(list.length - 1)} onView={() => toBudget("spinner")} />
            )
          )}
        </>
      )}

      {leaving && (
        <ConfirmDialog
          // PLACEHOLDER copy
          title="Leave your budget?"
          body="Your answers so far won’t be saved. You can start again anytime."
          confirmLabel="Leave"
          onConfirm={onClose}
          onCancel={() => setLeaving(false)}
        />
      )}
    </div>
  );
}

// The moment between steps. Spinner: a beat before the first question.
// Goose: Moneta "reading" her spending before the budget (the same goose as
// bringing in a sheet).
function Loading({ kind, onDone }: { kind: "spinner" | "goose"; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, kind === "spinner" ? 700 : READING_MS);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return kind === "spinner" ? (
    <div className="grid flex-1 place-items-center" role="status" aria-label="Loading">
      <Loader2 size={28} className="animate-spin text-accent" aria-hidden="true" />
    </div>
  ) : (
    <div className="flex-1 px-4" role="status">
      {/* PLACEHOLDER copy */}
      <Reading text="Moneta is building your budget from your last 6 months…" />
    </div>
  );
}

// A category as she's set it in this flow (renamed / restyled / new), or as it is
type Looks = Record<string, CustomCategory>;
const showOf = (looks: Looks, c: CategoryId) => {
  const l = looks[c];
  return l ? { label: l.label, Icon: categories[l.look].icon, hue: l.hue } : { label: cat(c).label, Icon: cat(c).icon, hue: cat(c).hue };
};


// The bottom bar: Back on the left, the step's main action on the right,
// kept clear of the bottom edge
function Footer({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <div className="flow-footer border-t border-line bg-surface px-4 pt-3">
      <div className={onBack ? "grid grid-cols-2 gap-2" : ""}>
        {onBack && <Button className="w-full" onClick={onBack}>Back</Button>}
        {children}
      </div>
    </div>
  );
}

/* ---------- 1. Sort your spending ---------- */

function Intro({ sheetName, animate, onBack, onStart, onSkip }: { sheetName?: string; animate: boolean; onBack?: () => void; onStart: () => void; onSkip: () => void }) {
  // The first time: Moneta's note slides in and types, then its buttons.
  // Back here later: everything's already there.
  const [typed, setTyped] = useState(!animate);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  // A tap anywhere outside Moneta's note skips the typing (not announced)
  const [skip, setSkip] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const skipOnTap = (ev: React.PointerEvent) => {
    if (!typed && !noteRef.current?.contains(ev.target as Node)) setSkip(true);
  };
  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pb-6" onPointerDown={skipOnTap}>
        <div ref={noteRef}>
        <MonetaNote
          className={`${animate ? "slide-in" : ""} mt-2`}
          action={typed && (
            // The two ways forward, once Moneta has finished "typing"
            <div className={`${animate ? "slide-in [animation-duration:0.8s]" : ""} flex flex-col gap-2`}>
              <Button variant="primary" className="w-full" onClick={onStart}>Answer your questions first</Button>
              <Button className="w-full" onClick={onSkip}>Just make me a budget</Button>
            </div>
          )}
        >
          <Typing
            paragraphs={[
              { text: "Hi! I'm here to help build a budget that’s right for you.", className: "text-headline font-medium", ms: 18 },
              { text: "I learn your habits over time to give you smarter, personalized insights.", ms: 9 },
              { text: "To get started, I can ask a few questions about your recent transactions - or we can jump straight to your first budget.", ms: 9 },
              { text: "Which would you prefer?", ms: 9 },
            ]}
            instant={!animate || skip}
            onDone={() => setTyped(true)}
          />
        </MonetaNote>
        </div>
        {sheetName && (
          // PLACEHOLDER copy
          <p className="mt-3 px-4 text-body text-fg-2">Your rows from {sheetName} are in. Each answer puts a place you shop in the right row.</p>
        )}
      </div>
      {/* Privacy notice: pinned just above the bottom bar */}
      <div className="px-4 pb-3" onPointerDown={skipOnTap}>
        {/* Privacy notice (the lock is the Lucide icon, no emoji in the UI) */}
        <div className="rounded-card border border-line bg-subtle px-4 py-1">
          {/* Collapsed to start; tap to read */}
          <button className="flex w-full items-center gap-2 py-2.5 text-left text-body font-medium text-fg" onClick={() => setPrivacyOpen((o) => !o)} aria-expanded={privacyOpen}>
            <Lock size={15} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
            <span className="flex-1">We take your privacy seriously</span>
            <ExpandChevron open={privacyOpen} />
          </button>
          <Expand open={privacyOpen}>
            <p className="pb-3 text-label text-fg-2">Your answers are strictly used to customize your experience. We never share or sell your personal financial data.</p>
          </Expand>
        </div>
      </div>
      <div className="flow-footer border-t border-line bg-surface px-4 pt-3" onPointerDown={skipOnTap}>
        {onBack && <Button variant="ghost" size="sm" className="mb-2 w-full" onClick={onBack}>Back</Button>}
        <p className="text-[11px] leading-4 text-fg-3">
          Moneta is an AI tool designed to assist with data analysis, not a certified financial advisor. Insights provided are for informational purposes only and should not be taken as professional financial advice.{" "}
          {/* A pretend link: there are no terms in the prototype */}
          <a href="#" onClick={(ev) => ev.preventDefault()} className="text-fg-2 underline">Terms & Conditions</a> apply.
        </p>
      </div>
    </>
  );
}

// One merchant. Moneta's recommendation first, then the rest of her
// categories, then "It varies". Nothing selected until she picks.
function Ask({ q, cats, looks, onCreate, previous, firstDraftDone, onView, onBack, onNext }: {
  q: Question;
  cats: CategoryId[];
  looks: Looks;
  onCreate: (c: CustomCategory) => void;
  previous?: Answer;
  firstDraftDone: boolean;
  onView: () => void;
  onBack: () => void;
  onNext: (a: Answer) => void;
}) {
  const recommended = cats.includes(q.suggested) ? q.suggested : null;
  // Moneta's recommendation starts selected, so she can tap through
  const [picked, setPicked] = useState<Answer | undefined>(previous ?? recommended ?? undefined);
  const [creating, setCreating] = useState<CustomCategory | null>(null);
  const [showCharges, setShowCharges] = useState(false);
  const [showAll, setShowAll] = useState(false);
  // Tap again to deselect
  const toggle = (a: Answer) => setPicked((p) => (p === a ? undefined : a));
  // The likely runner-ups first (where this merchant's other charges land,
  // then her biggest categories), then everything else behind "View more"
  const rest = [...new Set([...q.options, ...popularCategories, ...cats])].filter((c) => c !== recommended && cats.includes(c));
  const RUNNER_UPS = 4;
  const visible = showAll ? rest : rest.filter((c, i) => i < RUNNER_UPS || c === picked);
  // A new category with the same name as one she has picks that one instead
  const create = (v: CustomCategory) => {
    const same = cats.find((c) => showOf(looks, c).label.toLowerCase() === v.label.toLowerCase());
    if (same) setPicked(same);
    else { onCreate(v); setPicked(v.id); }
    setCreating(null);
  };
  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {firstDraftDone && (
          <MonetaNote
            className="pop-in mb-4"
            action={<Button size="sm" variant="primary" onClick={onView}>View draft</Button>}
          >
            {/* PLACEHOLDER copy, except "First draft done" */}
            <strong>First draft done.</strong> View your draft now, or keep going for a more accurate budget.
          </MonetaNote>
        )}

        {/* Moneta asking: the goose beside the question */}
        <div className="flex items-center gap-2.5">
          <img src={goose} alt="" className="size-7 shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="text-headline font-medium">How would you categorize this expense?</h3>
            <p className="mt-1 text-label text-fg-2">Just go with your gut - we can always change it later!</p>
          </div>
        </div>

        <section className="mt-4 rounded-card border border-line bg-surface px-4 pt-4 pb-2 shadow-card">
          <h3 className="text-headline font-medium">{q.merchant}</h3>
          <p className="tabular mt-0.5 text-caption text-fg-3">{q.count} charge{q.count === 1 ? "" : "s"} · {usd(q.total)} in all</p>
          {/* Recent charges: collapsed to start */}
          <button className="mt-2 flex w-full items-center gap-1.5 py-1.5 text-left text-label font-medium text-fg-2" onClick={() => setShowCharges((o) => !o)} aria-expanded={showCharges}>
            <ExpandChevron open={showCharges} />
            {/* PLACEHOLDER copy */}
            Recent charges
          </button>
          <Expand open={showCharges}>
            <div className="divide-y divide-line pb-1">
              {q.examples.map((t) => (
                <div key={t.id} className="flex items-baseline justify-between gap-3 py-2 text-label">
                  <span className="min-w-0 truncate">{t.merchant}</span>
                  <span className="tabular shrink-0 text-fg-2">{shortDate(t.date)} · ${(-t.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Expand>
        </section>

        {recommended && (
          <>
            {/* PLACEHOLDER copy */}
            <p className="mt-4 mb-2 text-caption font-medium text-fg-3">Recommended by Moneta</p>
            <Choice id={recommended} looks={looks} recommended on={picked === recommended} onClick={() => toggle(recommended)} />
          </>
        )}

        {/* PLACEHOLDER copy */}
        <p className="mt-4 mb-2 text-caption font-medium text-fg-3">{recommended ? "Or set category as" : "Set category as"}</p>
        <div className="flex flex-wrap gap-1.5">
          {visible.map((c) => <Choice key={c} id={c} looks={looks} on={picked === c} onClick={() => toggle(c)} />)}
          {/* Add category only once the full list is showing (or there's no more to show) */}
          {(showAll || rest.length <= RUNNER_UPS) && (
            // PLACEHOLDER copy
            <button
              onClick={() => setCreating({ id: newCategoryId(), label: "", look: "misc", hue: "slate" })}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3.5 text-label text-fg-2 hover:bg-subtle hover:text-fg"
            >
              <Plus size={14} aria-hidden="true" /> Add category
            </button>
          )}
          {rest.length > RUNNER_UPS && (
            // PLACEHOLDER copy
            <button onClick={() => setShowAll((a) => !a)} className="inline-flex h-9 items-center px-2 text-label font-medium text-accent hover:underline">
              {showAll ? "View less" : "View more"}
            </button>
          )}
        </div>

        {/* Not sure: a checkbox, the other way to answer (clears any chip) */}
        <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-label">
          <input type="checkbox" checked={picked === "varies"} onChange={() => toggle("varies")} className="size-4.5 accent-accent" />
          Not sure / it depends / skip
        </label>
        {/* PLACEHOLDER copy */}
        <p className="mt-1 ml-7 text-caption text-fg-3">We can come back to these later.</p>
      </div>

      {/* A new category, picked for this merchant once saved */}
      <NewCategory key={creating?.id ?? "none"} value={creating} onClose={() => setCreating(null)} onSave={(v) => create(v)} />
      <Footer onBack={onBack}>
        <Button variant="primary" className="w-full" disabled={picked === undefined} onClick={() => picked !== undefined && onNext(picked)}>Next</Button>
      </Footer>
    </>
  );
}

// A category to pick: one at a time, filled with a check when selected.
// The recommended one gets a soft accent glow and a slightly darker border
// (not selected). Tap a selected one again to deselect it.
function Choice({ id, looks, on, recommended = false, onClick }: { id: CategoryId; looks: Looks; on: boolean; recommended?: boolean; onClick: () => void }) {
  const c = showOf(looks, id);
  const Icon = on ? Check : c.Icon;
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-label transition-colors duration-150 active:scale-[0.97] ${
        on ? "border-fg bg-fg text-white" : recommended ? "border-line-strong bg-surface text-fg ring-4 ring-accent-soft hover:bg-subtle" : "border-line bg-surface text-fg hover:bg-subtle"
      }`}
    >
      <Icon size={14} strokeWidth={on ? 2.5 : 1.75} className={on ? "" : hueClasses[c.hue].fg} aria-hidden="true" />
      {c.label}
    </button>
  );
}

// After the very last merchant
function AllSorted({ count, onBack, onView }: { count: number; onBack: () => void; onView: () => void }) {
  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* PLACEHOLDER copy */}
        <MonetaNote>That’s everything: {count} places sorted. Your budget is as accurate as it gets.</MonetaNote>
      </div>
      <Footer onBack={onBack}>
        <Button variant="primary" className="w-full" onClick={onView}>View draft</Button>
      </Footer>
    </>
  );
}
