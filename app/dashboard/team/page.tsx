"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Shield,
  Users,
  UserCheck,
  Clock3,
  BriefcaseBusiness,
  Eye,
  Pencil,
  UserRoundCheck,
  UserRoundX,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Settings2,
  Check,
  Save,
  ShieldCheck,
  ShieldOff,
  UserRound,
  X,
} from "lucide-react";

const API_URL = "https://nyaymitra-backend-production.up.railway.app";

type MemberType =
  | "employee"
  | "lawyer"
  | "CA"
  | "CS"
  | "consultant"
  | "other";

type WorkspaceRole =
  | "owner"
  | "admin"
  | "legal_manager"
  | "member"
  | "viewer";

type MemberStatus = "invited" | "active" | "suspended" | "removed";

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
  memberType: MemberType;
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
  memberType: MemberType;
  workspaceRole: Exclude<WorkspaceRole, "owner">;
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

const MEMBER_TYPES: {
  value: MemberType;
  label: string;
}[] = [
    { value: "employee", label: "Employee" },
    { value: "lawyer", label: "Lawyer" },
    { value: "CA", label: "Chartered Accountant" },
    { value: "CS", label: "Company Secretary" },
    { value: "consultant", label: "Consultant" },
    { value: "other", label: "Other" },
  ];

const WORKSPACE_ROLES: {
  value: Exclude<WorkspaceRole, "owner">;
  label: string;
  description: string;
}[] = [
    {
      value: "admin",
      label: "Admin",
      description: "Manage team and workspace settings",
    },
    {
      value: "legal_manager",
      label: "Legal Manager",
      description: "Manage legal operations and matters",
    },
    {
      value: "member",
      label: "Member",
      description: "Standard workspace access",
    },
    {
      value: "viewer",
      label: "Viewer",
      description: "Read-only workspace access",
    },
  ];

const PERMISSIONS = [
  {
    key: "contracts.read",
    label: "View Contracts",
    group: "Contracts",
  },
  {
    key: "contracts.write",
    label: "Manage Contracts",
    group: "Contracts",
  },
  {
    key: "documents.read",
    label: "View Documents",
    group: "Documents",
  },
  {
    key: "documents.write",
    label: "Manage Documents",
    group: "Documents",
  },
  {
    key: "matters.read",
    label: "View Matters",
    group: "Matters",
  },
  {
    key: "matters.write",
    label: "Manage Matters",
    group: "Matters",
  },
  {
    key: "tasks.read",
    label: "View Tasks",
    group: "Tasks",
  },
  {
    key: "tasks.write",
    label: "Manage Tasks",
    group: "Tasks",
  },
  {
    key: "reports.read",
    label: "View Reports",
    group: "Reports",
  },
];

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

const getMemberTypeLabel = (type: MemberType) => {
  return (
    MEMBER_TYPES.find((item) => item.value === type)?.label || "Other"
  );
};

const getRoleLabel = (role: WorkspaceRole) => {
  if (role === "legal_manager") return "Legal Manager";

  return (
    WORKSPACE_ROLES.find((item) => item.value === role)?.label || "Member"
  );
};

const getAvatar = (user?: User) => {
  return user?.profilePhoto || user?.avatar || "";
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedMember, setSelectedMember] =
    useState<TeamMember | null>(null);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found.");
      }

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

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load your team."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  useEffect(() => {
    if (!successMessage) return;

    const timeout = setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    return () => clearTimeout(timeout);
  }, [successMessage]);

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === "active"),
    [members]
  );

  const suspendedMembers = useMemo(
    () => members.filter((member) => member.status === "suspended"),
    [members]
  );

  const admins = useMemo(
    () =>
      members.filter(
        (member) =>
          member.status === "active" &&
          ["owner", "admin"].includes(member.workspaceRole)
      ),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const name = member.user?.fullName?.toLowerCase() || "";
      const email = member.user?.email?.toLowerCase() || "";
      const memberType = member.memberType?.toLowerCase() || "";
      const workspaceRole =
        member.workspaceRole?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        name.includes(query) ||
        email.includes(query) ||
        memberType.includes(query) ||
        workspaceRole.includes(query);

      const matchesRole =
        roleFilter === "all" ||
        member.workspaceRole === roleFilter;

      const matchesType =
        typeFilter === "all" ||
        member.memberType === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        member.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesType &&
        matchesStatus
      );
    });
  }, [members, search, roleFilter, typeFilter, statusFilter]);

  const handleInvite = async (payload: {
    email: string;
    memberType: MemberType;
    workspaceRole: Exclude<WorkspaceRole, "owner">;
    permissions: string[];
  }) => {
    try {
      setActionLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/v1/team/invite`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to send invitation."
        );
      }

      setShowInviteModal(false);

      setSuccessMessage(
        "Team invitation created successfully."
      );

      await fetchTeam();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to invite team member."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMember = async (
    memberId: string,
    payload: {
      workspaceRole?: Exclude<WorkspaceRole, "owner">;
      memberType?: MemberType;
      permissions?: string[];
    }
  ) => {
    try {
      setActionLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/v1/team/${memberId}/role`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update team member."
        );
      }

      setShowEditModal(false);
      setSelectedMember(null);

      setSuccessMessage(
        "Team member updated successfully."
      );

      await fetchTeam();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update team member."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const openViewMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowViewModal(true);
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Workspace</span>
              <span>/</span>
              <span className="text-foreground">My Team</span>
            </div>

            <h1 className="text-display-lg font-semibold tracking-tight text-foreground">
              My Team
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage everyone who has access to{" "}
              {business?.companyName
                ? business.companyName
                : "your workspace"}
              .
            </p>
          </div>

          <button
            onClick={() => {
              setError("");
              setShowInviteModal(true);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Team Member
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <div className="flex-1">
              {error}
            </div>

            <button
              onClick={() => setError("")}
              className="rounded-md p-1 hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            {successMessage}
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Total Members"
            value={activeMembers.length}
            description="Active workspace members"
          />

          <StatCard
            icon={<UserCheck className="h-5 w-5" />}
            label="Active"
            value={activeMembers.length}
            description="Currently active"
          />

          <StatCard
            icon={<Clock3 className="h-5 w-5" />}
            label="Pending Invitations"
            value={invitations.length}
            description="Awaiting acceptance"
          />

          <StatCard
            icon={<Shield className="h-5 w-5" />}
            label="Admins"
            value={admins.length}
            description="Workspace administrators"
          />
        </div>

        {/* Search / Filters */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, email, role or type..."
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <FilterSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: "all", label: "All Roles" },
                ...WORKSPACE_ROLES.map((role) => ({
                  value: role.value,
                  label: role.label,
                })),
                {
                  value: "owner",
                  label: "Owner",
                },
              ]}
            />

            <FilterSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: "all", label: "All Types" },
                ...MEMBER_TYPES,
              ]}
            />

            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Statuses" },
                {
                  value: "active",
                  label: "Active",
                },
                {
                  value: "suspended",
                  label: "Suspended",
                },
                {
                  value: "invited",
                  label: "Invited",
                },
              ]}
            />
          </div>

          {(search ||
            roleFilter !== "all" ||
            typeFilter !== "all" ||
            statusFilter !== "all") && (
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  Showing {filteredMembers.length} of{" "}
                  {members.length} team members
                </p>

                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
        </div>

        {/* Team Members */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Team Members
              </h2>

              <p className="mt-0.5 text-sm text-muted-foreground">
                People currently associated with your workspace
              </p>
            </div>

            {!loading && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {filteredMembers.length} members
              </span>
            )}
          </div>

          {loading ? (
            <TeamLoadingState />
          ) : filteredMembers.length === 0 ? (
            <EmptyTeamState
              hasFilters={
                !!search ||
                roleFilter !== "all" ||
                typeFilter !== "all" ||
                statusFilter !== "all"
              }
              onClearFilters={clearFilters}
              onAdd={() => setShowInviteModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredMembers.map((member) => (
                <TeamMemberCard
                  key={member._id}
                  member={member}
                  onView={() => openViewMember(member)}
                  onEdit={() => openEditMember(member)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Pending Invitations
              </h2>

              <p className="mt-0.5 text-sm text-muted-foreground">
                Invitations waiting to be accepted
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="divide-y divide-border">
                {invitations.map((invitation) => (
                  <InvitationRow
                    key={invitation._id}
                    invitation={invitation}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Team summary */}
        {!loading && members.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryCard
              icon={<BriefcaseBusiness className="h-5 w-5" />}
              title="Professional Coverage"
              value={`${new Set(
                activeMembers.map((member) => member.memberType)
              ).size} types`}
              description="Different professional types in your team"
            />

            <SummaryCard
              icon={<UserRoundCheck className="h-5 w-5" />}
              title="Active Workspace"
              value={`${activeMembers.length}`}
              description="Members with active access"
            />

            <SummaryCard
              icon={<UserRoundX className="h-5 w-5" />}
              title="Suspended"
              value={`${suspendedMembers.length}`}
              description="Members currently restricted"
            />
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          loading={actionLoading}
          onClose={() => setShowInviteModal(false)}
          onSubmit={handleInvite}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMember && (
        <EditMemberModal
          member={selectedMember}
          loading={actionLoading}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMember(null);
          }}
          onSubmit={handleUpdateMember}
        />
      )}

      {/* View Modal */}
      {showViewModal && selectedMember && (
        <ViewMemberModal
          member={selectedMember}
          onClose={() => {
            setShowViewModal(false);
            setSelectedMember(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setShowEditModal(true);
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      </div>

      <div className="text-2xl font-semibold text-foreground">
        {value}
      </div>

      <div className="mt-1 text-sm font-medium text-foreground">
        {label}
      </div>

      <div className="mt-1 text-xs text-muted-foreground">
        {description}
      </div>
    </div>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-[150px] appearance-none rounded-xl border border-border bg-background pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/* =========================================================
   TEAM MEMBER CARD
========================================================= */

function TeamMemberCard({
  member,
  onView,
  onEdit,
}: {
  member: TeamMember;
  onView: () => void;
  onEdit: () => void;
}) {
  const avatar = getAvatar(member.user);

  return (
    <div className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/30 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {avatar ? (
            <img
              src={avatar}
              alt={member.user.fullName}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(member.user.fullName)}
            </div>
          )}

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">
              {member.user.fullName}
            </h3>

            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {member.user.email}
            </p>
          </div>
        </div>

        <MemberMenu
          onView={onView}
          onEdit={onEdit}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge>
          {getRoleLabel(member.workspaceRole)}
        </Badge>

        <Badge variant="secondary">
          {getMemberTypeLabel(member.memberType)}
        </Badge>

        <StatusBadge status={member.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Access
          </p>

          <p className="mt-1 text-sm font-medium text-foreground">
            {member.permissions?.length || 0} permissions
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Joined
          </p>

          <p className="mt-1 text-sm font-medium text-foreground">
            {member.joinedAt
              ? formatDate(member.joinedAt)
              : "Pending"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={onView}
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition hover:bg-muted"
        >
          <Eye className="h-4 w-4" />
          View
        </button>

        {member.status !== "removed" && (
          <button
            onClick={onEdit}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-muted text-sm font-medium text-foreground transition hover:bg-muted/80"
          >
            <Pencil className="h-4 w-4" />
            Manage
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MEMBER MENU
========================================================= */

function MemberMenu({
  onView,
  onEdit,
}: {
  onView: () => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <button
            aria-label="Close menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg">
            <button
              onClick={() => {
                setOpen(false);
                onView();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
            >
              <Eye className="h-4 w-4" />
              View member
            </button>

            <button
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
            >
              <Pencil className="h-4 w-4" />
              Manage access
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   BADGES
========================================================= */

function Badge({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${variant === "primary"
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground"
        }`}
    >
      {children}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: MemberStatus;
}) {
  const config = {
    active: {
      label: "Active",
      className:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    suspended: {
      label: "Suspended",
      className:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    invited: {
      label: "Invited",
      className:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    removed: {
      label: "Removed",
      className:
        "bg-muted text-muted-foreground",
    },
  };

  const item = config[status];

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.className}`}
    >
      {item.label}
    </span>
  );
}

/* =========================================================
   INVITATION ROW
========================================================= */

function InvitationRow({
  invitation,
}: {
  invitation: Invitation;
}) {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Mail className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {invitation.email}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {getMemberTypeLabel(invitation.memberType)}
            </span>

            <span>•</span>

            <span>
              {getRoleLabel(invitation.workspaceRole)}
            </span>

            <span>•</span>

            <span>
              Invited {formatDate(invitation.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
          Pending
        </span>

        <span className="text-xs text-muted-foreground">
          Expires {formatDate(invitation.expiresAt)}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   INVITE MODAL
========================================================= */

function InviteMemberModal({
  loading,
  onClose,
  onSubmit,
}: {
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    email: string;
    memberType: MemberType;
    workspaceRole: Exclude<WorkspaceRole, "owner">;
    permissions: string[];
  }) => void;
}) {
  const [email, setEmail] = useState("");
  const [memberType, setMemberType] =
    useState<MemberType>("employee");

  const [workspaceRole, setWorkspaceRole] =
    useState<Exclude<WorkspaceRole, "owner">>("member");

  const [permissions, setPermissions] = useState<string[]>([
    "contracts.read",
    "documents.read",
    "matters.read",
    "tasks.read",
  ]);

  const [formError, setFormError] = useState("");

  const togglePermission = (permission: string) => {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setFormError("Enter an email address.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    onSubmit({
      email: email.trim().toLowerCase(),
      memberType,
      workspaceRole,
      permissions,
    });
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRoundCheck className="h-5 w-5" />
            </div>

            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Add team member
            </h2>

            <p className="mt-1 max-w-md text-sm leading-5 text-muted-foreground">
              Invite someone to collaborate in your workspace.
              You can configure their access before sending the
              invitation.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-8">
              {/* Step 1 */}
              <section>
                <SectionHeader
                  number="01"
                  title="Member details"
                  description="Tell us who you want to invite."
                />

                <div className="mt-5 space-y-5">
                  <Field
                    label="Work email"
                    required
                  >
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <input
                        type="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setFormError("");
                        }}
                        placeholder="name@company.com"
                        autoFocus
                        className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>

                    {formError && (
                      <p className="mt-2 text-xs text-destructive">
                        {formError}
                      </p>
                    )}
                  </Field>

                  <Field label="Member type">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {MEMBER_TYPES.map((type) => {
                        const active =
                          memberType === type.value;

                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              setMemberType(type.value)
                            }
                            className={`rounded-xl border px-3 py-3 text-left transition ${active
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border bg-background hover:border-primary/30 hover:bg-muted/40"
                              }`}
                          >
                            <div
                              className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold ${active
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                                }`}
                            >
                              {type.label.charAt(0)}
                            </div>

                            <p className="text-xs font-medium text-foreground">
                              {type.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>
              </section>

              <div className="h-px bg-border" />

              {/* Step 2 */}
              <section>
                <SectionHeader
                  number="02"
                  title="Workspace access"
                  description="Choose what this member can do."
                />

                <div className="mt-5">
                  <p className="mb-3 text-sm font-medium text-foreground">
                    Workspace role
                  </p>

                  <div className="space-y-2">
                    {WORKSPACE_ROLES.map((role) => {
                      const active =
                        workspaceRole === role.value;

                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() =>
                            setWorkspaceRole(role.value)
                          }
                          className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${active
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-primary/30 hover:bg-muted/40"
                            }`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {role.value === "admin" ? (
                              <Shield className="h-4 w-4" />
                            ) : role.value ===
                              "legal_manager" ? (
                              <BriefcaseBusiness className="h-4 w-4" />
                            ) : role.value ===
                              "viewer" ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <Users className="h-4 w-4" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-foreground">
                                {role.label}
                              </p>

                              {active && (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                              )}
                            </div>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {role.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              <div className="h-px bg-border" />

              {/* Step 3 */}
              <section>
                <SectionHeader
                  number="03"
                  title="Permissions"
                  description="Fine-tune access to specific workspace modules."
                />

                <div className="mt-5 space-y-2">
                  {PERMISSIONS.map((permission) => {
                    const checked = permissions.includes(
                      permission.key
                    );

                    return (
                      <button
                        key={permission.key}
                        type="button"
                        onClick={() =>
                          togglePermission(permission.key)
                        }
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${checked
                          ? "border-primary/30 bg-primary/5"
                          : "border-border hover:bg-muted/40"
                          }`}
                      >
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background"
                            }`}
                        >
                          {checked && (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {permission.label}
                          </p>

                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {permission.group}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border bg-card px-6 py-4">
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  Invitation will be sent to
                </p>

                <p className="truncate text-sm font-medium text-foreground">
                  {email || "name@company.com"}
                </p>
              </div>

              <Badge>
                {getRoleLabel(workspaceRole)}
              </Badge>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-11 flex-1 rounded-xl border border-border bg-background text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send invitation
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionHeader({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-semibold text-muted-foreground">
        {number}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {title}
        </h3>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   EDIT MEMBER DRAWER
========================================================= */

function EditMemberModal({
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
      workspaceRole?: Exclude<WorkspaceRole, "owner">;
      memberType?: MemberType;
      permissions?: string[];
    }
  ) => void;
}) {
  const [memberType, setMemberType] = useState<MemberType>(
    member.memberType
  );

  const [workspaceRole, setWorkspaceRole] = useState<
    Exclude<WorkspaceRole, "owner">
  >(
    member.workspaceRole === "owner"
      ? "admin"
      : member.workspaceRole
  );

  const [permissions, setPermissions] = useState<string[]>(
    member.permissions || []
  );

  const togglePermission = (permission: string) => {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    );
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    onSubmit(member._id, {
      memberType,
      workspaceRole,
      permissions,
    });
  };

  const avatar = getAvatar(member.user);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-[2px]"
      />

      {/* Drawer */}
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Settings2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-foreground">
                Manage access
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Update this member's workspace access and permissions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <form
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Member identity */}
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
              {avatar ? (
                <img
                  src={avatar}
                  alt={member.user.fullName}
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-background"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {getInitials(member.user.fullName)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {member.user.fullName}
                </p>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {member.user.email}
                </p>
              </div>

              <StatusBadge status={member.status} />
            </div>

            {/* Member details */}
            <div className="mt-8">
              <SectionHeader
                number="01"
                title="Member details"
                description="Define how this person is identified within the workspace."
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Member type">
                  <Select
                    value={memberType}
                    onChange={(value) =>
                      setMemberType(value as MemberType)
                    }
                    options={MEMBER_TYPES}
                  />
                </Field>

                <Field label="Workspace role">
                  <Select
                    value={workspaceRole}
                    onChange={(value) =>
                      setWorkspaceRole(
                        value as Exclude<WorkspaceRole, "owner">
                      )
                    }
                    options={WORKSPACE_ROLES.map((role) => ({
                      value: role.value,
                      label: role.label,
                    }))}
                  />
                </Field>
              </div>
            </div>

            {/* Permissions */}
            <div className="mt-8">
              <SectionHeader
                number="02"
                title="Permissions"
                description="Control what this member can access and manage."
              />

              <div className="mt-5 rounded-2xl border border-border bg-card">
                <PermissionSelector
                  permissions={permissions}
                  onToggle={togglePermission}
                />
              </div>
            </div>

            {/* Access summary */}
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground">
                    Access summary
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    This member will have{" "}
                    <span className="font-medium text-foreground">
                      {getRoleLabel(workspaceRole)}
                    </span>{" "}
                    access with{" "}
                    <span className="font-medium text-foreground">
                      {permissions.length}
                    </span>{" "}
                    custom permission
                    {permissions.length === 1 ? "" : "s"}.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="border-t border-border bg-background px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <p className="hidden text-xs text-muted-foreground sm:block">
                Changes apply immediately after saving.
              </p>

              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}


/* =========================================================
   VIEW MEMBER DRAWER
========================================================= */

function ViewMemberModal({
  member,
  onClose,
  onEdit,
}: {
  member: TeamMember;
  onClose: () => void;
  onEdit: () => void;
}) {
  const avatar = getAvatar(member.user);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-[2px]"
      />

      {/* Drawer */}
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-foreground">
                Team member
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Membership and workspace access details.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Profile */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-4">
              {avatar ? (
                <img
                  src={avatar}
                  alt={member.user.fullName}
                  className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-background"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {getInitials(member.user.fullName)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {member.user.fullName}
                </h3>

                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {member.user.email}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>
                    {getRoleLabel(member.workspaceRole)}
                  </Badge>

                  <Badge variant="secondary">
                    {getMemberTypeLabel(member.memberType)}
                  </Badge>

                  <StatusBadge status={member.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Overview */}
          <div className="mt-8">
            <SectionHeader
              number="01"
              title="Member overview"
              description="Basic information about this workspace member."
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoItem
                label="Email"
                value={member.user.email}
              />

              <InfoItem
                label="Phone"
                value={member.user.phone || "Not available"}
              />

              <InfoItem
                label="Member type"
                value={getMemberTypeLabel(member.memberType)}
              />

              <InfoItem
                label="Workspace role"
                value={getRoleLabel(member.workspaceRole)}
              />

              <InfoItem
                label="Joined"
                value={
                  member.joinedAt
                    ? formatDate(member.joinedAt)
                    : "Pending"
                }
              />

              <InfoItem
                label="Permissions"
                value={`${member.permissions?.length || 0} granted`}
              />
            </div>
          </div>

          {/* Permissions */}
          <div className="mt-8">
            <SectionHeader
              number="02"
              title="Permissions"
              description="Capabilities currently granted to this member."
            />

            <div className="mt-5 rounded-2xl border border-border bg-card p-4">
              {member.permissions?.length ? (
                <div className="space-y-2">
                  {member.permissions.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Check className="h-3.5 w-3.5" />
                        </div>

                        <span className="truncate text-sm text-foreground">
                          {permission}
                        </span>
                      </div>

                      <span className="ml-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Granted
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <ShieldOff className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-medium text-foreground">
                    No custom permissions
                  </p>

                  <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                    This member does not have any custom permissions assigned.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-background px-6 py-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 flex-1 rounded-lg border border-border text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Close
            </button>

            {member.workspaceRole !== "owner" && (
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
        </div>
      </aside>
    </div>
  );
}
/* =========================================================
   PERMISSIONS
========================================================= */

function PermissionSelector({
  permissions,
  onToggle,
}: {
  permissions: string[];
  onToggle: (permission: string) => void;
}) {
  return (
    <div>
      <div className="mb-3">
        <p className="text-sm font-medium text-foreground">
          Permissions
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Control what this team member can access.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PERMISSIONS.map((permission) => {
          const checked = permissions.includes(
            permission.key
          );

          return (
            <label
              key={permission.key}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${checked
                ? "border-primary/30 bg-primary/5"
                : "border-border hover:bg-muted/50"
                }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onToggle(permission.key)
                }
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />

              <div>
                <p className="text-sm font-medium text-foreground">
                  {permission.label}
                </p>

                <p className="text-[11px] text-muted-foreground">
                  {permission.group}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL FOOTER
========================================================= */

function ModalFooter({
  onClose,
  loading,
  submitLabel,
}: {
  onClose: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {submitLabel}
      </button>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}

        {required && (
          <span className="ml-1 text-destructive">*</span>
        )}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   SELECT
========================================================= */

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="input-field appearance-none pr-10"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>

        <p className="mt-1 text-lg font-semibold text-foreground">
          {value}
        </p>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyTeamState({
  hasFilters,
  onClearFilters,
  onAdd,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Users className="h-6 w-6" />
      </div>

      <h3 className="mt-5 text-base font-semibold text-foreground">
        {hasFilters
          ? "No team members found"
          : "Your team is empty"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {hasFilters
          ? "Try adjusting your search or filters."
          : "Invite employees, lawyers, CAs, CSs and consultants to collaborate in your workspace."}
      </p>

      <div className="mt-5 flex justify-center gap-2">
        {hasFilters ? (
          <button
            onClick={onClearFilters}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Clear Filters
          </button>
        ) : (
          <button
            onClick={onAdd}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Team Member
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function TeamLoadingState() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted" />

            <div className="flex-1">
              <div className="h-4 w-36 rounded bg-muted" />
              <div className="mt-2 h-3 w-48 rounded bg-muted" />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <div className="h-6 w-24 rounded-full bg-muted" />
            <div className="h-6 w-28 rounded-full bg-muted" />
          </div>

          <div className="mt-5 h-px bg-muted" />

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <div className="h-3 w-12 rounded bg-muted" />
              <div className="mt-2 h-4 w-24 rounded bg-muted" />
            </div>

            <div>
              <div className="h-3 w-12 rounded bg-muted" />
              <div className="mt-2 h-4 w-20 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}