import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">
          LearningOS
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
          AI-powered learning platform for mastering any topic through conversation and visual knowledge mapping
        </p>
        
        <div className="flex gap-4 justify-center pt-8">
          <Link
            href="/signup"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg shadow-lg border border-gray-300 transition-colors dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Sign In
          </Link>
        </div>
        
        <div className="pt-4">
          <span className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
            🚀 Pre-Sprint 0: Project Setup In Progress
          </span>
        </div>
      </div>
    </div>
  );
}
