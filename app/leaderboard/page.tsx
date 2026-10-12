"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import BottomNav from "@/components/BottomNav";
import { Trophy, Medal, Award, Crown } from "lucide-react";

type Row = { id: string; name: string; school: string; medium: string; average: number };

const GRADES = [6, 7, 8, 9, 10, 11];

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [grade, setGrade] = useState<number>((session?.user as any)?.grade || 6);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if ((session?.user as any)?.grade) setGrade((session!.user as any).grade);
  }, [session]);

  useEffect(() => {
    fetch(`/api/leaderboard?grade=${grade}`).then((r) => r.json()).then(setRows);
  }, [grade]);

  const currentUserId = (session?.user as any)?.id;

  function getRankIcon(index: number) {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-orange-600" />;
    return <span className="w-6 text-center font-bold text-gray-500">{index + 1}</span>;
  }

  function getRankBadge(index: number) {
    if (index === 0) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
    if (index === 1) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
    if (index === 2) return "bg-gradient-to-r from-orange-400 to-orange-600 text-white";
    return "bg-blue-100 text-blue-600";
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 sm:px-6 pt-8 pb-12 shadow-lg animate-slide-in-left">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Leaderboard</h1>
              <p className="text-yellow-100 text-sm">Top performers by grade</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 -mt-8 max-w-4xl mx-auto">
        {/* Grade Selection */}
        <div className="card shadow-xl border-2 border-yellow-100 mb-6 animate-scale-in">
          <h2 className="font-semibold text-gray-900 mb-3">Select Grade</h2>
          <div className="flex gap-2 flex-wrap">
            {GRADES.map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${grade === g
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                Grade {g}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3">
          {rows.length === 0 ? (
            <div className="card text-center py-12 animate-fade-in">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No rankings yet</p>
              <p className="text-sm text-gray-500">
                Be the first to take a quiz for Grade {grade}!
              </p>
            </div>
          ) : (
            rows.map((r, i) => {
              const isCurrentUser = r.id === currentUserId;
              return (
                <div
                  key={r.id}
                  className={`card-interactive stagger-item ${i < 3 ? "shadow-xl border-2 border-yellow-200" : ""
                    } ${isCurrentUser ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getRankBadge(i)}`}>
                        {getRankIcon(i)}
                      </div>

                      {/* Student Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{r.name}</p>
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 sinhala-text">
                          {r.school} · {r.medium === "SINHALA" ? "සිංහල" : "English"}
                        </p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-600">
                        {r.average.toFixed(1)}
                      </div>
                      <p className="text-xs text-gray-500">avg score</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Card */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 mt-6 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-1">How rankings work</p>
              <p>Your average quiz score determines your position. Take more quizzes to improve your ranking!</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
