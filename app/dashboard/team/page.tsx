"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import {
  Search,
  Plus,
  Mail,
  Shield,
  Users,
  BriefcaseBusiness,
  Eye,
  Pencil,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Save,
  RotateCcw,
  LayoutGrid,
  Table2,
  Lock,
  Settings2,
  Clock3,
  UserPlus,
  X,
} from "lucide-react";
import { premiumToast } from "@/lib/premium-toast";

const API_URL = "https://nyaymitra-backend-production.up.railway.app";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-team-display",
  display: "swap",
});

/* =========================================================
   TYPES
========================================================= */

type ProfessionalRole = "lawyer" | "CA" | "CS";
type WorkspaceRole = "owner" | "admin" | "legal_manager" | "member" | "viewer";
type InvitableRole = Exclude<WorkspaceRole, "owner">;
type MemberStatus = "invited" | "active" | "suspended" | "removed";
type Level = 0 | 1 | 2;

interface User {
  _id?: string;
  userId?: string;
  fullName: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  avatar?: string;
  role?: string;
}

interface TeamMember {
  _id: string;
  business: string;
  user: User;
  workspaceRole: WorkspaceRole;
  permissions: string[];
  status: MemberStatus;
  invitedBy?: User;
  invitedAt?: string;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Invitation {
  _id: string;
  business: string;
  email: string;
  role: ProfessionalRole;
  workspaceRole: InvitableRole;
  permissions: string[];
  invitedBy?: User;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
  createdAt: string;
}

interface Business {
  _id: string;
  companyName: string;
  logo?: string;
}

interface TeamResponse {
  success: boolean;
  data: {
    business: Business;
    members: TeamMember[];
    invitations: Invitation[];
    totalMembers: number;
    pendingInvitations: number;
  };
  message?: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const PROFESSIONAL_ROLES: { value: ProfessionalRole; label: string }[] = [
  { value: "lawyer", label: "Lawyer" },
  { value: "CA", label: "Chartered Accountant" },
  { value: "CS", label: "Company Secretary" },
];

const WORKSPACE_ROLES: {
  value: InvitableRole;
  label: string;
  description: string;
}[] = [
    { value: "admin", label: "Admin", description: "Runs the team and workspace settings" },
    { value: "legal_manager", label: "Legal Manager", description: "Runs matters and contracts day to day" },
    { value: "member", label: "Member", description: "Works on assigned documents and tasks" },
    { value: "viewer", label: "Viewer", description: "Can look, cannot change anything" },
  ];

/** Each module has a colour. The same colour is used in the seal, the matrix and the pickers. */
const MODULES = [
  { key: "contracts", label: "Contracts", color: "#4f46e5", canManage: true },
  { key: "documents", label: "Documents", color: "#0d9488", canManage: true },
  { key: "matters", label: "Matters", color: "#d97706", canManage: true },
  { key: "tasks", label: "Tasks", color: "#e11d48", canManage: true },
  { key: "reports", label: "Reports", color: "#7c3aed", canManage: false },
] as const;

type Module = (typeof MODULES)[number];

const LEVEL_LABEL = ["No access", "View", "Manage"];

const ROLE_PRESETS: Record<InvitableRole, Record<Module["key"], Level>> = {
  admin: { contracts: 2, documents: 2, matters: 2, tasks: 2, reports: 1 },
  legal_manager: { contracts: 2, documents: 2, matters: 2, tasks: 2, reports: 1 },
  member: { contracts: 1, documents: 2, matters: 1, tasks: 2, reports: 0 },
  viewer: { contracts: 1, documents: 1, matters: 1, tasks: 1, reports: 1 },
};

const ROLE_BAR: { key: WorkspaceRole; label: string; tone: string }[] = [
  { key: "owner", label: "Owner", tone: "bg-foreground" },
  { key: "admin", label: "Admins", tone: "bg-primary" },
  { key: "legal_manager", label: "Legal managers", tone: "bg-sky-500" },
  { key: "member", label: "Members", tone: "bg-emerald-500" },
  { key: "viewer", label: "Viewers", tone: "bg-muted-foreground/40" },
];

/* =========================================================
   HELPERS
========================================================= */

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getProfessionalRoleLabel = (role?: string) =>
  PROFESSIONAL_ROLES.find((item) => item.value === role)?.label ||
  role ||
  "Unknown professional";

const getRoleLabel = (role: WorkspaceRole) => {
  if (role === "owner") return "Owner";
  return WORKSPACE_ROLES.find((item) => item.value === role)?.label || "Member";
};

const getAvatar = (user?: User) => user?.profilePhoto || user?.avatar || "";

const levelOf = (perms: string[], key: Module["key"]): Level => {
  if (perms.includes(`${key}.write`)) return 2;
  if (perms.includes(`${key}.read`)) return 1;
  return 0;
};

const withLevel = (perms: string[], key: Module["key"], level: Level) => {
  const rest = perms.filter((p) => p !== `${key}.read` && p !== `${key}.write`);
  if (level >= 1) rest.push(`${key}.read`);
  if (level === 2) rest.push(`${key}.write`);
  return rest;
};

const presetPerms = (role: InvitableRole) => {
  let perms: string[] = [];
  MODULES.forEach((m) => {
    perms = withLevel(perms, m.key, ROLE_PRESETS[role][m.key]);
  });
  return perms;
};

const FULL_ACCESS = (() => {
  let perms: string[] = [];
  MODULES.forEach((m) => {
    perms = withLevel(perms, m.key, m.canManage ? 2 : 1);
  });
  return perms;
})();

const samePerms = (a: string[], b: string[]) =>
  [...a].sort().join("|") === [...b].sort().join("|");

const effectivePerms = (member: TeamMember) =>
  member.workspaceRole === "owner" ? FULL_ACCESS : member.permissions || [];

function formatDate(date?: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function expiryLabel(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  return `Expires in ${days} day${days === 1 ? "" : "s"}`;
}

/* =========================================================
   ACCESS SEAL
   A notary-style stamp: five wedges (one per module).
   Inner ring = can view, outer ring = can manage.
========================================================= */

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function wedge(cx: number, cy: number, r1: number, r2: number, a0: number, a1: number) {
  const [x1, y1] = polar(cx, cy, r2, a0);
  const [x2, y2] = polar(cx, cy, r2, a1);
  const [x3, y3] = polar(cx, cy, r1, a1);
  const [x4, y4] = polar(cx, cy, r1, a0);
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
}

function AccessSeal({
  perms,
  size = 56,
  isOwner = false,
  className = "",
}: {
  perms: string[];
  size?: number;
  isOwner?: boolean;
  className?: string;
}) {
  const summary = MODULES.map(
    (m) => `${m.label}: ${LEVEL_LABEL[levelOf(perms, m.key)]}`
  ).join(", ");

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-label={`Access seal. ${summary}`}
      className={`text-foreground ${className}`}
    >
      <title>{summary}</title>
      {MODULES.map((m, i) => {
        const level = levelOf(perms, m.key);
        const start = -90 + i * 72 + 3;
        const end = start + 66;
        return (
          <g key={m.key}>
            <path
              d={wedge(24, 24, 9, 14.5, start, end)}
              fill={level >= 1 ? m.color : "currentColor"}
              opacity={level >= 1 ? 1 : 0.1}
              style={{ transition: "fill 200ms, opacity 200ms" }}
            />
            {m.canManage && (
              <path
                d={wedge(24, 24, 16, 22, start, end)}
                fill={level >= 2 ? m.color : "currentColor"}
                opacity={level >= 2 ? 1 : 0.1}
                style={{ transition: "fill 200ms, opacity 200ms" }}
              />
            )}
          </g>
        );
      })}
      <circle
        cx="24"
        cy="24"
        r="3.5"
        fill="currentColor"
        opacity={isOwner ? 0.9 : 0.15}
      />
    </svg>
  );
}

/* =========================================================
   SMALL PIECES
========================================================= */

function Avatar({ user, size = 48 }: { user: User; size?: number }) {
  const src = getAvatar(user);
  const style = { width: size, height: size };

  if (src) {
    return (
      <img
        src={src}
        alt={user.fullName}
        style={style}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={{ ...style, fontSize: size * 0.32 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
    >
      {getInitials(user.fullName)}
    </div>
  );
}

function Pill({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: "primary" | "muted";
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone === "primary"
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground"
        }`}
    >
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: MemberStatus }) {
  const config = {
    active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    suspended: { label: "Suspended", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    invited: { label: "Invited", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    removed: { label: "Removed", cls: "bg-muted text-muted-foreground" },
  }[status];

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.cls}`}>
      {config.label}
    </span>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 min-w-[150px] appearance-none rounded-xl border border-border bg-background pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [savingMatrix, setSavingMatrix] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"people" | "matrix">("people");

  const [showInvite, setShowInvite] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  /** Unsaved matrix edits, keyed by member id */
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});

  const fetchTeam = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");

      const token = getToken();
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(`${API_URL}/api/v1/team/all`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result: TeamResponse = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch team.");
      }

      setMembers(result.data.members || []);
      setInvitations(result.data.invitations || []);
      setBusiness(result.data.business || null);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to load your team.";
      setError(message);
      premiumToast.error("Could not load team", { description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  // One entrance moment: the role spectrum draws in once data is ready.
  useEffect(() => {
    if (loading) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [loading]);

  const patchMember = async (
    memberId: string,
    payload: {
      workspaceRole?: InvitableRole;
      role?: ProfessionalRole;
      permissions?: string[];
    }
  ) => {
    const response = await fetch(`${API_URL}/api/v1/team/${memberId}/role`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to update team member.");
    }
  };

  /* ---------- derived ---------- */

  const liveMembers = useMemo(() => members.filter((m) => m.status !== "removed"), [members]);
  const activeMembers = useMemo(() => members.filter((m) => m.status === "active"), [members]);
  const adminCount = useMemo(
    () =>
      members.filter(
        (m) => m.status === "active" && ["owner", "admin"].includes(m.workspaceRole)
      ).length,
    [members]
  );

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    liveMembers.forEach((m) => {
      counts[m.workspaceRole] = (counts[m.workspaceRole] || 0) + 1;
    });
    return counts;
  }, [liveMembers]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter((member) => {
      const haystack = [
        member.user?.fullName,
        member.user?.email,
        member.user?.role,
        member.workspaceRole,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || haystack.includes(query)) &&
        (roleFilter === "all" || member.workspaceRole === roleFilter) &&
        (typeFilter === "all" || member.user.role === typeFilter) &&
        (statusFilter === "all" || member.status === statusFilter)
      );
    });
  }, [members, search, roleFilter, typeFilter, statusFilter]);

  const hasFilters =
    !!search || roleFilter !== "all" || typeFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  /* ---------- actions ---------- */

  const handleInvite = async (payload: {
    email: string;
    role: ProfessionalRole;
    workspaceRole: InvitableRole;
    permissions: string[];
  }) => {
    try {
      setActionLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/v1/team/invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to send invitation.");
      }

      setShowInvite(false);
      premiumToast.success("Invitation sent", {
        description: `An invite has been sent to ${payload.email}.`,
      });
      await fetchTeam(true);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to invite team member.";
      setError(message);
      premiumToast.error("Invitation failed", { description: message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMember = async (
    memberId: string,
    payload: {
      workspaceRole?: InvitableRole;
      role?: ProfessionalRole;
      permissions?: string[];
    }
  ) => {
    try {
      setActionLoading(true);
      setError("");
      await patchMember(memberId, payload);

      setShowEdit(false);
      setSelectedMember(null);
      setDrafts((d) => {
        const copy = { ...d };
        delete copy[memberId];
        return copy;
      });
      premiumToast.success("Member updated", {
        description: "Access and permissions have been saved.",
      });
      await fetchTeam(true);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to update team member.";
      setError(message);
      premiumToast.error("Update failed", { description: message });
    } finally {
      setActionLoading(false);
    }
  };

  /* ---------- matrix ---------- */

  const permsOf = (m: TeamMember) => drafts[m._id] ?? effectivePerms(m);
  const isLocked = (m: TeamMember) => m.workspaceRole === "owner" || m.status === "removed";
  const dirtyIds = Object.keys(drafts);

  const cycleCell = (member: TeamMember, mod: Module) => {
    const current = permsOf(member);
    const max = mod.canManage ? 2 : 1;
    const next = ((levelOf(current, mod.key) + 1) % (max + 1)) as Level;
    const updated = withLevel(current, mod.key, next);

    setDrafts((d) => {
      const copy = { ...d };
      if (samePerms(updated, member.permissions || [])) delete copy[member._id];
      else copy[member._id] = updated;
      return copy;
    });
  };

  const saveDrafts = async () => {
    setSavingMatrix(true);
    let saved = 0;
    const failed: string[] = [];

    for (const id of dirtyIds) {
      const member = members.find((m) => m._id === id);
      if (!member || member.workspaceRole === "owner") continue;
      try {
        await patchMember(id, {
          permissions: drafts[id],
          workspaceRole: member.workspaceRole as InvitableRole,
          role: member.user.role as ProfessionalRole,
        });
        saved += 1;
        setDrafts((d) => {
          const copy = { ...d };
          delete copy[id];
          return copy;
        });
      } catch {
        failed.push(member.user.fullName);
      }
    }

    if (saved) {
      premiumToast.success("Access saved", {
        description: `Updated ${saved} team member${saved === 1 ? "" : "s"}.`,
      });
    }
    if (failed.length) {
      premiumToast.error("Some changes did not save", {
        description: `Try again for: ${failed.join(", ")}.`,
      });
    }

    await fetchTeam(true);
    setSavingMatrix(false);
  };

  /* ---------- render ---------- */

  const company = business?.companyName || "your workspace";
  const peopleLabel = activeMembers.length === 1 ? "person" : "people";

  const barTotal = liveMembers.length + invitations.length;

  return (
    <div className={`${display.variable} tm-root min-h-full bg-background`}>
      <style>{`
        .tm-display { font-family: var(--font-team-display), ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.025em; }
        @keyframes tm-slide { from { transform: translateX(32px); opacity: 0 } to { transform: none; opacity: 1 } }
        .tm-slide { animation: tm-slide 220ms cubic-bezier(.2,.8,.2,1) both; }
        @keyframes tm-rise { from { transform: translate(-50%, 16px); opacity: 0 } to { transform: translate(-50%, 0); opacity: 1 } }
        .tm-rise { animation: tm-rise 200ms cubic-bezier(.2,.8,.2,1) both; }
        .tm-reveal { transition: clip-path 1000ms cubic-bezier(.2,.8,.2,1); }
        @media (prefers-reduced-motion: reduce) {
          .tm-slide, .tm-rise { animation: none; }
          .tm-reveal { transition: none; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">
        {/* ---------- Header ---------- */}
        <header className="mb-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <h1 className="tm-display text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl">
                {loading
                  ? "Loading your team"
                  : `${activeMembers.length} ${peopleLabel} can open ${company}.`}
              </h1>

              {!loading && (
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  {adminCount} {adminCount === 1 ? "person manages" : "people manage"} the
                  team
                  {invitations.length > 0
                    ? `, and ${invitations.length} invite${invitations.length === 1 ? " is" : "s are"
                    } waiting to be accepted.`
                    : "."}{" "}
                  Decide who sees contracts, documents, matters, tasks and reports.
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setError("");
                setShowInvite(true);
              }}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            >
              <UserPlus className="h-4 w-4" />
              Invite someone
            </button>
          </div>

          {/* Role spectrum: the one memorable element on the page */}
          {!loading && barTotal > 0 && (
            <div className="mt-8">
              <div
                className="tm-reveal flex h-4 w-full gap-1"
                style={{
                  clipPath: mounted ? "inset(0 0 0 0 round 8px)" : "inset(0 100% 0 0 round 8px)",
                }}
              >
                {ROLE_BAR.filter((r) => roleCounts[r.key]).map((r) => {
                  const dim = roleFilter !== "all" && roleFilter !== r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      aria-label={`Filter by ${r.label}`}
                      aria-pressed={roleFilter === r.key}
                      title={`${r.label}: ${roleCounts[r.key]}`}
                      onClick={() => setRoleFilter(roleFilter === r.key ? "all" : r.key)}
                      style={{ flexGrow: roleCounts[r.key] }}
                      className={`${r.tone} h-full min-w-[14px] rounded-[5px] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dim ? "opacity-25" : "opacity-100"
                        }`}
                    />
                  );
                })}

                {invitations.length > 0 && (
                  <div
                    title={`Pending invitations: ${invitations.length}`}
                    style={{ flexGrow: invitations.length }}
                    className="h-full min-w-[14px] rounded-[5px] border border-dashed border-primary/60 bg-primary/10"
                  />
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {ROLE_BAR.filter((r) => roleCounts[r.key]).map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRoleFilter(roleFilter === r.key ? "all" : r.key)}
                    className={`inline-flex items-center gap-2 transition hover:text-foreground ${roleFilter === r.key ? "font-semibold text-foreground" : ""
                      }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-[3px] ${r.tone}`} />
                    {r.label}
                    <span className="text-foreground">{roleCounts[r.key]}</span>
                  </button>
                ))}

                {invitations.length > 0 && (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-[3px] border border-dashed border-primary/60 bg-primary/10" />
                    Pending invites
                    <span className="text-foreground">{invitations.length}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </header>

        {/* ---------- Error ---------- */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">{error}</div>
            <button
              onClick={() => setError("")}
              aria-label="Dismiss"
              className="rounded-md p-1 hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ---------- Toolbar ---------- */}
        <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or role"
              className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <FilterSelect
            label="Professional type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[{ value: "all", label: "All professions" }, ...PROFESSIONAL_ROLES]}
          />

          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "Any status" },
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
              { value: "invited", label: "Invited" },
            ]}
          />

          <div
            role="tablist"
            aria-label="Team view"
            className="inline-flex h-11 shrink-0 rounded-xl border border-border bg-muted/40 p-1"
          >
            {(
              [
                { id: "people", label: "People", icon: LayoutGrid },
                { id: "matrix", label: "Access grid", icon: Table2 },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={view === tab.id}
                onClick={() => setView(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition ${view === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {hasFilters && (
          <div className="-mt-2 mb-6 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {filteredMembers.length} of {members.length} team members
            </span>
            <button onClick={clearFilters} className="font-medium text-primary hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {/* ---------- Members ---------- */}
        <section className="mb-12" aria-live="polite">
          {loading ? (
            <LoadingState />
          ) : filteredMembers.length === 0 ? (
            <EmptyState
              hasFilters={hasFilters}
              onClear={clearFilters}
              onAdd={() => setShowInvite(true)}
            />
          ) : view === "people" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filteredMembers.map((member) => (
                <MemberCard
                  key={member._id}
                  member={member}
                  onView={() => {
                    setSelectedMember(member);
                    setShowView(true);
                  }}
                  onEdit={() => {
                    setSelectedMember(member);
                    setShowEdit(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <AccessGrid
              members={filteredMembers}
              permsOf={permsOf}
              isLocked={isLocked}
              drafts={drafts}
              onCycle={cycleCell}
            />
          )}
        </section>

        {/* ---------- Pending invitations ---------- */}
        {!loading && invitations.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              <h2 className="tm-display text-xl font-semibold text-foreground">
                Waiting to join
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {invitations.map((inv) => (
                <InvitationTicket key={inv._id} invitation={inv} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ---------- Unsaved matrix changes ---------- */}
      {dirtyIds.length > 0 && (
        <div
          role="status"
          className="tm-rise fixed bottom-6 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-xl items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-2xl"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {dirtyIds.length} {dirtyIds.length === 1 ? "person has" : "people have"} unsaved
              access changes
            </p>
            <p className="text-xs text-muted-foreground">Nothing changes until you save.</p>
          </div>

          <button
            onClick={() => setDrafts({})}
            disabled={savingMatrix}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Discard
          </button>

          <button
            onClick={saveDrafts}
            disabled={savingMatrix}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {savingMatrix ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {savingMatrix ? "Saving" : "Save changes"}
          </button>
        </div>
      )}

      {/* ---------- Drawers ---------- */}
      {showInvite && (
        <InviteDrawer
          loading={actionLoading}
          onClose={() => setShowInvite(false)}
          onSubmit={handleInvite}
        />
      )}

      {showEdit && selectedMember && (
        <EditDrawer
          member={selectedMember}
          loading={actionLoading}
          onClose={() => {
            setShowEdit(false);
            setSelectedMember(null);
          }}
          onSubmit={handleUpdateMember}
        />
      )}

      {showView && selectedMember && (
        <ViewDrawer
          member={selectedMember}
          onClose={() => {
            setShowView(false);
            setSelectedMember(null);
          }}
          onEdit={() => {
            setShowView(false);
            setShowEdit(true);
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   MEMBER CARD
========================================================= */

function MemberCard({
  member,
  onView,
  onEdit,
}: {
  member: TeamMember;
  onView: () => void;
  onEdit: () => void;
}) {
  const perms = effectivePerms(member);
  const isOwner = member.workspaceRole === "owner";

  return (
    <article
      className={`flex flex-col rounded-3xl border bg-card p-5 ${member.status === "removed" ? "opacity-60" : ""
        } ${isOwner ? "border-foreground/25" : "border-border"}`}
    >
      <div className="flex items-start gap-4">
        <Avatar user={member.user} />

        <div className="min-w-0 flex-1">
          <h3 className="tm-display truncate text-lg font-semibold text-foreground">
            {member.user.fullName}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{member.user.email}</p>
        </div>

        <AccessSeal perms={perms} size={64} isOwner={isOwner} className="shrink-0" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Pill>{getRoleLabel(member.workspaceRole)}</Pill>
        <Pill tone="muted">{getProfessionalRoleLabel(member.user.role)}</Pill>
        <StatusPill status={member.status} />
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {MODULES.map((m) => {
          const level = levelOf(perms, m.key);
          return (
            <li
              key={m.key}
              className={`inline-flex items-center gap-1.5 ${level ? "text-foreground" : "text-muted-foreground/60"
                }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: level ? m.color : "transparent",
                  border: level ? "none" : "1px solid currentColor",
                }}
              />
              {m.label}
              {level > 0 && (
                <span className="text-muted-foreground">
                  {level === 2 ? "manage" : "view"}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <p className="mr-auto text-xs text-muted-foreground">
          {member.joinedAt ? `Joined ${formatDate(member.joinedAt)}` : "Has not joined yet"}
        </p>

        <button
          onClick={onView}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          <Eye className="h-4 w-4" />
          View
        </button>

        {!isOwner && member.status !== "removed" ? (
          <button
            onClick={onEdit}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-sm font-medium text-background transition hover:opacity-90"
          >
            <Pencil className="h-4 w-4" />
            Manage access
          </button>
        ) : (
          isOwner && (
            <span className="inline-flex h-9 items-center gap-1.5 px-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Full access
            </span>
          )
        )}
      </div>
    </article>
  );
}

/* =========================================================
   ACCESS GRID (matrix)
========================================================= */

function AccessGrid({
  members,
  permsOf,
  isLocked,
  drafts,
  onCycle,
}: {
  members: TeamMember[];
  permsOf: (m: TeamMember) => string[];
  isLocked: (m: TeamMember) => boolean;
  drafts: Record<string, string[]>;
  onCycle: (m: TeamMember, mod: Module) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Select a cell to step through no access, view and manage. Changes stay in draft until
        you save.
      </p>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 bg-card px-5 py-4 text-sm font-medium text-muted-foreground">
                Person
              </th>
              {MODULES.map((m) => {
                const withAccess = members.filter((x) => levelOf(permsOf(x), m.key) > 0).length;
                return (
                  <th key={m.key} className="px-3 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                      {m.label}
                    </div>
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                      {withAccess} of {members.length} can open
                    </p>
                  </th>
                );
              })}
              <th className="px-5 py-4 text-sm font-medium text-muted-foreground">Seal</th>
            </tr>
          </thead>

          <tbody>
            {members.map((member) => {
              const perms = permsOf(member);
              const locked = isLocked(member);
              const dirty = !!drafts[member._id];

              return (
                <tr
                  key={member._id}
                  className={`border-b border-border last:border-0 ${dirty ? "bg-primary/[0.04]" : ""
                    }`}
                >
                  <td className="sticky left-0 z-10 bg-card px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={member.user} size={36} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {member.user.fullName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {getRoleLabel(member.workspaceRole)}
                          {dirty && <span className="ml-2 text-primary">edited</span>}
                        </p>
                      </div>
                    </div>
                  </td>

                  {MODULES.map((mod) => {
                    const level = levelOf(perms, mod.key);
                    return (
                      <td key={mod.key} className="px-3 py-3">
                        <GridCell
                          level={level}
                          mod={mod}
                          locked={locked}
                          label={`${member.user.fullName}, ${mod.label}: ${LEVEL_LABEL[level]}`}
                          onClick={() => onCycle(member, mod)}
                        />
                      </td>
                    );
                  })}

                  <td className="px-5 py-3">
                    <AccessSeal
                      perms={perms}
                      size={36}
                      isOwner={member.workspaceRole === "owner"}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GridCell({
  level,
  mod,
  locked,
  label,
  onClick,
}: {
  level: Level;
  mod: Module;
  locked: boolean;
  label: string;
  onClick: () => void;
}) {
  const style: React.CSSProperties =
    level === 2
      ? { background: mod.color, color: "#fff", borderColor: mod.color }
      : level === 1
        ? { background: `${mod.color}24`, color: mod.color, borderColor: `${mod.color}55` }
        : {};

  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      aria-label={label}
      style={style}
      className={`h-9 w-full min-w-[84px] rounded-lg border text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${level === 0 ? "border-dashed border-border text-muted-foreground/60" : ""
        } ${locked ? "cursor-not-allowed opacity-70" : "hover:brightness-110"}`}
    >
      {locked && level > 0 ? (
        <span className="inline-flex items-center gap-1">
          <Lock className="h-3 w-3" />
          {LEVEL_LABEL[level]}
        </span>
      ) : level === 0 ? (
        "None"
      ) : (
        LEVEL_LABEL[level]
      )}
    </button>
  );
}

/* =========================================================
   INVITATION TICKET
========================================================= */

function InvitationTicket({ invitation }: { invitation: Invitation }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary/[0.03] p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Mail className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{invitation.email}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {getProfessionalRoleLabel(invitation.role)} as {getRoleLabel(invitation.workspaceRole)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sent {formatDate(invitation.createdAt)}. {expiryLabel(invitation.expiresAt)}.
        </p>
      </div>

      <AccessSeal perms={invitation.permissions || []} size={44} />
    </div>
  );
}

/* =========================================================
   DRAWER SHELL
========================================================= */

function Drawer({
  title,
  description,
  icon,
  onClose,
  footer,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-[2px]"
      />

      <aside className="tm-slide absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <h2 className="tm-display text-xl font-semibold text-foreground">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}

        {footer && (
          <div className="shrink-0 border-t border-border bg-background px-6 py-4">{footer}</div>
        )}
      </aside>
    </div>
  );
}

/* =========================================================
   ACCESS FIELDS (shared by invite + edit)
========================================================= */

function LevelPicker({
  mod,
  level,
  onChange,
}: {
  mod: Module;
  level: Level;
  onChange: (level: Level) => void;
}) {
  const options: Level[] = mod.canManage ? [0, 1, 2] : [0, 1];

  return (
    <div
      role="group"
      aria-label={`${mod.label} access`}
      className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
    >
      {options.map((opt) => {
        const active = level === opt;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt)}
            style={
              active && opt > 0
                ? { background: opt === 2 ? mod.color : `${mod.color}2e`, color: opt === 2 ? "#fff" : mod.color }
                : undefined
            }
            className={`h-8 rounded-md px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active && opt === 0
                ? "bg-background text-foreground shadow-sm"
                : !active
                  ? "text-muted-foreground hover:text-foreground"
                  : ""
              }`}
          >
            {opt === 0 ? "None" : LEVEL_LABEL[opt]}
          </button>
        );
      })}
    </div>
  );
}

function AccessFields({
  professionalRole,
  onProfessionalRole,
  workspaceRole,
  onWorkspaceRole,
  permissions,
  onPermissions,
}: {
  professionalRole: ProfessionalRole;
  onProfessionalRole: (r: ProfessionalRole) => void;
  workspaceRole: InvitableRole;
  onWorkspaceRole: (r: InvitableRole) => void;
  permissions: string[];
  onPermissions: (p: string[]) => void;
}) {
  const matchesPreset = samePerms(permissions, presetPerms(workspaceRole));

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground">What do they do?</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Their profession, shown next to their name.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {PROFESSIONAL_ROLES.map((type) => {
            const active = professionalRole === type.value;
            return (
              <button
                key={type.value}
                type="button"
                aria-pressed={active}
                onClick={() => onProfessionalRole(type.value)}
                className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${active
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground">Role in the workspace</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Picking a role fills in sensible access. You can adjust it below.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {WORKSPACE_ROLES.map((role) => {
            const active = workspaceRole === role.value;
            const Icon =
              role.value === "admin"
                ? Shield
                : role.value === "legal_manager"
                  ? BriefcaseBusiness
                  : role.value === "viewer"
                    ? Eye
                    : Users;

            return (
              <button
                key={role.value}
                type="button"
                aria-pressed={active}
                onClick={() => onWorkspaceRole(role.value)}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${active
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/30 hover:bg-muted/40"
                  }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{role.label}</p>
                  <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Access by module</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {matchesPreset
                ? `Matches the ${getRoleLabel(workspaceRole)} defaults.`
                : "Custom access."}
              {!matchesPreset && (
                <button
                  type="button"
                  onClick={() => onPermissions(presetPerms(workspaceRole))}
                  className="ml-2 font-medium text-primary hover:underline"
                >
                  Reset to {getRoleLabel(workspaceRole)} defaults
                </button>
              )}
            </p>
          </div>

          <AccessSeal perms={permissions} size={64} className="shrink-0" />
        </div>

        <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
          {MODULES.map((mod) => (
            <div key={mod.key} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: mod.color }} />
                {mod.label}
              </div>
              <LevelPicker
                mod={mod}
                level={levelOf(permissions, mod.key)}
                onChange={(level) => onPermissions(withLevel(permissions, mod.key, level))}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   INVITE DRAWER
========================================================= */

function InviteDrawer({
  loading,
  onClose,
  onSubmit,
}: {
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    email: string;
    role: ProfessionalRole;
    workspaceRole: InvitableRole;
    permissions: string[];
  }) => void;
}) {
  const [email, setEmail] = useState("");
  const [professionalRole, setProfessionalRole] = useState<ProfessionalRole>("lawyer");
  const [workspaceRole, setWorkspaceRole] = useState<InvitableRole>("member");
  const [permissions, setPermissions] = useState<string[]>(presetPerms("member"));
  const [formError, setFormError] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setFormError("Enter an email address.");
      premiumToast.warning("Email required", {
        description: "Enter an email address to send the invitation.",
      });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFormError("Enter a valid email address, like name@company.com.");
      premiumToast.warning("Invalid email", {
        description: "Please check the email format and try again.",
      });
      return;
    }

    onSubmit({
      email: email.trim().toLowerCase(),
      role: professionalRole,
      workspaceRole,
      permissions,
    });
  };

  return (
    <Drawer
      title="Invite someone"
      description="They get an email with exactly the access you set here."
      icon={<UserPlus className="h-5 w-5" />}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          <AccessSeal perms={permissions} size={40} className="shrink-0" />
          <p className="mr-auto min-w-0 truncate text-sm text-muted-foreground">
            {email.trim() || "name@company.com"}
          </p>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 rounded-xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="tm-invite-form"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send invitation
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="tm-invite-form" onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-8">
          <div>
            <label htmlFor="tm-email" className="mb-2 block text-sm font-semibold text-foreground">
              Work email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="tm-email"
                type="email"
                value={email}
                autoFocus
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormError("");
                }}
                placeholder="name@company.com"
                className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
            {formError && <p className="mt-2 text-xs text-destructive">{formError}</p>}
          </div>

          <AccessFields
            professionalRole={professionalRole}
            onProfessionalRole={setProfessionalRole}
            workspaceRole={workspaceRole}
            onWorkspaceRole={(role) => {
              setWorkspaceRole(role);
              setPermissions(presetPerms(role));
            }}
            permissions={permissions}
            onPermissions={setPermissions}
          />
        </div>
      </form>
    </Drawer>
  );
}

/* =========================================================
   EDIT DRAWER
========================================================= */

function EditDrawer({
  member,
  loading,
  onClose,
  onSubmit,
}: {
  member: TeamMember;
  loading: boolean;
  onClose: () => void;
  onSubmit: (
    memberId: string,
    payload: {
      workspaceRole?: InvitableRole;
      role?: ProfessionalRole;
      permissions?: string[];
    }
  ) => void;
}) {
  const [professionalRole, setProfessionalRole] = useState<ProfessionalRole>(
    (member.user.role as ProfessionalRole) || "lawyer"
  );
  const [workspaceRole, setWorkspaceRole] = useState<InvitableRole>(
    member.workspaceRole === "owner" ? "admin" : member.workspaceRole
  );
  const [permissions, setPermissions] = useState<string[]>(member.permissions || []);

  const changed =
    professionalRole !== member.user.role ||
    workspaceRole !== member.workspaceRole ||
    !samePerms(permissions, member.permissions || []);

  return (
    <Drawer
      title="Manage access"
      description="Changes apply as soon as you save."
      icon={<Settings2 className="h-5 w-5" />}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          <p className="mr-auto hidden text-xs text-muted-foreground sm:block">
            {changed ? "You have unsaved changes." : "No changes yet."}
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="tm-edit-form"
            disabled={loading || !changed}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            )}
          </button>
        </div>
      }
    >
      <form
        id="tm-edit-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(member._id, { role: professionalRole, workspaceRole, permissions });
        }}
        className="min-h-0 flex-1 overflow-y-auto px-6 py-6"
      >
        <div className="mb-8 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <Avatar user={member.user} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{member.user.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
          </div>
          <StatusPill status={member.status} />
        </div>

        <AccessFields
          professionalRole={professionalRole}
          onProfessionalRole={setProfessionalRole}
          workspaceRole={workspaceRole}
          onWorkspaceRole={setWorkspaceRole}
          permissions={permissions}
          onPermissions={setPermissions}
        />
      </form>
    </Drawer>
  );
}

/* =========================================================
   VIEW DRAWER
========================================================= */

function ViewDrawer({
  member,
  onClose,
  onEdit,
}: {
  member: TeamMember;
  onClose: () => void;
  onEdit: () => void;
}) {
  const perms = effectivePerms(member);
  const isOwner = member.workspaceRole === "owner";

  return (
    <Drawer
      title="Team member"
      description="Membership and what this person can open."
      icon={<Users className="h-5 w-5" />}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-lg border border-border text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Close
          </button>
          {!isOwner && member.status !== "removed" && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Settings2 className="h-4 w-4" />
              Manage access
            </button>
          )}
        </div>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="flex items-center gap-5 rounded-3xl border border-border bg-card p-5">
          <AccessSeal perms={perms} size={96} isOwner={isOwner} className="shrink-0" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <Avatar user={member.user} size={40} />
              <h3 className="tm-display truncate text-xl font-semibold text-foreground">
                {member.user.fullName}
              </h3>
            </div>
            <p className="mt-2 truncate text-sm text-muted-foreground">{member.user.email}</p>
            {member.user.phone && (
              <p className="truncate text-sm text-muted-foreground">{member.user.phone}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill>{getRoleLabel(member.workspaceRole)}</Pill>
              <Pill tone="muted">{getProfessionalRoleLabel(member.user.role)}</Pill>
              <StatusPill status={member.status} />
            </div>
          </div>
        </div>

        <h3 className="mt-8 text-sm font-semibold text-foreground">What they can open</h3>

        <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {MODULES.map((mod) => {
            const level = levelOf(perms, mod.key);
            return (
              <div key={mod.key} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: mod.color }} />
                  {mod.label}
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={
                    level === 2
                      ? { background: mod.color, color: "#fff" }
                      : level === 1
                        ? { background: `${mod.color}24`, color: mod.color }
                        : undefined
                  }
                >
                  {level === 0 ? (
                    <span className="text-muted-foreground">No access</span>
                  ) : (
                    LEVEL_LABEL[level]
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Joined</dt>
            <dd className="mt-1 font-medium text-foreground">
              {member.joinedAt ? formatDate(member.joinedAt) : "Not yet"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Invited by</dt>
            <dd className="mt-1 font-medium text-foreground">
              {member.invitedBy?.fullName || "—"}
            </dd>
          </div>
        </dl>
      </div>
    </Drawer>
  );
}

/* =========================================================
   EMPTY + LOADING
========================================================= */

function EmptyState({
  hasFilters,
  onClear,
  onAdd,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <AccessSeal perms={[]} size={72} className="mx-auto" />

      <h3 className="tm-display mt-5 text-xl font-semibold text-foreground">
        {hasFilters ? "No one matches these filters" : "No one else has access yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {hasFilters
          ? "Try a different search, or clear the filters to see everyone."
          : "Invite lawyers, CAs, company secretaries and your own staff, and choose what each of them can open."}
      </p>

      <div className="mt-6 flex justify-center">
        {hasFilters ? (
          <button
            onClick={onClear}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Clear filters
          </button>
        ) : (
          <button
            onClick={onAdd}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Invite someone
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-3xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted" />
            <div className="flex-1">
              <div className="h-4 w-36 rounded bg-muted" />
              <div className="mt-2 h-3 w-48 rounded bg-muted" />
            </div>
            <div className="h-16 w-16 rounded-full bg-muted" />
          </div>
          <div className="mt-5 flex gap-2">
            <div className="h-6 w-20 rounded-full bg-muted" />
            <div className="h-6 w-28 rounded-full bg-muted" />
          </div>
          <div className="mt-5 h-3 w-3/4 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}