"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { authFetch } from "@/lib/api/authFetch";
import { SessionCard } from "@/components/dashboard/SessionCard";
import { SkeletonList, EmptyState } from "@/components/ui";
import { MessageCircleIcon } from "@/components/icons";

type SessionStatus = "all" | "active" | "completed" | "abandoned";

interface Session {
  sessionId: string;
  topic: string;
  goal?: string | null;
  startedAt: string;
  lastActivity: string;
  messageCount: number;
  conceptsCovered: string[];
  status: "active" | "completed" | "abandoned";
}

export default function SessionHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SessionStatus>("all");

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user) return;
      const response = await authFetch(user, `/api/sessions?userId=${user.uid}`);
      if (!response.ok) {
        throw new Error("Failed to load sessions");
      }
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (filter === "all") return true;
    return session.status === filter;
  });

  const handleResume = (sessionId: string) => {
    router.push(`/dashboard/chat?sessionId=${sessionId}`);
  };

  const handleViewSummary = (sessionId: string) => {
    router.push(`/dashboard/chat?sessionId=${sessionId}&view=summary`);
  };

  const filterTabs: { value: SessionStatus; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Session History
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review and continue your past learning sessions
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.value
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
            {filter === tab.value && sessions.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 rounded-full">
                {filteredSessions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonList count={4} variant="with-avatar" />
      ) : error ? (
        <EmptyState
          icon={<MessageCircleIcon className="w-full h-full" />}
          title="Failed to load sessions"
          description={error}
          action={{ label: "Try Again", onClick: loadSessions }}
        />
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={<MessageCircleIcon className="w-full h-full" />}
          title={filter === "all" ? "No sessions yet" : `No ${filter} sessions`}
          description={
            filter === "all"
              ? "Start a learning conversation to see your session history here."
              : `You don't have any ${filter} sessions.`
          }
          action={
            filter === "all"
              ? { label: "Start Learning", onClick: () => router.push("/dashboard/chat") }
              : undefined
          }
          secondaryAction={
            filter !== "all"
              ? { label: "View All", onClick: () => setFilter("all") }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              onResume={session.status === "active" ? () => handleResume(session.sessionId) : undefined}
              onViewSummary={() => handleViewSummary(session.sessionId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
