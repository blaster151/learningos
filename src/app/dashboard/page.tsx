"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { authFetch } from "@/lib/api/authFetch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { BookIcon, MessageCircleIcon, ChevronRightIcon } from "@/components/icons";
import Link from "next/link";

interface DashboardStats {
  sessions: number;
  concepts: number;
  messages: number;
  streak: number;
  avgMastery: number;
  mastered: number;
  learning: number;
  newConcepts: number;
}

// Compute learning quadrant from stats
function getLearningState(stats: DashboardStats): {
  label: string;
  emoji: string;
  description: string;
  color: string;
  bgColor: string;
} {
  const { sessions, concepts, avgMastery } = stats;

  if (sessions === 0 || concepts === 0) {
    return {
      label: "Getting Started",
      emoji: "🚀",
      description: "Begin your first conversation to start learning!",
      color: "text-gray-700 dark:text-gray-300",
      bgColor: "bg-gray-100 dark:bg-gray-800",
    };
  }
  if (avgMastery >= 70 && concepts >= 10) {
    return {
      label: "You've got this!",
      emoji: "🌟",
      description: "Strong mastery across many concepts — keep pushing boundaries!",
      color: "text-amber-700 dark:text-amber-300",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    };
  }
  if (avgMastery >= 50) {
    return {
      label: "Building Momentum",
      emoji: "⚡",
      description: "Solid progress — concepts are clicking into place.",
      color: "text-blue-700 dark:text-blue-300",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    };
  }
  if (concepts >= 5) {
    return {
      label: "Exploring",
      emoji: "🔍",
      description: "You're discovering lots of new concepts — keep going!",
      color: "text-purple-700 dark:text-purple-300",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    };
  }
  return {
    label: "Building Up",
    emoji: "🌱",
    description: "Every expert was once a beginner — you're on your way!",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    sessions: 0,
    concepts: 0,
    messages: 0,
    streak: 0,
    avgMastery: 0,
    mastered: 0,
    learning: 0,
    newConcepts: 0,
  });
  const [hasStartedChat, setHasStartedChat] = useState(false);

  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch sessions count
      const sessionsRes = await authFetch(user, `/api/sessions?userId=${user.uid}`);
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        const sessionsList = sessionsData.sessions || [];
        const totalMessages = sessionsList.reduce(
          (sum: number, s: { messageCount?: number }) => sum + (s.messageCount || 0),
          0
        );

        // Compute day streak from session dates
        const sessionDates = sessionsList
          .map((s: { lastActivity?: string; startedAt?: string }) => s.lastActivity || s.startedAt)
          .filter(Boolean)
          .map((d: string) => {
            const dt = new Date(d);
            return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
          });
        const uniqueDays = [...new Set(sessionDates)].sort().reverse();
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < uniqueDays.length; i++) {
          const expected = new Date(today);
          expected.setDate(expected.getDate() - i);
          const key = `${expected.getFullYear()}-${expected.getMonth()}-${expected.getDate()}`;
          if (uniqueDays.includes(key)) {
            streak++;
          } else {
            break;
          }
        }

        setStats((prev) => ({
          ...prev,
          sessions: sessionsList.length,
          messages: totalMessages,
          streak,
        }));
        setHasStartedChat(sessionsList.length > 0);
      }

      // Fetch concepts count and mastery stats
      const conceptsRes = await authFetch(user, `/api/concepts?userId=${user.uid}`);
      if (conceptsRes.ok) {
        const conceptsData = await conceptsRes.json();
        setStats((prev) => ({
          ...prev,
          concepts: conceptsData.stats?.total || 0,
          avgMastery: conceptsData.stats?.avgMastery || 0,
          mastered: conceptsData.stats?.mastered || 0,
          learning: conceptsData.stats?.learning || 0,
          newConcepts: conceptsData.stats?.new || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.displayName?.split(" ")[0] || "there";
  const learningState = getLearningState(stats);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {getGreeting()}, {firstName}! 👋
            </h1>
            <p className="text-blue-100">
              Ready to continue your learning journey? Pick up where you left off or start something new.
            </p>
          </div>
          {/* Learning State Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ${learningState.bgColor} self-start sm:self-center shrink-0`}>
            <span className="text-xl" aria-hidden="true">{learningState.emoji}</span>
            <div>
              <p className={`text-sm font-semibold ${learningState.color}`}>{learningState.label}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 max-w-[160px]">{learningState.description}</p>
            </div>
          </div>
        </div>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sessions}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sessions</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.concepts}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Concepts</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.messages}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.streak}</p>
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
              { label: "Start your first conversation", completed: hasStartedChat },
              { label: "Explore the concept map", completed: stats.concepts > 0 },
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
