"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Clock, Lightbulb, CheckCircle, XCircle, Trophy, Home } from "lucide-react";

type QuizData = {
  id: string;
  durationMin: number;
  questions: {
    id: string;
    question: string;
    options: string[];
    hint: string | null;
    diagramUrl: string | null;
  }[];
};

type Result = {
  score: number;
  total: number;
  percentage: number;
  correctAnswers: number[];
  explanations: (string | null)[];
};

export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [shownHints, setShownHints] = useState<Record<number, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(`quiz-${id}`);
    if (stored) {
      const data: QuizData = JSON.parse(stored);
      setQuiz(data);
      setAnswers(new Array(data.questions.length).fill(-1));
      setSecondsLeft(data.durationMin * 60);
    }
  }, [id]);

  useEffect(() => {
    if (!quiz || result) return;
    if (secondsLeft <= 0) {
      submit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, quiz, result]);

  async function submit() {
    if (submittedRef.current || !quiz) return;
    submittedRef.current = true;
    const res = await fetch(`/api/quiz/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    if (res.ok) setResult(data);
  }

  function selectAnswer(qIndex: number, optIndex: number) {
    setAnswers((a) => a.map((v, i) => (i === qIndex ? optIndex : v)));
  }

  function toggleHint(qIndex: number) {
    setShownHints((h) => ({ ...h, [qIndex]: !h[qIndex] }));
  }

  if (!quiz) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="card text-center animate-pulse-slow">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading quiz...</p>
        </div>
      </main>
    );
  }

  if (result) {
    const passed = result.percentage >= 50;
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Results Header */}
          <div className={`card shadow-2xl text-center mb-6 animate-scale-in ${passed ? "bg-gradient-to-br from-green-50 to-green-100 border-green-300" : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300"
            }`}>
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${passed ? "bg-green-600" : "bg-orange-600"
              }`}>
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
            <div className="text-5xl font-bold mb-2">
              <span className={passed ? "text-green-600" : "text-orange-600"}>
                {result.score}
              </span>
              <span className="text-gray-400">/{result.total}</span>
            </div>
            <p className="text-xl font-semibold text-gray-700">
              {result.percentage.toFixed(0)}% correct
            </p>
            {passed ? (
              <p className="text-green-700 font-medium mt-2">🎉 Great job! Keep it up!</p>
            ) : (
              <p className="text-orange-700 font-medium mt-2">💪 Keep practicing!</p>
            )}
          </div>

          {/* Question Review */}
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 animate-fade-in">
            <span>📝</span>
            <span>Review Answers</span>
          </h2>
          <div className="space-y-4">
            {quiz.questions.map((q, i) => {
              const correct = result.correctAnswers[i] === answers[i];
              return (
                <div key={i} className={`card stagger-item ${correct ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
                  }`}>
                  <div className="flex items-start gap-3 mb-3">
                    {correct ? (
                      <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-2 sinhala-text">
                        {i + 1}. {q.question.replace(/\[DIAGRAM:[^\]]+\]/g, '')}
                      </p>

                      {q.diagramUrl && (
                        <div className="mb-3 p-2 bg-white border border-gray-200 rounded-lg">
                          <img
                            src={q.diagramUrl}
                            alt="Question diagram"
                            className="max-w-full h-auto max-h-48 mx-auto rounded"
                          />
                        </div>
                      )}

                      <div className="space-y-1 mb-2 text-sm">
                        <p className={`font-medium ${correct ? "text-green-700" : "text-red-700"}`}>
                          <span className="font-semibold">Your answer:</span>{" "}
                          {answers[i] >= 0 ? q.options[answers[i]] : "No answer"}
                        </p>
                        {!correct && (
                          <p className="text-green-700 font-medium">
                            <span className="font-semibold">Correct answer:</span>{" "}
                            {q.options[result.correctAnswers[i]]}
                          </p>
                        )}
                      </div>

                      {result.explanations[i] && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                          <p className="text-xs font-semibold text-blue-800 mb-1">📚 Explanation:</p>
                          <p className="text-sm text-gray-700 sinhala-text">{result.explanations[i]}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-3 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <a href="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </a>
            <a href="/quiz" className="btn-outline w-full flex items-center justify-center gap-2">
              <span>Take Another Quiz</span>
            </a>
          </div>
        </div>
      </main>
    );
  }

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const isLowTime = secondsLeft < 60;
  const answered = answers.filter(a => a >= 0).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-32">
      {/* Sticky Timer Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b-2 border-gray-200 shadow-md animate-slide-in-left">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="font-bold text-purple-600">{answered}/{quiz.questions.length}</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Quiz in Progress</h1>
              <p className="text-xs text-gray-500">{answered} of {quiz.questions.length} answered</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${isLowTime ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-100 text-blue-600"
            }`}>
            <Clock className="w-5 h-5" />
            <span>{mm}:{ss.toString().padStart(2, "0")}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div
            className="progress-fill bg-purple-600"
            style={{ width: `${(answered / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {quiz.questions.map((q, qi) => (
          <div key={qi} className="card shadow-lg stagger-item">
            {/* Diagram */}
            {q.diagramUrl && (
              <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl animate-scale-in">
                <img
                  src={q.diagramUrl}
                  alt="Question diagram"
                  className="max-w-full h-auto max-h-72 mx-auto rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Question Text */}
            <p className="font-semibold text-gray-900 mb-4 text-base sinhala-text">
              <span className="inline-block w-8 h-8 bg-purple-600 text-white rounded-lg text-center leading-8 mr-2">
                {qi + 1}
              </span>
              {q.question.replace(/\[DIAGRAM:[^\]]+\]/g, '')}
            </p>

            {/* Options */}
            <div className="space-y-2 mb-4">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => selectAnswer(qi, oi)}
                  className={`w-full text-left rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all sinhala-text ${answers[qi] === oi
                      ? "border-purple-600 bg-purple-100 shadow-md scale-[1.02]"
                      : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${answers[qi] === oi ? "border-purple-600 bg-purple-600" : "border-gray-300"
                      }`}>
                      {answers[qi] === oi && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <span>{opt}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Hint */}
            {q.hint && (
              <div>
                <button
                  onClick={() => toggleHint(qi)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>{shownHints[qi] ? "Hide hint" : "Need a hint?"}</span>
                </button>
                {shownHints[qi] && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg animate-scale-in">
                    <p className="text-sm text-gray-700 sinhala-text">💡 {q.hint}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t-2 border-gray-200 shadow-2xl">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={submit}
            className="btn-success w-full flex items-center justify-center gap-2 text-lg shadow-xl hover:scale-[1.02] transition-transform"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Submit Quiz</span>
          </button>
        </div>
      </div>
    </main>
  );
}
