"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { authFetch } from "@/lib/api/authFetch";
import type { ConceptNode, MasteryLevel } from "@/types";

interface ConceptDetailPanelProps {
  conceptId: string;
  userId: string;
  onClose: () => void;
  onStartPath?: (conceptId: string) => void;
}

interface ConceptDetail {
  concept: ConceptNode;
  relatedConcepts: Array<{
    conceptId: string;
    name: string;
    masteryLevel: MasteryLevel;
    relationType: string;
  }>;
  recentSessions: Array<{
    sessionId: string;
    title: string;
    timestamp: string;
  }>;
  statistics: {
    totalSessions: number;
    totalReflections: number;
    daysSinceLastReview: number;
  };
}

export default function ConceptDetailPanel({
  conceptId,
  userId,
  onClose,
  onStartPath,
}: ConceptDetailPanelProps) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<ConceptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ userId });
        const response = await authFetch(
          user,
          `/api/graph/concepts/${conceptId}?${params}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch concept details");
        }

        const data = await response.json();
        setDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [conceptId, userId, user]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Concept Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {detail && (
            <>
              {/* Concept Info */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {detail.concept.name}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {detail.concept.domain}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded capitalize">
                    {detail.concept.masteryLevel}
                  </span>
                </div>
                <p className="text-gray-700">{detail.concept.definition}</p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {detail.statistics.totalSessions}
                  </div>
                  <div className="text-xs text-gray-500">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {detail.statistics.totalReflections}
                  </div>
                  <div className="text-xs text-gray-500">Reflections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {detail.statistics.daysSinceLastReview}d
                  </div>
                  <div className="text-xs text-gray-500">Last Review</div>
                </div>
              </div>

              {/* Related Concepts */}
              {detail.relatedConcepts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Related Concepts
                  </h4>
                  <div className="space-y-2">
                    {detail.relatedConcepts.map((related) => (
                      <div
                        key={related.conceptId}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {related.name}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {related.relationType.replace(/_/g, " ")}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-white text-gray-700 text-xs rounded capitalize">
                            {related.masteryLevel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Sessions */}
              {detail.recentSessions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Recent Sessions
                  </h4>
                  <div className="space-y-2">
                    {detail.recentSessions.map((session) => (
                      <div
                        key={session.sessionId}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="font-medium text-gray-900 text-sm">
                          {session.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(session.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                {onStartPath && (
                  <button
                    onClick={() => onStartPath(conceptId)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Create Learning Path
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
