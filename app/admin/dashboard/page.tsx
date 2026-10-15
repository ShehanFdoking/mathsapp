import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { Users, BookOpen, FileText, FileQuestion, TrendingUp, ArrowRight } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [studentCount, textbookCount, lessonCount, questionCount] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.textbook.count(),
    prisma.lesson.count(),
    prisma.question.count(),
  ]);

  const recentLessons = await prisma.lesson.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      grade: true,
      medium: true,
      _count: { select: { questions: true } },
    },
  });

  const stats = [
    {
      title: "Total Students",
      value: studentCount,
      icon: Users,
      color: "blue",
      link: "/admin/students",
      description: "Registered students",
    },
    {
      title: "Textbooks",
      value: textbookCount,
      icon: BookOpen,
      color: "green",
      link: "/admin/textbooks",
      description: "Uploaded textbooks",
    },
    {
      title: "Lessons",
      value: lessonCount,
      icon: FileText,
      color: "purple",
      link: null,
      description: "Identified lessons",
    },
    {
      title: "Questions",
      value: questionCount,
      icon: FileQuestion,
      color: "orange",
      link: "/admin/manage-questions",
      description: "Generated questions",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-slide-in-left">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Admin! 👋</h1>
          <p className="text-gray-600">Here's what's happening with your platform today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: "from-blue-500 to-blue-600",
              green: "from-green-500 to-green-600",
              purple: "from-purple-500 to-purple-600",
              orange: "from-orange-500 to-orange-600",
            }[stat.color];

            const content = (
              <>
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colorClasses} opacity-10 rounded-bl-[60px]`}></div>
                <div className="relative">
                  <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium mb-1">{stat.title}</p>
                  <p className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </>
            );

            return stat.link ? (
              <Link
                key={index}
                href={stat.link}
                className="card-interactive stagger-item group relative overflow-hidden"
              >
                {content}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ) : (
              <div key={index} className="card stagger-item relative overflow-hidden">
                {content}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Lessons */}
          <div className="card shadow-xl border-2 border-gray-200 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Lessons</h2>
              <Link href="/admin/textbooks" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </Link>
            </div>

            {recentLessons.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">No lessons yet</p>
                <p className="text-gray-500 text-xs mt-1">Upload textbooks to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentLessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/admin/questions/${lesson.id}?difficulty=EASY`}
                    className="card-interactive flex items-center justify-between group p-3"
                  >
                    <div className="flex-1">
                      <p
                        className="font-medium text-gray-900 sinhala-text text-sm"
                      >
                        {lesson.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Grade {lesson.grade} · {lesson.medium} · {lesson._count.questions} questions
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="card shadow-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/admin/textbooks"
                className="card-interactive bg-white flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Upload Textbook</p>
                  <p className="text-sm text-gray-600">Add new textbooks and generate lessons</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/admin/manage-questions"
                className="card-interactive bg-white flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileQuestion className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Manage Questions</p>
                  <p className="text-sm text-gray-600">Review and edit question bank</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/admin/students"
                className="card-interactive bg-white flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">View Students</p>
                  <p className="text-sm text-gray-600">Manage student accounts</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="card bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">Platform Growing!</h3>
              <p className="text-blue-100 text-sm">
                You now have {studentCount} students learning with {questionCount} questions across {lessonCount} lessons.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
