"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { NotebookPen, CheckCircle2, Download, AlertCircle } from "lucide-react";

type Lesson = { id: string; title: string; smartNote: string | null; notePdfKey: string | null };

export default function CreateNotesPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lessons").then((r) => r.json()).then(setLessons);
  }, []);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    setError(null);
  }

  async function createNotes() {
    if (selected.length === 0) return;
    setLoading(true);
    setDownloadUrl(null);
    setError(null);

    try {
      const res = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonIds: selected }),
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setLoading(false);
        const text = await res.text();
        console.error("Non-JSON response received:", text);
        setError("Server error occurred. Please check the server logs.");
        return;
      }

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setDownloadUrl(data.url);
      } else {
        setError(data.error || "Failed to generate notes");
      }
    } catch (err: any) {
      setLoading(false);
      console.error("Generate notes error:", err);
      setError(err.message || "An error occurred while generating notes");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 pb-28">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-blue-600 text-white px-4 sm:px-6 pt-8 pb-12 shadow-lg animate-slide-in-left">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <NotebookPen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Create Study Notes</h1>
              <p className="text-orange-100 text-sm">Compile notes from your lessons</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 -mt-8 max-w-4xl mx-auto">
        {/* Info Card */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-xl mb-6 animate-scale-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <NotebookPen className="w-5 h-5 text-white" />
            </div>
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-1">Compile your study materials!</p>
              <p>Select lessons to create a comprehensive study note PDF with all the important concepts.</p>
            </div>
          </div>
        </div>

        {/* Lesson Selection */}
        <div className="card shadow-xl border-2 border-orange-100 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-gray-900">Select Lessons</h2>
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
                  className={`card-interactive flex items-center gap-3 cursor-pointer stagger-item ${selected.includes(l.id) ? "border-orange-400 bg-orange-50" : ""
                    } ${!l.notePdfKey ? "opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(l.id)}
                    onChange={() => toggle(l.id)}
                    className="w-5 h-5 accent-orange-600 cursor-pointer"
                    disabled={!l.notePdfKey}
                  />
                  <div className="flex-1 sinhala-text">
                    <span className="font-medium text-gray-900">{l.title}</span>
                    {!l.notePdfKey && (
                      <span className="ml-2 text-xs text-orange-600 font-semibold flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        PDF note not available yet
                      </span>
                    )}
                  </div>
                  {selected.includes(l.id) && (
                    <CheckCircle2 className="w-5 h-5 text-orange-600 animate-scale-in" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          className={`btn-primary w-full flex items-center justify-center gap-2 shadow-2xl animate-fade-in bg-orange-600 hover:bg-orange-700 ${selected.length === 0 || loading ? "opacity-50" : "hover:scale-[1.02]"
            }`}
          style={{ animationDelay: "0.3s" }}
          disabled={selected.length === 0 || loading}
          onClick={createNotes}
        >
          {loading ? (
            <>
              <div className="spinner border-white"></div>
              <span>Preparing notes...</span>
            </>
          ) : (
            <>
              <NotebookPen className="w-5 h-5" />
              <span>Create Notes PDF</span>
            </>
          )}
        </button>

        {selected.length === 0 && (
          <p className="text-center text-sm text-gray-500 mt-4 animate-pulse-slow">
            Select at least one lesson to continue
          </p>
        )}

        {/* Error Message */}
        {error && (
          <div className="card bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 shadow-xl mt-6 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Error</p>
                <p className="text-sm text-gray-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Download Link */}
        {downloadUrl && (
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-xl mt-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Notes ready!</p>
                  <p className="text-sm text-gray-600">Your study notes PDF is ready</p>
                </div>
              </div>
              <a
                href={downloadUrl}
                target="_blank"
                className="btn-success flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
