"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, FileText, Brain, Trophy, LogOut, NotebookPen, User } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/quiz", label: "Quiz", icon: Brain },
  { href: "/create-paper", label: "Paper", icon: FileText },
  { href: "/create-notes", label: "Notes", icon: NotebookPen },
  { href: "/leaderboard", label: "Leaders", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t-2 border-gray-200 shadow-2xl z-40 overflow-x-auto">
      <div className="flex justify-around py-2 min-w-max px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center text-xs gap-1 px-2 py-2 rounded-xl transition-all min-w-[56px] ${active
                ? "text-blue-600 bg-blue-50 font-semibold"
                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center text-xs gap-1 px-2 py-2 rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all min-w-[56px]"
        >
          <LogOut size={20} strokeWidth={2} />
          <span className="text-[10px]">Logout</span>
        </button>
      </div>
    </nav>
  );
}
