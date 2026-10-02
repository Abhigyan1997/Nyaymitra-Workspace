"use client";

import {
    useEffect,
    useState,
    type ComponentType,
} from "react";

import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    Eye,
    EyeOff,
    Lock,
    LogOut,
    Mail,
    Pencil,
    Phone,
    Save,
    Shield,
    UserRound,
    X,
    Loader2,
} from "lucide-react";

import {
    getAdminProfile,
    updateAdminProfile,
    type AdminProfile,
} from "@/lib/adminApi";
import { premiumToast } from "@/lib/premium-toast";

type SettingsSection =
    | "profile"
    | "security";

const EMPTY_PROFILE: AdminProfile = {
    _id: "",
    userId: "",
    fullName: "",
    email: "",
    phone: "",
    profilePhoto: "",
    avatar: "",
    role: "admin",
    accountStatus: "active",
};

function getInitials(name: string) {
    if (!name.trim()) {
        return "A";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase();
}

function formatRole(role: string) {
    if (role === "admin") {
        return "Administrator";
    }

    return role
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
}

function formatStatus(status: string) {
    return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
}

function Card({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-2xl border border-white/[0.08] bg-white/[0.025] ${className}`}
        >
            {children}
        </div>
    );
}

function SectionTitle({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="mb-6">
            <h2 className="text-sm font-semibold text-white">
                {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-zinc-600">
                {description}
            </p>
        </div>
    );
}

function SettingsNavButton({
    active,
    icon: Icon,
    title,
    description,
    onClick,
}: {
    active: boolean;
    icon: ComponentType<{
        className?: string;
    }>;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${active
                ? "bg-blue-400/[0.08] ring-1 ring-blue-400/15"
                : "hover:bg-white/[0.025]"
                }`}
        >
            <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${active
                    ? "bg-blue-400/10"
                    : "bg-white/[0.03]"
                    }`}
            >
                <Icon
                    className={`h-4 w-4 ${active
                        ? "text-blue-400"
                        : "text-zinc-500"
                        }`}
                />
            </div>

            <div className="min-w-0">
                <p
                    className={`text-xs font-medium ${active
                        ? "text-white"
                        : "text-zinc-300"
                        }`}
                >
                    {title}
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-600">
                    {description}
                </p>
            </div>

            {active && (
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-blue-400" />
            )}
        </button>
    );
}

function Field({
    label,
    value,
    onChange,
    type = "text",
    disabled = false,
    placeholder,
}: {
    label: string;
    value: string;
    onChange?: (value: string) => void;
    type?: string;
    disabled?: boolean;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="mb-2 block text-[11px] font-medium text-zinc-500">
                {label}
            </label>

            <input
                type={type}
                value={value}
                disabled={disabled}
                placeholder={placeholder}
                onChange={(event) =>
                    onChange?.(event.target.value)
                }
                className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-sm text-white outline-none placeholder:text-zinc-700 transition focus:border-blue-400/30 disabled:cursor-not-allowed disabled:opacity-50"
            />
        </div>
    );
}

function InfoItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                {label}
            </p>

            <p className="mt-1 break-words text-xs font-medium text-zinc-300">
                {value || "—"}
            </p>
        </div>
    );
}

function StatusBadge({
    status,
}: {
    status: "active" | "inactive" | string;
}) {
    const active = status === "active";

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${active
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                }`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />

            {formatStatus(status)}
        </span>
    );
}

function PasswordField({
    label,
    value,
    onChange,
    show,
    setShow,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    show: boolean;
    setShow: (value: boolean) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-[11px] font-medium text-zinc-500">
                {label}
            </label>

            <div className="relative">
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 pr-11 text-sm text-white outline-none transition focus:border-blue-400/30"
                />

                <button
                    type="button"
                    onClick={() =>
                        setShow(!show)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
                >
                    {show ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </button>
            </div>
        </div>
    );
}

export default function AdminSettingsPage() {
    const [activeSection, setActiveSection] =
        useState<SettingsSection>("profile");

    const [profile, setProfile] =
        useState<AdminProfile>(EMPTY_PROFILE);

    const [originalProfile, setOriginalProfile] =
        useState<AdminProfile>(EMPTY_PROFILE);

    const [loading, setLoading] =
        useState(true);

    const [editingProfile, setEditingProfile] =
        useState(false);

    const [savingProfile, setSavingProfile] =
        useState(false);

    const [profileMessage, setProfileMessage] =
        useState("");

    const [profileError, setProfileError] =
        useState("");

    const [currentPassword, setCurrentPassword] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showCurrentPassword, setShowCurrentPassword] =
        useState(false);

    const [showNewPassword, setShowNewPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [passwordMessage, setPasswordMessage] =
        useState("");

    const [passwordLoading, setPasswordLoading] =
        useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setProfileError("");

            const data =
                await getAdminProfile();

            setProfile(data);
            setOriginalProfile(data);
        } catch (error) {
            console.error(
                "Admin settings profile error:",
                error
            );

            const message =
                error instanceof Error
                    ? error.message
                    : "Unable to load admin profile.";

            setProfileError(message);

            // ===== ERROR TOAST =====
            premiumToast.error('Could not load profile', {
                description: message,
            });
        } finally {
            setLoading(false);
        }
    };

    const updateProfileField = (
        key: keyof AdminProfile,
        value: string
    ) => {
        setProfile((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const cancelProfileEdit = () => {
        setProfile(originalProfile);
        setEditingProfile(false);
        setProfileError("");
        setProfileMessage("");
    };

    const saveProfile = async () => {
        try {
            setSavingProfile(true);
            setProfileError("");
            setProfileMessage("");

            const updated =
                await updateAdminProfile({
                    fullName: profile.fullName,
                    phone: profile.phone,
                });

            setProfile(updated);
            setOriginalProfile(updated);

            try {
                const storedUser =
                    localStorage.getItem("user");

                if (storedUser) {
                    const parsed =
                        JSON.parse(storedUser);

                    localStorage.setItem(
                        "user",
                        JSON.stringify({
                            ...parsed,
                            fullName: updated.fullName,
                            phone: updated.phone,
                            profilePhoto:
                                updated.profilePhoto,
                            avatar: updated.avatar,
                        })
                    );
                }
            } catch {
                // Local storage sync is optional.
            }

            setEditingProfile(false);

            setProfileMessage(
                "Profile updated successfully."
            );

            // ===== SUCCESS TOAST =====
            premiumToast.success('Profile updated', {
                description: 'Your administrator profile has been saved.',
            });

            window.setTimeout(() => {
                setProfileMessage("");
            }, 3000);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unable to update profile.";

            setProfileError(message);

            // ===== ERROR TOAST =====
            premiumToast.error('Profile save failed', {
                description: message,
            });
        } finally {
            setSavingProfile(false);
        }
    };

    /*
     * Reuse the existing authentication
     * password endpoint already used by
     * the existing settings implementation.
     */
    const changePassword = async () => {
        setPasswordMessage("");

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            setPasswordMessage(
                "Please fill in all password fields."
            );

            // ===== WARNING TOAST =====
            premiumToast.warning('Missing fields', {
                description: 'Please fill in all password fields.',
            });

            return;
        }

        if (newPassword.length < 8) {
            setPasswordMessage(
                "New password must contain at least 8 characters."
            );

            // ===== WARNING TOAST =====
            premiumToast.warning('Password too short', {
                description: 'New password must contain at least 8 characters.',
            });

            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage(
                "New password and confirmation do not match."
            );

            // ===== WARNING TOAST =====
            premiumToast.warning("Passwords don't match", {
                description: 'New password and confirmation do not match.',
            });

            return;
        }

        try {
            setPasswordLoading(true);

            const token =
                localStorage.getItem("token") ||
                localStorage.getItem(
                    "accessToken"
                );

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            const API_BASE = (
                process.env.NEXT_PUBLIC_API_URL ||
                "https://nyaymitra-backend-production.up.railway.app/api/v1"
            ).replace(/\/$/, "");

            const response = await fetch(
                `${API_BASE}/auth/change-password`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                    }),
                }
            );

            const result =
                await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    result.error ||
                    "Unable to change password."
                );
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setPasswordMessage(
                result.message ||
                "Password updated successfully."
            );

            // ===== SUCCESS TOAST =====
            premiumToast.success('Password updated', {
                description: 'Your account password has been changed.',
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unable to change password.";

            setPasswordMessage(message);

            // ===== ERROR TOAST =====
            premiumToast.error('Password change failed', {
                description: message,
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem(
            "accessToken"
        );
        localStorage.removeItem("user");

        // ===== SUCCESS TOAST =====
        premiumToast.success('Signed out', {
            description: 'You have been signed out of your account.',
        });

        window.location.href =
            "/auth/login";
    };

    return (
        <div className="min-h-screen bg-[#06080b] text-white">
            {/* Background */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-[25%] top-0 h-[420px] w-[420px] rounded-full bg-blue-500/[0.025] blur-3xl" />

                <div className="absolute right-0 top-[35%] h-[360px] w-[360px] rounded-full bg-violet-500/[0.018] blur-3xl" />
            </div>

            <main className="relative mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="border-b border-white/[0.06] pb-6">
                    <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600">
                        <span>Admin Dashboard</span>

                        <ChevronRight className="h-3 w-3" />

                        <span className="text-zinc-300">
                            Settings
                        </span>
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Settings
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                        Manage your administrator profile and account security.
                    </p>
                </div>

                {/* Success */}
                {profileMessage && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3 text-xs text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        {profileMessage}
                    </div>
                )}

                {/* Error */}
                {profileError && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/15 bg-red-500/[0.04] px-4 py-3 text-xs text-red-400">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {profileError}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setProfileError("")
                            }
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Layout */}
                <div className="mt-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
                    {/* Navigation */}
                    <aside>
                        <Card className="overflow-hidden p-2">
                            <SettingsNavButton
                                active={
                                    activeSection ===
                                    "profile"
                                }
                                icon={UserRound}
                                title="Profile"
                                description="Administrator account"
                                onClick={() =>
                                    setActiveSection(
                                        "profile"
                                    )
                                }
                            />

                            <SettingsNavButton
                                active={
                                    activeSection ===
                                    "security"
                                }
                                icon={Lock}
                                title="Security"
                                description="Password & account"
                                onClick={() =>
                                    setActiveSection(
                                        "security"
                                    )
                                }
                            />
                        </Card>

                        {!loading && (
                            <Card className="mt-3 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                                        <Shield className="h-4 w-4 text-blue-400" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-white">
                                            Administrator
                                        </p>

                                        <p className="mt-0.5 text-[10px] text-zinc-600">
                                            Full admin access
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </aside>

                    {/* Content */}
                    <section className="min-w-0">
                        {activeSection ===
                            "profile" && (
                                <ProfileSection
                                    profile={profile}
                                    loading={loading}
                                    editing={editingProfile}
                                    saving={savingProfile}
                                    onEdit={() =>
                                        setEditingProfile(
                                            true
                                        )
                                    }
                                    onCancel={
                                        cancelProfileEdit
                                    }
                                    onSave={saveProfile}
                                    updateProfile={
                                        updateProfileField
                                    }
                                />
                            )}

                        {activeSection ===
                            "security" && (
                                <SecuritySection
                                    currentPassword={
                                        currentPassword
                                    }
                                    newPassword={
                                        newPassword
                                    }
                                    confirmPassword={
                                        confirmPassword
                                    }
                                    setCurrentPassword={
                                        setCurrentPassword
                                    }
                                    setNewPassword={
                                        setNewPassword
                                    }
                                    setConfirmPassword={
                                        setConfirmPassword
                                    }
                                    showCurrentPassword={
                                        showCurrentPassword
                                    }
                                    showNewPassword={
                                        showNewPassword
                                    }
                                    showConfirmPassword={
                                        showConfirmPassword
                                    }
                                    setShowCurrentPassword={
                                        setShowCurrentPassword
                                    }
                                    setShowNewPassword={
                                        setShowNewPassword
                                    }
                                    setShowConfirmPassword={
                                        setShowConfirmPassword
                                    }
                                    passwordMessage={
                                        passwordMessage
                                    }
                                    passwordLoading={
                                        passwordLoading
                                    }
                                    changePassword={
                                        changePassword
                                    }
                                    onSignOut={
                                        handleSignOut
                                    }
                                />
                            )}
                    </section>
                </div>
            </main>
        </div>
    );
}

/* ========================================================================== */
/* PROFILE                                                                     */
/* ========================================================================== */

function ProfileSection({
    profile,
    loading,
    editing,
    saving,
    onEdit,
    onCancel,
    onSave,
    updateProfile,
}: {
    profile: AdminProfile;
    loading: boolean;
    editing: boolean;
    saving: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    updateProfile: (
        key: keyof AdminProfile,
        value: string
    ) => void;
}) {
    return (
        <div className="space-y-5">
            <Card className="overflow-hidden">
                {/* Header */}
                <div className="border-b border-white/[0.06] px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-semibold">
                                Administrator Profile
                            </h2>

                            <p className="mt-1 text-xs text-zinc-600">
                                Basic information associated with your admin account.
                            </p>
                        </div>

                        {!editing ? (
                            <button
                                type="button"
                                onClick={onEdit}
                                disabled={loading}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-50"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    disabled={saving}
                                    className="rounded-lg border border-white/[0.06] px-3 py-2 text-xs text-zinc-500 transition hover:text-white disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={onSave}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-300 ring-1 ring-blue-400/20 transition hover:bg-blue-500/15 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Save className="h-3.5 w-3.5" />
                                    )}

                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5">
                    {loading ? (
                        <ProfileLoading />
                    ) : (
                        <>
                            {/* Identity */}
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-blue-500/[0.06]">
                                    {profile.profilePhoto ||
                                        profile.avatar ? (
                                        <img
                                            src={
                                                profile.profilePhoto ||
                                                profile.avatar
                                            }
                                            alt={
                                                profile.fullName ||
                                                "Administrator"
                                            }
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xl font-semibold text-blue-300">
                                            {getInitials(
                                                profile.fullName
                                            )}
                                        </span>
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-semibold">
                                            {profile.fullName ||
                                                "Administrator"}
                                        </h3>

                                        <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[10px] font-medium text-blue-300">
                                            Administrator
                                        </span>
                                    </div>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        NyayMitra Admin Account
                                    </p>
                                </div>
                            </div>

                            <div className="my-6 h-px bg-white/[0.06]" />

                            {/* Fields */}
                            {editing ? (
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field
                                        label="Full Name"
                                        value={
                                            profile.fullName
                                        }
                                        onChange={(value) =>
                                            updateProfile(
                                                "fullName",
                                                value
                                            )
                                        }
                                    />

                                    <Field
                                        label="Phone"
                                        value={
                                            profile.phone
                                        }
                                        onChange={(value) =>
                                            updateProfile(
                                                "phone",
                                                value
                                            )
                                        }
                                        placeholder="+91XXXXXXXXXX"
                                    />

                                    <Field
                                        label="Email"
                                        value={
                                            profile.email
                                        }
                                        disabled
                                    />

                                    <Field
                                        label="Role"
                                        value={formatRole(
                                            profile.role
                                        )}
                                        disabled
                                    />
                                </div>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2">
                                    <InfoItem
                                        label="Full Name"
                                        value={
                                            profile.fullName
                                        }
                                    />

                                    <InfoItem
                                        label="Email"
                                        value={
                                            profile.email
                                        }
                                    />

                                    <InfoItem
                                        label="Phone"
                                        value={
                                            profile.phone
                                        }
                                    />

                                    <InfoItem
                                        label="Role"
                                        value={formatRole(
                                            profile.role
                                        )}
                                    />

                                    <InfoItem
                                        label="User ID"
                                        value={
                                            profile.userId ||
                                            profile._id
                                        }
                                    />

                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                                            Account Status
                                        </p>

                                        <div className="mt-2">
                                            <StatusBadge
                                                status={
                                                    profile.accountStatus
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Card>

            {/* Access information */}
            <Card className="p-5">
                <SectionTitle
                    title="Account Information"
                    description="Some administrator properties are intentionally read-only."
                />

                <div className="space-y-3">
                    <ReadOnlyRow
                        icon={Mail}
                        title="Email address"
                        description="Managed by the authentication system."
                    />

                    <ReadOnlyRow
                        icon={Shield}
                        title="Administrator role"
                        description="Cannot be changed from Settings."
                    />

                    <ReadOnlyRow
                        icon={Shield}
                        title="Account status"
                        description="Managed through admin account controls."
                    />
                </div>
            </Card>
        </div>
    );
}

function ReadOnlyRow({
    icon: Icon,
    title,
    description,
}: {
    icon: ComponentType<{
        className?: string;
    }>;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                <Icon className="h-4 w-4 text-zinc-500" />
            </div>

            <div>
                <p className="text-xs font-medium text-zinc-300">
                    {title}
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-600">
                    {description}
                </p>
            </div>
        </div>
    );
}

/* ========================================================================== */
/* SECURITY                                                                    */
/* ========================================================================== */

function SecuritySection({
    currentPassword,
    newPassword,
    confirmPassword,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    setShowCurrentPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    passwordMessage,
    passwordLoading,
    changePassword,
    onSignOut,
}: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    setCurrentPassword: (
        value: string
    ) => void;
    setNewPassword: (
        value: string
    ) => void;
    setConfirmPassword: (
        value: string
    ) => void;
    showCurrentPassword: boolean;
    showNewPassword: boolean;
    showConfirmPassword: boolean;
    setShowCurrentPassword: (
        value: boolean
    ) => void;
    setShowNewPassword: (
        value: boolean
    ) => void;
    setShowConfirmPassword: (
        value: boolean
    ) => void;
    passwordMessage: string;
    passwordLoading: boolean;
    changePassword: () => void;
    onSignOut: () => void;
}) {
    const messageSuccess =
        passwordMessage.includes(
            "successfully"
        );

    return (
        <div className="space-y-5">
            <Card className="overflow-hidden">
                <div className="border-b border-white/[0.06] px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                            <Lock className="h-4 w-4 text-blue-400" />
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold">
                                Change Password
                            </h2>

                            <p className="mt-1 text-xs text-zinc-600">
                                Update the password used to access the admin account.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-5 p-5">
                    <PasswordField
                        label="Current Password"
                        value={currentPassword}
                        onChange={
                            setCurrentPassword
                        }
                        show={
                            showCurrentPassword
                        }
                        setShow={
                            setShowCurrentPassword
                        }
                    />

                    <PasswordField
                        label="New Password"
                        value={newPassword}
                        onChange={setNewPassword}
                        show={showNewPassword}
                        setShow={
                            setShowNewPassword
                        }
                    />

                    <PasswordField
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={
                            setConfirmPassword
                        }
                        show={
                            showConfirmPassword
                        }
                        setShow={
                            setShowConfirmPassword
                        }
                    />

                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                        <p className="text-xs font-medium text-zinc-300">
                            Password requirements
                        </p>

                        <div className="mt-2 space-y-1 text-[11px] text-zinc-600">
                            <p>
                                • Minimum 8 characters
                            </p>
                            <p>
                                • Use a mix of letters and numbers
                            </p>
                            <p>
                                • Avoid easily guessed information
                            </p>
                        </div>
                    </div>

                    {passwordMessage && (
                        <div
                            className={`rounded-xl border px-4 py-3 text-xs ${messageSuccess
                                ? "border-emerald-500/15 bg-emerald-500/[0.04] text-emerald-400"
                                : "border-red-500/15 bg-red-500/[0.04] text-red-400"
                                }`}
                        >
                            {passwordMessage}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={
                                changePassword
                            }
                            disabled={
                                passwordLoading
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2.5 text-xs font-medium text-blue-300 ring-1 ring-blue-400/20 transition hover:bg-blue-500/15 disabled:opacity-50"
                        >
                            {passwordLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Lock className="h-3.5 w-3.5" />
                            )}

                            {passwordLoading
                                ? "Updating..."
                                : "Update Password"}
                        </button>
                    </div>
                </div>
            </Card>

            {/* Security status */}
            <Card className="p-5">
                <SectionTitle
                    title="Account Security"
                    description="Review the security state of your administrator account."
                />

                <div className="space-y-3">
                    <SecurityRow
                        icon={Shield}
                        title="Administrator access"
                        description="This account has administrator privileges."
                        status="Active"
                    />

                    <SecurityRow
                        icon={Mail}
                        title="Email"
                        description="Your authentication email is managed by the auth system."
                        status="Protected"
                    />

                    <SecurityRow
                        icon={Lock}
                        title="Password"
                        description="Your password is protected by the authentication service."
                        status="Protected"
                    />
                </div>
            </Card>

            {/* Sign out */}
            <Card className="border-red-500/10 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Sign out
                        </h3>

                        <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-600">
                            Sign out from the current administrator session on this device.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onSignOut}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/15 bg-red-500/[0.04] px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/[0.08]"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                    </button>
                </div>
            </Card>
        </div>
    );
}

function SecurityRow({
    icon: Icon,
    title,
    description,
    status,
}: {
    icon: ComponentType<{
        className?: string;
    }>;
    title: string;
    description: string;
    status: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                    <Icon className="h-4 w-4 text-zinc-500" />
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-300">
                        {title}
                    </p>

                    <p className="mt-0.5 text-[10px] text-zinc-600">
                        {description}
                    </p>
                </div>
            </div>

            <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-400">
                {status}
            </span>
        </div>
    );
}

function ProfileLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-5">
                <div className="h-20 w-20 rounded-2xl bg-white/[0.05]" />

                <div className="space-y-3">
                    <div className="h-5 w-36 rounded bg-white/[0.05]" />

                    <div className="h-3 w-48 rounded bg-white/[0.04]" />

                    <div className="h-5 w-32 rounded-full bg-white/[0.04]" />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                {[1, 2, 3, 4].map(
                    (item) => (
                        <div
                            key={item}
                            className="space-y-2"
                        >
                            <div className="h-3 w-20 rounded bg-white/[0.04]" />

                            <div className="h-11 rounded-xl bg-white/[0.04]" />
                        </div>
                    )
                )}
            </div>
        </div>
    );
}