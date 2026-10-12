"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard,
    BookOpen,
    FileQuestion,
    Users,
    LogOut,
    GraduationCap,
    FileText,
} from "lucide-react";

const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/textbooks", label: "Textbooks", icon: BookOpen },
    { href: "/admin/notes", label: "Notes", icon: FileText },
    { href: "/admin/manage-questions", label: "Questions", icon: FileQuestion },
    { href: "/admin/students", label: "Students", icon: Users },
];

export default function AdminNav() {
    const pathname = usePathname();

    return (
        <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/admin/dashboard" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">GoMath Admin</p>
                            <p className="text-xs text-gray-400">Teacher Portal</p>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-1">
                        {navItems.map(({ href, label, icon: Icon }) => {
                            const active = pathname.startsWith(href);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${active
                                        ? "bg-blue-600 text-white shadow-lg"
                                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{label}</span>
                                </Link>
                            );
                        })}

                        {/* Logout Button */}
                        <button
                            onClick={() => signOut({ callbackUrl: "/admin/login" })}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-all ml-2"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
