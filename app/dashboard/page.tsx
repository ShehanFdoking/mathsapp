import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { BookOpen, FileText, Brain, Trophy, NotebookPen, User } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const { grade, medium, name } = session!.user as any;

  const lessons = await prisma.lesson.findMany({
    where: { grade, medium },
    orderBy: { order: "asc" },
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 pb-24">
      {/* Header with Gradient */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 pt-6 pb-8 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-2xl">👋</span>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Welcome back,</p>
                <h1 className="text-2xl font-bold">{name}</h1>
              </div>
            </div>

            {/* Profile Button */}
            <Link
              href="/profile"
              className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
              title="My Profile"
            >
              <User className="w-5 h-5 text-white" />
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-100">📚 Grade {grade}</span>
              <span className="text-blue-200">•</span>
              <span className="text-blue-100 sinhala-text">
                {medium === "SINHALA" ? "සිංහල මාධ්‍යය" : "English Medium"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions Grid */}
      <section className="px-4 sm:px-6 -mt-6 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Create Quiz Card */}
            <Link
              href="/quiz"
              className="card-interactive bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-center"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-gray-900 text-sm">Practice Quiz</span>
              </div>
            </Link>

            {/* Create Paper Card */}
            <Link
              href="/create-paper"
              className="card-interactive bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-center"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-gray-900 text-sm">Exam Paper</span>
              </div>
            </Link>

            {/* Create Notes Card */}
            <Link
              href="/create-notes"
              className="card-interactive bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 text-center"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                  <NotebookPen className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-gray-900 text-sm">Study Notes</span>
              </div>
            </Link>

            {/* Leaderboard Card */}
            <Link
              href="/leaderboard"
              className="card-interactive bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 text-center"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-gray-900 text-sm">Leaderboard</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Lessons Section */}
      <section className="px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Your Lessons</h2>
          </div>

          {lessons.length === 0 ? (
            <div className="card text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No lessons available yet</p>
              <p className="text-sm text-gray-500">
                Your teacher will upload lessons for Grade {grade} soon. Check back later!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/lesson/${lesson.id}`}
                  className="card-interactive flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <span className="font-bold text-blue-600 group-hover:text-white transition-colors">
                        {lesson.order}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Lesson {lesson.order}</p>
                      <p className="font-semibold text-gray-900 sinhala-text text-base">
                        {lesson.title}
                      </p>
                    </div>
                  </div>
                  <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                    <span className="text-2xl">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* My Papers Section */}
      <section className="px-4 sm:px-6 mt-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/my-papers"
            className="card-interactive bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg">My Papers</p>
                <p className="text-blue-100 text-sm">View your past attempts</p>
              </div>
            </div>
            <span className="text-2xl">→</span>
          </Link>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
