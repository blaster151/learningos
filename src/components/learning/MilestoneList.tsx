import React from "react";
import type { PathMilestone, MilestoneStatus } from "@/types";

interface MilestoneListProps {
  milestones: PathMilestone[];
  onMilestoneClick?: (milestoneId: string) => void;
}

const statusStyles: Record<MilestoneStatus, string> = {
  locked: "bg-gray-100 border-gray-300 text-gray-500",
  available: "bg-blue-50 border-blue-300 text-blue-900",
  "in-progress": "bg-yellow-50 border-yellow-300 text-yellow-900",
  completed: "bg-green-50 border-green-300 text-green-900",
};

const statusIcons: Record<MilestoneStatus, JSX.Element> = {
  locked: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  ),
  available: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),
  "in-progress": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  completed: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export default function MilestoneList({ milestones, onMilestoneClick }: MilestoneListProps) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No milestones defined for this path</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {milestones.map((milestone, index) => {
        const isClickable = onMilestoneClick && milestone.status !== "locked";
        return (
          <div
            key={milestone.id}
            onClick={isClickable ? () => onMilestoneClick(milestone.id) : undefined}
            className={`border-2 rounded-lg p-4 transition-all ${
              statusStyles[milestone.status]
            } ${isClickable ? "cursor-pointer hover:shadow-md" : "cursor-default"}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">{statusIcons[milestone.status]}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-500">
                    Milestone {index + 1}
                  </span>
                  {milestone.status === "in-progress" && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-900 rounded">
                      Current
                    </span>
                  )}
                  {milestone.status === "completed" && milestone.completedAt && (
                    <span className="text-xs text-gray-500">
                      Completed{" "}
                      {new Date(
                        milestone.completedAt.seconds * 1000
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h4 className="text-lg font-semibold mb-2">{milestone.title}</h4>
                <p className="text-sm mb-3">{milestone.description}</p>

                {milestone.requiredConcepts && milestone.requiredConcepts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {milestone.requiredConcepts.map((conceptId) => (
                      <span
                        key={conceptId}
                        className="px-2 py-1 text-xs font-medium bg-white border border-current rounded"
                      >
                        {conceptId}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium">
                    {milestone.estimatedHours || 0}h estimated
                  </span>
                  {milestone.progress !== undefined && (
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1 bg-white rounded-full h-2 max-w-xs">
                        <div
                          className="bg-current h-2 rounded-full transition-all duration-300"
                          style={{ width: `${milestone.progress}%` }}
                        />
                      </div>
                      <span className="font-semibold">{milestone.progress}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
