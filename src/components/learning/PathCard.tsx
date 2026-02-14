import React from "react";
import type { LearningPath, PathStatus } from "@/types";

interface PathCardProps {
  path: LearningPath;
  onAccept?: (pathId: string) => void;
  onAbandon?: (pathId: string) => void;
  onPause?: (pathId: string) => void;
  onResume?: (pathId: string) => void;
  onView?: (pathId: string) => void;
}

const statusStyles: Record<PathStatus, string> = {
  suggested: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700",
  active: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700",
  paused: "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700",
  completed: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600",
  abandoned: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700",
};

const statusLabels: Record<PathStatus, string> = {
  suggested: "Suggested",
  active: "In Progress",
  paused: "Paused",
  completed: "Completed",
  abandoned: "Abandoned",
};

export default function PathCard({ path, onAccept, onAbandon, onPause, onResume, onView }: PathCardProps) {
  const progress = Math.round((path.progress || 0) * 100);
  const estimatedHours = Math.ceil((path.estimatedMinutes || 0) / 60);
  const estimatedDays = Math.ceil(estimatedHours / 2); // Assuming 2 hrs/day

  return (
    <div
      onClick={onView ? () => onView(path.pathId) : undefined}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all p-6 ${
        onView ? "cursor-pointer hover:border-blue-400 dark:hover:border-blue-500" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{path.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{path.description}</p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full border ${
            statusStyles[path.status]
          }`}
        >
          {statusLabels[path.status]}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <svg
            className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {path.milestones.length} milestone{path.milestones.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <svg
            className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {estimatedHours} hours (~{estimatedDays} days)
          </span>
        </div>

        {(path.status === "active" || path.status === "paused") && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-1">
              <span>Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  path.status === "paused" ? "bg-amber-500" : "bg-blue-600"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {path.status === "suggested" && onAccept && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAccept(path.pathId);
            }}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Start Path
          </button>
        )}

        {path.status === "active" && onPause && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPause(path.pathId);
            }}
            className="flex-1 bg-amber-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            ⏸ Pause
          </button>
        )}

        {path.status === "active" && onAbandon && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAbandon(path.pathId);
            }}
            className="flex-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors border border-red-300 dark:border-red-700"
          >
            Abandon
          </button>
        )}

        {path.status === "paused" && onResume && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResume(path.pathId);
            }}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            ▶ Resume
          </button>
        )}

        {path.status === "paused" && onAbandon && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAbandon(path.pathId);
            }}
            className="flex-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors border border-red-300 dark:border-red-700"
          >
            Abandon
          </button>
        )}

        {onView && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(path.pathId);
            }}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Open
          </button>
        )}
      </div>
    </div>
  );
}
