"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { authFetch } from "@/lib/api/authFetch";
import { PathCard, ProgressRing } from "@/components/learning";
import type { LearningPath } from "@/types";

export default function LearnPage() {
  const { user } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activePaths, setActivePaths] = useState<LearningPath[]>([]);
  const [pausedPaths, setPausedPaths] = useState<LearningPath[]>([]);
  const [suggestedPaths, setSuggestedPaths] = useState<LearningPath[]>([]);
  const [completedPaths, setCompletedPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load paths on mount
  useEffect(() => {
    if (user) {
      loadPaths();
    }
  }, [user]);

  const loadPaths = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user) return;
      const response = await authFetch(user, "/api/paths");
      if (!response.ok) {
        throw new Error("Failed to load paths");
      }
      const data = await response.json();
      setPaths(data.paths || []);

      // Categorize paths
      const active = data.paths.filter((p: LearningPath) => p.status === "active");
      const paused = data.paths.filter((p: LearningPath) => p.status === "paused");
      const suggested = data.paths.filter((p: LearningPath) => p.status === "suggested");
      const completed = data.paths.filter((p: LearningPath) => p.status === "completed");

      setActivePaths(active);
      setPausedPaths(paused);
      setSuggestedPaths(suggested);
      setCompletedPaths(completed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load paths");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePath = async () => {
    if (!goalInput.trim()) {
      setError("Please enter a learning goal");
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      if (!user) return;
      const response = await authFetch(user, "/api/paths/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goalInput }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate path");
      }

      const data = await response.json();
      setGoalInput("");
      await loadPaths(); // Reload to show new path
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate path");
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptPath = async (pathId: string) => {
    try {
      if (!user) return;
      const response = await authFetch(user, `/api/paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept path");
      }

      await loadPaths();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept path");
    }
  };

  const handleAbandonPath = async (pathId: string) => {
    if (!window.confirm("Are you sure you want to abandon this path? Your progress will be saved but the path will be moved to abandoned.")) {
      return;
    }
    try {
      if (!user) return;
      const response = await authFetch(user, `/api/paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "abandon" }),
      });

      if (!response.ok) {
        throw new Error("Failed to abandon path");
      }

      await loadPaths();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to abandon path");
    }
  };

  const handlePausePath = async (pathId: string) => {
    try {
      if (!user) return;
      const response = await authFetch(user, `/api/paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });

      if (!response.ok) {
        throw new Error("Failed to pause path");
      }

      await loadPaths();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pause path");
    }
  };

  const handleResumePath = async (pathId: string) => {
    try {
      if (!user) return;
      const response = await authFetch(user, `/api/paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      });

      if (!response.ok) {
        throw new Error("Failed to resume path");
      }

      await loadPaths();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume path");
    }
  };

  const handleViewPath = (pathId: string) => {
    window.location.href = `/dashboard/learn/${pathId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Paths</h1>
        <p className="text-gray-600">
          AI-guided learning paths personalized to your knowledge and goals
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Active Paths */}
      {activePaths.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Active Paths {activePaths.length > 1 && `(${activePaths.length})`}
          </h2>
          <div className="space-y-4">
            {activePaths.map((activePath) => (
              <div key={activePath.pathId} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border-2 border-blue-200">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                  <ProgressRing
                    progress={Math.round((activePath.progress || 0) * 100)}
                    size={140}
                    strokeWidth={10}
                  />
                  <div className="flex-1">
                    <PathCard
                      path={activePath}
                      onPause={handlePausePath}
                      onAbandon={handleAbandonPath}
                      onView={handleViewPath}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paused Paths */}
      {pausedPaths.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            ⏸ Paused Paths {pausedPaths.length > 1 && `(${pausedPaths.length})`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pausedPaths.map((path) => (
              <PathCard
                key={path.pathId}
                path={path}
                onResume={handleResumePath}
                onAbandon={handleAbandonPath}
                onView={handleViewPath}
              />
            ))}
          </div>
        </div>
      )}

      {/* Generate New Path */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Generate New Learning Path
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            placeholder="What do you want to learn? (e.g., 'Master React hooks')"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={generating}
          />
          <button
            onClick={handleGeneratePath}
            disabled={generating || !goalInput.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors sm:w-auto w-full"
          >
            {generating ? "Generating..." : "Generate Path"}
          </button>
        </div>
      </div>

      {/* Suggested Paths */}
      {suggestedPaths.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Suggested Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestedPaths.map((path) => (
              <PathCard
                key={path.pathId}
                path={path}
                onAccept={handleAcceptPath}
                onView={handleViewPath}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Paths */}
      {completedPaths.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Completed Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedPaths.map((path) => (
              <PathCard key={path.pathId} path={path} onView={handleViewPath} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {activePaths.length === 0 && pausedPaths.length === 0 && suggestedPaths.length === 0 && completedPaths.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No learning paths yet</h3>
          <p className="text-gray-600 mb-6">
            Generate your first AI-guided learning path to get started
          </p>
        </div>
      )}
    </div>
  );
}
