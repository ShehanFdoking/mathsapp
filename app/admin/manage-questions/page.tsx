"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";

const GRADES = [6, 7, 8, 9, 10, 11];
const MEDIUMS = ["ENGLISH", "SINHALA"];
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

type Step = "grade" | "medium" | "lesson" | "difficulty";
type Lesson = {
    id: string;
    title: string;
    order: number;
    _count: { questions: number };
};

export default function ManageQuestionsPage() {
    const [step, setStep] = useState<Step>("grade");
    const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
    const [selectedMedium, setSelectedMedium] = useState<string | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loadingLessons, setLoadingLessons] = useState(false);

    const handleGradeSelect = (grade: number) => {
        setSelectedGrade(grade);
        setStep("medium");
    };

    const handleMediumSelect = async (medium: string) => {
        setSelectedMedium(medium);
        setLoadingLessons(true);

        try {
            const res = await fetch(`/api/admin/lessons?grade=${selectedGrade}&medium=${medium}`);
            const data = await res.json();
            setLessons(data);
        } catch (err) {
            console.error("Failed to load lessons:", err);
            setLessons([]);
        } finally {
            setLoadingLessons(false);
        }

        setStep("lesson");
    };

    const handleLessonSelect = (lesson: Lesson) => {
        setSelectedLesson(lesson);
        setStep("difficulty");
    };

    const goBack = () => {
        if (step === "medium") {
            setStep("grade");
            setSelectedGrade(null);
        } else if (step === "lesson") {
            setStep("medium");
            setSelectedMedium(null);
            setLessons([]);
        } else if (step === "difficulty") {
            setStep("lesson");
            setSelectedLesson(null);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <AdminNav />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8 animate-slide-in-left">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">📝</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Question Bank Management</h1>
                            <p className="text-gray-600">Navigate through grades, mediums, and lessons to manage questions</p>
                        </div>
                    </div>
                </div>

                {/* Breadcrumb */}
                <div className="card border-2 border-blue-200 bg-blue-50 mb-6 animate-fade-in">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                        <span className={`px-3 py-1 rounded-lg ${step === "grade" ? "bg-blue-600 text-white font-bold" : "bg-white text-gray-600"}`}>
                            Grade {selectedGrade || "?"}
                        </span>
                        {selectedGrade && (
                            <>
                                <span className="text-gray-400">→</span>
                                <span className={`px-3 py-1 rounded-lg ${step === "medium" ? "bg-blue-600 text-white font-bold" : "bg-white text-gray-600"}`}>
                                    {selectedMedium || "Medium"}
                                </span>
                            </>
                        )}
                        {selectedMedium && (
                            <>
                                <span className="text-gray-400">→</span>
                                <span className={`px-3 py-1 rounded-lg ${step === "lesson" ? "bg-blue-600 text-white font-bold" : "bg-white text-gray-600"} max-w-xs truncate`}>
                                    {selectedLesson ? selectedLesson.title : "Lesson"}
                                </span>
                            </>
                        )}
                        {selectedLesson && (
                            <>
                                <span className="text-gray-400">→</span>
                                <span className={`px-3 py-1 rounded-lg ${step === "difficulty" ? "bg-blue-600 text-white font-bold" : "bg-white text-gray-600"}`}>
                                    {selectedDifficulty || "Difficulty"}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Grade Selection */}
                {step === "grade" && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">Select Grade</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {GRADES.map((grade, index) => (
                                <button
                                    key={grade}
                                    onClick={() => handleGradeSelect(grade)}
                                    className="card-interactive border-2 border-gray-200 stagger-item group"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition">
                                            Grade {grade}
                                        </span>
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                            {grade}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600">Select to continue →</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Medium Selection */}
                {step === "medium" && selectedGrade && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">
                            Select Medium for Grade {selectedGrade}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                            {MEDIUMS.map((medium, index) => (
                                <button
                                    key={medium}
                                    onClick={() => handleMediumSelect(medium)}
                                    className="card-interactive border-2 border-gray-200 stagger-item group"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-16 h-16 ${medium === "ENGLISH" ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-orange-500 to-orange-600"} rounded-xl flex items-center justify-center text-3xl`}>
                                            {medium === "ENGLISH" ? "🇬🇧" : "🇱🇰"}
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition">
                                                {medium === "ENGLISH" ? "English Medium" : "Sinhala Medium"}
                                            </h3>
                                            <p className="text-sm text-gray-600">Click to view lessons</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={goBack}
                            className="btn-secondary"
                        >
                            ← Back to Grade Selection
                        </button>
                    </div>
                )}

                {/* Lesson Selection */}
                {step === "lesson" && selectedGrade && selectedMedium && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">
                            Select Lesson - Grade {selectedGrade} {selectedMedium}
                        </h2>

                        {loadingLessons ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                                <p className="ml-4 text-gray-600 font-medium">Loading lessons...</p>
                            </div>
                        ) : lessons.length === 0 ? (
                            <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="text-2xl">⚠️</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 mb-2">No lessons found</p>
                                        <p className="text-sm text-gray-700">
                                            No lessons found for Grade {selectedGrade} {selectedMedium}.
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Upload textbooks first to generate lessons.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                                {lessons.map((lesson, index) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => handleLessonSelect(lesson)}
                                        className="card-interactive border-2 border-gray-200 text-left stagger-item group"
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <p
                                                    className="font-bold text-gray-900 text-lg mb-2 sinhala-text group-hover:text-blue-600 transition"
                                                >
                                                    {lesson.order}. {lesson.title}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                                        {lesson._count?.questions || 0} questions
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-blue-500 text-2xl group-hover:translate-x-1 transition">→</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={goBack}
                            className="btn-secondary"
                        >
                            ← Back to Medium Selection
                        </button>
                    </div>
                )}

                {/* Difficulty Selection */}
                {step === "difficulty" && selectedGrade && selectedMedium && selectedLesson && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold mb-2 text-gray-900 sinhala-text">
                            {selectedLesson.title}
                        </h2>
                        <p className="text-gray-600 mb-6">Select difficulty level to manage questions</p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                            {DIFFICULTIES.map((difficulty, index) => (
                                <Link
                                    key={difficulty}
                                    href={`/admin/questions/${selectedLesson.id}?difficulty=${difficulty}`}
                                    className="card-interactive border-2 border-gray-200 text-center stagger-item group"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className={`w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center text-3xl ${difficulty === "EASY" ? "bg-gradient-to-br from-green-400 to-green-600" :
                                            difficulty === "MEDIUM" ? "bg-gradient-to-br from-yellow-400 to-yellow-600" :
                                                "bg-gradient-to-br from-red-400 to-red-600"
                                        }`}>
                                        {difficulty === "EASY" && "🟢"}
                                        {difficulty === "MEDIUM" && "🟡"}
                                        {difficulty === "HARD" && "🔴"}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition">
                                        {difficulty}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-2">Manage questions →</p>
                                </Link>
                            ))}
                        </div>

                        <button
                            onClick={goBack}
                            className="btn-secondary"
                        >
                            ← Back to Lesson Selection
                        </button>
                    </div>
                )}

                {/* Help Card */}
                <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 mt-8 animate-fade-in">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-xl">💡</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">Question Bank Workflow</h3>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>• Select grade, medium, lesson, and difficulty level</li>
                                <li>• Generate new questions using AI</li>
                                <li>• Review and approve questions before publishing</li>
                                <li>• Attach diagrams to questions that need visual aids</li>
                                <li>• Approved questions become available to students</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
