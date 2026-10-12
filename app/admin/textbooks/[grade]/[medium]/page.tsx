"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { Upload, FileText, Trash2, Edit2, Eye, Check, X, Loader, BookOpen } from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  order: number;
  startPage: number;
  endPage: number;
  smartNote: string | null;
};

type TextbookPart = {
  id: string;
  part: number;
  pageCount: number;
  uploadedAt: string;
  _count: { lessons: number };
};

export default function AdminTextbookDetail() {
  const router = useRouter();
  const { grade, medium } = useParams<{ grade: string; medium: string }>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [parts, setParts] = useState<TextbookPart[]>([]);
  const [part, setPart] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ title: string; startPage: number; endPage: number }>({
    title: "",
    startPage: 1,
    endPage: 1,
  });

  async function loadLessons() {
    const res = await fetch(`/api/admin/lessons?grade=${grade}&medium=${medium}`);
    setLessons(await res.json());
  }

  async function loadParts() {
    const res = await fetch(`/api/admin/textbooks?grade=${grade}&medium=${medium}`);
    setParts(await res.json());
  }

  useEffect(() => {
    loadLessons();
    loadParts();
  }, [grade, medium]);

  async function upload() {
    if (!file) return;
    setUploading(true);
    setStatus("Extracting text and identifying lessons... this can take a minute.");
    const form = new FormData();
    form.append("file", file);
    form.append("grade", grade);
    form.append("medium", medium);
    form.append("part", String(part));

    const res = await fetch("/api/admin/upload-textbook", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (res.ok) {
      const droppedNote = data.lessonsDropped > 0 ? ` (${data.lessonsDropped} detected lessons had invalid page ranges and were skipped.)` : "";
      const ocrNote = data.ocrSkippedWarning ? ` ⚠️ ${data.ocrSkippedWarning}` : "";
      setStatus(`Done — ${data.lessonsCreated} lessons identified.${droppedNote}${ocrNote}`);
      loadLessons();
      loadParts();
      setFile(null);
    } else {
      setStatus(`Error: ${data.error}`);
    }
  }

  async function deletePart(id: string) {
    if (!confirm("Delete this textbook part? This also removes its lessons and any question bank entries.")) return;
    await fetch(`/api/admin/textbooks/${id}`, { method: "DELETE" });
    loadParts();
    loadLessons();
  }

  async function generateNote(lessonId: string) {
    setStatus("Generating smart note...");
    const res = await fetch("/api/admin/generate-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    if (res.ok) {
      setStatus("Note generated.");
      loadLessons();
    }
  }

  function startEdit(l: Lesson) {
    setEditingId(l.id);
    setEditDraft({ title: l.title, startPage: l.startPage, endPage: l.endPage });
  }

  async function saveEdit(id: string) {
    setStatus("Saving lesson changes...");
    const res = await fetch(`/api/admin/lessons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("Lesson updated. Regenerate its smart note if the page range changed.");
      setEditingId(null);
      loadLessons();
    } else {
      setStatus(`Error: ${data.error}`);
    }
  }

  async function deleteLesson(id: string) {
    if (!confirm("Delete this lesson and its question bank entries?")) return;
    await fetch(`/api/admin/lessons/${id}`, { method: "DELETE" });
    loadLessons();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-slide-in-left">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-medium mb-3 flex items-center gap-2"
          >
            ← Back to Textbooks
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Grade {grade} — {medium === "SINHALA" ? "Sinhala" : "English"} Textbook
              </h1>
              <p className="text-gray-600">
                Upload parts separately — system extracts text and detects lessons automatically
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-fade-in">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <p className="text-sm text-gray-600 font-medium mb-1">Textbook Parts</p>
            <p className="text-3xl font-bold text-blue-600">{parts.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <p className="text-sm text-gray-600 font-medium mb-1">Total Lessons</p>
            <p className="text-3xl font-bold text-green-600">{lessons.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <p className="text-sm text-gray-600 font-medium mb-1">With Notes</p>
            <p className="text-3xl font-bold text-purple-600">
              {lessons.filter(l => l.smartNote).length}
            </p>
          </div>
        </div>

        {/* Upload Card */}
        <div className="card border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 mb-6 animate-fade-in">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900 mb-2">Upload a Textbook Part</h2>
              <p className="text-sm text-gray-600 mb-4">
                Select the part number (1, 2, or 3) and upload the PDF file
              </p>

              <div className="flex gap-3 mb-4">
                <select
                  className="input flex-1"
                  value={part}
                  onChange={(e) => setPart(Number(e.target.value))}
                  disabled={uploading}
                >
                  {[1, 2, 3].map((p) => (
                    <option key={p} value={p}>
                      Part {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block">
                  <div className="relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer cursor-pointer"
                    />
                  </div>
                </label>
                {file && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <button
                className="btn-primary w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                disabled={!file || uploading}
                onClick={upload}
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Process
                  </>
                )}
              </button>

              {status && (
                <div className={`mt-4 p-3 rounded-lg ${status.includes("Error")
                    ? "bg-red-100 border border-red-200 text-red-700"
                    : status.includes("Done")
                      ? "bg-green-100 border border-green-200 text-green-700"
                      : "bg-blue-100 border border-blue-200 text-blue-700"
                  }`}>
                  <p className="text-sm font-medium">{status}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Uploaded Parts */}
        {parts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Uploaded Textbook Parts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {parts.map((p, index) => (
                <div
                  key={p.id}
                  className="card-interactive border-2 border-gray-200 stagger-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {p.part}
                        </div>
                        <h3 className="font-bold text-gray-900">Part {p.part}</h3>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>📄 {p.pageCount} pages</p>
                        <p>📚 {p._count.lessons} lessons</p>
                        <p className="text-xs">
                          {new Date(p.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deletePart(p.id)}
                    className="w-full btn-danger flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Part
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lessons */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-900">Identified Lessons</h2>
          {lessons.length === 0 ? (
            <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 text-center py-12">
              <FileText className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">No lessons yet</p>
              <p className="text-gray-600 text-sm">Upload a textbook part above to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map((l, index) => (
                <div
                  key={l.id}
                  className="card border-2 border-gray-200 stagger-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {editingId === l.id ? (
                    <div className="space-y-3">
                      <input
                        className="input"
                        value={editDraft.title}
                        onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                        placeholder="Lesson title"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          className="input"
                          value={editDraft.startPage}
                          min={1}
                          onChange={(e) => setEditDraft((d) => ({ ...d, startPage: Number(e.target.value) }))}
                          placeholder="Start page"
                        />
                        <input
                          type="number"
                          className="input"
                          value={editDraft.endPage}
                          min={1}
                          onChange={(e) => setEditDraft((d) => ({ ...d, endPage: Number(e.target.value) }))}
                          placeholder="End page"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Page numbers refer to the position within the uploaded PDF part
                      </p>
                      <div className="flex gap-2">
                        <button
                          className="flex-1 btn-success flex items-center justify-center gap-2"
                          onClick={() => saveEdit(l.id)}
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          className="flex-1 btn-secondary flex items-center justify-center gap-2"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                              Lesson {l.order}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                              Pages {l.startPage}-{l.endPage}
                            </span>
                            {l.smartNote && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Has Note
                              </span>
                            )}
                          </div>
                          <h3
                            className="font-bold text-gray-900 text-lg sinhala-text"
                          >
                            {l.title}
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`/api/admin/lessons/${l.id}/pdf`}
                          target="_blank"
                          className="btn-outline flex items-center justify-center gap-2 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View PDF
                        </a>
                        <button
                          onClick={() => generateNote(l.id)}
                          className="btn-primary bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          {l.smartNote ? "Regen Note" : "Gen Note"}
                        </button>
                        <button
                          onClick={() => startEdit(l)}
                          className="btn-secondary flex items-center justify-center gap-2 text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteLesson(l.id)}
                          className="btn-danger flex items-center justify-center gap-2 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                      <a
                        href={`/admin/questions/${l.id}`}
                        className="block text-center mt-2 btn-outline border-blue-600 text-blue-700 hover:bg-blue-50"
                      >
                        📝 Manage Questions
                      </a>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Card */}
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 mt-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Textbook Processing Tips</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Upload each part (1, 2, 3) separately</li>
                <li>• System automatically detects lesson boundaries</li>
                <li>• Review and edit lesson titles/pages if needed</li>
                <li>• Generate smart notes for student study materials</li>
                <li>• Create question banks after processing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
