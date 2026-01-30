"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SessionCardProps {
  session: {
    sessionId: string;
    topic: string;
    goal?: string | null;
    startedAt: string;
    lastActivity: string;
    messageCount: number;
    conceptsCovered: string[];
    status: "active" | "completed" | "abandoned";
  };
  onResume?: () => void;
  onViewSummary?: () => void;
  className?: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function StatusBadge({ status }: { status: SessionCardProps["session"]["status"] }) {
  const styles = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    abandoned: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", styles[status])}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function SessionCard({
  session,
  onResume,
  onViewSummary,
  className,
}: SessionCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {session.topic}
            </h3>
            {session.goal && (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                Goal: {session.goal}
              </p>
            )}
          </div>
          <StatusBadge status={session.status} />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <span>{formatRelativeTime(session.lastActivity)}</span>
          <span>•</span>
          <span>{session.messageCount} messages</span>
        </div>

        {/* Concepts */}
        {session.conceptsCovered.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {session.conceptsCovered.slice(0, 3).map((concept, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
              >
                {concept}
              </span>
            ))}
            {session.conceptsCovered.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                +{session.conceptsCovered.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {session.status === "active" && onResume && (
            <Button size="sm" onClick={onResume}>
              Resume
            </Button>
          )}
          {onViewSummary && (
            <Button size="sm" variant="outline" onClick={onViewSummary}>
              View Summary
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SessionCard;
