"use client";

import { FormEvent, useEffect, useState } from "react";
import {
    CheckCircle2,
    Clock3,
    Loader2,
    Mail,
    ShieldCheck,
    Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import { premiumToast } from "@/lib/premium-toast";

const API_URL =
    "https://nyaymitra-backend-production.up.railway.app";

const SITE_URL = "https://mynyaymitra.info";

interface InvitationData {
    invitation: {
        _id: string;
        email: string;
        memberType: string;
        workspaceRole: string;
        permissions: string[];
        expiresAt: string;
        invitedBy?: {
            fullName?: string;
            email?: string;
        };
    };

    business: {
        _id: string;
        companyName: string;
        logo?: string;
    };
}

interface InvitationResponse {
    success: boolean;
    data?: InvitationData;
    message?: string;
}

const roleLabel = (role: string) => {
    if (role === "legal_manager") {
        return "Legal Manager";
    }

    if (role === "admin") {
        return "Admin";
    }

    if (role === "viewer") {
        return "Viewer";
    }

    return "Member";
};

const memberTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        employee: "Employee",
        lawyer: "Lawyer",
        CA: "Chartered Accountant",
        CS: "Company Secretary",
        consultant: "Consultant",
        other: "Team Member",
    };

    return labels[type] || "Team Member";
};

export default function InvitationPage() {
    const params = useParams();

    const token = params?.token as string;

    const [invitation, setInvitation] =
        useState<InvitationData | null>(null);

    const [loading, setLoading] = useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [fullName, setFullName] =
        useState("");

    const [phone, setPhone] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    // ==================================================
    // LOAD INVITATION
    // ==================================================

    useEffect(() => {
        if (!token) return;

        const loadInvitation = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/api/v1/team/invitations/${token}`
                );

                const result: InvitationResponse =
                    await response.json();

                if (
                    !response.ok ||
                    !result.success ||
                    !result.data
                ) {
                    throw new Error(
                        result.message ||
                        "Invalid invitation."
                    );
                }

                setInvitation(result.data);
            } catch (err) {
                console.error(err);

                const message =
                    err instanceof Error
                        ? err.message
                        : "Unable to load invitation.";

                setError(message);

                // ===== ERROR TOAST =====
                premiumToast.error('Invitation unavailable', {
                    description: message,
                });
            } finally {
                setLoading(false);
            }
        };

        loadInvitation();
    }, [token]);

    // ==================================================
    // SUBMIT REGISTRATION
    // ==================================================

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!fullName.trim()) {
            setError("Please enter your full name.");

            // ===== WARNING TOAST =====
            premiumToast.warning('Name required', {
                description: 'Please enter your full name.',
            });

            return;
        }

        if (password.length < 8) {
            setError(
                "Password must contain at least 8 characters."
            );

            // ===== WARNING TOAST =====
            premiumToast.warning('Password too short', {
                description: 'Password must contain at least 8 characters.',
            });

            return;
        }

        if (password !== confirmPassword) {
            setError(
                "Passwords do not match."
            );

            // ===== WARNING TOAST =====
            premiumToast.warning("Passwords don't match", {
                description: 'New password and confirmation do not match.',
            });

            return;
        }

        try {
            setSubmitting(true);

            const response = await fetch(
                `${API_URL}/api/v1/team/invitations/${token}/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        fullName,
                        phone,
                        password,
                    }),
                }
            );

            const result = await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                if (
                    result.code ===
                    "ACCOUNT_EXISTS"
                ) {
                    // ===== INFO TOAST =====
                    premiumToast.info('Account already exists', {
                        description:
                            'Log in with that account to accept the invitation.',
                    });

                    throw new Error(
                        "An account already exists with this email. Please log in with that account and accept the invitation."
                    );
                }

                throw new Error(
                    result.message ||
                    "Registration failed."
                );
            }

            setSuccess(
                "Your account has been created and you have joined the workspace. Redirecting..."
            );

            // ===== SUCCESS TOAST =====
            premiumToast.success(
                `Welcome to ${invitation?.business?.companyName || 'NyayMitra'}`,
                {
                    description: 'Your account has been created.',
                }
            );

            // ------------------------------------------
            // REDIRECT TO MAIN SITE
            // ------------------------------------------
            //
            // Full-page navigation (not router.push) so it
            // works reliably across origins / subdomains
            // and avoids the 404 you were seeing on /login.
            // ------------------------------------------

            setTimeout(() => {
                window.location.href = SITE_URL;
            }, 1500);
        } catch (err) {
            console.error(err);

            const message =
                err instanceof Error
                    ? err.message
                    : "Registration failed.";

            setError(message);

            // ===== ERROR TOAST =====
            // (skip if we already fired the info toast for ACCOUNT_EXISTS)
            if (
                !message
                    .toLowerCase()
                    .includes('already exists')
            ) {
                premiumToast.error('Registration failed', {
                    description: message,
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background px-6">
                <div className="flex flex-col items-center text-center">
                    <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />

                    <h1 className="text-lg font-semibold">
                        Validating invitation
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Please wait...
                    </p>
                </div>
            </main>
        );
    }

    // ==================================================
    // ERROR
    // ==================================================

    if (error && !invitation) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background px-6">
                <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <Clock3 className="h-7 w-7" />
                    </div>

                    <h1 className="mt-5 text-xl font-semibold">
                        Invitation unavailable
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {error}
                    </p>

                    <button
                        onClick={() => {
                            window.location.href = SITE_URL;
                        }}
                        className="mt-6 h-10 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
                    >
                        Go to NyayMitra
                    </button>
                </div>
            </main>
        );
    }

    if (!invitation) {
        return null;
    }

    // ==================================================
    // MAIN
    // ==================================================

    return (
        <main className="min-h-screen bg-muted/30 px-4 py-10">
            <div className="mx-auto w-full max-w-lg">
                {/* Brand */}
                <div className="mb-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <ShieldCheck className="h-6 w-6" />
                    </div>

                    <h1 className="mt-4 text-2xl font-bold tracking-tight">
                        Join NyayMitra
                    </h1>

                    <p className="mt-2 text-sm text-muted-foreground">
                        You have been invited to join a
                        business workspace.
                    </p>
                </div>

                {/* Invitation information */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Users className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Workspace invitation
                            </p>

                            <h2 className="mt-1 truncate text-lg font-semibold">
                                {
                                    invitation.business
                                        .companyName
                                }
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Invited as{" "}
                                <span className="font-medium text-foreground">
                                    {roleLabel(
                                        invitation
                                            .invitation
                                            .workspaceRole
                                    )}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Invited email
                                </p>

                                <p className="text-sm font-medium">
                                    {
                                        invitation
                                            .invitation
                                            .email
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Member type
                                </p>

                                <p className="text-sm font-medium">
                                    {memberTypeLabel(
                                        invitation
                                            .invitation
                                            .memberType
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Workspace role
                                </p>

                                <p className="text-sm font-medium">
                                    {roleLabel(
                                        invitation
                                            .invitation
                                            .workspaceRole
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registration */}
                <div className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">
                            Create your account
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Set up your account to access the
                            workspace.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                            <span>
                                {success}
                            </span>
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        {/* Full name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Full name
                            </label>

                            <input
                                value={fullName}
                                onChange={(e) =>
                                    setFullName(
                                        e.target.value
                                    )
                                }
                                placeholder="Alok Abhigyan"
                                autoComplete="name"
                                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Email
                            </label>

                            <input
                                value={
                                    invitation
                                        .invitation
                                        .email
                                }
                                disabled
                                className="h-11 w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Phone
                            </label>

                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) =>
                                    setPhone(
                                        e.target.value
                                    )
                                }
                                placeholder="+91 XXXXX XXXXX"
                                autoComplete="tel"
                                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                placeholder="Minimum 8 characters"
                                autoComplete="new-password"
                                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* Confirm password */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Confirm password
                            </label>

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(
                                        e.target.value
                                    )
                                }
                                placeholder="Re-enter your password"
                                autoComplete="new-password"
                                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                "Accept invitation & join workspace"
                            )}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
                        By joining this workspace, you agree to
                        use NyayMitra according to your assigned
                        workspace permissions.
                    </p>
                </div>
            </div>
        </main>
    );
}