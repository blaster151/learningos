"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { authFetch } from "@/lib/api/authFetch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from "@/components/ui";
import { HighlighterIcon, SearchIcon, TrashIcon, MessageCircleIcon } from "@/components/icons";
import Link from "next/link";

// ===================================
// Types
// ===================================

interface HighlightItem {
  highlightId: string;
  userId: string;
  sessionId: string;
  messageId: string;
  text: string;
  startOffset: number;
  endOffset: number;
  note?: string;
  createdAt: { seconds: number; nanoseconds: number };
}

interface SessionInfo {
  sessionId: string;
  topic?: string;
  startedAt?: { seconds: number; nanoseconds: number };
}

// ===================================
// HighlightsPage
// ===================================

export default function HighlightsPage() {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [sessions, setSessions] = useState<Record<string, SessionInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch all highlights
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch highlights
        const hlResponse = await authFetch(
          user,
          `/api/highlights?userId=${user.uid}`
        );
        if (hlResponse.ok) {
          const hlData = await hlResponse.json();
          setHighlights(hlData.highlights || []);

          // Gather unique session IDs and fetch session info
          const sessionIds = [
            ...new Set(
              (hlData.highlights || []).map((h: HighlightItem) => h.sessionId)
            ),
          ] as string[];

          const sessionMap: Record<string, SessionInfo> = {};
          await Promise.all(
            sessionIds.map(async (sid) => {
              try {
                const sResponse = await authFetch(
                  user,
                  `/api/sessions?userId=${user.uid}&sessionId=${sid}`
                );
                if (sResponse.ok) {
                  const sData = await sResponse.json();
                  if (sData.session) {
                    sessionMap[sid] = {
                      sessionId: sid,
                      topic: sData.session.topic,
                      startedAt: sData.session.startedAt,
                    };
                  }
                }
              } catch {
                // Session lookup failed — not critical
              }
            })
          );
          setSessions(sessionMap);
        }
      } catch (error) {
        console.error("Failed to fetch highlights:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Delete a highlight
  const handleDelete = async (highlightId: string) => {
    if (!user) return;
    setDeletingId(highlightId);
    try {
      const response = await authFetch(
        user,
        `/api/highlights?highlightId=${highlightId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        setHighlights((prev) =>
          prev.filter((h) => h.highlightId !== highlightId)
        );
      }
    } catch (error) {
      console.error("Failed to delete highlight:", error);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter highlights by search query
  const filteredHighlights = useMemo(() => {
    if (!searchQuery.trim()) return highlights;
    const lower = searchQuery.toLowerCase();
    return highlights.filter(
      (h) =>
        h.text.toLowerCase().includes(lower) ||
        h.note?.toLowerCase().includes(lower) ||
        sessions[h.sessionId]?.topic?.toLowerCase().includes(lower)
    );
  }, [highlights, searchQuery, sessions]);

  // Group highlights by session
  const groupedBySession = useMemo(() => {
    const groups: Record<string, HighlightItem[]> = {};
    for (const h of filteredHighlights) {
      if (!groups[h.sessionId]) {
        groups[h.sessionId] = [];
      }
      groups[h.sessionId].push(h);
    }
    return groups;
  }, [filteredHighlights]);

  // Sort session groups by most recent highlight
  const sortedSessionIds = useMemo(() => {
    return Object.keys(groupedBySession).sort((a, b) => {
      const aLatest = Math.max(
        ...groupedBySession[a].map((h) => h.createdAt?.seconds || 0)
      );
      const bLatest = Math.max(
        ...groupedBySession[b].map((h) => h.createdAt?.seconds || 0)
      );
      return bLatest - aLatest;
    });
  }, [groupedBySession]);

  const formatDate = (ts: { seconds: number; nanoseconds: number } | undefined) => {
    if (!ts) return "";
    return new Date(ts.seconds * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <HighlighterIcon className="w-7 h-7 text-yellow-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Highlights
          </h1>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <HighlighterIcon className="w-7 h-7 text-yellow-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Highlights
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {highlights.length} highlight{highlights.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search highlights…"
          className="pl-10"
        />
      </div>

      {/* Empty State */}
      {highlights.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <HighlighterIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No highlights yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
              Select text in any AI response during a chat session to save it as a highlight.
              Your highlights will appear here for easy review.
            </p>
            <Link href="/dashboard/chat">
              <Button>
                <MessageCircleIcon className="w-4 h-4 mr-2" />
                Start a Chat
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* No search results */}
      {highlights.length > 0 && filteredHighlights.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <SearchIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No highlights match &ldquo;{searchQuery}&rdquo;
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grouped Highlights */}
      <div className="space-y-6">
        {sortedSessionIds.map((sessionId) => {
          const sessionHighlights = groupedBySession[sessionId];
          const session = sessions[sessionId];

          return (
            <Card key={sessionId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircleIcon className="w-4 h-4 text-blue-500" />
                  {session?.topic || "Chat Session"}
                </CardTitle>
                {session?.startedAt && (
                  <CardDescription className="text-xs">
                    {formatDate(session.startedAt)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessionHighlights.map((hl) => (
                    <div
                      key={hl.highlightId}
                      className="group flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/40 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors"
                    >
                      {/* Yellow bar */}
                      <div className="w-1 self-stretch bg-yellow-400 dark:bg-yellow-600 rounded-full flex-shrink-0" />
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                          &ldquo;{hl.text}&rdquo;
                        </p>
                        {hl.note && (
                          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic">
                            📝 {hl.note}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(hl.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/dashboard/chat?session=${hl.sessionId}`}
                          className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded transition-colors"
                          title="Go to chat"
                        >
                          <MessageCircleIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(hl.highlightId)}
                          disabled={deletingId === hl.highlightId}
                          className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors disabled:opacity-50"
                          title="Delete highlight"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
