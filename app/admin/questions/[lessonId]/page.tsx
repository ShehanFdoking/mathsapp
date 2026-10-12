"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { extractDiagramDescriptions } from "@/lib/image-generator";

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

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

// Modal with click-and-drag crop
function ImagePreviewModal({
  imageUrl,
  description,
  onAccept,
  onReject,
  isLoading,
  onCropped
}: {
  imageUrl: string | null;
  description: string;
  onAccept: () => void;
  onReject: () => void;
  isLoading: boolean;
  onCropped?: (croppedUrl: string) => void;
}) {
  const [cropping, setCropping] = useState(false);
  const [selection, setSelection] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [displayImage, setDisplayImage] = useState<string>(imageUrl || "");

  const getCoords = (e: React.MouseEvent): { x: number; y: number } | null => {
    if (!imgRef.current) return null;
    const rect = imgRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getCoords(e);
    if (!coords) return;
    setIsSelecting(true);
    setSelection({ startX: coords.x, startY: coords.y, endX: coords.x, endY: coords.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !selection) return;
    const coords = getCoords(e);
    if (!coords) return;
    setSelection(s => s ? { ...s, endX: coords.x, endY: coords.y } : null);
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const applyCrop = () => {
    if (!selection || !canvasRef.current || !imgRef.current) return;

    const startX = Math.min(selection.startX, selection.endX);
    const startY = Math.min(selection.startY, selection.endY);
    const width = Math.abs(selection.endX - selection.startX);
    const height = Math.abs(selection.endY - selection.startY);

    if (width < 5 || height < 5) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imgRef.current, startX, startY, width, height, 0, 0, width, height);
    const croppedUrl = canvas.toDataURL('image/png');

    setDisplayImage(croppedUrl);
    setCropping(false);
    setSelection(null);

    if (onCropped) {
      onCropped(croppedUrl);
    }
  };

  if (!imageUrl && !isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">📐 Review Diagram</h2>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-600">Generating diagram...</p>
              <p className="text-xs text-gray-500 mt-2">{description}</p>
            </div>
          ) : imageUrl ? (
            <>
              {cropping ? (
                <>
                  <p className="text-sm text-gray-700 mb-3">Drag to select. Blue box = what you keep.</p>
                  <div
                    className="bg-gray-100 rounded-lg mb-4 relative w-fit mx-auto"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ cursor: 'crosshair', userSelect: 'none' }}
                  >
                    <img
                      ref={imgRef}
                      src={displayImage}
                      alt="crop"
                      className="max-w-full max-h-64 block"
                      draggable={false}
                    />
                    {selection && (
                      <div
                        className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
                        style={{
                          left: `${Math.min(selection.startX, selection.endX)}px`,
                          top: `${Math.min(selection.startY, selection.endY)}px`,
                          width: `${Math.abs(selection.endX - selection.startX)}px`,
                          height: `${Math.abs(selection.endY - selection.startY)}px`
                        }}
                      />
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-2">
                    <button
                      onClick={applyCrop}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm font-semibold"
                    >
                      ✓ Crop
                    </button>
                    <button
                      onClick={() => {
                        setCropping(false);
                        setSelection(null);
                        setDisplayImage(imageUrl);
                      }}
                      className="flex-1 px-3 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-100 rounded-lg p-4 mb-6 flex items-center justify-center min-h-64">
                    <img src={displayImage} alt={description} className="max-w-full max-h-96 h-auto rounded" />
                  </div>

                  <div className="bg-blue-50 p-3 rounded mb-6 border border-blue-200">
                    <p className="text-sm text-gray-700"><strong>Description:</strong> {description}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={onAccept}
                      className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
                    >
                      ✓ Accept & Attach
                    </button>
                    <button
                      onClick={() => {
                        setCropping(true);
                        setSelection(null);
                      }}
                      className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                    >
                      ✂️ Crop
                    </button>
                    <button
                      onClick={onReject}
                      className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
                    >
                      ✕ Retry
                    </button>
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Component to render question with diagram images
function QuestionWithDiagram({
  question,
  questionId,
  savedDiagramUrl,
  onImageAttached
}: {
  question: string;
  questionId: string;
  savedDiagramUrl?: string | null;
  onImageAttached?: (questionId: string, imageUrl: string | null) => void;
}) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [attachedImages, setAttachedImages] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<{ url: string | null; description: string; isLoading: boolean }>({
    url: null,
    description: "",
    isLoading: false
  });
  const [manualDiagramPrompt, setManualDiagramPrompt] = useState("");
  const [showManualDiagramForm, setShowManualDiagramForm] = useState(false);

  // If there's a saved diagram URL, display it immediately
  const hasSavedDiagram = !!savedDiagramUrl;

  // Notify parent when an image is attached
  const notifyImageAttachment = () => {
    // Get the first attached image URL
    const attachedImageUrl = Object.entries(attachedImages)
      .filter(([_, isAttached]) => isAttached)
      .map(([description]) => imageUrls[description])
      .find(url => !!url) || null;

    if (onImageAttached) {
      console.log(`Notifying parent: Question ${questionId} has image:`, attachedImageUrl);
      onImageAttached(questionId, attachedImageUrl);
    }
  };

  const generateImage = async (description: string) => {
    setPreviewImage({ url: null, description, isLoading: true });

    try {
      const res = await fetch('/api/admin/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptions: [description] }),
      });

      const data = await res.json();
      if (data.images?.[description]) {
        setPreviewImage({
          url: data.images[description],
          description,
          isLoading: false
        });
      } else {
        setPreviewImage({
          url: null,
          description,
          isLoading: false
        });
      }
    } catch (err) {
      console.error('Failed to generate diagram:', err);
      setPreviewImage({
        url: null,
        description,
        isLoading: false
      });
    }
  };

  const acceptImage = () => {
    if (previewImage.url && previewImage.description) {
      const newImageUrls = {
        ...imageUrls,
        [previewImage.description]: previewImage.url
      };
      const newAttachedImages = {
        ...attachedImages,
        [previewImage.description]: true
      };

      setImageUrls(newImageUrls);
      setAttachedImages(newAttachedImages);
      setPreviewImage({ url: null, description: "", isLoading: false });

      // Notify parent immediately with the new attached image
      if (onImageAttached && previewImage.url) {
        console.log(`Image attached for question ${questionId}:`, previewImage.url.substring(0, 50));
        onImageAttached(questionId, previewImage.url);
      }
    }
  };

  const rejectImage = () => {
    generateImage(previewImage.description);
  };

  const deleteImage = (description: string) => {
    setImageUrls(prev => {
      const updated = { ...prev };
      delete updated[description];
      return updated;
    });
    setAttachedImages(prev => {
      const updated = { ...prev };
      delete updated[description];
      return updated;
    });
  };

  // Replace [DIAGRAM: ...] with actual images
  const parts = question.split(/(\[DIAGRAM:[^\]]+\])/g);
  const hasDiagrams = parts.some(part => part.match(/\[DIAGRAM:[^\]]+\]/));

  return (
    <>
      <ImagePreviewModal
        imageUrl={previewImage.url}
        description={previewImage.description}
        onAccept={acceptImage}
        onReject={rejectImage}
        isLoading={previewImage.isLoading}
        onCropped={(croppedUrl) => {
          setPreviewImage(prev => ({ ...prev, url: croppedUrl }));
        }}
      />

      {/* Display saved diagram from database if exists */}
      {hasSavedDiagram && savedDiagramUrl && (
        <div className="mb-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
          <p className="text-xs text-green-700 font-semibold mb-2">✓ Approved Diagram</p>
          <div className="bg-white rounded p-2 flex items-center justify-center border border-green-200">
            <img src={savedDiagramUrl} alt="Approved diagram" className="max-w-full max-h-64 h-auto" />
          </div>
        </div>
      )}

      <div className="font-medium mb-2">
        {parts.map((part, idx) => {
          const match = part.match(/\[DIAGRAM:\s*([^\]]+)\]/);
          if (match) {
            const description = match[1].trim();
            const imageUrl = imageUrls[description];
            const isAttached = attachedImages[description];

            if (imageUrl) {
              return (
                <div key={idx} className={`my-4 p-4 rounded-lg border-2 ${isAttached ? 'border-green-400 bg-green-50' : 'border-yellow-400 bg-yellow-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">
                      {isAttached ? '✓ Attached' : '⚠ Pending Review'}
                    </p>
                    {isAttached && (
                      <button
                        onClick={() => deleteImage(description)}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="bg-white rounded p-3 mb-3 flex items-center justify-center min-h-48 border border-gray-200">
                    <img src={imageUrl} alt={description} className="max-w-full max-h-80 h-auto" />
                  </div>
                  <p className="text-xs text-gray-600 mb-3 italic">{description}</p>
                  <div className="flex gap-2">
                    {!isAttached && (
                      <>
                        <button
                          onClick={() => setPreviewImage({ url: imageUrl, description, isLoading: false })}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                          👁 Preview
                        </button>
                        <button
                          onClick={() => generateImage(description)}
                          className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition"
                        >
                          🔄 Retry
                        </button>
                      </>
                    )}
                    {isAttached && (
                      <>
                        <button
                          onClick={() => setPreviewImage({ url: imageUrl, description, isLoading: false })}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                          👁 View
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = imageUrl;
                            link.download = `diagram-${Date.now()}.png`;
                            link.click();
                          }}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition"
                        >
                          ⬇ Download
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            }

            // Show placeholder if not yet generated
            return (
              <div key={idx} className="my-4 p-4 bg-blue-50 rounded-lg border border-blue-300">
                <p className="text-sm text-gray-700 mb-2">📐 Figure: {description}</p>
                <button
                  onClick={() => generateImage(description)}
                  className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  ✨ Generate Image
                </button>
              </div>
            );
          }

          return <span key={idx}>{part}</span>;
        })}

        {!hasDiagrams && (
          <div className="my-4 p-4 bg-purple-50 rounded-lg border border-purple-300">
            <p className="text-sm text-gray-700 mb-3">📐 This question doesn't have a diagram yet. Add one?</p>

            {!showManualDiagramForm ? (
              <button
                onClick={() => setShowManualDiagramForm(true)}
                className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition"
              >
                ✨ Add Diagram
              </button>
            ) : (
              <div className="space-y-2">
                <textarea
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  rows={3}
                  placeholder="Describe the geometric figure (e.g., 'Rectangle with width 5cm and height 3cm, with diagonal drawn')"
                  value={manualDiagramPrompt}
                  onChange={(e) => setManualDiagramPrompt(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (manualDiagramPrompt.trim()) {
                        generateImage(manualDiagramPrompt.trim());
                        setShowManualDiagramForm(false);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition"
                  >
                    ✨ Generate
                  </button>
                  <button
                    onClick={() => {
                      setShowManualDiagramForm(false);
                      setManualDiagramPrompt("");
                    }}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function QuestionReviewPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [type, setType] = useState<"MCQ" | "STRUCTURED">("MCQ");
  const [difficulty, setDifficulty] = useState("EASY");
  const [status, setStatus] = useState("PENDING");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Question>>({});
  const [genCount, setGenCount] = useState(20);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [questionImages, setQuestionImages] = useState<Record<string, string | null>>({});

  // Handle image attachment from QuestionWithDiagram component
  const handleImageAttached = (questionId: string, imageUrl: string | null) => {
    setQuestionImages(prev => ({
      ...prev,
      [questionId]: imageUrl
    }));
  };

  async function load() {
    const res = await fetch(
      `/api/admin/questions?lessonId=${lessonId}&difficulty=${difficulty}&status=${status}&type=${type}`
    );
    const data = await res.json();
    setQuestions(data);
  }

  useEffect(() => {
    load();
  }, [lessonId, difficulty, status, type]);

  // Filter questions based on search term
  const filteredQuestions = questions.filter((q) =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  async function generate() {
    setGenerating(true);
    setGenStatus(
      `Generating ${genCount} ${difficulty.toLowerCase()} ${type === "MCQ" ? "quiz MCQs" : "paper questions"}... this can take a while for large counts.`
    );

    try {
      const res = await fetch("/api/admin/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, difficulty, type, count: genCount }),
      });
      const data = await res.json();

      if (res.ok) {
        setGenStatus(`✓ Done — ${data.generated} questions generated and awaiting review.`);
        setStatus("PENDING");
        load();
      } else {
        // Check if it's a rate limit error
        const is503 = res.status === 503 || data.error?.includes("high demand") || data.error?.includes("UNAVAILABLE");
        const is429 = res.status === 429 || data.error?.includes("rate limit");

        if (is503 || is429) {
          setGenStatus(`⚠ API Rate Limit: Google's Gemini API is experiencing high demand. This is temporary. Please wait a few minutes and try again with a smaller count (e.g., 5-10 questions at a time).`);
        } else {
          setGenStatus(`❌ Error: ${data.error}`);
        }
      }
    } catch (err: any) {
      setGenStatus(`❌ Network error: ${err?.message || "Failed to connect to server"}`);
    } finally {
      setGenerating(false);
    }
  }

  async function review(id: string, action: "approve" | "reject", edits?: any) {
    // Include attached image URL if available
    const imageUrl = questionImages[id];
    console.log(`Reviewing question ${id}:`, { action, hasImage: !!imageUrl, imageUrl: imageUrl?.substring(0, 50) });

    const finalEdits = imageUrl ? { ...edits, diagramUrl: imageUrl } : edits;

    await fetch(`/api/admin/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, edits: finalEdits }),
    });
    setEditingId(null);
    load();
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Are you sure you want to delete this question? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        load();
      }
    } catch (err) {
      console.error("Failed to delete question:", err);
    }
  }

  function startEdit(q: Question) {
    setEditingId(q.id);
    setEditDraft(q);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-1">Question bank review</h1>
      <p className="text-gray-500 text-sm mb-6">
        Only questions you approve here become available to students in papers and quizzes.
      </p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setType("MCQ")}
          className={`flex-1 rounded-xl border py-2 text-sm ${type === "MCQ" ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600"
            }`}
        >
          Quiz MCQs
        </button>
        <button
          onClick={() => setType("STRUCTURED")}
          className={`flex-1 rounded-xl border py-2 text-sm ${type === "STRUCTURED" ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600"
            }`}
        >
          Paper questions
        </button>
      </div>

      <div className="card mb-6">
        <p className="font-medium mb-2">
          Generate new {type === "MCQ" ? "quiz MCQs" : "paper questions"}
        </p>
        <div className="flex gap-2 mb-3">
          <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            type="number"
            className="input"
            value={genCount}
            min={1}
            max={100}
            onChange={(e) => setGenCount(Number(e.target.value))}
          />
        </div>
        <button className="btn-primary w-full" disabled={generating} onClick={generate}>
          {generating ? "Generating..." : `Generate ${genCount} questions`}
        </button>
        {genStatus && <p className="text-sm text-gray-600 mt-2">{genStatus}</p>}
      </div>

      <div className="card mb-4">
        <input
          type="text"
          className="input w-full"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          Found {filteredQuestions.length} of {questions.length} questions
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-sm border ${status === s ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600"
              }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Management Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">📊 Question Bank Stats</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-white p-2 rounded border border-gray-200">
            <p className="text-gray-600">Total Questions</p>
            <p className="text-xl font-bold text-gray-800">{questions.length}</p>
          </div>
          <div className="bg-white p-2 rounded border border-gray-200">
            <p className="text-gray-600">Approved</p>
            <p className="text-xl font-bold text-green-600">{questions.filter(q => q.status === 'APPROVED').length}</p>
          </div>
          <div className="bg-white p-2 rounded border border-gray-200">
            <p className="text-gray-600">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{questions.filter(q => q.status === 'PENDING').length}</p>
          </div>
          <div className="bg-white p-2 rounded border border-gray-200">
            <p className="text-gray-600">Rejected</p>
            <p className="text-xl font-bold text-red-600">{questions.filter(q => q.status === 'REJECTED').length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredQuestions.length === 0 && (
          <p className="text-gray-500 text-sm">
            {questions.length === 0
              ? `No ${status.toLowerCase()} questions here yet.`
              : "No questions match your search."}
          </p>
        )}
        {filteredQuestions.map((q) => (
          <div key={q.id} className="card">
            {editingId === q.id ? (
              <div className="space-y-2">
                <textarea
                  className="input"
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
                          className="input flex-1"
                          value={opt}
                          onChange={(e) =>
                            setEditDraft((d) => {
                              const options = [...(d.options || [])];
                              options[i] = e.target.value;
                              return { ...d, options };
                            })
                          }
                        />
                      </div>
                    ))}
                    <textarea
                      className="input"
                      placeholder="Explanation"
                      value={editDraft.explanation || ""}
                      onChange={(e) => setEditDraft((d) => ({ ...d, explanation: e.target.value }))}
                    />
                  </>
                ) : (
                  <textarea
                    className="input"
                    placeholder="Model answer / marking scheme"
                    rows={4}
                    value={editDraft.modelAnswer || ""}
                    onChange={(e) => setEditDraft((d) => ({ ...d, modelAnswer: e.target.value }))}
                  />
                )}
                <textarea
                  className="input"
                  placeholder="Hint"
                  value={editDraft.hint || ""}
                  onChange={(e) => setEditDraft((d) => ({ ...d, hint: e.target.value }))}
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Marks"
                  value={editDraft.marks}
                  onChange={(e) => setEditDraft((d) => ({ ...d, marks: Number(e.target.value) }))}
                />
                <div className="flex gap-2">
                  <button
                    className="flex-1 rounded-xl bg-green-600 text-white py-2 text-sm"
                    onClick={() => review(q.id, "approve", editDraft)}
                  >
                    Save & Approve
                  </button>
                  <button
                    className="flex-1 rounded-xl border border-gray-300 py-2 text-sm"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <QuestionWithDiagram
                  question={q.question}
                  questionId={q.id}
                  savedDiagramUrl={q.diagramUrl}
                  onImageAttached={handleImageAttached}
                />
                {q.type === "MCQ" ? (
                  <>
                    <ul className="text-sm space-y-1 mb-2">
                      {q.options?.map((opt, i) => (
                        <li key={i} className={i === q.answerIndex ? "text-green-600 font-medium" : "text-gray-600"}>
                          {["A", "B", "C", "D"][i]}) {opt} {i === q.answerIndex && "✓"}
                        </li>
                      ))}
                    </ul>
                    {q.explanation && <p className="text-xs text-gray-500 mb-1"><b>Explanation:</b> {q.explanation}</p>}
                  </>
                ) : (
                  q.modelAnswer && (
                    <p className="text-xs text-gray-500 mb-1 whitespace-pre-wrap"><b>Model answer:</b> {q.modelAnswer}</p>
                  )
                )}
                {q.hint && <p className="text-xs text-gray-500 mb-2"><b>Hint:</b> {q.hint}</p>}
                <p className="text-xs text-gray-400 mb-3">{q.marks} mark(s) · {q.difficulty} · {q.type === "MCQ" ? "Quiz MCQ" : "Paper question"}</p>

                <div className="flex gap-2 mb-2">
                  {status === "PENDING" && (
                    <>
                      <button
                        className="flex-1 rounded-xl bg-green-600 text-white py-2 text-sm hover:bg-green-700 transition"
                        onClick={() => review(q.id, "approve")}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="flex-1 rounded-xl border border-gray-300 py-2 text-sm hover:bg-gray-50 transition"
                        onClick={() => startEdit(q)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="flex-1 rounded-xl bg-red-600 text-white py-2 text-sm hover:bg-red-700 transition"
                        onClick={() => review(q.id, "reject")}
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}
                  {status === "APPROVED" && (
                    <>
                      <button
                        className="flex-1 rounded-xl border border-gray-300 py-2 text-sm hover:bg-gray-50 transition"
                        onClick={() => startEdit(q)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="flex-1 rounded-xl bg-orange-600 text-white py-2 text-sm hover:bg-orange-700 transition"
                        onClick={() => review(q.id, "reject")}
                      >
                        📋 Move to Rejected
                      </button>
                    </>
                  )}
                  {status === "REJECTED" && (
                    <>
                      <button
                        className="flex-1 rounded-xl bg-green-600 text-white py-2 text-sm hover:bg-green-700 transition"
                        onClick={() => review(q.id, "approve")}
                      >
                        ↩️ Approve
                      </button>
                      <button
                        className="flex-1 rounded-xl border border-gray-300 py-2 text-sm hover:bg-gray-50 transition"
                        onClick={() => startEdit(q)}
                      >
                        ✏️ Edit
                      </button>
                    </>
                  )}
                </div>

                {/* Delete button - always available */}
                <button
                  className="w-full rounded-xl bg-red-100 text-red-600 py-2 text-xs hover:bg-red-200 transition border border-red-300"
                  onClick={() => deleteQuestion(q.id)}
                >
                  🗑️ Delete Question
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </main >
  );
}
