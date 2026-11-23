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
} from "@/lib/services/contract.service";

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
    High: "text-rose-400",
    Medium: "text-amber-300",
    Low: "text-emerald-400",
    None: "text-emerald-400",
    Unknown: "text-zinc-500",
};

const riskDot: Record<RiskLevel, string> = {
    High: "bg-rose-400",
    Medium: "bg-amber-300",
    Low: "bg-emerald-400",
    None: "bg-emerald-400",
    Unknown: "bg-zinc-600",
};

const riskLabel: Record<RiskLevel, string> = {
    High: "High",
    Medium: "Medium",
    Low: "Low",
    None: "None",
    Unknown: "Not analyzed",
};

const sevBorder: Record<string, string> = {
    high: "border-l-rose-500",
    medium: "border-l-amber-500",
    low: "border-l-emerald-500",
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

function useCountUp(target: number, duration = 900) {
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
            const next = Math.round(from + (target - from) * eased);
            setValue(next);
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
      @keyframes ci-fade { from { opacity: 0 } to { opacity: 1 } }
      @keyframes ci-scan { 0% { top: 0; opacity: 0 } 10% { opacity: 1 } 90% { opacity: 1 } 100% { top: calc(100% - 2px); opacity: 0 } }
      .ci-fade { animation: ci-fade .2s ease both }
      .ci-scan { animation: ci-scan 2.2s ease-in-out infinite }

      @keyframes ci-stat-in {
        from { opacity: 0; transform: translateY(10px) scale(.97) }
        to   { opacity: 1; transform: translateY(0) scale(1) }
      }
      @keyframes ci-stat-sheen {
        0%   { transform: translateX(-130%) }
        55%  { transform: translateX(130%) }
        100% { transform: translateX(130%) }
      }
      @keyframes ci-stat-pulse {
        0%, 100% { opacity: .35; transform: scale(.85) }
        50%      { opacity: .9; transform: scale(1.15) }
      }
      @keyframes ci-stat-glow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(252,211,77,0) }
        50%      { box-shadow: 0 0 18px -4px rgba(252,211,77,.25) }
      }

      .ci-stat {
        position: relative;
        overflow: hidden;
        animation: ci-stat-in .55s cubic-bezier(.22,.61,.36,1) both;
        transition: border-color .25s ease, background-color .25s ease, transform .25s ease;
      }
      .ci-stat:hover {
        border-color: rgba(252,211,77,.35);
        transform: translateY(-2px);
      }
      .ci-stat::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
          100deg,
          transparent 25%,
          rgba(252,211,77,.06) 45%,
          rgba(252,211,77,.16) 50%,
          rgba(252,211,77,.06) 55%,
          transparent 75%
        );
        transform: translateX(-130%);
        animation: ci-stat-sheen 7s ease-in-out infinite;
        pointer-events: none;
      }
      .ci-stat:hover::after { animation-duration: 2.2s; }
      .ci-stat-value { font-variant-numeric: tabular-nums; }
      .ci-stat-dot { animation: ci-stat-pulse 2.4s ease-in-out infinite; }
      .ci-stat-glow { animation: ci-stat-glow 3.6s ease-in-out infinite; }

      @media (prefers-reduced-motion: reduce) {
        .ci-fade, .ci-scan, .ci-stat, .ci-stat::after,
        .ci-stat-dot, .ci-stat-glow { animation: none !important; }
      }
    `}</style>
    );
}

function RiskDot({ level, withLabel = true }: { level: RiskLevel; withLabel?: boolean }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${riskDot[level]}`} />
            {withLabel && (
                <span className={`text-[11px] uppercase tracking-wider ${riskTone[level]}`}>
                    {riskLabel[level]}
                </span>
            )}
        </span>
    );
}

function ScanPanel({ startedAt }: { startedAt: number }) {
    const s = useElapsed(startedAt);
    const pct = Math.min(95, Math.round((1 - Math.exp(-s / (EXPECTED_SECONDS / 2.2))) * 100));
    const stageIdx = STAGES.reduce((acc, st, i) => (s >= st.at ? i : acc), 0);
    const stage = STAGES[stageIdx];

    return (
        <div className="flex items-start gap-3">
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded border border-zinc-800 bg-zinc-900 p-1.5">
                {[70, 100, 85, 100, 60, 90].map((w, i) => (
                    <div
                        key={i}
                        className="mb-1 h-0.5 rounded-full bg-zinc-700"
                        style={{ width: `${w}%` }}
                    />
                ))}
                <div className="ci-scan absolute inset-x-0 h-[2px] bg-amber-300/80 shadow-[0_0_8px_rgba(252,211,77,0.6)]" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">{stage.label}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">{stage.hint}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                        className="h-full rounded-full bg-amber-300 transition-all duration-1000"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="tabular-nums">{fmtClock(s)} elapsed</span>
                    <span>~5 min</span>
                </div>
            </div>
        </div>
    );
}

/* ---------------------------- stat card ----------------------------------- */

function StatCard({
    label,
    value,
    icon: Icon,
    index = 0,
    tone = "default",
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    index?: number;
    tone?: "default" | "danger" | "success" | "warn";
}) {
    const animated = useCountUp(value);

    const valueTone =
        tone === "danger" ? "text-rose-300"
            : tone === "success" ? "text-emerald-300"
                : tone === "warn" ? "text-amber-200"
                    : "text-zinc-100";

    const dotTone =
        tone === "danger" ? "bg-rose-400"
            : tone === "success" ? "bg-emerald-400"
                : tone === "warn" ? "bg-amber-300"
                    : "bg-zinc-600";

    return (
        <div
            className="ci-stat rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">{label}</p>
                <Icon size={14} className="text-zinc-600" />
            </div>
            <div className="mt-2 flex items-end gap-2">
                <p className={`ci-stat-value text-2xl font-semibold ${valueTone}`}>
                    {animated.toLocaleString("en-IN")}
                </p>
                {value > 0 && (
                    <span className={`ci-stat-dot mb-1.5 h-1.5 w-1.5 rounded-full ${dotTone}`} />
                )}
            </div>
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
            <div className="ci-fade relative w-full max-w-md overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-zinc-800 p-5">
                    <div>
                        <h3 className="text-base font-semibold text-zinc-100">Upload a contract</h3>
                        <p className="mt-0.5 text-xs text-zinc-500">PDF or DOCX. Max 25 MB.</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close"
                        className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    <div
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition ${drag ? "border-amber-300 bg-amber-300/5" : "border-zinc-700 hover:border-zinc-600"
                            }`}
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDrag(false);
                            pickFile(e.dataTransfer.files?.[0] ?? null);
                        }}
                    >
                        <FilePlus2 size={22} className="text-zinc-500" />
                        <p className="mt-2 text-sm text-zinc-200">
                            {file ? file.name : "Drop a file here, or click to browse"}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                            {file
                                ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                                : "PDF, DOCX · up to 25 MB"}
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
                        <span className="text-xs font-medium text-zinc-400">Title</span>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Vendor MSA — Acme"
                            className="mt-1.5 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-300/60"
                        />
                    </label>

                    {err && (
                        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                            {err}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-zinc-800 p-4">
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-md px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={busy || !file || !title.trim()}
                        className="inline-flex items-center gap-2 rounded-md bg-amber-300 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
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
    const counterparty = pick(item.contract, ["counterparty", "counterpartyName", "party", "vendor"]);
    const updated = fmtDate(item.analysis?.updatedAt || item.contract.updatedAt);

    return (
        <button
            onClick={onSelect}
            className={`group flex w-full items-start gap-3 px-3 py-3 text-left transition ${selected
                ? "bg-zinc-800/60"
                : "hover:bg-zinc-900/60"
                }`}
        >
            <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400">
                <FileText size={13} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-zinc-100">{contractTitle(item.contract)}</p>
                    {run && !run.error && <Loader2 size={11} className="animate-spin text-amber-300" />}
                </div>
                <p className="truncate text-[11px] text-zinc-500">
                    {counterparty || "No counterparty"}
                    {updated ? ` · ${updated}` : ""}
                </p>
            </div>
            <div className="mt-1 shrink-0">
                <RiskDot level={done ? level : "Unknown"} withLabel={false} />
            </div>
        </button>
    );
}

/* ---------------------------- focus panel --------------------------------- */

function FocusPanel({
    item, run, onOpenReport, onAnalyze, onDelete,
}: {
    item: Item | null;
    run?: RunState;
    onOpenReport: () => void;
    onAnalyze: () => void;
    onDelete: () => void;
}) {
    if (!item) {
        return (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
                <ScanSearch size={22} className="text-zinc-600" />
                <p className="mt-3 text-sm font-medium text-zinc-300">Select a contract</p>
                <p className="mt-1 max-w-xs text-xs text-zinc-500">
                    Pick one from the list, or upload a new file to get started.
                </p>
            </div>
        );
    }

    const level = riskLevel(item.analysis);
    const done = item.analysis?.status === "Completed" && !!dataOf(item.analysis);
    const failed = item.analysis?.status === "Failed";
    const d = dataOf(item.analysis);
    const c = riskCounts(item.analysis);
    const ver = verification(item.analysis);
    const counterparty = pick(item.contract, ["counterparty", "counterpartyName", "party", "vendor"]);
    const updated = fmtDate(item.analysis?.updatedAt || item.contract.updatedAt);
    const running = !!run && !run.error;

    const summary = d?.summary ?? "";
    const risks = d?.risks ?? [];

    return (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
            <div className="border-b border-zinc-800 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <RiskDot level={done ? level : "Unknown"} />
                        <h2 className="mt-2 truncate text-lg font-semibold text-zinc-100">
                            {contractTitle(item.contract)}
                        </h2>
                        <p className="mt-1 truncate text-xs text-zinc-500">
                            {counterparty || "No counterparty"}
                            {updated ? ` · updated ${updated}` : ""}
                        </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        {done && !running && (
                            <button
                                onClick={onOpenReport}
                                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-300 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200"
                            >
                                View report <ArrowUpRight size={14} />
                            </button>
                        )}
                        <button
                            onClick={onAnalyze}
                            disabled={running || !item.version}
                            className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${done && !running
                                ? "border border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900"
                                : "bg-amber-300 font-semibold text-zinc-950 hover:bg-amber-200"
                                }`}
                        >
                            {running ? (
                                <><Loader2 size={14} className="animate-spin" /> Analyzing</>
                            ) : done ? (
                                <><RefreshCw size={13} /> Re-run</>
                            ) : (
                                <><Sparkles size={14} /> Run analysis</>
                            )}
                        </button>
                        <button
                            onClick={onDelete}
                            aria-label="Delete contract"
                            className="inline-flex items-center justify-center rounded-md border border-zinc-800 px-2.5 py-2 text-zinc-500 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-5">
                {!item.version && (
                    <p className="rounded-md border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs text-zinc-400">
                        No uploaded version yet. Upload a file to run analysis.
                    </p>
                )}

                {run && !run.error && <ScanPanel startedAt={run.startedAt} />}

                {run?.error && (
                    <p className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                        {run.error}
                    </p>
                )}

                {!run && done && (
                    <>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { k: "High", v: c.high, c: "text-rose-400" },
                                { k: "Medium", v: c.medium, c: "text-amber-300" },
                                { k: "Low", v: c.low, c: "text-emerald-400" },
                            ].map((x) => (
                                <div key={x.k} className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3 text-center">
                                    <p className={`text-2xl font-semibold tabular-nums ${x.c}`}>{x.v}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">{x.k}</p>
                                </div>
                            ))}
                        </div>

                        {summary && (
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Summary</h3>
                                <p className="mt-1.5 line-clamp-5 text-sm leading-relaxed text-zinc-300">
                                    {summary}
                                </p>
                            </div>
                        )}

                        {/* <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Evidence</p>
                                <p className="mt-1 text-base font-semibold text-zinc-100">
                                    {ver.verified}<span className="text-xs font-normal text-zinc-500"> / {ver.total}</span>
                                </p>
                            </div>
                            <div className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Tokens</p>
                                <p className="mt-1 text-base font-semibold text-zinc-100">
                                    {(item.analysis?.aiMetadata?.usage?.total_tokens ?? 0).toLocaleString("en-IN")}
                                </p>
                            </div>
                        </div> */}

                        {risks.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Top risks</h3>
                                <ul className="mt-2 space-y-1.5">
                                    {risks.slice(0, 3).map((r, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-zinc-300">
                                            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${sev(r) === "high" ? "bg-rose-400" : sev(r) === "medium" ? "bg-amber-300" : "bg-emerald-400"
                                                }`} />
                                            <span className="line-clamp-2">{str(r.title) || str(r.explanation)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}

                {!run && !done && !failed && item.version && (
                    <p className="text-sm text-zinc-400">
                        No report yet. Run an analysis to extract clauses, obligations and risks.
                    </p>
                )}

                {!run && failed && (
                    <p className="text-sm text-rose-300">
                        Last run failed. Try again to retry.
                    </p>
                )}
            </div>
        </div>
    );
}

/* ------------------------------- report ----------------------------------- */

function RiskRing({ counts }: { counts: ReturnType<typeof riskCounts> }) {
    const R = 44;
    const C = 2 * Math.PI * R;
    const score = counts.total
        ? Math.round(((counts.high * 3 + counts.medium * 2 + counts.low) / (counts.total * 3)) * 100)
        : 0;
    const off = C * (1 - score / 100);
    const color = score >= 60 ? "#fb7185" : score >= 40 ? "#fcd34d" : "#34d399";

    return (
        <div className="relative mx-auto h-28 w-28 sm:h-32 sm:w-32">
            <svg viewBox="0 0 100 100" className="-rotate-90">
                <circle cx="50" cy="50" r={R} fill="none" stroke="#27272a" strokeWidth="5" />
                <circle
                    cx="50" cy="50" r={R}
                    fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={off}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums text-zinc-100 sm:text-3xl">{score}</span>
                <span className="text-[10px] text-zinc-500">exposure</span>
            </div>
        </div>
    );
}

function Evidence({ f }: { f: Finding }) {
    const quote = str(f.evidenceQuote);
    if (!quote) return null;
    const ok = (f.evidenceVerification as Finding | undefined)?.verified === true;
    return (
        <details className="group mt-2">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300">
                <Quote size={11} />
                Source
                {ok ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400"><BadgeCheck size={11} /> matched</span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-amber-300"><CircleDashed size={11} /> not exact</span>
                )}
            </summary>
            <p className="mt-1.5 rounded-md bg-zinc-900/70 p-2.5 text-xs italic leading-relaxed text-zinc-400">
                {quote}
            </p>
        </details>
    );
}

type Tab = "overview" | "risks" | "clauses" | "obligations" | "details" | "parties";

function Report({ item, onClose }: { item: Item; onClose: () => void }) {
    const [tab, setTab] = useState<Tab>("overview");
    const [showAll, setShowAll] = useState(false);
    const a = item.analysis;
    const d = dataOf(a) ?? {};
    const counts = riskCounts(a);
    const ver = verification(a);

    const risks = useMemo(() => {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return [...(d.risks ?? [])].sort((x, y) => (order[sev(x)] ?? 3) - (order[sev(y)] ?? 3));
    }, [d.risks]);

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
        { id: "details", label: "Details", icon: KeyRound, count: d.keyDetails?.length },
        { id: "parties", label: "Parties", icon: Users, count: parties.length },
    ];

    const summary = d.summary ?? "";

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="ci-fade absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <aside className="ci-fade relative flex h-full w-full flex-col border-l border-zinc-800 bg-zinc-950 sm:max-w-3xl">
                <header className="border-b border-zinc-800 px-4 pb-0 pt-4 sm:px-6 sm:pt-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="truncate font-serif text-lg text-zinc-100 sm:text-2xl">
                                {contractTitle(item.contract)}
                            </h2>
                            <p className="mt-1 truncate text-xs text-zinc-500">
                                Analyzed {fmtDate(a?.aiMetadata?.analyzedAt)}
                                {a?.lawyerReview?.status ? ` · lawyer review: ${a.lawyerReview.status.toLowerCase()}` : ""}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close report"
                            className="shrink-0 rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <nav className="-mb-px mt-3 flex gap-1 overflow-x-auto">
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-xs font-medium transition sm:px-3 sm:text-sm ${tab === t.id
                                    ? "border-amber-300 text-amber-200"
                                    : "border-transparent text-zinc-500 hover:text-zinc-200"
                                    }`}
                            >
                                <t.icon size={13} />
                                {t.label}
                                {t.count !== undefined && (
                                    <span className="rounded-full bg-zinc-800 px-1.5 text-[10px] text-zinc-400">
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </header>

                <div key={tab} className="ci-fade flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
                    {tab === "overview" && (
                        <>
                            <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
                                <RiskRing counts={counts} />
                                <div className="grid flex-1 grid-cols-3 gap-2 text-center">
                                    {[
                                        { k: "High", v: counts.high, c: "text-rose-400" },
                                        { k: "Medium", v: counts.medium, c: "text-amber-300" },
                                        { k: "Low", v: counts.low, c: "text-emerald-400" },
                                    ].map((x) => (
                                        <div key={x.k} className="rounded-md border border-zinc-800 bg-zinc-950/40 p-2.5">
                                            <p className={`text-xl font-semibold tabular-nums sm:text-3xl ${x.c}`}>{x.v}</p>
                                            <p className="text-[10px] text-zinc-500">{x.k}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Summary</h3>
                                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                                    {showAll || summary.length < 420 ? summary : `${summary.slice(0, 420)}...`}
                                </p>
                                {summary.length >= 420 && (
                                    <button
                                        onClick={() => setShowAll((s) => !s)}
                                        className="mt-2 text-xs font-medium text-amber-300 hover:text-amber-200"
                                    >
                                        {showAll ? "Show less" : "Read full summary"}
                                    </button>
                                )}
                            </div>

                            {!!d.reviewRecommendations?.length && (
                                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Before signing</h3>
                                    <ul className="mt-3 space-y-2.5">
                                        {d.reviewRecommendations.slice(0, 6).map((r, i) => (
                                            <li key={i} className="flex gap-2 text-sm leading-relaxed text-zinc-300">
                                                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-amber-300" />
                                                <span>
                                                    <span className="font-medium text-zinc-100">{str(r.topic)}.</span>{" "}
                                                    {str(r.recommendation)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}

                    {tab === "risks" &&
                        risks.map((r, i) => (
                            <div
                                key={i}
                                className={`rounded-lg border border-zinc-800 border-l-2 p-4 ${sevBorder[sev(r)] ?? "border-l-zinc-600"}`}
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-medium text-zinc-100">{str(r.title) || `Risk ${i + 1}`}</h4>
                                    <span className={`rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] capitalize ${sev(r) === "high" ? "text-rose-300" : sev(r) === "medium" ? "text-amber-300" : "text-emerald-300"
                                        }`}>
                                        {sev(r) || "unrated"}
                                    </span>
                                    {str(r.clauseReference) && (
                                        <span className="text-[11px] text-zinc-500">Clause {str(r.clauseReference)}</span>
                                    )}
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{str(r.explanation)}</p>
                                {str(r.recommendation) && (
                                    <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                                        <span className="font-medium text-amber-200">Fix:</span> {str(r.recommendation)}
                                    </p>
                                )}
                                <Evidence f={r} />
                            </div>
                        ))}

                    {tab === "clauses" &&
                        (d.clauses ?? []).map((c, i) => (
                            <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                                        {str(c.clauseReference)}
                                    </span>
                                    <h4 className="text-sm font-medium text-zinc-100">{str(c.title)}</h4>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{str(c.explanation)}</p>
                                <Evidence f={c} />
                            </div>
                        ))}

                    {tab === "obligations" &&
                        (d.obligations ?? []).map((o, i) => (
                            <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-200">
                                        {str(o.responsibleParty)}
                                    </span>
                                    {str(o.clauseReference) && (
                                        <span className="text-[11px] text-zinc-500">Clause {str(o.clauseReference)}</span>
                                    )}
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-zinc-200">{str(o.obligation)}</p>
                                <Evidence f={o} />
                            </div>
                        ))}

                    {tab === "details" && (
                        <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900/30">
                            {(d.keyDetails ?? []).map((k, i) => (
                                <div key={i} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
                                    <p className="text-xs text-zinc-500">{str(k.field)}</p>
                                    <div>
                                        <p className="text-sm text-zinc-100">{str(k.value)}</p>
                                        <Evidence f={k} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === "parties" &&
                        parties.map((p) => (
                            <div key={p.name} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                                <h4 className="text-sm font-medium text-zinc-100">{p.name}</h4>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {[...p.roles].map((r) => (
                                        <span key={r} className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
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
    const [runs, setRuns] = useState<Record<string, RunState>>({});
    const [toast, setToast] = useState<{ id: string; text: string } | null>(null);
    const [uploadOpen, setUploadOpen] = useState(false);
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
        return {
            total: items.length,
            analyzed: analyzed.length,
            high: analyzed.filter((i) => riskLevel(i.analysis) === "High").length,
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
        setToast({ id: c._id, text: `Uploaded ${contractTitle(c)}` });
    }, []);

    return (
        <div className="min-h-full bg-zinc-950 text-zinc-100">
            <Styles />

            <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
                            Contract intelligence
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
                            Run an AI analysis on any uploaded contract and get clauses, obligations and risks in one report.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            onClick={() => setUploadOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-300 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200"
                        >
                            <Upload size={14} /> Upload contract
                        </button>
                        <button
                            onClick={() => load(false)}
                            disabled={refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-800 px-3.5 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>
                </header>

                {/* Running banner */}
                {runningCount > 0 && (
                    <div className="ci-fade mt-5 flex items-start gap-2.5 rounded-lg border border-amber-300/30 bg-amber-300/5 px-3 py-2.5 text-xs text-amber-200 sm:items-center sm:px-4 sm:text-sm">
                        <Clock3 size={14} className="mt-0.5 shrink-0 sm:mt-0" />
                        <p>
                            {runningCount} {runningCount === 1 ? "analysis is" : "analyses are"} running (~5 min).
                            You can leave this tab and the report saves automatically.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-300 sm:items-center sm:px-4 sm:text-sm">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0 sm:mt-0" />
                        <span className="flex-1">{error}</span>
                        <button onClick={() => setError("")} className="shrink-0 text-rose-300/60 hover:text-rose-300" aria-label="Dismiss">
                            <X size={13} />
                        </button>
                    </div>
                )}

                {/* Stats — animated */}
                <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard index={0} label="Contracts" value={stats.total} icon={FileText} />
                    <StatCard index={1} label="Analyzed" value={stats.analyzed} icon={CheckCircle2} tone="success" />
                    <StatCard index={2} label="High risk" value={stats.high} icon={AlertTriangle} tone="danger" />
                    <StatCard index={3} label="Awaiting review" value={stats.unreviewed} icon={Scale} tone="warn" />
                </div>

                {/* Toolbar */}
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search contracts"
                            className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-300/60"
                        />
                    </div>
                    <div className="flex shrink-0 rounded-md border border-zinc-800 bg-zinc-900 p-0.5">
                        {(["All", "High", "Medium", "Low", "Pending"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium transition ${filter === f
                                    ? "bg-zinc-800 text-zinc-100"
                                    : "text-zinc-500 hover:text-zinc-300"
                                    }`}
                            >
                                {f === "Pending" ? "Not analyzed" : f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dossier */}
                {loading ? (
                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
                        <div className="h-96 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/30" />
                        <div className="h-96 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/30" />
                    </div>
                ) : visible.length === 0 ? (
                    <div className="mt-5 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 px-4 py-16 text-center">
                        <ScanSearch size={22} className="mx-auto text-zinc-600" />
                        <p className="mt-3 text-sm font-medium text-zinc-300">
                            {items.length ? "No contracts match these filters" : "No contracts yet"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            {items.length
                                ? "Clear the search or pick a different filter."
                                : "Upload a contract to get started."}
                        </p>
                        {!items.length && (
                            <button
                                onClick={() => setUploadOpen(true)}
                                className="mt-4 inline-flex items-center gap-2 rounded-md bg-amber-300 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200"
                            >
                                <Upload size={14} /> Upload contract
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
                        {/* Rail */}
                        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
                            <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5">
                                <h2 className="text-[11px] uppercase tracking-wider text-zinc-500">
                                    Documents <span className="text-zinc-600">({visible.length})</span>
                                </h2>
                                <button
                                    onClick={() => setUploadOpen(true)}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-amber-300"
                                >
                                    <Plus size={12} /> New
                                </button>
                            </div>
                            <div className="max-h-[560px] divide-y divide-zinc-800/70 overflow-y-auto">
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
                                    className="flex w-full items-center justify-center gap-1 border-t border-zinc-800 py-2 text-[11px] text-zinc-500 transition hover:text-zinc-300"
                                >
                                    <ChevronDown size={12} className={railExpanded ? "rotate-180" : ""} />
                                    {railExpanded ? "Show less" : `Show all ${visible.length}`}
                                </button>
                            )}
                        </div>

                        {/* Focus */}
                        <FocusPanel
                            item={selected}
                            run={selected ? runs[selected.contract._id] : undefined}
                            onOpenReport={() => selected && setReportId(selected.contract._id)}
                            onAnalyze={() => selected && startAnalysis(selected)}
                            onDelete={() => selected && handleDelete(selected)}
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
                            className="grid h-9 w-9 place-items-center rounded-md border border-zinc-800 text-zinc-300 transition hover:border-zinc-700 disabled:opacity-30"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs text-zinc-500">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            aria-label="Next page"
                            className="grid h-9 w-9 place-items-center rounded-md border border-zinc-800 text-zinc-300 transition hover:border-zinc-700 disabled:opacity-30"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>

            <UploadDialog
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                onUploaded={handleUploaded}
            />

            {reportItem && dataOf(reportItem.analysis) && (
                <Report item={reportItem} onClose={() => setReportId(null)} />
            )}

            {toast && (
                <div className="ci-fade fixed inset-x-3 bottom-3 z-[60] flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-zinc-200 shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:px-4 sm:text-sm">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                    <span className="flex-1 truncate">{toast.text}</span>
                    {toast.id && (
                        <button
                            onClick={() => {
                                setReportId(toast.id);
                                setToast(null);
                            }}
                            className="shrink-0 rounded-md bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-100 hover:bg-zinc-700"
                        >
                            View
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}