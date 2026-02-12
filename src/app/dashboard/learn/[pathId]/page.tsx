"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { authFetch } from "@/lib/api/authFetch";
import { ProgressRing } from "@/components/learning";
import type { LearningPath, PathMilestone } from "@/types";

// ===================================
// Milestone Status Helpers
// ===================================

const statusConfig: Record<
  string,
  { bg: string; border: string; text: string; icon: string; label: string }
> = {
  locked: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-400",
    icon: "🔒",
    label: "Locked",
  },
  not_started: {
    bg: "bg-gray-50",
    border: "border-gray-300",
    text: "text-gray-600",
    icon: "⏳",
    label: "Not Started",
  },
  available: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-800",
    icon: "⚡",
    label: "Available",
  },
  in_progress: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-800",
    icon: "▶️",
    label: "In Progress",
  },
  completed: {
    bg: "bg-green-50",
    border: "border-green-300",
    text: "text-green-800",
    icon: "✅",
    label: "Completed",
  },
};

// ===================================
// MilestoneCard Component
// ===================================

function MilestoneCard({
  milestone,
  index,
  isExpanded,
  onToggle,
  onStart,
  onComplete,
  isActive,
  pathStatus,
}: {
  milestone: PathMilestone;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onStart: () => void;
  onComplete: () => void;
  isActive: boolean;
  pathStatus: string;
}) {
  const config = statusConfig[milestone.status] || statusConfig.not_started;
  const isLocked = milestone.status === "locked";
  const isCompleted = milestone.status === "completed";
  const canStart =
    pathStatus === "active" &&
    (milestone.status === "available" || milestone.status === "not_started");
  const canComplete =
    pathStatus === "active" && milestone.status === "in_progress";

  return (
    <div
      className={`relative border-2 rounded-xl transition-all duration-200 ${config.border} ${config.bg} ${
        isActive ? "ring-2 ring-blue-400 ring-offset-2" : ""
      } ${isLocked ? "opacity-60" : ""}`}
    >
      {/* Connector line between milestones */}
      {index > 0 && (
        <div className="absolute -top-6 left-8 w-0.5 h-6 bg-gray-300" />
      )}

      {/* Header - always visible */}
      <button
        onClick={isLocked ? undefined : onToggle}
        disabled={isLocked}
        className={`w-full text-left p-4 sm:p-5 ${
          isLocked ? "cursor-not-allowed" : "cursor-pointer hover:bg-opacity-80"
        }`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Step number circle */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              isCompleted
                ? "bg-green-500 text-white"
                : isActive
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {isCompleted ? "✓" : index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3
                className={`text-lg font-semibold ${
                  isLocked ? "text-gray-400" : "text-gray-900"
                }`}
              >
                {milestone.title}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text} border ${config.border}`}
              >
                {config.icon} {config.label}
              </span>
            </div>
            <p
              className={`text-sm ${
                isLocked ? "text-gray-400" : "text-gray-600"
              } line-clamp-2`}
            >
              {milestone.description}
            </p>

            {/* Quick stats row */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {milestone.estimatedMinutes > 0 && (
                <span>
                  ⏱{" "}
                  {milestone.estimatedMinutes >= 60
                    ? `${Math.round(milestone.estimatedMinutes / 60)}h`
                    : `${milestone.estimatedMinutes}m`}
                </span>
              )}
              {milestone.conceptNames?.length > 0 && (
                <span>
                  📚 {milestone.conceptNames.length} concept
                  {milestone.conceptNames.length !== 1 ? "s" : ""}
                </span>
              )}
              {milestone.objectives?.length > 0 && (
                <span>
                  🎯 {milestone.objectives.length} objective
                  {milestone.objectives.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Expand/collapse chevron */}
          {!isLocked && (
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 mt-1 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && !isLocked && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-200 pt-4 space-y-4">
          {/* Objectives */}
          {milestone.objectives?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Learning Objectives
              </h4>
              <ul className="space-y-1.5">
                {milestone.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">○</span>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concepts */}
          {milestone.conceptNames?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Concepts Covered
              </h4>
              <div className="flex flex-wrap gap-2">
                {milestone.conceptNames.map((name, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-full text-gray-700"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar for in-progress milestones */}
          {milestone.status === "in_progress" && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span className="font-semibold">
                  {Math.round((milestone.progress || 0) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round((milestone.progress || 0) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Completed info */}
          {milestone.status === "completed" && milestone.completedAt && (
            <div className="text-sm text-green-700 bg-green-100 rounded-lg px-3 py-2">
              ✅ Completed on{" "}
              {new Date(
                typeof milestone.completedAt === "object" &&
                "seconds" in milestone.completedAt
                  ? milestone.completedAt.seconds * 1000
                  : milestone.completedAt
              ).toLocaleDateString()}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            {canStart && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStart();
                }}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                ▶ Start Milestone
              </button>
            )}
            {canComplete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                ✓ Mark as Complete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===================================
// PathDetailPage Component
// ===================================

export default function PathDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const pathId = params.pathId as string;

  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load path data
  const loadPath = useCallback(async () => {
    if (!user || !pathId) return;
    try {
      setError(null);
      const response = await authFetch(user, `/api/paths/${pathId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Learning path not found");
        } else {
          throw new Error("Failed to load path");
        }
        return;
      }
      const data = await response.json();
      setPath(data.path);

      // Auto-expand the current milestone
      if (data.path?.milestones) {
        const currentIdx = data.path.currentMilestoneIndex || 0;
        const currentMilestone = data.path.milestones[currentIdx];
        if (
          currentMilestone &&
          currentMilestone.status !== "completed" &&
          currentMilestone.status !== "locked"
        ) {
          setExpandedMilestone(currentMilestone.milestoneId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load path");
    } finally {
      setLoading(false);
    }
  }, [user, pathId]);

  useEffect(() => {
    loadPath();
  }, [loadPath]);

  // Perform a path action (start/complete milestone, accept/abandon path)
  const performAction = async (
    action: string,
    extra: Record<string, string> = {}
  ) => {
    if (!user || !pathId) return;
    const actionKey = extra.milestoneId || action;
    try {
      setActionLoading(actionKey);
      const response = await authFetch(user, `/api/paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Action failed");
      }

      // Reload path to reflect changes
      await loadPath();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartMilestone = (milestoneId: string) => {
    performAction("start_milestone", { milestoneId });
  };

  const handleCompleteMilestone = (milestoneId: string) => {
    performAction("complete_milestone", { milestoneId });
  };

  const handleAcceptPath = () => {
    performAction("accept");
  };

  const handleAbandonPath = () => {
    if (window.confirm("Are you sure you want to abandon this path? Your progress will be saved.")) {
      performAction("abandon");
    }
  };

  // ===================================
  // Loading State
  // ===================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading learning path...</p>
        </div>
      </div>
    );
  }

  // ===================================
  // Error State
  // ===================================
  if (error && !path) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error === "Learning path not found"
              ? "Path Not Found"
              : "Something Went Wrong"}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard/learn")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            ← Back to Learning Paths
          </button>
        </div>
      </div>
    );
  }

  if (!path) return null;

  // ===================================
  // Computed Values
  // ===================================
  const progressPercent = Math.round((path.progress || 0) * 100);
  const completedMilestones = path.milestones.filter(
    (m) => m.status === "completed"
  ).length;
  const totalMilestones = path.milestones.length;
  const estimatedHours = Math.ceil((path.estimatedMinutes || 0) / 60);
  const isCompleted = path.status === "completed";
  const isSuggested = path.status === "suggested";
  const isActive = path.status === "active";
  const isAbandoned = path.status === "abandoned";

  // ===================================
  // Render
  // ===================================
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard/learn")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Learning Paths
      </button>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ===================================
          Path Header
          =================================== */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 sm:p-8 border border-blue-200 mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Progress Ring */}
          <div className="flex-shrink-0">
            <ProgressRing
              progress={progressPercent}
              size={130}
              strokeWidth={10}
              label={isCompleted ? "Complete!" : "Progress"}
            />
          </div>

          {/* Path Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {path.title}
              </h1>
              {isCompleted && (
                <span className="px-3 py-1 text-xs font-bold bg-green-100 text-green-800 border border-green-300 rounded-full">
                  🎉 Completed
                </span>
              )}
              {isSuggested && (
                <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 rounded-full">
                  Suggested
                </span>
              )}
              {isAbandoned && (
                <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-800 border border-red-300 rounded-full">
                  Abandoned
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-4">{path.description}</p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-700 justify-center sm:justify-start">
              <div className="flex items-center gap-1">
                <span className="text-lg">📋</span>
                <span>
                  {completedMilestones}/{totalMilestones} milestones
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">⏱</span>
                <span>~{estimatedHours}h total</span>
              </div>
              {path.generatedFrom?.userLevel && (
                <div className="flex items-center gap-1">
                  <span className="text-lg">📊</span>
                  <span className="capitalize">
                    {path.generatedFrom.userLevel}
                  </span>
                </div>
              )}
            </div>

            {/* Goal */}
            {path.goal && (
              <div className="mt-4 text-sm bg-white/60 rounded-lg px-4 py-2 border border-blue-100">
                <span className="font-medium text-gray-700">Goal: </span>
                <span className="text-gray-600">{path.goal}</span>
              </div>
            )}
          </div>
        </div>

        {/* Path-level actions */}
        <div className="flex flex-wrap gap-3 mt-6 justify-center sm:justify-start">
          {isSuggested && (
            <button
              onClick={handleAcceptPath}
              disabled={actionLoading === "accept"}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {actionLoading === "accept" ? "Starting..." : "🚀 Start This Path"}
            </button>
          )}
          {isActive && (
            <button
              onClick={handleAbandonPath}
              disabled={!!actionLoading}
              className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Abandon Path
            </button>
          )}
          {isCompleted && (
            <button
              onClick={() => router.push("/dashboard/learn")}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              🎉 Back to All Paths
            </button>
          )}
        </div>
      </div>

      {/* ===================================
          Completion Banner
          =================================== */}
      {isCompleted && (
        <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🎓</div>
          <h2 className="text-xl font-bold text-green-800 mb-2">
            Congratulations!
          </h2>
          <p className="text-green-700">
            You&apos;ve completed all {totalMilestones} milestones in this
            learning path. Great work!
          </p>
        </div>
      )}

      {/* ===================================
          Milestones Section
          =================================== */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Milestones</h2>
          <span className="text-sm text-gray-500">
            {completedMilestones} of {totalMilestones} complete
          </span>
        </div>

        <div className="space-y-6">
          {path.milestones.map((milestone, index) => (
            <MilestoneCard
              key={milestone.milestoneId}
              milestone={milestone}
              index={index}
              isExpanded={expandedMilestone === milestone.milestoneId}
              onToggle={() =>
                setExpandedMilestone(
                  expandedMilestone === milestone.milestoneId
                    ? null
                    : milestone.milestoneId
                )
              }
              onStart={() => handleStartMilestone(milestone.milestoneId)}
              onComplete={() => handleCompleteMilestone(milestone.milestoneId)}
              isActive={index === (path.currentMilestoneIndex || 0) && isActive}
              pathStatus={path.status}
            />
          ))}
        </div>
      </div>

      {/* ===================================
          Path Details Footer
          =================================== */}
      {path.generatedFrom && (
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-sm text-gray-600">
          <h3 className="font-semibold text-gray-700 mb-2">Path Details</h3>
          <div className="space-y-1">
            <p>
              <span className="font-medium">Original Goal:</span>{" "}
              {path.generatedFrom.userGoal}
            </p>
            <p>
              <span className="font-medium">Level:</span>{" "}
              <span className="capitalize">
                {path.generatedFrom.userLevel}
              </span>
            </p>
            {path.generatedFrom.learningStyle && (
              <p>
                <span className="font-medium">Learning Style:</span>{" "}
                <span className="capitalize">
                  {path.generatedFrom.learningStyle}
                </span>
              </p>
            )}
            <p>
              <span className="font-medium">Created:</span>{" "}
              {path.createdAt &&
                new Date(
                  typeof path.createdAt === "object" && "seconds" in path.createdAt
                    ? path.createdAt.seconds * 1000
                    : path.createdAt
                ).toLocaleDateString()}
            </p>
            {path.startedAt && (
              <p>
                <span className="font-medium">Started:</span>{" "}
                {new Date(
                  typeof path.startedAt === "object" && "seconds" in path.startedAt
                    ? path.startedAt.seconds * 1000
                    : path.startedAt
                ).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
