"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import {
    FileText,
    Search,
    RefreshCw,
    Eye,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader,
} from "lucide-react";

type Lesson = {
    id: string;
    title: string;
    grade: number;
    medium: string;
    order: number;
    smartNote: string | null;
    createdAt: string;
};

const GRADES = [6, 7, 8, 9, 10, 11];
const MEDIUMS = ["ENGLISH", "SINHALA"];

export default function AdminNotesPage() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterGrade, setFilterGrade] = useState<number | "all">("all");
    const [filterMedium, setFilterMedium] = useState<string | "all">("all");
    const [filterStatus, setFilterStatus] = useState<"all" | "with-notes" | "without-notes">("all");
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [generating, setGenerating] = useState<string | null>(null);

    function load() {
        fetch("/api/admin/lessons")
            .then((r) => r.json())
            .then((data) => {
                setLessons(data);
                setFilteredLessons(data);
            });
    }

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        let filtered = lessons;

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter((l) =>
                l.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Grade filter
        if (filterGrade !== "all") {
            filtered = filtered.filter((l) => l.grade === filterGrade);
        }

        // Medium filter
        if (filterMedium !== "all") {
            filtered = filtered.filter((l) => l.medium === filterMedium);
        }

        // Status filter
        if (filterStatus === "with-notes") {
            filtered = filtered.filter((l) => l.smartNote);
        } else if (filterStatus === "without-notes") {
            filtered = filtered.filter((l) => !l.smartNote);
        }

        setFilteredLessons(filtered);
    }, [searchQuery, filterGrade, filterMedium, filterStatus, lessons]);

    async function generateNote(lessonId: string) {
        setGenerating(lessonId);
        try {
            const res = await fetch("/api/admin/generate-note", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessonId }),
            });

            if (res.ok) {
                load(); // Reload lessons
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || "Failed to generate note"}`);
            }
        } catch (err) {
            alert("Failed to generate note");
        } finally {
            setGenerating(null);
        }
    }

    const lessonsWithNotes = lessons.filter((l) => l.smartNote).length;
    const lessonsWithoutNotes = lessons.length - lessonsWithNotes;

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <AdminNav />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8 animate-slide-in-left">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Notes Management</h1>
                            <p className="text-gray-600">
                                {lessonsWithNotes} notes generated · {lessonsWithoutNotes} pending
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <p className="text-sm text-gray-600 font-medium mb-1">Total Lessons</p>
                        <p className="text-3xl font-bold text-blue-600">{lessons.length}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <p className="text-sm text-gray-600 font-medium mb-1">With Notes</p>
                        <p className="text-3xl font-bold text-green-600">{lessonsWithNotes}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                        <p className="text-sm text-gray-600 font-medium mb-1">Pending</p>
                        <p className="text-3xl font-bold text-orange-600">{lessonsWithoutNotes}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="card shadow-xl border-2 border-gray-200 mb-6 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                className="input pl-10"
                                placeholder="Search lessons..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Grade Filter */}
                        <select
                            className="input"
                            value={filterGrade}
                            onChange={(e) =>
                                setFilterGrade(e.target.value === "all" ? "all" : Number(e.target.value))
                            }
                        >
                            <option value="all">All Grades</option>
                            {GRADES.map((g) => (
                                <option key={g} value={g}>
                                    Grade {g}
                                </option>
                            ))}
                        </select>

                        {/* Medium Filter */}
                        <select
                            className="input"
                            value={filterMedium}
                            onChange={(e) => setFilterMedium(e.target.value)}
                        >
                            <option value="all">All Mediums</option>
                            {MEDIUMS.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            className="input"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                            <option value="all">All Status</option>
                            <option value="with-notes">With Notes</option>
                            <option value="without-notes">Pending</option>
                        </select>
                    </div>
                </div>

                {/* Lessons Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredLessons.length === 0 ? (
                        <div className="col-span-full card text-center py-16">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium mb-2">No lessons found</p>
                            <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                        </div>
                    ) : (
                        filteredLessons.map((lesson, index) => (
                            <div
                                key={lesson.id}
                                className="card-interactive stagger-item border-2 border-gray-200"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                                                Grade {lesson.grade}
                                            </span>
                                            <span
                                                className={`px-2 py-1 rounded-lg text-xs font-semibold ${lesson.medium === "SINHALA"
                                                        ? "bg-orange-100 text-orange-700"
                                                        : "bg-green-100 text-green-700"
                                                    }`}
                                            >
                                                {lesson.medium}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 sinhala-text text-lg mb-1">
                                            {lesson.order}. {lesson.title}
                                        </h3>
                                    </div>

                                    {/* Status Icon */}
                                    {lesson.smartNote ? (
                                        <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-gray-300 shrink-0" />
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-4">
                                    {lesson.smartNote ? (
                                        <>
                                            <button
                                                onClick={() => setSelectedLesson(lesson)}
                                                className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Note
                                            </button>
                                            <button
                                                onClick={() => generateNote(lesson.id)}
                                                disabled={generating === lesson.id}
                                                className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm bg-green-600 hover:bg-green-700"
                                            >
                                                {generating === lesson.id ? (
                                                    <>
                                                        <Loader className="w-4 h-4 animate-spin" />
                                                        Regenerating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw className="w-4 h-4" />
                                                        Regenerate
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => generateNote(lesson.id)}
                                            disabled={generating === lesson.id}
                                            className="w-full btn-primary flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                                        >
                                            {generating === lesson.id ? (
                                                <>
                                                    <Loader className="w-4 h-4 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="w-4 h-4" />
                                                    Generate Note
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Note Preview Modal */}
            {selectedLesson && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="card max-w-4xl w-full max-h-[80vh] overflow-y-auto animate-scale-in">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 sinhala-text">
                                    {selectedLesson.title}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Grade {selectedLesson.grade} · {selectedLesson.medium}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedLesson(null)}
                                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition"
                            >
                                ×
                            </button>
                        </div>

                        <div className="prose prose-sm max-w-none sinhala-text">
                            {selectedLesson.smartNote ? (
                                <div className="whitespace-pre-wrap">{selectedLesson.smartNote}</div>
                            ) : (
                                <p className="text-gray-500">No note available</p>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => generateNote(selectedLesson.id)}
                                disabled={generating === selectedLesson.id}
                                className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                                {generating === selectedLesson.id ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Regenerating...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Regenerate Note
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setSelectedLesson(null)}
                                className="btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
