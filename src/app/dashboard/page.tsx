"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { BookIcon, MessageCircleIcon, ChevronRightIcon } from "@/components/icons";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.displayName?.split(" ")[0] || "there";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {getGreeting()}, {firstName}! 👋
        </h1>
        <p className="text-blue-100">
          Ready to continue your learning journey? Pick up where you left off or start something new.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="elevated" className="hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <Link href="/dashboard/chat" className="block p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Start a Conversation
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ask questions and learn through dialogue with your AI tutor
                  </p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" />
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card variant="elevated" className="hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <Link href="/dashboard/learn" className="block p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Explore Topics
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Browse your concept map and track your learning progress
                  </p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle as="h2" className="text-lg">Your Progress</CardTitle>
          <CardDescription>Track your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sessions</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Concepts</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle as="h2" className="text-lg">Getting Started</CardTitle>
          <CardDescription>Complete these steps to get the most out of LearningOS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Create your account", completed: true },
              { label: "Complete onboarding", completed: true },
              { label: "Start your first conversation", completed: false },
              { label: "Explore the concept map", completed: false },
            ].map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  step.completed
                    ? "bg-green-50 dark:bg-green-900/20"
                    : "bg-gray-50 dark:bg-gray-800"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  {step.completed ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {index + 1}
                    </span>
                  )}
                </div>
                <span
                  className={`font-medium ${
                    step.completed
                      ? "text-green-700 dark:text-green-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tip of the Day */}
      <Card variant="outlined" className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800">
        <CardContent>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                Tip of the Day
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                The best way to learn is to explain concepts in your own words. Try summarizing what you&apos;ve learned to your AI tutor—it helps reinforce your understanding!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
