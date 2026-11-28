"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Search, FileText, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw,
    ChevronLeft, ChevronRight, Sparkles, X, Loader2, ScanSearch, Scale,
    ListChecks, Users, KeyRound, BadgeCheck, CircleDashed, Quote, Clock3,
    ArrowUpRight, Upload, Plus, FilePlus2, ChevronDown, Trash2,
} from "lucide-react";

import {
    contractService,
    Contract,
    ContractVersion,
    AIContractAnalysisRecord,
    AIContractQuestionResponse,
} from "@/lib/services/contract.service";
import { useContractIndexingStatus } from "@/lib/hooks/useContractIndexingStatus";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Finding = Record<string, unknown>;

type AnalysisData = {
    summary?: string;
    risks?: Finding[];
    clauses?: Finding[];
    obligations?: Finding[];
    keyDetails?: Finding[];
    parties?: Finding[];
    missingInformation?: Finding[];
    reviewRecommendations?: Finding[];
};

type RiskLevel = "High" | "Medium" | "Low" | "None" | "Unknown";
type Tab = "overview" | "risks" | "clauses" | "obligations" | "details" | "parties" | "qa";

interface Item {
    contract: Contract;
    version: ContractVersion | null;
    analysis: AIContractAnalysisRecord | null;
}

interface RunState {
    startedAt: number;
    error?: string;
}

const PAGE_SIZE = 12;
const POLL_MS = 8000;
const EXPECTED_SECONDS = 300;

const STAGES = [
    { at: 0, label: "Reading document", hint: "Extracting text" },
    { at: 25, label: "Finding clauses", hint: "Mapping obligations and terms" },
    { at: 80, label: "Assessing risk", hint: "Scoring each clause" },
    { at: 170, label: "Checking evidence", hint: "Matching to source text" },
    { at: 250, label: "Saving report", hint: "Writing to your workspace" },
];

/* ------------------------------ design tokens ------------------------------ */
/*  ink #000000 · panel #0E0E10 · raised #161618 · rule #26262A · seal #F59E0B  */

const btnPrimary =
    "inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-b from-[#F59E0B] to-[#D97706] px-3.5 py-2 text-sm font-semibold text-[#000000] shadow-[0_6px_20px_-6px_rgba(245,158,11,0.45)] transition hover:from-[#FBBF24] hover:to-[#F59E0B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F59E0B] disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
    "inline-flex items-center justify-center gap-2 rounded-md border border-[#26262A] px-3.5 py-2 text-sm text-neutral-200 transition hover:border-[#3F3F46] hover:bg-[#161618] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F59E0B] disabled:cursor-not-allowed disabled:opacity-50";
const panel = "rounded-xl border border-[#26262A] bg-[#0E0E10] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";
const label = "text-xs font-medium text-neutral-300";

/* ------------------------------- helpers ---------------------------------- */

const str = (v: unknown): string =>
    typeof v === "string" || typeof v === "number" ? String(v) : "";

const pick = (o: unknown, keys: string[]): string => {
    const rec = (o ?? {}) as Record<string, unknown>;
    for (const k of keys) {
        const v = str(rec[k]);
        if (v) return v;
    }
    return "";
};

const unwrap = <T,>(res: unknown): T | null => {
    if (!res) return null;
    const r = res as { data?: unknown };
    return (r.data !== undefined ? r.data : res) as T | null;
};

const sev = (f: Finding) => {
    const s = str(f.severity).toLowerCase();
    return s === "critical" ? "high" : s;
};

const dataOf = (a: AIContractAnalysisRecord | null) =>
    (a?.analysis ?? null) as AnalysisData | null;

function riskCounts(a: AIContractAnalysisRecord | null) {
    const risks = dataOf(a)?.risks ?? [];
    return {
        high: risks.filter((r) => sev(r) === "high").length,
        medium: risks.filter((r) => sev(r) === "medium").length,
        low: risks.filter((r) => sev(r) === "low").length,
        total: risks.length,
    };
}

function riskLevel(a: AIContractAnalysisRecord | null): RiskLevel {
    if (!dataOf(a)) return "Unknown";
    const c = riskCounts(a);
    if (c.high) return "High";
    if (c.medium) return "Medium";
    if (c.low) return "Low";
    return "None";
}

function exposureScore(c: ReturnType<typeof riskCounts>) {
    return c.total
        ? Math.round(((c.high * 3 + c.medium * 2 + c.low) / (c.total * 3)) * 100)
        : 0;
}

function stanceOf(c: ReturnType<typeof riskCounts>) {
    if (c.high >= 1)
        return { title: "Needs lawyer review", note: "High-risk terms found. Resolve these before signing.", tone: "text-rose-300", ring: "#fb7185" };
    if (c.medium >= 1)
        return { title: "Negotiate first", note: "No red flags, but some terms favour the other side.", tone: "text-orange-300", ring: "#fb923c" };
    return { title: "Looks clean", note: "Only minor or no risks flagged. Still read the summary.", tone: "text-emerald-300", ring: "#34d399" };
}

function verification(a: AIContractAnalysisRecord | null) {
    const d = dataOf(a);
    if (!d) return { verified: 0, total: 0 };
    const all = [
        ...(d.risks ?? []),
        ...(d.clauses ?? []),
        ...(d.obligations ?? []),
        ...(d.keyDetails ?? []),
        ...(d.parties ?? []),
    ];
    const withEvidence = all.filter((f) => f.evidenceVerification);
    const verified = withEvidence.filter(
        (f) => (f.evidenceVerification as Finding)?.verified === true
    ).length;
    return { verified, total: withEvidence.length };
}

const riskTone: Record<RiskLevel, string> = {
    High: "text-rose-300",
    Medium: "text-orange-300",
    Low: "text-emerald-300",
    None: "text-emerald-300",
    Unknown: "text-neutral-400",
};

const riskBar: Record<RiskLevel, string> = {
    High: "bg-rose-400",
    Medium: "bg-orange-400",
    Low: "bg-emerald-400",
    None: "bg-emerald-400",
    Unknown: "bg-[#2E2E33]",
};

const riskLabel: Record<RiskLevel, string> = {
    High: "High risk",
    Medium: "Medium risk",
    Low: "Low risk",
    None: "No risks found",
    Unknown: "Not analyzed",
};

const sevBorder: Record<string, string> = {
    high: "border-l-rose-400",
    medium: "border-l-orange-400",
    low: "border-l-emerald-400",
};

const sevText: Record<string, string> = {
    high: "text-rose-300",
    medium: "text-orange-300",
    low: "text-emerald-300",
};

const fmtDate = (v: unknown) => {
    const t = new Date(str(v));
    return isNaN(t.getTime())
        ? ""
        : t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const fmtClock = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const contractTitle = (c: Contract) =>
    pick(c, ["title", "name", "contractName", "fileName"]) || "Untitled contract";

/* ------------------------------- hooks ------------------------------------ */

function useElapsed(startedAt: number) {
    const [s, setS] = useState(Math.floor((Date.now() - startedAt) / 1000));
    useEffect(() => {
        const id = setInterval(
            () => setS(Math.floor((Date.now() - startedAt) / 1000)),
            1000
        );
        return () => clearInterval(id);
    }, [startedAt]);
    return s;
}

function useCountUp(target: number, duration = 700) {
    const [value, setValue] = useState(0);
    const fromRef = useRef(0);

    useEffect(() => {
        const from = fromRef.current;
        if (from === target) return;
        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.round(from + (target - from) * eased));
            if (t < 1) raf = requestAnimationFrame(tick);
            else fromRef.current = target;
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);

    return value;
}

/* ----------------------------- small parts -------------------------------- */

function Styles() {
    return (
        <style>{`
      @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@400;500;600&display=swap");
      .ci-root { font-family: "Manrope", system-ui, -apple-system, "Segoe UI", sans-serif; }
      .ci-serif { font-family: "Sora", "Manrope", system-ui, sans-serif; letter-spacing: -0.015em; }
      .ci-fade { animation: ci-fade .2s ease both }
      @keyframes ci-fade { from { opacity: 0 } to { opacity: 1 } }

      /* scanning line used while an analysis is running */
      .ci-scan { animation: ci-scan 2.2s ease-in-out infinite }
      @keyframes ci-scan { 0% { top: 0; opacity: 0 } 10% { opacity: 1 } 90% { opacity: 1 } 100% { top: calc(100% - 2px); opacity: 0 } }

      /* the one orchestrated moment: contract map reveals left to right */
      .ci-map { animation: ci-map 1.1s cubic-bezier(.65,0,.35,1) both }
      @keyframes ci-map { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }

      /* stage: soft gold light from the top edge plus a faint engineering grid */
      .ci-stage {
        background-image:
          radial-gradient(ellipse 70% 40% at 50% -5%, rgba(245,158,11,.16), transparent 70%),
          linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
        background-size: auto, 48px 48px, 48px 48px;
        background-position: top center, top center, top center;
        background-repeat: no-repeat, repeat-y, repeat-x;
      }
      .ci-stage-fade { mask-image: linear-gradient(#000, transparent 520px); -webkit-mask-image: linear-gradient(#000, transparent 520px); }
      .ci-hairline { position: relative; }
      .ci-hairline::before { content: ""; position: absolute; left: 12%; right: 12%; top: -1px; height: 1px; background: linear-gradient(90deg, transparent, rgba(245,158,11,.8), transparent); }

      @keyframes ci-ping { 0% { transform: scale(1); opacity: .6 } 80%,100% { transform: scale(2.4); opacity: 0 } }
      .ci-ping { animation: ci-ping 2s ease-out infinite }
      @keyframes ci-step { 0%,100% { opacity: 1 } 50% { opacity: .45 } }
      .ci-step-live { animation: ci-step 1.6s ease-in-out infinite }

      @media (prefers-reduced-motion: reduce) {
        .ci-fade, .ci-scan, .ci-map, .ci-ping, .ci-step-live { animation: none !important; }
      }
    `}</style>
    );
}

function RiskMark({ level, withLabel = true }: { level: RiskLevel; withLabel?: boolean }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${riskBar[level]}`} />
            {withLabel && <span className={`text-xs font-medium ${riskTone[level]}`}>{riskLabel[level]}</span>}
        </span>
    );
}

function ScanPanel({ startedAt }: { startedAt: number }) {
    const s = useElapsed(startedAt);
    const pct = Math.min(95, Math.round((1 - Math.exp(-s / (EXPECTED_SECONDS / 2.2))) * 100));
    const stageIdx = STAGES.reduce((acc, st, i) => (s >= st.at ? i : acc), 0);
    const stage = STAGES[stageIdx];

    return (
        <div className="ci-hairline overflow-hidden rounded-xl border border-[#26262A] bg-[#000000]/70">
            <div className="flex items-start gap-4 p-4 sm:p-5">
                <div className="relative h-24 w-[68px] shrink-0 overflow-hidden rounded border border-[#2E2E33] bg-[#161618] p-2">
                    {[70, 100, 85, 100, 60, 90, 75, 95].map((w, i) => (
                        <div key={i} className="mb-1.5 h-0.5 rounded-full bg-[#3F3F46]" style={{ width: `${w}%` }} />
                    ))}
                    <div className="ci-scan absolute inset-x-0 h-[2px] bg-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                        <p className="ci-serif truncate text-base text-white">{stage.label}</p>
                        <p className="shrink-0 text-xs tabular-nums text-neutral-300">{pct}%</p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-neutral-400">{stage.hint}</p>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#26262A]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-neutral-400">
                        <span className="tabular-nums">{fmtClock(s)} elapsed</span>
                        <span>About 5 min. You can leave this page.</span>
                    </div>
                </div>
            </div>
            <ol className="grid grid-cols-1 divide-y divide-[#26262A] border-t border-[#26262A] sm:grid-cols-5 sm:divide-x sm:divide-y-0">
                {STAGES.map((st, i) => {
                    const state = i < stageIdx ? "done" : i === stageIdx ? "live" : "next";
                    return (
                        <li key={st.label} className="flex items-center gap-2 px-3 py-2.5 sm:flex-col sm:items-start sm:gap-1">
                            <span className="flex items-center gap-1.5">
                                {state === "done" ? (
                                    <CheckCircle2 size={13} className="text-emerald-400" />
                                ) : state === "live" ? (
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="ci-ping absolute inset-0 rounded-full bg-[#F59E0B]" />
                                        <span className="relative h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                                    </span>
                                ) : (
                                    <CircleDashed size={13} className="text-neutral-500" />
                                )}
                            </span>
                            <span className={`text-[11px] leading-tight ${state === "live" ? "ci-step-live font-medium text-white" : state === "done" ? "text-neutral-300" : "text-neutral-500"}`}>
                                {st.label}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

/* ------------------------- contract map (signature) ------------------------ */
/*  The contract drawn as one strip, a segment per clause, coloured by the      */
/*  worst risk attached to it. Click a segment to jump to the detail.           */

type Segment = { name: string; ref: string; rank: number };
const RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };
const rankBar = ["bg-[#2E2E33]", "bg-emerald-400/80", "bg-orange-400", "bg-rose-400"];
const rankName = ["No risk", "Low risk", "Medium risk", "High risk"];

function buildSegments(a: AIContractAnalysisRecord | null): Segment[] {
    const d = dataOf(a);
    if (!d) return [];
    const risks = d.risks ?? [];
    const clauses = d.clauses ?? [];

    const worst = (ref: string) =>
        ref ? Math.max(0, ...risks.filter((r) => str(r.clauseReference) === ref).map((r) => RANK[sev(r)] ?? 0)) : 0;

    const segs: Segment[] = clauses.map((c) => {
        const ref = str(c.clauseReference);
        return { name: str(c.title) || ref || "Clause", ref, rank: worst(ref) };
    });

    const known = new Set(segs.map((s) => s.ref).filter(Boolean));
    risks.forEach((r) => {
        const ref = str(r.clauseReference);
        if (clauses.length && ref && known.has(ref)) return;
        segs.push({ name: str(r.title) || ref || "Risk", ref, rank: RANK[sev(r)] ?? 0 });
    });
    return segs;
}

function ContractMap({
    analysis, onPick, size = "md",
}: {
    analysis: AIContractAnalysisRecord | null;
    onPick?: (t: Tab) => void;
    size?: "sm" | "md";
}) {
    const segs = useMemo(() => buildSegments(analysis), [analysis]);
    if (!segs.length) return null;
    const flagged = segs.filter((s) => s.rank > 0).length;

    return (
        <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
                <p className={label}>Contract map</p>
                <p className="text-[11px] text-neutral-400">
                    {segs.length} {segs.length === 1 ? "clause" : "clauses"}, {flagged} flagged
                </p>
            </div>
            <div className={`ci-map flex gap-[3px] ${size === "md" ? "h-9" : "h-6"}`}>
                {segs.map((s, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onPick?.(s.rank > 0 ? "risks" : "clauses")}
                        title={`${s.ref ? `${s.ref}. ` : ""}${s.name}: ${rankName[s.rank]}`}
                        aria-label={`${s.name}: ${rankName[s.rank]}`}
                        className={`min-w-[3px] flex-1 rounded-[2px] transition hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F59E0B] ${rankBar[s.rank]} ${onPick ? "cursor-pointer" : "cursor-default"}`}
                    />
                ))}
            </div>
            {size === "md" && (
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400">
                    {[3, 2, 1, 0].map((r) => (
                        <span key={r} className="inline-flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-[2px] ${rankBar[r]}`} />
                            {rankName[r]}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ---------------------------- stat card ----------------------------------- */

function StatCard({
    label: text, value, icon: Icon, tone = "default",
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    tone?: "default" | "danger" | "success" | "warn";
}) {
    const animated = useCountUp(value);
    const valueTone =
        tone === "danger" ? "text-rose-300"
            : tone === "success" ? "text-emerald-300"
                : tone === "warn" ? "text-[#F59E0B]"
                    : "text-white";
    return (
        <div className={`${panel} p-4`}>
            <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-300">{text}</p>
                <Icon size={14} className="text-neutral-500" />
            </div>
            <p className={`ci-serif mt-2 text-3xl tabular-nums ${valueTone}`}>
                {animated.toLocaleString("en-IN")}
            </p>
        </div>
    );
}

/* --------------------------- upload dialog --------------------------------- */

function UploadDialog({
    open, onClose, onUploaded,
}: {
    open: boolean;
    onClose: () => void;
    onUploaded: (c: Contract) => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [drag, setDrag] = useState(false);

    useEffect(() => {
        if (!open) {
            setFile(null);
            setTitle("");
            setErr("");
            setBusy(false);
            setDrag(false);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, busy, onClose]);

    const pickFile = (f: File | null) => {
        if (!f) return;
        setFile(f);
        if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    };

    const submit = async () => {
        if (!file || !title.trim()) return;
        try {
            setBusy(true);
            setErr("");
            const fd = new FormData();
            fd.append("file", file);
            fd.append("title", title.trim());
            fd.append("contractType", "Custom Contract");
            const created = await contractService.uploadContract(fd);
            onUploaded(created);
            onClose();
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Upload failed.");
        } finally {
            setBusy(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="ci-fade absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !busy && onClose()} />
            <div className="ci-fade relative w-full max-w-md overflow-hidden rounded-xl border border-[#26262A] bg-[#0A0A0B] shadow-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-[#26262A] p-5">
                    <div>
                        <h3 className="ci-serif text-lg text-white">Upload a contract</h3>
                        <p className="mt-0.5 text-xs text-neutral-400">PDF or DOCX, up to 25 MB.</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close"
                        className="rounded-md p-1.5 text-neutral-400 transition hover:bg-[#161618] hover:text-white disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F59E0B] ${drag ? "border-[#F59E0B] bg-[#F59E0B]/5" : "border-[#3F3F46] hover:border-[#55555C]"}`}
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDrag(false);
                            pickFile(e.dataTransfer.files?.[0] ?? null);
                        }}
                    >
                        <FilePlus2 size={22} className="text-neutral-400" />
                        <p className="mt-2 text-sm text-white">
                            {file ? file.name : "Drop a file here, or click to browse"}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-400">
                            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF or DOCX"}
                        </p>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden"
                            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    <label className="block">
                        <span className={label}>Title</span>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Vendor MSA, Acme"
                            className="mt-1.5 w-full rounded-md border border-[#26262A] bg-[#000000] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-[#F59E0B]/70"
                        />
                    </label>

                    {err && (
                        <p className="rounded-md border border-rose-400/30 bg-rose-400/10 p-2.5 text-xs text-rose-300">{err}</p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-[#26262A] p-4">
                    <button onClick={onClose} disabled={busy} className={btnGhost}>Cancel</button>
                    <button onClick={submit} disabled={busy || !file || !title.trim()} className={btnPrimary}>
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {busy ? "Uploading" : "Upload"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* --------------------------- document row --------------------------------- */

function DocumentRow({
    item, selected, run, onSelect,
}: {
    item: Item;
    selected: boolean;
    run?: RunState;
    onSelect: () => void;
}) {
    const level = riskLevel(item.analysis);
    const done = item.analysis?.status === "Completed" && !!dataOf(item.analysis);
    const shown: RiskLevel = done ? level : "Unknown";
    const counterparty = pick(item.contract, ["counterparty", "counterpartyName", "party", "vendor"]);
    const updated = fmtDate(item.analysis?.updatedAt || item.contract.updatedAt);

    return (
        <button
            onClick={onSelect}
            aria-current={selected}
            className={`relative flex w-full items-start gap-3 py-3 pl-4 pr-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#F59E0B] ${selected ? "bg-[#1C1C1F]" : "hover:bg-[#161618]"}`}
        >
            <span className={`absolute inset-y-0 left-0 w-[3px] ${riskBar[shown]}`} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-white">{contractTitle(item.contract)}</p>
                    {run && !run.error && <Loader2 size={11} className="shrink-0 animate-spin text-[#F59E0B]" />}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-neutral-400">
                    {counterparty || "No counterparty"}
                    {updated ? `, ${updated}` : ""}
                </p>
            </div>
            <span className={`mt-0.5 shrink-0 text-[11px] ${riskTone[shown]}`}>
                {done ? riskLabel[level].replace(" risk", "") : ""}
            </span>
        </button>
    );
}

/* ---------------------------- focus panel --------------------------------- */

function FocusPanel({
    item, run, onOpenReport, onAnalyze, onDelete,
}: {
    item: Item | null;
    run?: RunState;
    onOpenReport: (tab?: Tab) => void;
    onAnalyze: () => void;
    onDelete: () => void;
}) {
    if (!item) {
        return (
            <div className={`${panel} flex h-full flex-col items-center justify-center px-6 py-16 text-center`}>
                <ScanSearch size={22} className="text-neutral-500" />
                <p className="mt-3 text-sm font-medium text-neutral-200">Select a contract</p>
                <p className="mt-1 max-w-xs text-xs text-neutral-400">
                    Pick one from the vault, or upload a new file to get started.
                </p>
            </div>
        );
    }

    const level = riskLevel(item.analysis);
    const done = item.analysis?.status === "Completed" && !!dataOf(item.analysis);
    const failed = item.analysis?.status === "Failed";
    const d = dataOf(item.analysis);
    const c = riskCounts(item.analysis);
    const counterparty = pick(item.contract, ["counterparty", "counterpartyName", "party", "vendor"]);
    const updated = fmtDate(item.analysis?.updatedAt || item.contract.updatedAt);
    const running = !!run && !run.error;
    const stance = stanceOf(c);

    const summary = d?.summary ?? "";
    const risks = [...(d?.risks ?? [])].sort(
        (x, y) => (RANK[sev(y)] ?? 0) - (RANK[sev(x)] ?? 0)
    );

    return (
        <div className={`${panel} overflow-hidden`}>
            <div className="border-b border-[#26262A] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <RiskMark level={done ? level : "Unknown"} />
                        <h2 className="ci-serif mt-2 truncate text-2xl text-white">
                            {contractTitle(item.contract)}
                        </h2>
                        <p className="mt-1 truncate text-xs text-neutral-400">
                            {counterparty || "No counterparty"}
                            {updated ? `, updated ${updated}` : ""}
                        </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        {done && !running && (
                            <button onClick={() => onOpenReport()} className={btnPrimary}>
                                Open report <ArrowUpRight size={14} />
                            </button>
                        )}
                        <button
                            onClick={onAnalyze}
                            disabled={running || !item.version}
                            className={done && !running ? btnGhost : btnPrimary}
                        >
                            {running ? (
                                <><Loader2 size={14} className="animate-spin" /> Analyzing</>
                            ) : done ? (
                                <><RefreshCw size={13} /> Run again</>
                            ) : (
                                <><Sparkles size={14} /> Run analysis</>
                            )}
                        </button>
                        <button
                            onClick={onDelete}
                            aria-label="Delete contract"
                            className="inline-flex items-center justify-center rounded-md border border-[#26262A] px-2.5 py-2 text-neutral-400 transition hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F59E0B]"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-5 p-5">
                {!item.version && (
                    <p className="rounded-md border border-[#26262A] bg-[#000000]/60 p-2.5 text-xs text-neutral-300">
                        No uploaded version yet. Upload a file to run analysis.
                    </p>
                )}

                {run && !run.error && <ScanPanel startedAt={run.startedAt} />}

                {run?.error && (
                    <p className="rounded-md border border-rose-400/30 bg-rose-400/10 p-2.5 text-xs text-rose-300">
                        {run.error}
                    </p>
                )}

                {!run && done && (
                    <>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-[#26262A] bg-[#000000]/60 p-4">
                            <div className="min-w-0 flex-1">
                                <p className={label}>Where this stands</p>
                                <p className={`ci-serif mt-1 text-xl ${stance.tone}`}>{stance.title}</p>
                                <p className="mt-0.5 text-xs text-neutral-400">{stance.note}</p>
                            </div>
                            <div className="flex gap-5 text-center">
                                {[
                                    { k: "High", v: c.high, c: "text-rose-300" },
                                    { k: "Medium", v: c.medium, c: "text-orange-300" },
                                    { k: "Low", v: c.low, c: "text-emerald-300" },
                                ].map((x) => (
                                    <div key={x.k}>
                                        <p className={`ci-serif text-3xl tabular-nums ${x.c}`}>{x.v}</p>
                                        <p className="text-[11px] text-neutral-400">{x.k}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <ContractMap analysis={item.analysis} size="sm" onPick={(t) => onOpenReport(t)} />

                        {summary && (
                            <div>
                                <h3 className={label}>Summary</h3>
                                <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-neutral-200">{summary}</p>
                            </div>
                        )}

                        {risks.length > 0 && (
                            <div>
                                <h3 className={label}>Biggest risks</h3>
                                <ul className="mt-2 space-y-2">
                                    {risks.slice(0, 3).map((r, i) => (
                                        <li key={i} className="flex gap-2.5 text-sm text-neutral-200">
                                            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${sev(r) === "high" ? "bg-rose-400" : sev(r) === "medium" ? "bg-orange-400" : "bg-emerald-400"}`} />
                                            <span className="line-clamp-2">{str(r.title) || str(r.explanation)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}

                {!run && !done && !failed && item.version && (
                    <p className="text-sm text-neutral-300">
                        No report yet. Run an analysis to extract clauses, obligations and risks.
                    </p>
                )}

                {!run && failed && (
                    <p className="text-sm text-rose-300">The last run failed. Run it again to retry.</p>
                )}
            </div>
        </div>
    );
}

/* ------------------------------- report ----------------------------------- */

function ExposureRing({ score, color }: { score: number; color: string }) {
    const R = 44;
    const C = 2 * Math.PI * R;
    const off = C * (1 - score / 100);
    return (
        <div className="relative mx-auto h-28 w-28 shrink-0 sm:h-32 sm:w-32">
            <svg viewBox="0 0 100 100" className="-rotate-90" role="img" aria-label={`Exposure ${score} out of 100`}>
                <circle cx="50" cy="50" r={R} fill="none" stroke="#26262A" strokeWidth="5" />
                <circle
                    cx="50" cy="50" r={R}
                    fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={off}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="ci-serif text-3xl tabular-nums text-white">{score}</span>
                <span className="text-[11px] text-neutral-400">exposure</span>
            </div>
        </div>
    );
}

function Evidence({ f }: { f: Finding }) {
    const quote = str(f.evidenceQuote);
    if (!quote) return null;
    const ok = (f.evidenceVerification as Finding | undefined)?.verified === true;
    return (
        <details className="group mt-3">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] text-neutral-400 hover:text-neutral-200">
                <Quote size={11} />
                Source text
                {ok ? (
                    <span className="inline-flex items-center gap-1 text-emerald-300"><BadgeCheck size={11} /> exact match</span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-orange-300"><CircleDashed size={11} /> close match</span>
                )}
            </summary>
            <p className="ci-serif mt-2 border-l-2 border-[#3F3F46] pl-3 text-sm italic leading-relaxed text-neutral-300">
                {quote}
            </p>
        </details>
    );
}


/* Waiting animation is illustrative, not backend progress telemetry. */
function QuestionResearch({ startedAt, onCancel }: { startedAt: number; onCancel: () => void }) {
    const elapsed = useElapsed(startedAt);
    const tips = [
        { title: "Check the original wording", text: "Small words such as ‘may’ and ‘must’ can change your obligations." },
        { title: "Know which version you are reading", text: "An older draft may contain different terms from your signed agreement." },
        { title: "Look beyond the headline price", text: "Payment deadlines, renewal terms and exit fees can matter just as much." },
        { title: "Review the source", text: "When your answer arrives, expand its supporting excerpts to read the original wording." },
    ];
    const tip = tips[Math.floor(Math.max(0, elapsed) / 18) % tips.length];
    return (
        <section className="ci-hairline overflow-hidden rounded-xl border border-[#F59E0B]/25 bg-[#0A0A0B]" aria-label="AI answer in progress">
            <div className="flex items-center gap-4 p-4 sm:p-5">
                <div aria-hidden="true" className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/5">
                    <span className="absolute inset-1 rounded-xl border border-dashed border-[#F59E0B]/50 motion-safe:animate-spin" style={{ animationDuration: "9s" }} />
                    <FileText size={26} className="text-[#FBBF24]" />
                    <span className="ci-scan absolute inset-x-2 h-px bg-[#F59E0B] shadow-[0_0_12px_#F59E0B]" />
                </div>
                <div className="min-w-0 flex-1">
                    <p role="status" className="flex items-center gap-2 text-xs font-medium text-[#FBBF24]"><Loader2 size={12} className="motion-safe:animate-spin" /> Working on your question</p>
                    <h4 className="ci-serif mt-1 text-lg text-white">Your answer is being prepared</h4>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-400">{elapsed >= 300 ? "This is taking longer than usual. You can keep waiting or stop waiting." : elapsed >= 60 ? "Some questions take several minutes. Your request is still pending." : "Please keep this window open while we wait for your answer."}</p>
                </div>
            </div>
            <div className="mx-4 h-1 overflow-hidden rounded-full bg-[#26262A]" aria-hidden="true"><div className="h-full w-full bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent motion-safe:animate-pulse" /></div>
            <div className="mx-4 my-4 rounded-lg border border-[#26262A] bg-[#161618] p-3">
                <p className="flex items-center gap-2 text-xs font-medium text-[#FBBF24]"><Sparkles size={13} /> While you wait · Contract essentials</p>
                <div key={tip.title} className="ci-fade mt-2"><p className="text-sm font-medium text-white">{tip.title}</p><p className="mt-1 text-xs leading-relaxed text-neutral-300">{tip.text}</p></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#26262A] px-4 py-3">
                <span className="flex items-center gap-2 text-xs text-neutral-300"><Clock3 size={14} /> <span className="tabular-nums">{fmtClock(Math.max(0, elapsed))} elapsed</span></span>
                <button type="button" className={btnGhost} onClick={onCancel}>Stop waiting</button>
                <p className="w-full text-[11px] text-neutral-400">Stopping the wait may not stop processing on the server. Live progress is not available yet.</p>
            </div>
        </section>
    );
}

/* Contract indexing readiness — backend-driven, no simulated progress. */
function IndexingReadinessPanel({
    readiness, isLoading, isPolling, isReady, error, refresh, disabled = false,
}: ReturnType<typeof useContractIndexingStatus> & { disabled?: boolean }) {
    const status = readiness?.status;
    const working = isLoading || isPolling || readiness?.shouldPoll === true;
    const failed = status === "Failed" || status === "Dispatch Failed" || status === "Analysis Failed";
    const tone = isReady ? "text-emerald-300" : error || failed ? "text-rose-300" : "text-[#FBBF24]";
    const borderTone = isReady ? "border-emerald-400/25" : error || failed ? "border-rose-400/25" : "border-[#F59E0B]/25";
    const StatusIcon = isReady ? BadgeCheck : error || failed ? AlertTriangle : working ? Loader2 : CircleDashed;
    const title = isReady ? "Contract intelligence ready" : error ? "Unable to verify readiness" : isLoading ? "Checking contract readiness" : failed ? "Contract preparation unsuccessful" : working ? "Preparing contract intelligence" : "Contract intelligence unavailable";
    const total = readiness?.indexing.totalChunks ?? null;
    const indexed = readiness?.indexing.indexedChunks ?? null;
    const analysisCompleted = readiness?.analysis.hasCompletedAnalysis === true;
    return (
        <section aria-label="Contract intelligence readiness" className={`ci-fade overflow-hidden rounded-xl border ${borderTone} bg-[#0A0A0B]`}>
            <div className="flex items-start gap-3 p-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${borderTone} bg-[#161618]`}>
                    <StatusIcon size={23} className={`${tone} ${working && !error && !isReady ? "motion-safe:animate-spin" : ""}`} />
                </div>
                <div className="min-w-0 flex-1" role="status" aria-live="polite">
                    <p className={`text-xs font-medium ${tone}`}>{isReady ? "AI SEARCH AVAILABLE" : "CONTRACT INTELLIGENCE"}</p>
                    <h4 className="ci-serif mt-1 text-base text-white">{title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-400">{error || readiness?.message || "Checking whether your document is ready for AI questions."}</p>
                </div>
            </div>
            {working && !isReady && !error && <div aria-hidden="true" className="mx-4 h-1 overflow-hidden rounded-full bg-[#26262A]"><div className="h-full w-full bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent motion-safe:animate-pulse" /></div>}
            <div className="space-y-3 p-4">
                <div className="flex items-center gap-2.5">
                    {analysisCompleted ? <CheckCircle2 size={15} className="shrink-0 text-emerald-400" /> : <CircleDashed size={15} className="shrink-0 text-neutral-500" />}
                    <span className="flex-1 text-xs text-neutral-200">AI contract analysis</span>
                    <span className="text-[11px] text-neutral-400">{analysisCompleted ? "Completed" : readiness?.analysis.status || (error ? "Unknown" : "Checking")}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    {isReady ? <CheckCircle2 size={15} className="shrink-0 text-emerald-400" /> : failed ? <AlertTriangle size={15} className="shrink-0 text-rose-300" /> : working && !error ? <Loader2 size={15} className="shrink-0 text-[#F59E0B] motion-safe:animate-spin" /> : <CircleDashed size={15} className="shrink-0 text-neutral-500" />}
                    <span className="flex-1 text-xs text-neutral-200">Semantic indexing</span>
                    <span className="text-[11px] text-neutral-400">{isReady ? "Available" : status || (error ? "Unknown" : "Checking")}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    {isReady ? <CheckCircle2 size={15} className="shrink-0 text-emerald-400" /> : <KeyRound size={15} className="shrink-0 text-neutral-500" />}
                    <span className="flex-1 text-xs text-neutral-200">Contract Q&A</span>
                    <span className={`text-[11px] ${isReady ? "text-emerald-300" : "text-neutral-500"}`}>{isReady ? "Unlocked" : "Locked"}</span>
                </div>
            </div>
            {isReady && typeof total === "number" && Number.isFinite(total) && total > 0 && typeof indexed === "number" && Number.isFinite(indexed) && indexed >= 0 && indexed <= total && (
                <div className="mx-4 mb-4 rounded-lg border border-[#26262A] bg-black/60 p-3">
                    <div className="flex items-center justify-between gap-3"><span className="text-xs text-neutral-300">Reported indexed document segments</span><span className="text-xs font-medium tabular-nums text-emerald-300">{indexed}/{total}</span></div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#26262A]"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${indexed / total * 100}%` }} /></div>
                </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#26262A] px-4 py-3">
                <span className="flex items-center gap-1.5 text-[11px] text-neutral-400"><Clock3 size={12} />{isPolling ? "Automatically checking status" : isReady ? "Ready for AI questions" : "Status check available"}</span>
                <button type="button" onClick={refresh} disabled={disabled || isLoading} className={`${btnGhost} !px-2.5 !py-1.5 !text-xs`}><RefreshCw size={12} className={isLoading ? "motion-safe:animate-spin" : ""} /> Check status</button>
                {failed && <p className="w-full text-[11px] leading-relaxed text-neutral-400">Checking status does not restart a failed indexing job. Contact support if preparation remains unsuccessful.</p>}
                {error && isPolling && <p className="w-full text-[11px] text-neutral-400">Another status check will be attempted automatically.</p>}
            </div>
        </section>
    );
}

function ContractQA({ item }: { item?: Item }) {
    const initialContractId = item?.contract._id;
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState<AIContractQuestionResponse | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [startedAt, setStartedAt] = useState(0);
    const request = useRef<AbortController | null>(null);
    useEffect(() => () => request.current?.abort(), []);
    const [contractId, setContractId] = useState(item?.contract._id ?? "");
    const [versionId, setVersionId] = useState("");
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [eligibleVersions, setEligibleVersions] = useState<Record<string, ContractVersion[]>>({});
    const versions = eligibleVersions[contractId] ?? [];
    const [loadingContracts, setLoadingContracts] = useState(true);
    const [listError, setListError] = useState("");
    const [reload, setReload] = useState(0);
    useEffect(() => {
        let active = true;
        setLoadingContracts(true); setListError("");
        void (async () => {
            try {
                const all = new Map<string, Contract>();
                let page = 1;
                while (active) {
                    const result = await contractService.getContracts({ page, limit: PAGE_SIZE });
                    for (const c of result.data) all.set(c._id, c);
                    if (page >= (result.pagination?.totalPages ?? result.pagination?.pages ?? 1) || !result.data.length) break;
                    page++;
                }
                const candidates = [...all.values()];
                const eligible: Record<string, ContractVersion[]> = {};
                let next = 0;
                const worker = async () => {
                    while (active && next < candidates.length) {
                        const c = candidates[next++];
                        const list = await contractService.getContractVersions(c._id);
                        const completed: ContractVersion[] = [];
                        for (const v of list) {
                            if (!active) return;
                            try {
                                const report = await contractService.getContractVersionAnalysis(c._id, v._id);
                                if (report?.status === "Completed" && report.analysis) completed.push(v);
                            } catch {
                                // Fail closed: unavailable reports never unlock questions.
                            }
                        }
                        if (completed.length) eligible[c._id] = completed.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent) || b.versionNumber - a.versionNumber);
                    }
                };
                await Promise.all(Array.from({ length: Math.min(4, candidates.length) }, worker));
                if (active) {
                    setEligibleVersions(eligible);
                    setContracts(candidates.filter(c => eligible[c._id]?.length));
                    const initial = initialContractId && eligible[initialContractId]?.length ? initialContractId : "";
                    setContractId(initial);
                    setVersionId(initial ? eligible[initial][0]._id : "");
                }
            } catch (e) { if (active) setListError(e instanceof Error ? e.message : "Could not load contracts."); }
            finally { if (active) setLoadingContracts(false); }
        })();
        return () => { active = false; };
    }, [reload, initialContractId]);
    const selectedContract = contracts.find(c => c._id === contractId);
    const selectedVersion = versions.find(v => v._id === versionId);
    const hasValidSelection = !loadingContracts && !listError && !!selectedContract && !!selectedVersion;
    const indexingStatus = useContractIndexingStatus({
        contractId: selectedContract?._id ?? null,
        versionId: selectedVersion?._id ?? null,
        enabled: hasValidSelection,
    });
    const ready = hasValidSelection && indexingStatus.isReady && indexingStatus.canAskQuestions;
    const clearAnswer = () => { setAnswer(null); setError(""); };
    const submit = async () => {
        if (request.current || !question.trim() || !ready) return;
        const controller = new AbortController();
        request.current = controller;
        setStartedAt(Date.now()); setBusy(true); setError(""); setAnswer(null);
        try {
            const result = await contractService.askContractQuestion({
                query: question, limit: 8,
                contractId: contractId,
                contractVersionId: versionId,
            }, controller.signal);
            if (!controller.signal.aborted) setAnswer(result);
        } catch (e) {
            if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Unable to answer question.");
        } finally {
            if (request.current === controller) { request.current = null; if (!controller.signal.aborted) setBusy(false); }
        }
    };
    return <div className="space-y-4">
        <div className={`${panel} space-y-3 p-4`}>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white"><Sparkles size={18} className="text-[#F59E0B]" /> Ask AI</h3>
            <p className="text-sm text-neutral-300">Understand your agreements in plain English. Choose what you want to ask about.</p>
            <label className="block text-sm text-neutral-200">Choose a contract
                <select disabled={busy || loadingContracts || !!listError} value={contractId} onChange={e => { setContractId(e.target.value); setVersionId(eligibleVersions[e.target.value]?.[0]?._id ?? ""); clearAnswer(); }} className="mt-1.5 block w-full rounded-md border border-[#26262A] bg-black p-3 text-sm text-white">
                    <option value="">Choose an analysed contract</option>
                    {contracts.map(c => <option key={c._id} value={c._id}>{contractTitle(c)} — {c.contractNumber}</option>)}
                </select>
            </label>
            {loadingContracts && <p role="status" className="text-xs text-neutral-400">Checking which contracts have completed analysis…</p>}
            {listError && <p role="alert" className="text-xs text-rose-300">{listError} <button type="button" disabled={busy} onClick={() => setReload(n => n + 1)} className="underline">Try again</button></p>}
            {!loadingContracts && !listError && !contracts.length && <div className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/5 p-4 text-sm text-neutral-200"><p className="font-semibold text-[#FBBF24]">Analyse a contract to get started</p><p className="mt-2">1. Close Ask AI and choose or upload a contract.</p><p>2. Click Run analysis and wait for the report.</p><p>3. Open Ask AI again and select your analysed contract.</p><button type="button" className={`${btnGhost} mt-3`} onClick={() => setReload(n => n + 1)}>Refresh analysed contracts</button></div>}
            {contractId && <label className="block text-sm text-neutral-200">Choose a version
                <select disabled={busy || loadingContracts || !!listError} value={versionId} onChange={e => { setVersionId(e.target.value); clearAnswer(); }} className="mt-1.5 block w-full rounded-md border border-[#26262A] bg-black p-3 text-sm text-white">

                    {versions.map(v => <option key={v._id} value={v._id}>Version {v.versionNumber} — {v.status}{v.isCurrent ? " (current)" : " (older)"}{fmtDate(v.createdAt) ? ` — ${fmtDate(v.createdAt)}` : ""}</option>)}
                </select>
            </label>}
            <div className="rounded-lg border border-[#26262A] bg-black/60 p-3 text-xs leading-relaxed text-neutral-300">
                <p className="font-medium text-white">{contractId ? selectedContract ? contractTitle(selectedContract) : "Selected contract" : "Choose an analysed contract"}</p>
                <p>{contractId ? selectedVersion ? `Version ${selectedVersion.versionNumber} · ${selectedVersion.status}` : "Choose an available version" : "Select a contract to ask a question."}</p>
                {selectedVersion?.status === "Draft" && <p className="mt-1 text-amber-300">This is a draft, not necessarily a signed agreement.</p>}
                <p className="mt-1">Only completed analyses are listed. Some analysed documents may still need preparation for AI questions.</p>
            </div>
            {hasValidSelection && <IndexingReadinessPanel {...indexingStatus} disabled={busy} />}
            <p className="text-xs font-medium text-neutral-300">Not sure what to ask? Try one of these:</p>
            <div className="flex flex-wrap gap-2">{["How can I end this agreement?", "What am I required to do?", "What should I check before signing?", "Are there any payment deadlines or penalties?"].map(q => <button type="button" key={q} disabled={busy || !ready} className={btnGhost} onClick={() => setQuestion(q)}>{q}</button>)}</div>
            <form onSubmit={e => { e.preventDefault(); void submit(); }} className="space-y-2">
                <textarea aria-label="Contract question" value={question} onChange={e => setQuestion(e.target.value)} disabled={busy || !ready} maxLength={1000} rows={3} placeholder="For example, can I cancel this agreement without paying a penalty?" className="w-full rounded-md border border-[#26262A] bg-black p-3 text-sm text-white outline-none focus:border-[#F59E0B]" />
                <div className="flex items-center justify-between"><span className="text-xs text-neutral-400">{question.length}/1000</span><button type="submit" disabled={busy || !question.trim() || !ready} className={btnPrimary}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}{busy ? "Searching…" : "Ask AI"}</button></div>
            </form>
            {busy && <QuestionResearch startedAt={startedAt} onCancel={() => { request.current?.abort(); request.current = null; setBusy(false); }} />}
            {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        </div>
        {answer && <div className={`${panel} space-y-4 p-4`} aria-live="polite">
            <p className="text-xs text-neutral-400">{answer.question}</p>
            <p className="text-sm font-semibold text-[#FBBF24]">{answer.answerStatus === "supported" ? "Source-backed answer" : answer.answerStatus === "partially_supported" ? "Partially supported" : "Not enough information to answer"}</p>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-200">{answer.answer}</p>
            {answer.retrieval.retrievalStatus !== "completed" && <p className="text-xs text-amber-300">AI could not find usable text. Your document may not be ready for AI search yet.</p>}
            {answer.claims.map(claim => <details key={claim.claimId} className="rounded-md border border-[#26262A] p-3">
                <summary className="cursor-pointer text-sm text-white">{claim.claimType === "inference" ? "Possible interpretation: " : ""}{claim.statement}</summary>
                {claim.evidence.map((ev, i) => <div key={`${ev.chunkId}-${i}`} className="mt-3 border-l-2 border-[#F59E0B] pl-3 text-xs text-neutral-300">
                    <p className="font-medium text-white">{ev.contract.title} · {ev.contract.contractNumber}</p>
                    <p>{ev.version ? `Version ${ev.version.versionNumber} · ${ev.version.status}` : ev.contract.status}{ev.pageNumber != null ? ` · Page ${ev.pageNumber}` : ` · Source excerpt ${ev.chunkIndex + 1}`}</p>
                    <blockquote className="my-2 whitespace-pre-wrap break-words">{ev.quote}</blockquote>
                    <p className="text-emerald-300">Quote found in the original document</p>
                </div>)}
            </details>)}
            {!!answer.missingInformation.length && <div><h4 className="text-sm font-medium text-white">What we could not confirm</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-neutral-300">{answer.missingInformation.map((m, i) => <li key={i}>{m}</li>)}</ul></div>}
            <details className="text-xs text-neutral-400"><summary className="cursor-pointer">Answer checking details</summary><p className="mt-2">{answer.verification.verifiedClaims} of {answer.verification.totalGeneratedClaims} generated claims passed quotation checks · {answer.retrieval.totalResults} retrieved passages. This is not an accuracy score.</p></details>
            <p className="text-xs text-neutral-400">{answer.disclaimer}</p>
        </div>}
    </div>;
}

function Report({ item, initialTab, onClose }: { item: Item; initialTab: Tab; onClose: () => void }) {
    const [tab, setTab] = useState<Tab>(initialTab);
    const [showAll, setShowAll] = useState(false);
    const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium" | "low">("all");
    const a = item.analysis;
    const d = dataOf(a) ?? {};
    const counts = riskCounts(a);
    const ver = verification(a);
    const score = exposureScore(counts);
    const stance = stanceOf(counts);

    const risks = useMemo(() => {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return [...(d.risks ?? [])].sort((x, y) => (order[sev(x)] ?? 3) - (order[sev(y)] ?? 3));
    }, [d.risks]);

    const shownRisks = useMemo(
        () => (riskFilter === "all" ? risks : risks.filter((r) => sev(r) === riskFilter)),
        [risks, riskFilter]
    );

    const parties = useMemo(() => {
        const map = new Map<string, { name: string; roles: Set<string> }>();
        (d.parties ?? []).forEach((p) => {
            const name = str(p.name);
            if (!name) return;
            const e = map.get(name) ?? { name, roles: new Set<string>() };
            if (str(p.role)) e.roles.add(str(p.role));
            map.set(name, e);
        });
        return [...map.values()];
    }, [d.parties]);

    const obligationsByParty = useMemo(() => {
        const map = new Map<string, Finding[]>();
        (d.obligations ?? []).forEach((o) => {
            const who = str(o.responsibleParty) || "Unassigned";
            map.set(who, [...(map.get(who) ?? []), o]);
        });
        return [...map.entries()];
    }, [d.obligations]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
        { id: "overview", label: "Overview", icon: ScanSearch },
        { id: "risks", label: "Risks", icon: ShieldAlert, count: risks.length },
        { id: "clauses", label: "Clauses", icon: Scale, count: d.clauses?.length },
        { id: "obligations", label: "Obligations", icon: ListChecks, count: d.obligations?.length },
        { id: "details", label: "Key terms", icon: KeyRound, count: d.keyDetails?.length },
        { id: "parties", label: "Parties", icon: Users, count: parties.length },
        { id: "qa", label: "Ask AI", icon: Sparkles },
    ];

    const summary = d.summary ?? "";
    const evPct = ver.total ? Math.round((ver.verified / ver.total) * 100) : 0;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="ci-fade absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <aside className="ci-fade relative flex h-full w-full flex-col border-l border-[#26262A] bg-[#000000] sm:max-w-3xl">
                <header className="border-b border-[#26262A] px-4 pb-0 pt-4 sm:px-6 sm:pt-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs text-neutral-400">Contract report</p>
                            <h2 className="ci-serif mt-1 truncate text-xl text-white sm:text-3xl">
                                {contractTitle(item.contract)}
                            </h2>
                            <p className="mt-1 truncate text-xs text-neutral-400">
                                Analyzed {fmtDate(a?.aiMetadata?.analyzedAt)}
                                {a?.lawyerReview?.status ? `, lawyer review ${a.lawyerReview.status.toLowerCase()}` : ""}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close report"
                            className="shrink-0 rounded-md p-1.5 text-neutral-400 transition hover:bg-[#161618] hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <nav className="-mb-px mt-4 flex gap-1 overflow-x-auto" aria-label="Report sections">
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                aria-current={tab === t.id}
                                className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-xs font-medium transition sm:px-3 sm:text-sm ${tab === t.id
                                    ? "border-[#F59E0B] text-[#FBBF24]"
                                    : "border-transparent text-neutral-400 hover:text-white"
                                    }`}
                            >
                                <t.icon size={13} />
                                {t.label}
                                {t.count !== undefined && (
                                    <span className="rounded-full bg-[#1C1C1F] px-1.5 text-[10px] text-neutral-300">{t.count}</span>
                                )}
                            </button>
                        ))}
                    </nav>
                </header>

                <div key={tab} className="ci-fade flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
                    {tab === "qa" && <ContractQA key={`${item.contract._id}-${item.version?._id ?? "current"}`} item={item} />}
                    {tab === "overview" && (
                        <>
                            <div className={`${panel} flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-8`}>
                                <ExposureRing score={score} color={stance.ring} />
                                <div className="min-w-0 flex-1">
                                    <p className={label}>Where this stands</p>
                                    <p className={`ci-serif mt-1 text-2xl ${stance.tone}`}>{stance.title}</p>
                                    <p className="mt-1 text-sm text-neutral-300">{stance.note}</p>
                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        {[
                                            { k: "High", v: counts.high, c: "text-rose-300" },
                                            { k: "Medium", v: counts.medium, c: "text-orange-300" },
                                            { k: "Low", v: counts.low, c: "text-emerald-300" },
                                        ].map((x) => (
                                            <div key={x.k} className="rounded-md border border-[#26262A] bg-[#000000]/60 p-2.5 text-center">
                                                <p className={`ci-serif text-2xl tabular-nums ${x.c}`}>{x.v}</p>
                                                <p className="text-[11px] text-neutral-400">{x.k}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={`${panel} p-5`}>
                                <ContractMap analysis={a} onPick={setTab} />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { k: "Clauses", v: d.clauses?.length ?? 0, t: "clauses" as Tab },
                                    { k: "Obligations", v: d.obligations?.length ?? 0, t: "obligations" as Tab },
                                    { k: "Key terms", v: d.keyDetails?.length ?? 0, t: "details" as Tab },
                                ].map((x) => (
                                    <button
                                        key={x.k}
                                        onClick={() => setTab(x.t)}
                                        className={`${panel} p-3.5 text-left transition hover:border-[#3F3F46]`}
                                    >
                                        <p className="ci-serif text-2xl tabular-nums text-white">{x.v}</p>
                                        <p className="text-[11px] text-neutral-400">{x.k}</p>
                                    </button>
                                ))}
                            </div>

                            {ver.total > 0 && (
                                <div className={`${panel} p-4`}>
                                    <div className="flex items-baseline justify-between">
                                        <p className={label}>Checked against the source text</p>
                                        <p className="text-xs tabular-nums text-neutral-300">{ver.verified} of {ver.total} exact</p>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#26262A]">
                                        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${evPct}%` }} />
                                    </div>
                                </div>
                            )}

                            <div className={`${panel} p-5`}>
                                <h3 className={label}>Summary</h3>
                                <p className="mt-2 text-sm leading-relaxed text-neutral-200">
                                    {showAll || summary.length < 420 ? summary : `${summary.slice(0, 420)}...`}
                                </p>
                                {summary.length >= 420 && (
                                    <button
                                        onClick={() => setShowAll((s) => !s)}
                                        className="mt-2 text-xs font-medium text-[#F59E0B] hover:text-[#FBBF24]"
                                    >
                                        {showAll ? "Show less" : "Read full summary"}
                                    </button>
                                )}
                            </div>

                            {!!d.reviewRecommendations?.length && (
                                <div className={`${panel} p-5`}>
                                    <h3 className={label}>Before you sign</h3>
                                    <ul className="mt-3 space-y-3">
                                        {d.reviewRecommendations.slice(0, 6).map((r, i) => (
                                            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-neutral-200">
                                                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#F59E0B]" />
                                                <span>
                                                    <span className="font-medium text-white">{str(r.topic)}.</span>{" "}
                                                    {str(r.recommendation)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {!!d.missingInformation?.length && (
                                <div className={`${panel} p-5`}>
                                    <h3 className={label}>Missing from this contract</h3>
                                    <ul className="mt-3 space-y-2">
                                        {d.missingInformation.slice(0, 6).map((m, i) => (
                                            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-neutral-200">
                                                <CircleDashed size={15} className="mt-0.5 shrink-0 text-orange-300" />
                                                <span>{pick(m, ["topic", "title", "field", "item"]) || str(m.description) || str(m.explanation)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}

                    {tab === "risks" && (
                        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter risks by severity">
                            {([
                                ["all", "All", risks.length],
                                ["high", "High", counts.high],
                                ["medium", "Medium", counts.medium],
                                ["low", "Low", counts.low],
                            ] as const).map(([k, l, n]) => (
                                <button
                                    key={k}
                                    onClick={() => setRiskFilter(k)}
                                    aria-pressed={riskFilter === k}
                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${riskFilter === k ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#FBBF24]" : "border-[#26262A] text-neutral-300 hover:border-[#3F3F46]"}`}
                                >
                                    {l} <span className="tabular-nums text-neutral-400">{n}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {tab === "risks" &&
                        shownRisks.map((r, i) => (
                            <div
                                key={i}
                                className={`${panel} border-l-[3px] p-4 ${sevBorder[sev(r)] ?? "border-l-neutral-500"}`}
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-medium text-white">{str(r.title) || `Risk ${i + 1}`}</h4>
                                    <span className={`rounded-full bg-[#1C1C1F] px-2 py-0.5 text-[11px] capitalize ${sevText[sev(r)] ?? "text-neutral-300"}`}>
                                        {sev(r) || "unrated"}
                                    </span>
                                    {str(r.clauseReference) && (
                                        <span className="text-[11px] text-neutral-400">Clause {str(r.clauseReference)}</span>
                                    )}
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-neutral-300">{str(r.explanation)}</p>
                                {str(r.recommendation) && (
                                    <p className="mt-3 rounded-md bg-[#000000]/70 p-3 text-sm leading-relaxed text-white">
                                        <span className="font-medium text-[#F59E0B]">Suggested fix. </span>
                                        {str(r.recommendation)}
                                    </p>
                                )}
                                <Evidence f={r} />
                            </div>
                        ))}

                    {tab === "clauses" &&
                        (d.clauses ?? []).map((c, i) => (
                            <div key={i} className={`${panel} p-4`}>
                                <div className="flex flex-wrap items-center gap-2">
                                    {str(c.clauseReference) && (
                                        <span className="rounded border border-[#2E2E33] bg-[#000000] px-1.5 py-0.5 text-[11px] font-medium text-neutral-300">
                                            {str(c.clauseReference)}
                                        </span>
                                    )}
                                    <h4 className="text-sm font-medium text-white">{str(c.title)}</h4>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-neutral-300">{str(c.explanation)}</p>
                                <Evidence f={c} />
                            </div>
                        ))}

                    {tab === "obligations" &&
                        obligationsByParty.map(([who, list]) => (
                            <section key={who} className={`${panel} overflow-hidden`}>
                                <div className="flex items-center justify-between border-b border-[#26262A] bg-[#161618] px-4 py-2.5">
                                    <h4 className="text-sm font-medium text-white">{who}</h4>
                                    <span className="text-[11px] text-neutral-400">
                                        {list.length} {list.length === 1 ? "obligation" : "obligations"}
                                    </span>
                                </div>
                                <ul className="divide-y divide-[#26262A]">
                                    {list.map((o, i) => (
                                        <li key={i} className="p-4">
                                            <p className="text-sm leading-relaxed text-white">{str(o.obligation)}</p>
                                            {str(o.clauseReference) && (
                                                <p className="mt-1 text-[11px] text-neutral-400">Clause {str(o.clauseReference)}</p>
                                            )}
                                            <Evidence f={o} />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}

                    {tab === "details" && (
                        <div className={`${panel} divide-y divide-[#26262A]`}>
                            {(d.keyDetails ?? []).map((k, i) => (
                                <div key={i} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
                                    <p className="text-xs text-neutral-400">{str(k.field)}</p>
                                    <div>
                                        <p className="text-sm text-white">{str(k.value)}</p>
                                        <Evidence f={k} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === "parties" &&
                        parties.map((p) => (
                            <div key={p.name} className={`${panel} p-4`}>
                                <h4 className="text-sm font-medium text-white">{p.name}</h4>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {[...p.roles].map((r) => (
                                        <span key={r} className="rounded-full border border-[#2E2E33] px-2 py-0.5 text-[11px] text-neutral-300">
                                            {r}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
            </aside>
        </div>
    );
}

/* -------------------------------- page ------------------------------------ */

export default function ContractIntelligencePage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"All" | "High" | "Medium" | "Low" | "Pending">("All");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [reportId, setReportId] = useState<string | null>(null);
    const [reportTab, setReportTab] = useState<Tab>("overview");
    const [runs, setRuns] = useState<Record<string, RunState>>({});
    const [toast, setToast] = useState<{ id: string; text: string } | null>(null);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [qaOpen, setQaOpen] = useState(false);
    const [railExpanded, setRailExpanded] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const pollers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

    const stopPoll = (id: string) => {
        clearInterval(pollers.current[id]);
        delete pollers.current[id];
    };

    useEffect(() => {
        const p = pollers.current;
        return () => Object.keys(p).forEach((id) => clearInterval(p[id]));
    }, []);

    const fetchAnalysis = useCallback(async (contractId: string, versionId: string) => {
        try {
            const rec = await contractService.getContractVersionAnalysis(contractId, versionId);
            return (rec ?? null) as AIContractAnalysisRecord | null;
        } catch {
            return null;
        }
    }, []);

    const patchItem = useCallback((contractId: string, analysis: AIContractAnalysisRecord) => {
        setItems((prev) =>
            prev.map((it) => (it.contract._id === contractId ? { ...it, analysis } : it))
        );
    }, []);

    const finishRun = useCallback(
        (contractId: string, title: string, analysis: AIContractAnalysisRecord) => {
            stopPoll(contractId);
            patchItem(contractId, analysis);
            setRuns((r) => {
                const { [contractId]: _gone, ...rest } = r;
                return rest;
            });
            setToast({ id: contractId, text: `Report ready for ${title}` });
        },
        [patchItem]
    );

    const failRun = (contractId: string, message: string) => {
        stopPoll(contractId);
        setRuns((r) => ({ ...r, [contractId]: { ...r[contractId], error: message } }));
    };

    const startPolling = useCallback(
        (it: Item, startedAt: number) => {
            const id = it.contract._id;
            const vid = it.version?._id;
            if (!vid) return;
            stopPoll(id);
            pollers.current[id] = setInterval(async () => {
                const rec = await fetchAnalysis(id, vid);
                if (!rec) return;
                const fresh = new Date(str(rec.updatedAt)).getTime() >= startedAt - 2000;
                if (rec.status === "Completed" && fresh) finishRun(id, contractTitle(it.contract), rec);
                else if (rec.status === "Failed" && fresh)
                    failRun(id, str(rec.errorMessage) || "Analysis failed. Try again.");
            }, POLL_MS);
        },
        [fetchAnalysis, finishRun]
    );

    const startAnalysis = useCallback(
        async (it: Item) => {
            const id = it.contract._id;
            const vid = it.version?._id;
            if (!vid) {
                setError("This contract has no current version to analyze.");
                return;
            }

            const svc = contractService as unknown as {
                analyzeContract?: (a: string, b: string) => Promise<unknown>;
                analyzeContractVersion?: (a: string, b: string) => Promise<unknown>;
            };
            const analyze =
                svc.analyzeContract?.bind(contractService) ??
                svc.analyzeContractVersion?.bind(contractService);

            if (!analyze) {
                setError("Contract service is missing analyzeContract().");
                return;
            }

            const startedAt = Date.now();
            setRuns((r) => ({ ...r, [id]: { startedAt } }));
            startPolling(it, startedAt);

            try {
                const res = await analyze(id, vid);
                const rec = unwrap<AIContractAnalysisRecord>(res);
                if (rec?.status === "Completed") {
                    finishRun(id, contractTitle(it.contract), rec);
                }
            } catch (e) {
                const msg = e instanceof Error ? e.message : "";
                const code = (e as { code?: string })?.code;
                const timedOut = code === "ECONNABORTED" || /timeout|network|aborted/i.test(msg);
                if (!timedOut) {
                    failRun(id, msg || "Could not start the analysis.");
                }
            }
        },
        [finishRun, startPolling]
    );

    const handleDelete = useCallback(async (it: Item) => {
        const title = contractTitle(it.contract);
        if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
        try {
            setDeleting(it.contract._id);
            await contractService.deleteContract(it.contract._id);
            stopPoll(it.contract._id);
            setItems((prev) => prev.filter((p) => p.contract._id !== it.contract._id));
            setRuns((r) => {
                const { [it.contract._id]: _gone, ...rest } = r;
                return rest;
            });
            setSelectedId((cur) => (cur === it.contract._id ? null : cur));
            setToast({ id: "", text: `Deleted ${title}` });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not delete contract.");
        } finally {
            setDeleting(null);
        }
    }, []);

    const load = useCallback(
        async (showLoader = true) => {
            try {
                showLoader ? setLoading(true) : setRefreshing(true);
                setError("");

                const response = await contractService.getContracts({ page, limit: PAGE_SIZE });
                const contracts = response.data || [];
                setTotalPages(response.pagination?.totalPages || response.pagination?.pages || 1);

                const results: Item[] = new Array(contracts.length);
                let next = 0;
                const worker = async () => {
                    while (next < contracts.length) {
                        const i = next++;
                        const contract = contracts[i];
                        let version: ContractVersion | null = null;
                        let analysis: AIContractAnalysisRecord | null = null;
                        try {
                            const versions = await contractService.getContractVersions(contract._id);
                            version = versions.find((v) => v.isCurrent) || versions[0] || null;
                            if (version) analysis = await fetchAnalysis(contract._id, version._id);
                        } catch {
                            /* leave empty */
                        }
                        results[i] = { contract, version, analysis };
                    }
                };
                await Promise.all(Array.from({ length: Math.min(4, contracts.length) }, worker));
                setItems(results);

                setSelectedId((cur) => cur ?? results[0]?.contract._id ?? null);

                results.forEach((it) => {
                    const status = it.analysis?.status as string | undefined;
                    if (status && /process|pending|queue/i.test(status) && !pollers.current[it.contract._id]) {
                        const startedAt = new Date(str(it.analysis?.createdAt)).getTime() || Date.now();
                        setRuns((r) => ({ ...r, [it.contract._id]: { startedAt } }));
                        startPolling(it, startedAt);
                    }
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : "Could not load contracts.");
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [page, fetchAnalysis, startPolling]
    );

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 8000);
        return () => clearTimeout(t);
    }, [toast]);

    const stats = useMemo(() => {
        const analyzed = items.filter((i) => dataOf(i.analysis));
        const lvl = (l: RiskLevel) => analyzed.filter((i) => riskLevel(i.analysis) === l).length;
        const high = lvl("High");
        const medium = lvl("Medium");
        const clear = lvl("Low") + lvl("None");
        const scores = analyzed.map((i) => exposureScore(riskCounts(i.analysis)));
        const avgExposure = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        return {
            avgExposure,
            total: items.length,
            analyzed: analyzed.length,
            high,
            medium,
            clear,
            pending: items.length - analyzed.length,
            unreviewed: analyzed.filter(
                (i) => (i.analysis?.lawyerReview?.status ?? "Not Reviewed") === "Not Reviewed"
            ).length,
        };
    }, [items]);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((i) => {
            const lvl = riskLevel(i.analysis);
            const matchQ = !q || contractTitle(i.contract).toLowerCase().includes(q);
            const matchF =
                filter === "All" ||
                (filter === "Pending" ? lvl === "Unknown" : lvl === filter);
            return matchQ && matchF;
        });
    }, [items, search, filter]);

    const railItems = railExpanded ? visible : visible.slice(0, 6);
    const selected = items.find((i) => i.contract._id === selectedId) || null;
    const reportItem = items.find((i) => i.contract._id === reportId) || null;
    const runningCount = Object.values(runs).filter((r) => !r.error).length;

    const openReport = (id: string, tab: Tab = "overview") => {
        setReportTab(tab);
        setReportId(id);
    };

    const handleUploaded = useCallback(async (c: Contract) => {
        let version: ContractVersion | null = null;
        try {
            const versions = await contractService.getContractVersions(c._id);
            version = versions.find((v) => v.isCurrent) || versions[0] || null;
        } catch {
            /* ignore */
        }
        const newItem: Item = { contract: c, version, analysis: null };
        setItems((prev) => [newItem, ...prev.filter((p) => p.contract._id !== c._id)]);
        setSelectedId(c._id);
        setToast({ id: "", text: `Uploaded ${contractTitle(c)}. Run an analysis to build its report.` });
    }, []);

    const dist = [
        { k: "High", v: stats.high, bar: "bg-rose-400" },
        { k: "Medium", v: stats.medium, bar: "bg-orange-400" },
        { k: "Low or none", v: stats.clear, bar: "bg-emerald-400" },
        { k: "Not analyzed", v: stats.pending, bar: "bg-[#2E2E33]" },
    ];

    return (
        <div className="ci-root relative min-h-full bg-[#000000] text-white">
            <Styles />
            <div className="ci-stage ci-stage-fade pointer-events-none absolute inset-x-0 top-0 h-[560px]" aria-hidden />

            <div className="relative mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
                {/* Top bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
                        <span>Workspace</span>
                        <ChevronRight size={12} className="text-neutral-600" />
                        <span className="text-neutral-200">Contract intelligence</span>
                    </nav>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#26262A] bg-[#0E0E10] px-3 py-1">
                        <span className="relative flex h-2 w-2">
                            <span className="ci-ping absolute inset-0 rounded-full bg-emerald-400" />
                            <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
                        </span>
                        Analysis engine online
                    </span>
                </div>

                {/* Hero */}
                <section className="mt-8 grid items-stretch gap-6 lg:grid-cols-[1.15fr_1fr]">
                    <div className="flex flex-col justify-center">
                        <h1 className="ci-serif text-4xl leading-[1.08] text-white sm:text-5xl">
                            Know what a contract says before you sign it.
                        </h1>
                        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-neutral-300">
                            Upload any agreement. In about five minutes you get every clause, who owes what, the key terms and a ranked list of risks, each one tied back to the original wording.
                        </p>
                        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                            <button onClick={() => setUploadOpen(true)} className={`${btnPrimary} px-5 py-2.5`}>
                                <Upload size={15} /> Upload contract
                            </button>
                            <button onClick={() => setQaOpen(true)} className={btnGhost}><Sparkles size={15} /> Ask AI</button>
                            <button onClick={() => load(false)} disabled={refreshing} className={`${btnGhost} px-5 py-2.5`}>
                                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                                Refresh
                            </button>
                        </div>
                        <ul className="mt-7 grid max-w-xl grid-cols-2 gap-x-6 gap-y-3 text-sm text-neutral-200">
                            {[
                                [Scale, "Clause extraction"],
                                [ListChecks, "Obligations by party"],
                                [ShieldAlert, "Ranked risk scoring"],
                                [BadgeCheck, "Checked against source text"],
                            ].map(([Icon, text]) => {
                                const I = Icon as React.ElementType;
                                return (
                                    <li key={text as string} className="flex items-center gap-2.5">
                                        <span className="grid h-7 w-7 place-items-center rounded-md border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]">
                                            <I size={14} />
                                        </span>
                                        {text as string}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Portfolio exposure */}
                    <div className={`${panel} ci-hairline flex flex-col p-5 sm:p-6`}>
                        <div className="flex items-center justify-between">
                            <p className={label}>Portfolio exposure</p>
                            <p className="text-[11px] text-neutral-400">
                                {stats.analyzed} of {stats.total} analyzed
                            </p>
                        </div>
                        {stats.analyzed > 0 ? (
                            <div className="mt-4 flex flex-1 flex-col justify-center gap-5 sm:flex-row sm:items-center">
                                <ExposureRing
                                    score={stats.avgExposure}
                                    color={stats.avgExposure >= 60 ? "#fb7185" : stats.avgExposure >= 35 ? "#fb923c" : "#34d399"}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-neutral-300">
                                        Average across analyzed contracts. Lower is better.
                                    </p>
                                    <div className="mt-4 flex h-2.5 gap-[3px] overflow-hidden rounded-sm">
                                        {dist.filter((x) => x.v > 0).map((x) => (
                                            <div
                                                key={x.k}
                                                className={`${x.bar} rounded-[2px] transition-all duration-700`}
                                                style={{ flexGrow: x.v, flexBasis: 0 }}
                                                title={`${x.k}: ${x.v}`}
                                            />
                                        ))}
                                    </div>
                                    <ul className="mt-3 space-y-1.5 text-xs text-neutral-300">
                                        {dist.map((x) => (
                                            <li key={x.k} className="flex items-center justify-between gap-3">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className={`h-2 w-2 rounded-[2px] ${x.bar}`} />
                                                    {x.k}
                                                </span>
                                                <span className="tabular-nums text-white">{x.v}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                                <ScanSearch size={22} className="text-neutral-500" />
                                <p className="mt-3 max-w-xs text-sm text-neutral-300">
                                    Run your first analysis and your portfolio exposure shows up here.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Running banner */}
                {runningCount > 0 && (
                    <div className="ci-fade mt-5 flex items-start gap-2.5 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/5 px-3 py-2.5 text-xs text-[#FBBF24] sm:items-center sm:px-4 sm:text-sm">
                        <Clock3 size={14} className="mt-0.5 shrink-0 sm:mt-0" />
                        <p>
                            {runningCount} {runningCount === 1 ? "analysis is" : "analyses are"} running, about 5 minutes each.
                            You can leave this tab and the report saves automatically.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-400/30 bg-rose-400/5 px-3 py-2.5 text-xs text-rose-300 sm:items-center sm:px-4 sm:text-sm">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0 sm:mt-0" />
                        <span className="flex-1">{error}</span>
                        <button onClick={() => setError("")} className="shrink-0 text-rose-300/60 hover:text-rose-300" aria-label="Dismiss">
                            <X size={13} />
                        </button>
                    </div>
                )}

                {/* KPIs */}
                <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard label="Contracts" value={stats.total} icon={FileText} />
                    <StatCard label="Analyzed" value={stats.analyzed} icon={CheckCircle2} tone="success" />
                    <StatCard label="High risk" value={stats.high} icon={AlertTriangle} tone="danger" />
                    <StatCard label="Awaiting lawyer review" value={stats.unreviewed} icon={Scale} tone="warn" />
                </section>

                {/* Toolbar */}
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search contracts"
                            aria-label="Search contracts"
                            className="w-full rounded-md border border-[#26262A] bg-[#0E0E10] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-[#F59E0B]/70"
                        />
                    </div>
                    <div className="flex shrink-0 overflow-x-auto rounded-md border border-[#26262A] bg-[#0E0E10] p-0.5">
                        {(["All", "High", "Medium", "Low", "Pending"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                aria-pressed={filter === f}
                                className={`whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium transition ${filter === f
                                    ? "bg-[#1C1C1F] text-white"
                                    : "text-neutral-400 hover:text-neutral-200"
                                    }`}
                            >
                                {f === "Pending" ? "Not analyzed" : f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Vault + dossier */}
                {loading ? (
                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
                        <div className="h-96 animate-pulse rounded-xl border border-[#26262A] bg-[#0E0E10]" />
                        <div className="h-96 animate-pulse rounded-xl border border-[#26262A] bg-[#0E0E10]" />
                    </div>
                ) : visible.length === 0 ? (
                    <div className="mt-5 rounded-xl border border-dashed border-[#3F3F46] bg-[#0E0E10]/50 px-4 py-16 text-center">
                        <ScanSearch size={22} className="mx-auto text-neutral-500" />
                        <p className="mt-3 text-sm font-medium text-neutral-200">
                            {items.length ? "No contracts match these filters" : "No contracts yet"}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                            {items.length
                                ? "Clear the search or pick a different filter."
                                : "Upload a contract and its report will appear here."}
                        </p>
                        {!items.length && (
                            <button onClick={() => setUploadOpen(true)} className={`${btnPrimary} mt-4`}>
                                <Upload size={14} /> Upload contract
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
                        {/* Vault */}
                        <div className={`${panel} overflow-hidden`}>
                            <div className="flex items-center justify-between border-b border-[#26262A] px-4 py-2.5">
                                <h2 className="text-xs font-medium text-neutral-300">
                                    Contract vault <span className="text-neutral-500">({visible.length})</span>
                                </h2>
                                <button
                                    onClick={() => setUploadOpen(true)}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-neutral-300 hover:text-[#F59E0B]"
                                >
                                    <Plus size={12} /> New
                                </button>
                            </div>
                            <div className="max-h-[560px] divide-y divide-[#26262A]/70 overflow-y-auto">
                                {railItems.map((it) => (
                                    <DocumentRow
                                        key={it.contract._id}
                                        item={it}
                                        selected={selectedId === it.contract._id}
                                        run={runs[it.contract._id]}
                                        onSelect={() => setSelectedId(it.contract._id)}
                                    />
                                ))}
                            </div>
                            {visible.length > 6 && (
                                <button
                                    onClick={() => setRailExpanded((v) => !v)}
                                    className="flex w-full items-center justify-center gap-1 border-t border-[#26262A] py-2 text-xs text-neutral-400 transition hover:text-neutral-200"
                                >
                                    <ChevronDown size={12} className={railExpanded ? "rotate-180" : ""} />
                                    {railExpanded ? "Show less" : `Show all ${visible.length}`}
                                </button>
                            )}
                        </div>

                        {/* Dossier */}
                        <FocusPanel
                            key={selected?.contract._id ?? "none"}
                            item={selected}
                            run={selected ? runs[selected.contract._id] : undefined}
                            onOpenReport={(t) => selected && openReport(selected.contract._id, t)}
                            onAnalyze={() => selected && startAnalysis(selected)}
                            onDelete={() => selected && deleting !== selected.contract._id && handleDelete(selected)}
                        />
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            aria-label="Previous page"
                            className="grid h-9 w-9 place-items-center rounded-md border border-[#26262A] text-neutral-200 transition hover:border-[#3F3F46] disabled:opacity-30"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs text-neutral-400">Page {page} of {totalPages}</span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            aria-label="Next page"
                            className="grid h-9 w-9 place-items-center rounded-md border border-[#26262A] text-neutral-200 transition hover:border-[#3F3F46] disabled:opacity-30"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>

            {qaOpen && <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label="Contract AI">
                <div className="absolute inset-0 bg-black/70" onClick={() => setQaOpen(false)} />
                <aside className="relative h-full w-full overflow-y-auto border-l border-[#26262A] bg-black p-4 sm:max-w-3xl sm:p-6">
                    <div className="mb-4 flex justify-between text-white"><h2 className="text-lg font-semibold">Contract AI workspace</h2><button aria-label="Close AI workspace" onClick={() => setQaOpen(false)}><X size={20} /></button></div>
                    <ContractQA key={`${selected?.contract._id ?? "portfolio"}-${selected?.version?._id ?? "current"}`} item={selected ?? undefined} />
                </aside>
            </div>}
            <UploadDialog
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                onUploaded={handleUploaded}
            />

            {reportItem && dataOf(reportItem.analysis) && (
                <Report
                    key={`${reportItem.contract._id}-${reportTab}`}
                    item={reportItem}
                    initialTab={reportTab}
                    onClose={() => setReportId(null)}
                />
            )}

            {toast && (
                <div className="ci-fade fixed inset-x-3 bottom-3 z-[60] flex items-center gap-3 rounded-lg border border-[#26262A] bg-[#161618] px-3 py-2.5 text-xs text-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:px-4 sm:text-sm">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                    <span className="flex-1 truncate">{toast.text}</span>
                    {toast.id && (
                        <button
                            onClick={() => {
                                openReport(toast.id);
                                setToast(null);
                            }}
                            className="shrink-0 rounded-md bg-[#26262A] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#2E2E33]"
                        >
                            Open report
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}