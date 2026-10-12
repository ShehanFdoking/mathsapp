"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { FileText, Clock, CheckCircle2, Download } from "lucide-react";

type Lesson = { id: string; title: string; order: number };

const DIFFICULTIES = [
  { key: "EASY", label: "Easy", desc: "30 min paper · direct questions", icon: "🟢", time: "30 min" },
  { key: "MEDIUM", label: "Medium", desc: "45 min paper · combined concepts", icon: "🟡", time: "45 min" },
  { key: "HARD", label: "Hard", desc: "1 hour paper · multi-step problems", icon: "🔴", time: "1 hour" },
];

export default function CreatePaperPage() {
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

  async function createPaper() {
    if (selected.length === 0) return;
    setLoading(true);
    const res = await fetch("/api/generate-paper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonIds: selected, difficulty }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/my-papers");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 pb-28">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 sm:px-6 pt-8 pb-12 shadow-lg animate-slide-in-left">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Create Exam Paper</h1>
              <p className="text-green-100 text-sm">Generate custom practice papers</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 -mt-8 max-w-4xl mx-auto">
        {/* Info Card */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-xl mb-6 animate-scale-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-1">Create a downloadable practice paper!</p>
              <p>Select lessons and difficulty level. Your paper will be generated as a PDF with model answers.</p>
            </div>
          </div>
        </div>

        {/* Lesson Selection */}
        <div className="card shadow-xl border-2 border-green-100 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="font-bold text-green-600">1</span>
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
              {lessons.map((l) => (
                <label
                  key={l.id}
                  className={`card-interactive flex items-center gap-3 cursor-pointer stagger-item ${selected.includes(l.id) ? "border-green-400 bg-green-50" : ""
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(l.id)}
                    onChange={() => toggle(l.id)}
                    className="w-5 h-5 accent-green-600 cursor-pointer"
                  />
                  <div className="flex-1 sinhala-text">
                    <span className="font-medium text-gray-900">{l.title}</span>
                  </div>
                  {selected.includes(l.id) && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 animate-scale-in" />
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
                    ? "border-green-400 bg-green-50 shadow-lg scale-[1.02]"
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
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center animate-scale-in">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          className={`btn-success w-full flex items-center justify-center gap-2 shadow-2xl animate-fade-in ${selected.length === 0 || loading ? "opacity-50" : "hover:scale-[1.02]"
            }`}
          style={{ animationDelay: "0.4s" }}
          disabled={selected.length === 0 || loading}
          onClick={createPaper}
        >
          {loading ? (
            <>
              <div className="spinner border-white"></div>
              <span>Generating paper...</span>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              <span>Create Paper</span>
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
