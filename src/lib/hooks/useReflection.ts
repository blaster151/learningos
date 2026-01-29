"use client";

import { useState, useCallback, useEffect } from "react";
import type { ReflectionAnalysis } from "@/types";

interface GeneratedPrompt {
  promptId: string;
  sessionId: string;
  promptText: string;
  hints: string[];
  conceptsToAddress: string[];
  minWords: number;
  maxWords: number;
}

interface UseReflectionOptions {
  userId: string;
  sessionId?: string;
  autoCheck?: boolean; // Auto-check if reflection should be triggered
}

interface UseReflectionReturn {
  // Prompt state
  shouldReflect: boolean;
  prompt: GeneratedPrompt | null;
  promptLoading: boolean;
  promptError: string | null;
  checkForReflection: () => Promise<void>;
  
  // Submission state
  submitting: boolean;
  submitError: string | null;
  submitReflection: (content: string) => Promise<ReflectionAnalysis | null>;
  skipReflection: () => Promise<void>;
  
  // Analysis state
  analysis: ReflectionAnalysis | null;
  
  // History
  recentReflections: Array<{
    reflectionId: string;
    overallScore: number;
    conceptCount: number;
    createdAt: string;
  }>;
  historyLoading: boolean;
  loadHistory: () => Promise<void>;
}

/**
 * Hook for managing reflection prompts, submissions, and analysis
 */
export function useReflection({
  userId,
  sessionId,
  autoCheck = false,
}: UseReflectionOptions): UseReflectionReturn {
  const [shouldReflect, setShouldReflect] = useState(false);
  const [prompt, setPrompt] = useState<GeneratedPrompt | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ReflectionAnalysis | null>(null);

  const [recentReflections, setRecentReflections] = useState<
    UseReflectionReturn["recentReflections"]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  /**
   * Check if reflection should be triggered
   */
  const checkForReflection = useCallback(async () => {
    if (!userId || !sessionId) return;

    setPromptLoading(true);
    setPromptError(null);

    try {
      const params = new URLSearchParams({ userId, sessionId });
      const response = await fetch(`/api/reflect/prompt?${params}`);

      if (!response.ok) {
        throw new Error("Failed to check for reflection");
      }

      const data = await response.json();

      if (data.shouldReflect && data.prompt) {
        setShouldReflect(true);
        setPrompt(data.prompt);
      } else {
        setShouldReflect(false);
        setPrompt(null);
      }
    } catch (err) {
      setPromptError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPromptLoading(false);
    }
  }, [userId, sessionId]);

  /**
   * Submit reflection for analysis
   */
  const submitReflection = useCallback(
    async (content: string): Promise<ReflectionAnalysis | null> => {
      if (!userId || !prompt) return null;

      setSubmitting(true);
      setSubmitError(null);

      try {
        const response = await fetch("/api/reflect/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            promptId: prompt.promptId,
            reflectionContent: content,
            sessionId: prompt.sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit reflection");
        }

        const data = await response.json();

        if (data.success && data.analysis) {
          setAnalysis(data.analysis);
          setShouldReflect(false);
          setPrompt(null);
          return data.analysis;
        }

        throw new Error(data.error || "Failed to analyze reflection");
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "An error occurred");
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [userId, prompt]
  );

  /**
   * Skip the current reflection
   */
  const skipReflection = useCallback(async () => {
    if (!userId || !sessionId) return;

    try {
      // Record dismissal for cooldown tracking
      await fetch("/api/reflect/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionId }),
      });

      setShouldReflect(false);
      setPrompt(null);
    } catch (err) {
      console.error("Failed to record dismissal:", err);
      // Still dismiss on client side
      setShouldReflect(false);
      setPrompt(null);
    }
  }, [userId, sessionId]);

  /**
   * Load reflection history
   */
  const loadHistory = useCallback(async () => {
    if (!userId) return;

    setHistoryLoading(true);

    try {
      const params = new URLSearchParams({ userId, limit: "10" });
      const response = await fetch(`/api/reflect/submit?${params}`);

      if (!response.ok) {
        throw new Error("Failed to load reflection history");
      }

      const data = await response.json();
      setRecentReflections(data.reflections || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  // Auto-check for reflection on mount if enabled
  useEffect(() => {
    if (autoCheck && sessionId) {
      checkForReflection();
    }
  }, [autoCheck, sessionId, checkForReflection]);

  return {
    shouldReflect,
    prompt,
    promptLoading,
    promptError,
    checkForReflection,
    submitting,
    submitError,
    submitReflection,
    skipReflection,
    analysis,
    recentReflections,
    historyLoading,
    loadHistory,
  };
}
