import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";

const GRADES = [6, 7, 8, 9, 10, 11];

export default async function AdminTextbooksPage() {
  const textbooks = await prisma.textbook.findMany({
    include: {
      _count: {
        select: { lessons: true }
      }
    }
  });

  function status(grade: number, medium: "ENGLISH" | "SINHALA") {
    const parts = textbooks.filter((t) => t.grade === grade && t.medium === medium);
    return parts.length;
  }

  const totalParts = textbooks.length;
  const totalLessons = textbooks.reduce((sum, t) => sum + (t._count?.lessons || 0), 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-slide-in-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Textbook Management</h1>
              <p className="text-gray-600">Upload and manage textbooks by grade and medium</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <p className="text-sm text-gray-600 font-medium mb-1">Total Textbook Parts</p>
            <p className="text-3xl font-bold text-blue-600">{totalParts}</p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <p className="text-sm text-gray-600 font-medium mb-1">Total Lessons</p>
            <p className="text-3xl font-bold text-green-600">{totalLessons}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <p className="text-sm text-gray-600 font-medium mb-1">Grades Available</p>
            <p className="text-3xl font-bold text-purple-600">{GRADES.length}</p>
          </div>
        </div>

        {/* Grade Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GRADES.map((g, index) => (
            <div
              key={g}
              className="card-interactive border-2 border-gray-200 stagger-item"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">Grade {g}</h2>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {g}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {status(g, "ENGLISH") + status(g, "SINHALA")} textbook parts uploaded
                </p>
              </div>

              <div className="space-y-2">
                <Link
                  href={`/admin/textbooks/${g}/ENGLISH`}
                  className="block text-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  🇬🇧 English Medium
                  <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {status(g, "ENGLISH")} parts
                  </span>
                </Link>
                <Link
                  href={`/admin/textbooks/${g}/SINHALA`}
                  className="block text-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 text-sm font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  🇱🇰 Sinhala Medium
                  <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {status(g, "SINHALA")} parts
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Help Card */}
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 mt-8 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">How to Upload Textbooks</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Select a grade and medium to begin</li>
                <li>• Upload textbook parts (PDF format)</li>
                <li>• System automatically extracts text and identifies lessons</li>
                <li>• Generate smart notes for each lesson</li>
                <li>• Create question banks for quizzes and papers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
