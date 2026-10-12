import { prisma } from "@/lib/prisma";
import LessonChat from "@/components/LessonChat";
import BottomNav from "@/components/BottomNav";
import ReactMarkdownLite from "@/components/MarkdownLite";
import { BookOpen, MessageCircle } from "lucide-react";

export default async function LessonPage({ params }: { params: { id: string } }) {
  const lesson = await prisma.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center max-w-md animate-scale-in">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lesson not found</h1>
          <p className="text-gray-600 mb-4">This lesson doesn't exist or has been removed.</p>
          <a href="/dashboard" className="btn-primary inline-block">Back to Dashboard</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 pb-24">
      {/* Header with Gradient */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 pt-8 pb-12 shadow-lg animate-slide-in-left">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <p className="text-blue-100 text-sm font-medium">Lesson {lesson.order}</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold sinhala-text">{lesson.title}</h1>
        </div>
      </header>

      {/* Smart Note Section */}
      <section className="px-4 sm:px-6 -mt-8 mb-6 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <div className="card shadow-xl border-2 border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">📝</span>
              </div>
              <h2 className="font-bold text-lg text-gray-900">Understandable Note</h2>
            </div>

            <div className="prose prose-sm sm:prose-base max-w-none sinhala-text">
              {lesson.smartNote ? (
                <ReactMarkdownLite content={lesson.smartNote} />
              ) : (
                <div className="text-center py-8 animate-pulse-slow">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⏳</span>
                  </div>
                  <p className="text-gray-600 font-medium">Note is being prepared...</p>
                  <p className="text-gray-500 text-sm mt-2">Check back soon for the smart note!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* AI Tutor Section */}
      <section className="px-4 sm:px-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-md">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold text-lg text-gray-900">Ask the AI Tutor</h2>
          </div>

          <div className="card shadow-lg border-2 border-purple-100">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-4 border border-purple-100">
              <p className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-lg">💡</span>
                <span>Ask any questions about this lesson. The AI tutor will help you understand difficult concepts!</span>
              </p>
            </div>
            <LessonChat lessonId={lesson.id} />
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
