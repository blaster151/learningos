"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { authFetch } from "@/lib/api/authFetch";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookIcon, MessageCircleIcon, TrophyIcon, BrainIcon, TargetIcon } from "@/components/icons";

interface LearningStats {
  concepts: {
    total: number;
    byMastery: Record<string, number>;
    byDomain: Record<string, number>;
  };
  reflections: {
    total: number;
    totalSkipped: number;
    averageScore: number;
    levelUps: number;
  };
  activity: {
    totalSessions: number;
    totalMessages: number;
    streak: number;
    lastActive: string | null;
  };
}

function MasteryBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">{value}</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function StatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user) return;
      const response = await authFetch(user, `/api/stats/learning?userId=${user.uid}`);
      if (!response.ok) {
        throw new Error("Failed to load stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <StatsLoading />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<TargetIcon className="w-full h-full" />}
        title="Failed to load stats"
        description={error}
        action={{ label: "Try Again", onClick: loadStats }}
      />
    );
  }

  if (!stats) {
    return (
      <EmptyState
        icon={<TargetIcon className="w-full h-full" />}
        title="No stats yet"
        description="Start learning to see your progress here."
      />
    );
  }

  const masteryLevels = [
    { key: "exploring", label: "Exploring", color: "bg-gray-400" },
    { key: "learning", label: "Learning", color: "bg-blue-500" },
    { key: "practicing", label: "Practicing", color: "bg-yellow-500" },
    { key: "comfortable", label: "Comfortable", color: "bg-green-500" },
    { key: "expert", label: "Expert", color: "bg-purple-500" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Learning Stats
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your learning progress and achievements
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Concepts Learned"
          value={stats.concepts.total}
          icon={<BrainIcon className="w-6 h-6" />}
        />
        <StatCard
          label="Learning Sessions"
          value={stats.activity.totalSessions}
          icon={<BookIcon className="w-6 h-6" />}
        />
        <StatCard
          label="Messages"
          value={stats.activity.totalMessages}
          icon={<MessageCircleIcon className="w-6 h-6" />}
        />
        <StatCard
          label="Day Streak"
          value={stats.activity.streak}
          icon={<TrophyIcon className="w-6 h-6" />}
        />
      </div>

      {/* Mastery Distribution */}
      {stats.concepts.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mastery Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {masteryLevels.map((level) => (
              <MasteryBar
                key={level.key}
                label={level.label}
                value={stats.concepts.byMastery[level.key] ?? 0}
                total={stats.concepts.total}
                color={level.color}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reflections */}
      <Card>
        <CardHeader>
          <CardTitle>Reflection Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.reflections.total}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completed
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.reflections.averageScore}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg Score
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.reflections.levelUps}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Level Ups
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.reflections.totalSkipped}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Skipped
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domains */}
      {Object.keys(stats.concepts.byDomain).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Learning Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.concepts.byDomain).map(([domain, count]) => (
                <div
                  key={domain}
                  className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg"
                >
                  <span className="font-medium">{domain}</span>
                  <span className="ml-2 text-blue-500 dark:text-blue-400">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
