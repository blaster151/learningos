"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { MessageCircleIcon, BrainIcon, CheckIcon } from "@/components/icons";
import Link from "next/link";

// ===================================
// Types
// ===================================

interface SessionSummaryData {
  id: string;
  topic: string;
  status: "active" | "paused" | "completed";
  messageCount: number;
  createdAt: string;
  lastActivity?: string;
  conceptsCovered?: string[];
}

interface Concept {
  id: string;
  name: string;
  category: string;
  masteryLevel: number;
}

interface AISummary {
  summary: string;
  keyInsights: string[];
  conceptsCovered: string[];
  suggestedNextSteps: string[];
  overallProgress: "exploring" | "learning" | "understanding" | "mastering";
}

interface SessionSummaryProps {
  sessionId: string;
  onClose?: () => void;
  onContinue?: () => void;
}

// Progress label mapping
const progressLabels: Record<string, { label: string; color: string; emoji: string }> = {
  exploring: { label: "Exploring", color: "text-blue-500", emoji: "🔍" },
  learning: { label: "Learning", color: "text-yellow-500", emoji: "📚" },
  understanding: { label: "Understanding", color: "text-green-500", emoji: "💡" },
  mastering: { label: "Mastering", color: "text-purple-500", emoji: "🏆" },
};

// ===================================
// Session Summary Component
// ===================================

export function SessionSummary({ sessionId, onClose, onContinue }: SessionSummaryProps) {
  const { user } = useAuth();
  const [session, setSession] = useState<SessionSummaryData | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const loadSessionData = useCallback(async () => {
    if (!user || !sessionId) return;

    try {
      // Load session details
      const sessionRes = await fetch(`/api/sessions?sessionId=${sessionId}`);
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setSession(sessionData.session);
      }

      // Load concepts for this user (recently practiced)
      const conceptsRes = await fetch(`/api/concepts?userId=${user.uid}&sortBy=lastPracticed&limit=10`);
      if (conceptsRes.ok) {
        const conceptsData = await conceptsRes.json();
        setConcepts(conceptsData.concepts || []);
      }

      // Try to load existing AI summary
      const summaryRes = await fetch(`/api/sessions/summary?sessionId=${sessionId}`);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setAiSummary(summaryData);
      }
    } catch (error) {
      console.error("Failed to load session summary:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, sessionId]);

  // Generate AI summary on demand
  const generateSummary = async () => {
    if (!user || !sessionId) return;
    
    setIsGeneratingSummary(true);
    try {
      const response = await fetch("/api/sessions/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userId: user.uid }),
      });

      if (response.ok) {
        const summaryData = await response.json();
        setAiSummary(summaryData);
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  // Calculate session duration
  const getDuration = () => {
    if (!session?.createdAt || !session?.lastActivity) return "Just started";
    const start = new Date(session.createdAt);
    const end = new Date(session.lastActivity);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return "Less than a minute";
    if (diffMins === 1) return "1 minute";
    if (diffMins < 60) return `${diffMins} minutes`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-12">
          <div className="text-center text-gray-500">Loading summary...</div>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-12">
          <div className="text-center text-gray-500">Session not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <CheckIcon className="w-8 h-8 text-white" />
        </div>
        <CardTitle>Session Complete!</CardTitle>
        <p className="text-gray-600 dark:text-gray-400">
          Great learning session on {session.topic}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <MessageCircleIcon className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {session.messageCount}
            </p>
            <p className="text-xs text-gray-500">Messages</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <BrainIcon className="w-5 h-5 mx-auto mb-1 text-purple-500" />
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {concepts.length}
            </p>
            <p className="text-xs text-gray-500">Concepts</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <ClockIcon className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {getDuration()}
            </p>
            <p className="text-xs text-gray-500">Duration</p>
          </div>
        </div>

        {/* AI Summary Section */}
        {aiSummary ? (
          <div className="space-y-4">
            {/* Progress Badge */}
            <div className="flex items-center gap-2">
              <span className="text-lg">{progressLabels[aiSummary.overallProgress]?.emoji}</span>
              <span className={`font-medium ${progressLabels[aiSummary.overallProgress]?.color}`}>
                {progressLabels[aiSummary.overallProgress]?.label}
              </span>
            </div>

            {/* Summary */}
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {aiSummary.summary}
            </p>

            {/* Key Insights */}
            {aiSummary.keyInsights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Insights
                </h4>
                <ul className="space-y-1">
                  {aiSummary.keyInsights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Next Steps */}
            {aiSummary.suggestedNextSteps.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Suggested Next Steps
                </h4>
                <ul className="space-y-1">
                  {aiSummary.suggestedNextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-blue-500 mt-0.5">→</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Button
              onClick={generateSummary}
              disabled={isGeneratingSummary}
              variant="outline"
              className="w-full"
            >
              {isGeneratingSummary ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Generating Summary...
                </>
              ) : (
                <>
                  <span className="mr-2">✨</span>
                  Generate AI Summary
                </>
              )}
            </Button>
          </div>
        )}

        {/* Concepts Covered */}
        {concepts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Concepts Explored
            </h4>
            <div className="flex flex-wrap gap-2">
              {concepts.slice(0, 6).map((concept) => (
                <span
                  key={concept.id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                >
                  <BrainIcon className="w-3 h-3" />
                  {concept.name}
                </span>
              ))}
              {concepts.length > 6 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{concepts.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {onContinue && (
            <Button onClick={onContinue} className="w-full">
              Continue Learning
            </Button>
          )}
          <Link href="/dashboard/learn" className="w-full">
            <Button variant="outline" className="w-full">
              View All Concepts
            </Button>
          </Link>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="w-full">
              Back to Dashboard
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Clock Icon (inline since it's only used here)
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default SessionSummary;
