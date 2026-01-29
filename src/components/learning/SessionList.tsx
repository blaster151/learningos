import React from "react";
import type { LearningSession } from "@/types";

interface SessionListProps {
  sessions: LearningSession[];
  onSessionClick?: (sessionId: string) => void;
  onBranchSession?: (sessionId: string) => void;
  currentSessionId?: string;
}

const statusStyles = {
  active: "bg-green-100 text-green-800 border-green-200",
  paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function SessionList({
  sessions,
  onSessionClick,
  onBranchSession,
  currentSessionId,
}: SessionListProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No learning sessions yet</p>
      </div>
    );
  }

  const formatDate = (timestamp: { seconds: number } | undefined): string => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  const formatDuration = (session: LearningSession): string => {
    if (!session.startTime) return "—";
    const start = session.startTime.seconds * 1000;
    const end = session.endTime?.seconds
      ? session.endTime.seconds * 1000
      : session.lastMessageTime?.seconds
      ? session.lastMessageTime.seconds * 1000
      : Date.now();
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const isActive = session.id === currentSessionId;
        const isClickable = onSessionClick && !isActive;

        return (
          <div
            key={session.id}
            onClick={isClickable ? () => onSessionClick(session.id!) : undefined}
            className={`border rounded-lg p-4 transition-all ${
              isActive
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            } ${isClickable ? "cursor-pointer hover:shadow-md" : ""}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-semibold text-gray-900 truncate">
                  {session.topic}
                </h4>
                {session.parentSessionId && (
                  <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                    Branched session
                  </span>
                )}
              </div>
              <span
                className={`ml-2 px-2 py-1 text-xs font-medium rounded-full border whitespace-nowrap ${
                  statusStyles[session.status]
                }`}
              >
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span>{session.messageCount || 0} messages</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-gray-500"
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
                <span>{formatDuration(session)}</span>
              </div>
            </div>

            {session.conceptsCovered && session.conceptsCovered.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1.5">
                  {session.conceptsCovered.slice(0, 5).map((concept) => (
                    <span
                      key={concept}
                      className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                    >
                      {concept}
                    </span>
                  ))}
                  {session.conceptsCovered.length > 5 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                      +{session.conceptsCovered.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Started {formatDate(session.startTime)}
              {session.lastMessageTime && (
                <> • Last activity {formatDate(session.lastMessageTime)}</>
              )}
            </div>

            {onBranchSession && session.status === "active" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBranchSession(session.id!);
                }}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
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
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Branch conversation
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
