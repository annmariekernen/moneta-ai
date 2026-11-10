// "Bring in my budget": where her budget lives now. First, a photo or
// screenshot that Moneta reads; then (or) Upload a file and Google Drive.
// Everything here is a MOCK of what iOS / Google would show, drawn inside the
// phone. Nothing real opens (no file picker, camera or Google sign-in), and
// nothing leaves the visitor's device. Every path ends with Lois's own 9 rows
// in the editor, where she checks how each row maps to Moneta's categories.
// How the real versions behave on iOS:
// - Files sheet: no permission needed; the app only gets the file she picks.
// - Google Drive: Google's own sign-in, then she approves access, then picks.
// - Camera: iOS asks for camera access the first time.
// - Photo picker (iOS 14+): no permission needed; the app only gets the
//   photo she picks.
// Copy marked PLACEHOLDER is for Ann Marie to reword.
import { useEffect, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, FileSpreadsheet, FileText, FolderOpen, Image, Upload, type LucideIcon } from "lucide-react";
import goose from "../assets/goose-glasses-circle.svg";
import { DemoNote } from "../components/DemoNote";
import { OrDivider } from "../components/OrDivider";
import { importedBudget } from "../data";

// How she brought it in, so the editor can say where the rows came from
export type ImportVia = { kind: "file" | "drive" | "photo"; name: string };

const files = [
  { name: "Lois budget 2026.xlsx", meta: "Oct 2 · 18 KB", icon: FileSpreadsheet },
  { name: "Lois budget 2026.csv", meta: "Oct 2 · 2 KB", icon: FileText },
  { name: "Wedding guest list.numbers", meta: "Sep 14 · 96 KB", icon: FileSpreadsheet },
  { name: "Lease renewal.pdf", meta: "Aug 30 · 1.2 MB", icon: FileText },
];

// The camera permission is remembered until reload, like iOS remembers it
let cameraAllowed = false;

type Step =
  | { at: "pick"; note?: string }
  | { at: "files" }
  | { at: "drive-consent" }
  | { at: "drive-files" }
  | { at: "camera-ask" }
  | { at: "camera" }
  | { at: "photos" }
  | { at: "reading"; via: ImportVia; photo?: boolean; text: string };

export function BudgetImport({ onDone, onClose }: { onDone: (via: ImportVia) => void; onClose: () => void }) {
  const [step, setStep] = useState<Step>({ at: "pick" });

  // The pretend read: a short pause (a little longer for a photo), then the editor
  useEffect(() => {
    if (step.at !== "reading") return;
    const timer = setTimeout(() => onDone(step.via), READING_MS);
    return () => clearTimeout(timer);
  }, [step, onDone]);

  const back = () => setStep({ at: "pick" });
  const openCamera = () => setStep({ at: cameraAllowed ? "camera" : "camera-ask" });

  return (
    <div className="filters-page absolute inset-0 z-10 flex flex-col bg-page" role="dialog" aria-label="Bring in my budget">
      <div className="flex items-center px-4 pt-2 pb-2">
        <button className="grid size-9 place-items-center rounded-control text-fg-2 hover:bg-subtle" onClick={onClose} aria-label="Back">
          <ChevronLeft size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {step.at === "reading" ? (
          <Reading text={step.text} />
        ) : (
          <>
            <h2 className="text-title font-medium">Bring in my budget</h2>
            <DemoNote id="budget-import" className="mt-2">these are pretend screens and Lois’s files. Nothing real opens or gets uploaded.</DemoNote>

            {/* First: a photo or screenshot, read by Moneta */}
            <div className="mt-4 rounded-card border border-accent/25 bg-accent-soft p-4">
              <div className="flex items-center gap-3">
                <img src={goose} alt="" className="size-10 shrink-0" />
                <div>
                  <p className="text-label font-medium">Budget on paper, or in a screenshot?</p>
                  <p className="mt-0.5 text-label text-fg-2">Snap a photo and Moneta will read it for you.</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <TipButton icon={Camera} onClick={openCamera}>Take a photo</TipButton>
                <TipButton icon={Image} onClick={() => setStep({ at: "photos" })}>Upload image</TipButton>
              </div>
            </div>

            <OrDivider />

            {/* PLACEHOLDER copy */}
            <div className="grid grid-cols-2 gap-3">
              <SourceCard icon={Upload} title="Upload a file" body="Excel, Numbers or CSV" onClick={() => setStep({ at: "files" })} />
              <SourceCard icon={FolderOpen} mark={<DriveMark size={22} />} title="Google Drive" body="Sign in and choose a sheet" onClick={() => setStep({ at: "drive-consent" })} />
            </div>
            {step.at === "pick" && step.note && <p className="mt-3 text-caption text-fg-3">{step.note}</p>}
          </>
        )}
      </div>

      {/* ---------- Mock system screens, over the cards ---------- */}

      {/* iOS Files sheet */}
      {step.at === "files" && (
        <MockSheet title="Recents" onCancel={back}>
          <div className="divide-y divide-[#e5e5ea]">
            {files.map((f, i) => (
              <button
                key={f.name}
                className="flex w-full items-center gap-3 py-2.5 text-left disabled:opacity-40"
                disabled={i > 1}
                onClick={() => setStep({ at: "reading", via: { kind: "file", name: f.name }, photo: true, text: `Moneta is reading “${f.name}”…` })}
              >
                <span className={`grid size-10 place-items-center rounded-[8px] ${f.icon === FileSpreadsheet ? "bg-[#e3f3e6] text-[#1f8a3b]" : "bg-[#e8eefc] text-[#2f5bea]"}`}>
                  <f.icon size={20} strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-black">{f.name}</span>
                  <span className="block text-[12px] text-[#8e8e93]">{f.meta}</span>
                </span>
              </button>
            ))}
          </div>
        </MockSheet>
      )}

      {/* Google Drive: asking for access (the real one is Google's own screen) */}
      {step.at === "drive-consent" && (
        <MockScrim>
          <div className="w-full rounded-card bg-surface p-5 shadow-float">
            <div className="flex items-center justify-center gap-3">
              <img src={goose} alt="" className="size-10" />
              <span className="text-fg-4">↔</span>
              <span className="grid size-10 place-items-center rounded-full border border-line bg-white"><DriveMark size={22} /></span>
            </div>
            <p className="mt-4 text-center text-headline font-medium">Connect Google Drive</p>
            <p className="mt-1 text-center text-label text-fg-2">Moneta can only see the sheet you pick, and can’t change or delete anything.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button className="h-10 rounded-control border border-line text-label font-medium hover:bg-subtle" onClick={back}>Cancel</button>
              <button className="h-10 rounded-control bg-accent text-label font-medium text-white hover:bg-accent-hover" onClick={() => setStep({ at: "drive-files" })}>Continue</button>
            </div>
          </div>
        </MockScrim>
      )}

      {/* Google Drive: pick a sheet */}
      {step.at === "drive-files" && (
        <MockSheet title="Choose a sheet" onCancel={back}>
          <button
            className="flex w-full items-center gap-3 py-2.5 text-left"
            onClick={() => setStep({ at: "reading", via: { kind: "drive", name: importedBudget.name }, photo: true, text: `Moneta is reading “${importedBudget.name}”…` })}
          >
            <span className="grid size-10 place-items-center rounded-[8px] bg-[#e3f3e6] text-[#1f8a3b]"><FileSpreadsheet size={20} strokeWidth={1.75} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] text-black">{importedBudget.name}</span>
              <span className="block text-[12px] text-[#8e8e93]">Google Sheets · edited Oct 28</span>
            </span>
            <ChevronRight size={16} className="text-[#c7c7cc]" />
          </button>
        </MockSheet>
      )}

      {/* iOS camera permission alert */}
      {step.at === "camera-ask" && (
        <MockScrim>
          <div role="alertdialog" className="w-[270px] overflow-hidden rounded-[14px] bg-[#f2f2f7]/95 text-center backdrop-blur">
            <div className="px-4 pt-4 pb-3.5">
              <p className="text-[17px] font-semibold leading-[22px] text-black">“Moneta” Would Like to Access the Camera</p>
              {/* PLACEHOLDER copy (the app writes this line) */}
              <p className="mt-1 text-[13px] leading-[17px] text-black">So you can take a photo of your budget for Moneta to read.</p>
            </div>
            <div className="grid grid-cols-2 border-t border-[#c6c6c8]">
              <button
                className="h-11 border-r border-[#c6c6c8] text-[17px] text-[#007aff]"
                onClick={() => setStep({ at: "pick", note: "Camera access is off. You can turn it on in Settings, or upload an image instead." })}
              >
                Don’t Allow
              </button>
              <button className="h-11 text-[17px] font-semibold text-[#007aff]" onClick={() => { cameraAllowed = true; setStep({ at: "camera" }); }}>
                Allow
              </button>
            </div>
          </div>
        </MockScrim>
      )}

      {/* Camera viewfinder */}
      {step.at === "camera" && (
        <div className="absolute inset-0 z-30 flex flex-col bg-black">
          <div className="flex justify-start px-4 pt-3">
            <button className="text-[17px] text-white" onClick={back}>Cancel</button>
          </div>
          <div className="grid flex-1 place-items-center bg-[radial-gradient(circle_at_50%_45%,#5b5146,#1c1a17_70%)]">
            <PretendPaper />
          </div>
          <div className="grid place-items-center gap-3 py-6">
            <p className="text-[15px] text-white">Snap a photo to continue</p>
            <button
              className="grid size-[68px] place-items-center rounded-full border-4 border-white"
              aria-label="Take photo"
              onClick={() => setStep({ at: "reading", via: { kind: "photo", name: "your photo" }, photo: true, text: "Moneta is reading your budget…" })}
            >
              <span className="size-[54px] rounded-full bg-white active:scale-95" />
            </button>
          </div>
        </div>
      )}

      {/* iOS photo picker (no permission needed) */}
      {step.at === "photos" && (
        <MockSheet title="Photos" onCancel={back}>
          <div className="grid grid-cols-3 gap-0.5">
            <button
              className="relative aspect-square overflow-hidden bg-[#f6f7f9]"
              aria-label="Screenshot of a budget"
              onClick={() => setStep({ at: "reading", via: { kind: "photo", name: "your screenshot" }, photo: true, text: "Moneta is reading your screenshot…" })}
            >
              <span className="absolute inset-1.5 flex flex-col gap-[3px] rounded-[3px] bg-white p-1.5">
                <span className="h-1 w-8 rounded-full bg-[#1f8a3b]" />
                {Array.from({ length: 7 }, (_, i) => <span key={i} className="h-[3px] rounded-full bg-[#d0d5dd]" />)}
              </span>
            </button>
            {["#c9b8a6", "#8fb3c9", "#d8c7a0", "#a6b89a", "#c99a9a", "#9aa6c9", "#b8b0c9", "#cbbf9e"].map((c) => (
              <span key={c} className="aspect-square opacity-60" style={{ background: `linear-gradient(135deg, ${c}, #f2f2f7)` }} aria-hidden="true" />
            ))}
          </div>
          <p className="mt-2 text-center text-[12px] text-[#8e8e93]">Moneta only sees the photo you choose.</p>
        </MockSheet>
      )}
    </div>
  );
}

function SourceCard({ icon: Icon, mark, title, body, onClick }: { icon: LucideIcon; mark?: React.ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <button className="flex flex-col items-start gap-3 rounded-card border border-line bg-surface p-4 text-left shadow-card hover:border-line-strong" onClick={onClick}>
      <span className={`grid size-10 place-items-center rounded-control ${mark ? "border border-line bg-white" : "bg-accent-soft text-accent"}`}>
        {mark ?? <Icon size={20} strokeWidth={1.75} />}
      </span>
      <span>
        <span className="block text-label font-medium">{title}</span>
        <span className="mt-0.5 block text-caption text-fg-3">{body}</span>
      </span>
    </button>
  );
}

function TipButton({ icon: Icon, onClick, children }: { icon: LucideIcon; onClick: () => void; children: string }) {
  return (
    <button className="flex h-9 items-center justify-center gap-1.5 rounded-control bg-surface text-label font-medium text-accent hover:bg-white/70" onClick={onClick}>
      <Icon size={15} /> {children}
    </button>
  );
}

// A dimmed layer for mock alerts and consent screens
function MockScrim({ children }: { children: React.ReactNode }) {
  // Centered, like real iOS alerts
  return (
    <div className="absolute inset-0 z-30 grid grid-rows-[1fr_auto_1fr] justify-items-center bg-black/30 p-6">
      <div className="row-start-2 grid w-full justify-items-center">{children}</div>
    </div>
  );
}

// A mock iOS system screen (Files, Photos): full screen, rises from the
// bottom, Cancel top left
function MockSheet({ title, onCancel, children }: { title: string; onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col">
      <div className="mock-sheet flex-1 overflow-y-auto bg-white px-4 pb-8">
        <div className="sticky top-0 grid grid-cols-[1fr_auto_1fr] items-center bg-white py-3">
          <button className="justify-self-start text-[17px] text-[#007aff]" onClick={onCancel}>Cancel</button>
          <p className="text-[17px] font-semibold text-black">{title}</p>
          <span />
        </div>
        {children}
      </div>
    </div>
  );
}

// How long the "Moneta is reading" moment lasts, for every way to start a budget
export const READING_MS = 3600;

// The "Moneta is reading" moment: the blank page, scan line and goose, with a
// line of copy under it. Used by every way to start a budget.
export function Reading({ text }: { text: string }) {
  return (
    <div className="grid place-items-center gap-10 pt-10 text-center">
      <PretendPaper scanning />
      <p className="text-label text-fg-2">{text}</p>
    </div>
  );
}

// The pretend budget on paper. In the camera it shows her handwritten rows.
// While Moneta reads it: a blank lined page, a scan line moving over it, and
// the goose in reading glasses at the corner.
function PretendPaper({ scanning = false }: { scanning?: boolean }) {
  // The camera's view: her handwritten budget, with real text
  if (!scanning)
    return (
      <div className="relative w-56 -rotate-2 overflow-hidden bg-[#fffdf6] px-4 py-3 text-left shadow-float" aria-hidden="true">
        <p className="mb-1.5 text-label font-medium italic text-fg-2">Here’s my “budget”</p>
        {importedBudget.rows.map((r) => (
          <p key={r.name} className="flex justify-between border-b border-[#dfe6f3] py-[3px] text-caption italic text-fg-2">
            <span>{r.name}</span>
            <span>{r.monthly}</span>
          </p>
        ))}
      </div>
    );
  // While Moneta reads it: a blank lined page, the scan line, the goose
  return (
    <div className="relative" aria-hidden="true">
      <div className="relative h-64 w-48 -rotate-2 overflow-hidden rounded-[6px] bg-[#fffdf6] px-4 pt-5 shadow-float">
        <span className="mb-4 block h-1.5 w-16 rounded-full bg-[#c9d3e6]" />
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} className="block border-b border-[#dfe6f3] pt-[17px]" />
        ))}
        <span className="absolute inset-y-0 left-3 border-l border-[#f3c9c9]" />
        <span className="scan-line" />
      </div>
      <img src={goose} alt="" className="absolute -right-7 -bottom-5 size-16 drop-shadow-md" />
    </div>
  );
}

// Google Drive's mark (the three-color triangle), for the pretend Drive steps
function DriveMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size * (78 / 87.3)} viewBox="0 0 87.3 78" aria-hidden="true">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
    </svg>
  );
}
