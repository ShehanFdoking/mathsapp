"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { Brain, Clock, CheckCircle2, Zap } from "lucide-react";

type Lesson = { id: string; title: string };

const DIFFICULTIES = [
  { key: "EASY", label: "Easy", desc: "20 min · 10 questions", icon: "🟢", color: "green" },
  { key: "MEDIUM", label: "Medium", desc: "30 min · 10 questions", icon: "🟡", color: "yellow" },
  { key: "HARD", label: "Hard", desc: "40 min · 10 questions", icon: "🔴", color: "red" },
];

export default function QuizSetupPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("EASY");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/lessons").then((r) => r.json()).then(setLessons);
  }, []);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function startQuiz() {
    if (selected.length === 0) return;
    setLoading(true);
    const res = await fetch("/api/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonIds: selected, difficulty }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      sessionStorage.setItem(`quiz-${data.id}`, JSON.stringify(data));
      router.push(`/quiz/${data.id}`);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-28">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 sm:px-6 pt-8 pb-12 shadow-lg animate-slide-in-left">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Practice Quiz</h1>
              <p className="text-purple-100 text-sm">Test your knowledge</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 -mt-8 max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="card shadow-xl border-2 border-purple-100 mb-6 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="font-bold text-purple-600">1</span>
              </div>
              <span className="font-semibold text-gray-900">Select Lessons</span>
            </div>
            <div className="text-sm text-gray-500">{selected.length} selected</div>
          </div>

          {lessons.length === 0 ? (
            <div className="text-center py-8 animate-pulse-slow">
              <div className="spinner mx-auto mb-3"></div>
              <p className="text-gray-600">Loading lessons...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((l, index) => (
                <label
                  key={l.id}
                  className={`card-interactive flex items-center gap-3 cursor-pointer stagger-item ${selected.includes(l.id) ? "border-purple-400 bg-purple-50" : ""
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(l.id)}
                    onChange={() => toggle(l.id)}
                    className="w-5 h-5 accent-purple-600 cursor-pointer"
                  />
                  <div className="flex-1 sinhala-text">
                    <span className="font-medium text-gray-900">{l.title}</span>
                  </div>
                  {selected.includes(l.id) && (
                    <CheckCircle2 className="w-5 h-5 text-purple-600 animate-scale-in" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Difficulty Selection */}
        <div className="card shadow-xl border-2 border-blue-100 mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="font-bold text-blue-600">2</span>
            </div>
            <span className="font-semibold text-gray-900">Select Difficulty</span>
          </div>

          <div className="space-y-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.key}
                onClick={() => setDifficulty(d.key)}
                className={`card-interactive w-full text-left transition-all ${difficulty === d.key
                    ? `border-${d.color}-400 bg-${d.color}-50 shadow-lg scale-[1.02]`
                    : "hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{d.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{d.label}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {d.desc}
                    </p>
                  </div>
                  {difficulty === d.key && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center animate-scale-in">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          className={`btn-primary w-full flex items-center justify-center gap-2 shadow-2xl animate-fade-in ${selected.length === 0 || loading ? "opacity-50" : "hover:scale-[1.02]"
            }`}
          style={{ animationDelay: "0.4s" }}
          disabled={selected.length === 0 || loading}
          onClick={startQuiz}
        >
          {loading ? (
            <>
              <div className="spinner border-white"></div>
              <span>Preparing quiz...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Start Quiz</span>
            </>
          )}
        </button>

        {selected.length === 0 && (
          <p className="text-center text-sm text-gray-500 mt-4 animate-pulse-slow">
            Select at least one lesson to continue
          </p>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
