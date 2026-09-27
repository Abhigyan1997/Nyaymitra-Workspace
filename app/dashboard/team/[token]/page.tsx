"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    CheckCircle2,
    AlertCircle,
    Building2,
    Mail,
    ShieldCheck,
    Users,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";

const API_URL =
    "https://nyaymitra-backend-production.up.railway.app";

type Invitation = {
    _id: string;
    email: string;
    memberType: string;
    workspaceRole: string;
    permissions: string[];
    status: "pending" | "accepted" | "expired" | "cancelled";
    expiresAt: string;
    business?: {
        _id: string;
        companyName: string;
        legalName?: string;
        logo?: string;
    };
    invitedBy?: {
        fullName?: string;
        email?: string;
    };
};

function formatRole(role?: string) {
    if (!role) return "Member";

    const labels: Record<string, string> = {
        owner: "Owner",
        admin: "Admin",
        legal_manager: "Legal Manager",
        member: "Member",
        viewer: "Viewer",
    };

    return (
        labels[role] ||
        role
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
    );
}

function formatMemberType(type?: string) {
    if (!type) return "Other";

    const labels: Record<string, string> = {
        employee: "Employee",
        lawyer: "Lawyer",
        CA: "Chartered Accountant",
        CS: "Company Secretary",
        consultant: "Consultant",
        other: "Other",
    };

    return labels[type] || type;
}

function formatDate(date?: string) {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function TeamInvitePage() {
    const params = useParams();
    const router = useRouter();

    const token =
        typeof params.token === "string"
            ? params.token
            : "";

    const [invitation, setInvitation] =
        useState<Invitation | null>(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    // =====================================================
    // FETCH INVITATION
    // =====================================================

    useEffect(() => {
        if (!token) return;

        const fetchInvitation = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/api/v1/team//${token}`,
                    {
                        method: "GET",
                        cache: "no-store",
                    }
                );

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message ||
                        "This invitation is invalid or has expired."
                    );
                }

                setInvitation(result.data);

                // If backend provides invited user's name
                if (result.data?.user?.fullName) {
                    setFullName(
                        result.data.user.fullName
                    );
                }
            } catch (err) {
                console.error(
                    "Invitation fetch error:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load invitation."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchInvitation();
    }, [token]);

    // =====================================================
    // ACCEPT INVITATION
    // =====================================================

    const handleSubmit = async (
        event: FormEvent
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!fullName.trim()) {
            setError("Enter your full name.");
            return;
        }

        if (password.length < 8) {
            setError(
                "Password must be at least 8 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setSubmitting(true);

            const response = await fetch(
                `${API_URL}/api/v1/team/invite/${token}/accept`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fullName: fullName.trim(),
                        phone: phone.trim() || undefined,
                        password,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to accept invitation."
                );
            }

            setSuccess(
                "Your account has been created successfully."
            );

            // If API returns token/login data
            if (
                result.data?.token &&
                result.data?.user
            ) {
                localStorage.setItem(
                    "token",
                    result.data.token
                );

                localStorage.setItem(
                    "user",
                    JSON.stringify(result.data.user)
                );

                setTimeout(() => {
                    router.push(
                        "/dashboard"
                    );
                }, 1200);

                return;
            }

            // Otherwise send to login
            setTimeout(() => {
                router.push("/login");
            }, 1500);
        } catch (err) {
            console.error(
                "Accept invitation error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to accept invitation."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="flex flex-col items-center text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />

                    <p className="mt-4 text-sm text-muted-foreground">
                        Loading your invitation...
                    </p>
                </div>
            </div>
        );
    }

    // =====================================================
    // ERROR / INVALID INVITATION
    // =====================================================

    if (!invitation) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <AlertCircle className="h-7 w-7" />
                    </div>

                    <h1 className="mt-6 text-2xl font-semibold text-foreground">
                        Invitation unavailable
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {error ||
                            "This invitation is invalid, expired, or has already been used."}
                    </p>

                    <button
                        type="button"
                        onClick={() => router.push("/login")}
                        className="mt-6 h-11 w-full rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Go to login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid w-full overflow-hidden rounded-3xl border border-border bg-card shadow-xl lg:grid-cols-[0.9fr_1.1fr]">

                    {/* =================================================
              LEFT
          ================================================= */}
                    <div className="hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>

                                <div>
                                    <p className="font-semibold">
                                        NyayMitra
                                    </p>

                                    <p className="text-xs text-primary-foreground/70">
                                        Legal Operations Platform
                                    </p>
                                </div>
                            </div>

                            <div className="mt-16">
                                <p className="text-sm font-medium text-primary-foreground/70">
                                    TEAM INVITATION
                                </p>

                                <h1 className="mt-4 text-4xl font-semibold leading-tight">
                                    You're invited to join the workspace.
                                </h1>

                                <p className="mt-5 max-w-md text-sm leading-6 text-primary-foreground/75">
                                    Create your NyayMitra account to access your
                                    organization's workspace and collaborate with your team.
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-6">
                            <p className="text-xs text-primary-foreground/60">
                                Your invitation expires on{" "}
                                <span className="font-medium text-primary-foreground/90">
                                    {formatDate(invitation.expiresAt)}
                                </span>
                                .
                            </p>
                        </div>
                    </div>

                    {/* =================================================
              RIGHT
          ================================================= */}
                    <div className="p-6 sm:p-10">
                        {/* Header */}
                        <div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary lg:hidden">
                                <ShieldCheck className="h-6 w-6" />
                            </div>

                            <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-primary">
                                You're invited
                            </p>

                            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                                Join{" "}
                                {invitation.business?.companyName ||
                                    "the workspace"}
                            </h2>

                            <p className="mt-2 text-sm text-muted-foreground">
                                Complete your registration to accept this invitation.
                            </p>
                        </div>

                        {/* Company card */}
                        <div className="mt-7 rounded-2xl border border-border bg-muted/30 p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Building2 className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground">
                                        {invitation.business?.companyName ||
                                            "NyayMitra Workspace"}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Workspace access invitation
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Member type
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-foreground">
                                        {formatMemberType(
                                            invitation.memberType
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Workspace role
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-foreground">
                                        {formatRole(
                                            invitation.workspaceRole
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="mt-5 rounded-xl bg-muted/40 px-4 py-3">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />

                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                        Invitation sent to
                                    </p>

                                    <p className="truncate text-sm font-medium text-foreground">
                                        {invitation.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mt-5 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                <p>{success}</p>
                            </div>
                        )}

                        {/* Registration form */}
                        <form
                            onSubmit={handleSubmit}
                            className="mt-7 space-y-5"
                        >
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    Full name
                                </label>

                                <input
                                    value={fullName}
                                    onChange={(e) =>
                                        setFullName(e.target.value)
                                    }
                                    placeholder="Enter your full name"
                                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    Email
                                </label>

                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                    <input
                                        value={invitation.email}
                                        disabled
                                        className="h-12 w-full rounded-xl border border-border bg-muted pl-10 pr-4 text-sm text-muted-foreground"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    Phone number
                                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                                        (optional)
                                    </span>
                                </label>

                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) =>
                                        setPhone(e.target.value)
                                    }
                                    placeholder="Enter your phone number"
                                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    Create password
                                </label>

                                <div className="relative">
                                    <input
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="At least 8 characters"
                                        className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-11 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                (current) => !current
                                            )
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    Confirm password
                                </label>

                                <div className="relative">
                                    <input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Re-enter your password"
                                        className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-11 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                (current) => !current
                                            )
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-muted/20 p-4">
                                <div className="flex items-start gap-3">
                                    <Users className="mt-0.5 h-4 w-4 text-primary" />

                                    <p className="text-xs leading-5 text-muted-foreground">
                                        You will join this workspace as{" "}
                                        <span className="font-medium text-foreground">
                                            {formatRole(
                                                invitation.workspaceRole
                                            )}
                                        </span>{" "}
                                        with the{" "}
                                        <span className="font-medium text-foreground">
                                            {formatMemberType(
                                                invitation.memberType
                                            )}
                                        </span>{" "}
                                        member type.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Create account & join workspace
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs leading-5 text-muted-foreground">
                                By continuing, you are accepting the invitation
                                to collaborate with this workspace.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}