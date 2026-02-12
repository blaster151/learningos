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
  suggested: "bg-blue-100 text-blue-800 border-blue-200",
  active: "bg-green-100 text-green-800 border-green-200",
  paused: "bg-amber-100 text-amber-800 border-amber-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  abandoned: "bg-red-100 text-red-800 border-red-200",
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{path.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{path.description}</p>
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
        <div className="flex items-center text-sm text-gray-700">
          <svg
            className="w-4 h-4 mr-2 text-gray-500"
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

        <div className="flex items-center text-sm text-gray-700">
          <svg
            className="w-4 h-4 mr-2 text-gray-500"
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
            <div className="flex justify-between text-sm text-gray-700 mb-1">
              <span>Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
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
            onClick={() => onAccept(path.pathId)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Start Path
          </button>
        )}

        {path.status === "active" && onPause && (
          <button
            onClick={() => onPause(path.pathId)}
            className="flex-1 bg-amber-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            ⏸ Pause
          </button>
        )}

        {path.status === "active" && onAbandon && (
          <button
            onClick={() => onAbandon(path.pathId)}
            className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200 transition-colors border border-red-300"
          >
            Abandon
          </button>
        )}

        {path.status === "paused" && onResume && (
          <button
            onClick={() => onResume(path.pathId)}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            ▶ Resume
          </button>
        )}

        {path.status === "paused" && onAbandon && (
          <button
            onClick={() => onAbandon(path.pathId)}
            className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200 transition-colors border border-red-300"
          >
            Abandon
          </button>
        )}

        {onView && (
          <button
            onClick={() => onView(path.pathId)}
            className="flex-1 bg-gray-100 text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
