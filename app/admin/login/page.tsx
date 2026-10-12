"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, LogIn, AlertCircle, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("admin", { username, password, redirect: false });
    setLoading(false);

    if (res?.ok) {
      router.push("/admin/dashboard");
    } else {
      setError("Invalid admin credentials");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-medium mb-6 transition-colors animate-slide-in-left"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </Link>

        {/* Login Card */}
        <div className="card shadow-2xl border-2 border-gray-700 bg-gray-800 animate-scale-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse-slow">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-gray-400">Sign in to manage the platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Username
              </label>
              <input
                className="input bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                placeholder="Enter admin username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <input
                className="input bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                placeholder="Enter password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border-2 border-red-500 rounded-xl p-3 flex items-start gap-2 animate-scale-in">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-200 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className={`btn-primary w-full flex items-center justify-center gap-2 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 ${loading ? "" : "hover:scale-[1.02]"
                }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t-2 border-gray-700 text-center">
            <p className="text-gray-400 text-sm">
              Not an admin?{" "}
              <Link href="/login" className="text-blue-400 font-semibold hover:text-blue-300">
                Student login
              </Link>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-gray-500 text-xs animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <p>Secure admin access · GoMath Learning Platform</p>
        </div>
      </div>
    </main>
  );
}
