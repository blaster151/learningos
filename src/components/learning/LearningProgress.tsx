"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { BrainIcon, CheckIcon } from "@/components/icons";

// ===================================
// Types
// ===================================

interface Concept {
  id: string;
  name: string;
  description?: string;
  category: string;
  masteryLevel: number;
  exposureCount: number;
  lastPracticed?: string;
}

interface ConceptStats {
  total: number;
  avgMastery: number;
  mastered: number;
  learning: number;
  new: number;
}

// ===================================
// Mastery Level Indicator
// ===================================

function MasteryIndicator({ level }: { level: number }) {
  const getColor = () => {
    if (level >= 80) return "bg-green-500";
    if (level >= 50) return "bg-blue-500";
    if (level >= 30) return "bg-yellow-500";
    return "bg-gray-300";
  };

  const getLabel = () => {
    if (level >= 80) return "Mastered";
    if (level >= 50) return "Proficient";
    if (level >= 30) return "Learning";
    return "New";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${level}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[70px]">
        {getLabel()} ({level}%)
      </span>
    </div>
  );
}

// ===================================
// Category Badge
// ===================================

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    programming: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    mathematics: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    science: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    language: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    technology: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    business: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    history: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    art: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[category] || colors.other}`}>
      {category}
    </span>
  );
}

// ===================================
// Stats Summary Card
// ===================================

function StatsSummary({ stats }: { stats: ConceptStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
        <div className="text-xs text-gray-500">Total Concepts</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.avgMastery}%</div>
        <div className="text-xs text-gray-500">Avg Mastery</div>
      </div>
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.mastered}</div>
        <div className="text-xs text-gray-500">Mastered</div>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.learning}</div>
        <div className="text-xs text-gray-500">Learning</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-gray-600">{stats.new}</div>
        <div className="text-xs text-gray-500">New</div>
      </div>
    </div>
  );
}

// ===================================
// Learning Progress Component
// ===================================

export function LearningProgress() {
  const { user } = useAuth();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [stats, setStats] = useState<ConceptStats>({
    total: 0,
    avgMastery: 0,
    mastered: 0,
    learning: 0,
    new: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("masteryLevel");

  const loadConcepts = useCallback(async () => {
    if (!user) return;

    try {
      const params = new URLSearchParams({
        userId: user.uid,
        sortBy,
        limit: "100",
      });

      const response = await fetch(`/api/concepts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setConcepts(data.concepts || []);
        setStats(data.stats || {
          total: 0,
          avgMastery: 0,
          mastered: 0,
          learning: 0,
          new: 0,
        });
      }
    } catch (error) {
      console.error("Failed to load concepts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, sortBy]);

  useEffect(() => {
    loadConcepts();
  }, [loadConcepts]);

  // Filter concepts
  const filteredConcepts = concepts.filter((concept) => {
    if (filter === "all") return true;
    if (filter === "mastered") return concept.masteryLevel >= 80;
    if (filter === "learning") return concept.masteryLevel >= 30 && concept.masteryLevel < 80;
    if (filter === "new") return concept.masteryLevel < 30;
    return concept.category === filter;
  });

  // Get unique categories
  const categories = [...new Set(concepts.map((c) => c.category))];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">Loading your learning progress...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <StatsSummary stats={stats} />

      {/* Concepts Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BrainIcon className="w-5 h-5" />
                Learning Concepts
              </CardTitle>
              <CardDescription>
                Concepts you&apos;ve explored through conversations
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Concepts</option>
                <option value="mastered">Mastered</option>
                <option value="learning">Learning</option>
                <option value="new">New</option>
                <optgroup label="Categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </optgroup>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="masteryLevel">Sort by Mastery</option>
                <option value="lastPracticed">Sort by Recent</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredConcepts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <BrainIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {concepts.length === 0 ? "No concepts yet" : "No matching concepts"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {concepts.length === 0
                  ? "Start chatting with your AI tutor to discover and track learning concepts."
                  : "Try adjusting your filters to see more concepts."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConcepts.map((concept) => (
                <div
                  key={concept.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      {concept.masteryLevel >= 80 && (
                        <CheckIcon className="w-4 h-4 text-green-500" />
                      )}
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {concept.name}
                      </h4>
                      <CategoryBadge category={concept.category} />
                    </div>
                    <span className="text-xs text-gray-500">
                      {concept.exposureCount} {concept.exposureCount === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                  {concept.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {concept.description}
                    </p>
                  )}
                  <MasteryIndicator level={concept.masteryLevel} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default LearningProgress;
