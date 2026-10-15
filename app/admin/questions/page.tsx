"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Question = {
    id: string;
    question: string;
    options: string[] | null;
    answerIndex: number | null;
    modelAnswer: string | null;
    explanation: string | null;
    hint: string | null;
    marks: number;
    difficulty: string;
    type: "MCQ" | "STRUCTURED";
    status: string;
    grade: number;
    medium: string;
    diagramUrl: string | null;
};

// Function to clean LaTeX formatting from text
function cleanLatexText(text: string): string {
    if (!text) return text;
    return text
        // Remove inline math mode delimiters
        .replace(/\$\$/g, "")
        .replace(/\$/g, "")
        // Replace common LaTeX operators
        .replace(/\\times/g, "×")
        .replace(/\\div/g, "÷")
        .replace(/\\cdot/g, "·")
        .replace(/\\pm/g, "±")
        .replace(/\\leq/g, "≤")
        .replace(/\\geq/g, "≥")
        .replace(/\\neq/g, "≠")
        .replace(/\\approx/g, "≈")
        // Handle fractions
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
        // Remove LaTeX commands
        .replace(/\\left/g, "")
        .replace(/\\right/g, "")
        .replace(/\\,/g, " ")
        .replace(/\\;/g, " ")
        .replace(/\\:/g, " ")
        .replace(/\\\[/g, "")
        .replace(/\\\]/g, "")
        .replace(/\\\(/g, "")
        .replace(/\\\)/g, "")
        .replace(/\\text\{([^}]+)\}/g, "$1")
        // Clean up extra spaces
        .replace(/\s+/g, " ")
        .trim();
}

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

function QuestionsManagementPageContent() {
    const searchParams = useSearchParams();
    const grade = searchParams.get("grade");
    const medium = searchParams.get("medium");
    const type = searchParams.get("type") as "MCQ" | "STRUCTURED" | null;
    const difficulty = searchParams.get("difficulty");

    const [questions, setQuestions] = useState<Question[]>([]);
    const [status, setStatus] = useState("PENDING");
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<Partial<Question>>({});

    async function load() {
        try {
            const res = await fetch(
                `/api/admin/questions?grade=${grade}&medium=${medium}&type=${type}&difficulty=${difficulty}&status=${status}`
            );
            const data = await res.json();
            setQuestions(data);
        } catch (err) {
            console.error("Failed to load questions:", err);
        }
    }

    useEffect(() => {
        if (grade && medium && type && difficulty) {
            load();
        }
    }, [grade, medium, type, difficulty, status]);

    const filteredQuestions = questions.filter((q) =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase())
    );

    async function review(id: string, action: "approve" | "reject", edits?: any) {
        await fetch(`/api/admin/questions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, edits }),
        });
        setEditingId(null);
        load();
    }

    async function deleteQuestion(id: string) {
        if (!confirm("Delete this question? This cannot be undone.")) return;
        try {
            await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
            load();
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    }

    function startEdit(q: Question) {
        setEditingId(q.id);
        setEditDraft(q);
    }

    if (!grade || !medium || !type || !difficulty) {
        return (
            <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
                <p className="text-gray-600 mb-4">Invalid filters. Please select from Manage Question Bank.</p>
                <Link href="/admin/manage-questions" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Go Back
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/admin/manage-questions"
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition mb-4 inline-block"
                >
                    ← Back to Selection
                </Link>
                <h1 className="text-2xl font-bold">
                    📚 Grade {grade} • {medium} • {type} • {difficulty}
                </h1>
                <p className="text-gray-500 mt-1">Manage {difficulty.toLowerCase()} {type === "MCQ" ? "quiz MCQs" : "paper questions"}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm">Total</p>
                    <p className="text-2xl font-bold">{questions.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{questions.filter(q => q.status === "APPROVED").length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{questions.filter(q => q.status === "PENDING").length}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex gap-2 mb-4">
                    {["PENDING", "APPROVED", "REJECTED"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`px-4 py-2 rounded text-sm font-semibold transition ${status === s ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                />
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {filteredQuestions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No questions found</p>
                ) : (
                    filteredQuestions.map((q) => (
                        <div key={q.id} className="bg-white rounded-lg p-4 border border-gray-200">
                            {editingId === q.id ? (
                                <div className="space-y-3">
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded"
                                        value={editDraft.question}
                                        onChange={(e) => setEditDraft((d) => ({ ...d, question: e.target.value }))}
                                    />
                                    {q.type === "MCQ" ? (
                                        <>
                                            {editDraft.options?.map((opt, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        checked={editDraft.answerIndex === i}
                                                        onChange={() => setEditDraft((d) => ({ ...d, answerIndex: i }))}
                                                    />
                                                    <input
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const options = [...(editDraft.options || [])];
                                                            options[i] = e.target.value;
                                                            setEditDraft((d) => ({ ...d, options }));
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                            <textarea
                                                className="w-full px-3 py-2 border border-gray-300 rounded"
                                                placeholder="Explanation"
                                                value={editDraft.explanation || ""}
                                                onChange={(e) => setEditDraft((d) => ({ ...d, explanation: e.target.value }))}
                                            />
                                        </>
                                    ) : (
                                        <textarea
                                            className="w-full px-3 py-2 border border-gray-300 rounded"
                                            placeholder="Model answer"
                                            rows={4}
                                            value={editDraft.modelAnswer || ""}
                                            onChange={(e) => setEditDraft((d) => ({ ...d, modelAnswer: e.target.value }))}
                                        />
                                    )}
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded"
                                        placeholder="Hint"
                                        value={editDraft.hint || ""}
                                        onChange={(e) => setEditDraft((d) => ({ ...d, hint: e.target.value }))}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => review(q.id, "approve", editDraft)}
                                            className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                            Save & Approve
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Display attached diagram if exists */}
                                    {q.diagramUrl && (
                                        <div className="mb-3 border border-gray-300 rounded-lg p-2 bg-gray-50">
                                            <img
                                                src={q.diagramUrl}
                                                alt="Question diagram"
                                                className="max-w-full h-auto max-h-64 mx-auto"
                                            />
                                        </div>
                                    )}

                                    <p className="font-medium mb-2 whitespace-pre-wrap">{cleanLatexText(q.question)}</p>
                                    {q.type === "MCQ" ? (
                                        <ul className="text-sm space-y-1 mb-3">
                                            {q.options?.map((opt, i) => (
                                                <li key={i} className={i === q.answerIndex ? "text-green-600 font-bold" : "text-gray-600"}>
                                                    {["A", "B", "C", "D"][i]}) {cleanLatexText(opt)}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{cleanLatexText(q.modelAnswer || "")}</p>
                                    )}
                                    {q.explanation && (
                                        <p className="text-sm text-blue-600 mb-2 whitespace-pre-wrap">
                                            <strong>Explanation:</strong> {cleanLatexText(q.explanation)}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 mb-3">
                                        {q.marks} marks • Status: {q.status}
                                    </p>
                                    <div className="flex gap-2">
                                        {status === "PENDING" && (
                                            <>
                                                <button
                                                    onClick={() => review(q.id, "approve")}
                                                    className="flex-1 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => startEdit(q)}
                                                    className="flex-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => review(q.id, "reject")}
                                                    className="flex-1 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => deleteQuestion(q.id)}
                                            className="flex-1 px-3 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 border border-red-300"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}


export default function QuestionsManagementPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <p className="text-gray-600">Loading...</p>
            </main>
        }>
            <QuestionsManagementPageContent />
        </Suspense>
    );
}
