import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BottomNav from "@/components/BottomNav";
import { FileText, Download, Clock, Calendar } from "lucide-react";
import Link from "next/link";

export default async function MyPapersPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id;

  const papers = await prisma.paper.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  function getDifficultyColor(difficulty: string) {
    if (difficulty === "EASY") return "from-green-400 to-green-600";
    if (difficulty === "MEDIUM") return "from-yellow-400 to-yellow-600";
    return "from-red-400 to-red-600";
  }

  function getDifficultyIcon(difficulty: string) {
    if (difficulty === "EASY") return "🟢";
    if (difficulty === "MEDIUM") return "🟡";
    return "🔴";
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 pt-8 pb-12 shadow-lg animate-slide-in-left">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Papers</h1>
              <p className="text-blue-100 text-sm">Your practice papers history</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 -mt-8 max-w-4xl mx-auto">
        {papers.length === 0 ? (
          <div className="card shadow-xl text-center py-16 animate-scale-in">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No papers yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first practice paper to start preparing for exams!
            </p>
            <Link href="/create-paper" className="btn-primary inline-flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span>Create Paper</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Card */}
            <div className="card bg-gradient-to-br from-blue-50 to-purple-100 border-blue-200 shadow-xl mb-6 animate-scale-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{papers.length}</p>
                    <p className="text-sm text-gray-600">Total Papers</p>
                  </div>
                </div>
                <Link href="/create-paper" className="btn-primary flex items-center gap-2">
                  <span>+ New Paper</span>
                </Link>
              </div>
            </div>

            {/* Papers List */}
            <div className="space-y-3">
              {papers.map((p, index) => (
                <a
                  key={p.id}
                  href={`/api/papers/${p.id}/download`}
                  className="card-interactive group stagger-item"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Difficulty Badge */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${getDifficultyColor(p.difficulty)} shadow-md`}>
                        <span className="text-2xl">{getDifficultyIcon(p.difficulty)}</span>
                      </div>

                      {/* Paper Info */}
                      <div>
                        <p className="font-bold text-gray-900 text-lg mb-1">
                          {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()} Paper
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {p.durationMin} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(p.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-xl font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Info Card */}
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 mt-6 animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-lg">💡</span>
                </div>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Practice makes perfect!</p>
                  <p>Download your papers and practice regularly. All papers include model answers to help you learn.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
