"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { UserPlus, ArrowLeft, AlertCircle, Phone, Mail, CheckCircle } from "lucide-react";

const GRADES = [6, 7, 8, 9, 10, 11];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    age: "",
    grade: "",
    medium: "ENGLISH",
    school: "",
    contactType: "phone", // phone | email
    contact: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: any = {
      name: form.name,
      age: Number(form.age),
      grade: Number(form.grade),
      medium: form.medium,
      school: form.school,
      password: form.password,
      [form.contactType]: form.contact,
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message || data.error || "Registration failed");
      setLoading(false);
      return;
    }

    // auto sign in after successful registration
    const signInRes = await signIn("student", {
      identifier: form.contact,
      password: form.password,
      redirect: false,
    });

    setLoading(false);
    if (signInRes?.ok) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6 animate-slide-in-left"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </Link>

        {/* Register Card */}
        <div className="card shadow-2xl border-2 border-green-100 animate-scale-in">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Us!</h1>
            <p className="text-gray-600">Start your mathematics learning journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Medium */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Medium
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => update("medium", "ENGLISH")}
                  className={`card-interactive py-3 text-sm font-semibold transition-all ${form.medium === "ENGLISH"
                      ? "border-blue-400 bg-blue-50 shadow-md scale-[1.02]"
                      : ""
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {form.medium === "ENGLISH" && <CheckCircle className="w-4 h-4 text-blue-600" />}
                    <span>English</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => update("medium", "SINHALA")}
                  className={`card-interactive py-3 text-sm font-semibold transition-all sinhala-text ${form.medium === "SINHALA"
                      ? "border-blue-400 bg-blue-50 shadow-md scale-[1.02]"
                      : ""
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {form.medium === "SINHALA" && <CheckCircle className="w-4 h-4 text-blue-600" />}
                    <span>සිංහල</span>
                  </div>
                </button>
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

            {/* Contact Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => update("contactType", "phone")}
                  className={`card-interactive py-3 text-sm font-semibold transition-all ${form.contactType === "phone"
                      ? "border-green-400 bg-green-50 shadow-md scale-[1.02]"
                      : ""
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>Phone</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => update("contactType", "email")}
                  className={`card-interactive py-3 text-sm font-semibold transition-all ${form.contactType === "email"
                      ? "border-green-400 bg-green-50 shadow-md scale-[1.02]"
                      : ""
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Contact */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {form.contactType === "phone" ? "Phone Number" : "Email Address"}
              </label>
              <input
                className="input"
                placeholder={form.contactType === "phone" ? "07XXXXXXXX" : "you@example.com"}
                type={form.contactType === "phone" ? "tel" : "email"}
                required
                value={form.contact}
                onChange={(e) => update("contact", e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                className="input"
                placeholder="Create a strong password"
                type="password"
                minLength={6}
                required
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-start gap-2 animate-scale-in">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              className={`btn-success w-full flex items-center justify-center gap-2 shadow-xl ${loading ? "" : "hover:scale-[1.02]"
                }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner border-white"></div>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t-2 border-gray-100 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
