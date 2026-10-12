"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { User, Save, ArrowLeft, CheckCircle, AlertCircle, Phone, Mail, LogOut, FileText, NotebookPen } from "lucide-react";

const GRADES = [6, 7, 8, 9, 10, 11];

export default function ProfilePage() {
    const { data: session, update: updateSession } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        age: "",
        grade: "",
        school: "",
        phone: "",
        email: "",
    });

    useEffect(() => {
        if (session?.user) {
            const user = session.user as any;
            setForm({
                name: user.name || "",
                age: String(user.age || ""),
                grade: String(user.grade || ""),
                school: user.school || "",
                phone: user.phone || "",
                email: user.email || "",
            });
        }
    }, [session]);

    function update(field: string, value: string) {
        setForm((f) => ({ ...f, [field]: value }));
        setSuccess(false);
        setError(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const res = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: form.name,
                age: Number(form.age),
                grade: Number(form.grade),
                school: form.school,
                phone: form.phone || null,
                email: form.email || null,
            }),
        });

        const data = await res.json();
        setLoading(false);

        if (res.ok) {
            setSuccess(true);
            // Update session with new data
            await updateSession({
                ...session,
                user: {
                    ...session?.user,
                    name: form.name,
                    age: Number(form.age),
                    grade: Number(form.grade),
                    school: form.school,
                },
            });
            setTimeout(() => setSuccess(false), 3000);
        } else {
            setError(data.error || "Failed to update profile");
        }
    }

    if (!session) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="spinner"></div>
            </main>
        );
    }

    const user = session.user as any;

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-24">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 pt-8 pb-12 shadow-lg animate-slide-in-left">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
                            <p className="text-blue-100 text-sm">Update your information</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-4 sm:px-6 -mt-8 max-w-4xl mx-auto">
                {/* Success/Error Messages */}
                {success && (
                    <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 shadow-xl mb-6 animate-scale-in">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Profile Updated!</p>
                                <p className="text-sm text-gray-700">Your information has been saved successfully.</p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="card bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 shadow-xl mb-6 animate-scale-in">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Update Failed</p>
                                <p className="text-sm text-gray-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Form */}
                <div className="card shadow-2xl border-2 border-blue-100 animate-fade-in">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info Section */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <User className="w-4 h-4 text-blue-600" />
                                </span>
                                <span>Basic Information</span>
                            </h2>

                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        className="input"
                                        placeholder="Enter your full name"
                                        required
                                        value={form.name}
                                        onChange={(e) => update("name", e.target.value)}
                                    />
                                </div>

                                {/* Age & Grade */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Age
                                        </label>
                                        <input
                                            className="input"
                                            placeholder="Age"
                                            type="number"
                                            min="10"
                                            max="20"
                                            required
                                            value={form.age}
                                            onChange={(e) => update("age", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Grade
                                        </label>
                                        <select
                                            className="input"
                                            required
                                            value={form.grade}
                                            onChange={(e) => update("grade", e.target.value)}
                                        >
                                            <option value="">Select</option>
                                            {GRADES.map((g) => (
                                                <option key={g} value={g}>
                                                    Grade {g}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* School */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        School
                                    </label>
                                    <input
                                        className="input"
                                        placeholder="Enter your school name"
                                        required
                                        value={form.school}
                                        onChange={(e) => update("school", e.target.value)}
                                    />
                                </div>

                                {/* Medium (Read-only) */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Medium
                                    </label>
                                    <div className="input bg-gray-100 text-gray-600 cursor-not-allowed">
                                        {user.medium === "SINHALA" ? "සිංහල (Sinhala)" : "English"}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Medium cannot be changed. Contact support if needed.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info Section */}
                        <div className="pt-6 border-t-2 border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Phone className="w-4 h-4 text-purple-600" />
                                </span>
                                <span>Contact Information</span>
                            </h2>

                            <div className="space-y-4">
                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        <span>Phone Number</span>
                                    </label>
                                    <input
                                        className="input"
                                        placeholder="07XXXXXXXX"
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => update("phone", e.target.value)}
                                    />
                                    {!form.phone && (
                                        <p className="text-xs text-gray-500 mt-1">Optional - Add a phone number</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        <span>Email Address</span>
                                    </label>
                                    <input
                                        className="input"
                                        placeholder="you@example.com"
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => update("email", e.target.value)}
                                    />
                                    {!form.email && (
                                        <p className="text-xs text-gray-500 mt-1">Optional - Add an email address</p>
                                    )}
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                    <p className="text-xs text-gray-700">
                                        <span className="font-semibold">💡 Note:</span> At least one contact method (phone or email) is required for login.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6 border-t-2 border-gray-100">
                            <button
                                type="submit"
                                className={`btn-primary w-full flex items-center justify-center gap-2 shadow-xl ${loading ? "" : "hover:scale-[1.02]"
                                    }`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner border-white"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Card */}
                <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 mt-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-yellow-600 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-lg">🔒</span>
                        </div>
                        <div className="text-sm text-gray-700">
                            <p className="font-semibold mb-1">Privacy & Security</p>
                            <p>Your personal information is secure and will only be used for your learning experience. To change your password, please contact support.</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card shadow-xl border-2 border-purple-100 mt-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                        <Link
                            href="/create-paper"
                            className="card-interactive flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="font-medium text-gray-900">Create Exam Paper</span>
                            </div>
                            <span className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">→</span>
                        </Link>

                        <Link
                            href="/create-notes"
                            className="card-interactive flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <NotebookPen className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="font-medium text-gray-900">Create Study Notes</span>
                            </div>
                            <span className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">→</span>
                        </Link>

                        <Link
                            href="/my-papers"
                            className="card-interactive flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="font-medium text-gray-900">My Papers</span>
                            </div>
                            <span className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">→</span>
                        </Link>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="btn-danger w-full flex items-center justify-center gap-2 mt-6 animate-fade-in"
                    style={{ animationDelay: "0.4s" }}
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>

            <BottomNav />
        </main>
    );
}
