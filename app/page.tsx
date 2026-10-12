import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-xl font-bold">📐</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Grade Maths
            </h1>
          </div>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm sm:text-base transition-colors"
          >
            Sign In →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              🎓 For Grades 6-11 Students
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Master Mathematics
              <span className="block bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Step by Step
              </span>
            </h2>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Learn with AI-powered lessons, practice with custom quizzes, and track your progress.
              Available in <span className="font-semibold text-blue-600">English</span> and{" "}
              <span className="font-semibold text-blue-600 font-sinhala">සිංහල</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link
                href="/register"
                className="btn-primary inline-flex items-center justify-center gap-2 text-lg shadow-xl hover:shadow-2xl"
              >
                <span>Get Started Free</span>
                <span className="text-xl">→</span>
              </Link>

              <Link
                href="/admin/login"
                className="btn-outline inline-flex items-center justify-center gap-2"
              >
                <span>👨‍🏫 Teacher Login</span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✓</span>
                <span>Free to use</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✓</span>
                <span>Bilingual support</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✓</span>
                <span>Track progress</span>
              </div>
            </div>
          </div>

          {/* Right Column - Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-interactive bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="font-bold text-gray-900 mb-2">Smart Lessons</h3>
              <p className="text-sm text-gray-600">AI-powered notes from your textbooks</p>
            </div>

            <div className="card-interactive bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="text-4xl mb-3">✏️</div>
              <h3 className="font-bold text-gray-900 mb-2">Practice Quizzes</h3>
              <p className="text-sm text-gray-600">Test your knowledge instantly</p>
            </div>

            <div className="card-interactive bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="font-bold text-gray-900 mb-2">Exam Papers</h3>
              <p className="text-sm text-gray-600">Generate custom practice papers</p>
            </div>

            <div className="card-interactive bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="font-bold text-gray-900 mb-2">Leaderboard</h3>
              <p className="text-sm text-gray-600">Compete with classmates</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white border-t-2 border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Excel</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete learning platform designed specifically for Sri Lankan mathematics students
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Personalized Learning</h4>
              <p className="text-gray-600">
                Choose your grade, language, and difficulty level. Get questions tailored to your needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Instant Feedback</h4>
              <p className="text-gray-600">
                Get immediate results with detailed explanations for every question you answer.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Track Progress</h4>
              <p className="text-gray-600">
                Monitor your improvement over time and see where you stand on the leaderboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Learning?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join students across Sri Lanka mastering mathematics
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-2">© 2024 Grade Maths. Made for Sri Lankan students.</p>
          <p className="text-sm">Supporting Grades 6-11 | English & සිංහල</p>
        </div>
      </footer>
    </main>
  );
}
