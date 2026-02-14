"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { authFetch } from "@/lib/api/authFetch";
import { PathCard, ProgressRing } from "@/components/learning";
import type { LearningPath, TopicScopeAnalysis, CalibrationPill } from "@/types";
import type { NarrowTopicSuggestion } from "@/lib/ai/narrowSuggest";

type PreflightStep = "idle" | "analyzing" | "narrow" | "loading_pills" | "pills" | "loading_pills_w2" | "pills_w2";

// Max recursive narrowing depth before we stop re-analyzing
const MAX_NARROW_DEPTH = 3;

export default function LearnPage() {
  const { user } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activePaths, setActivePaths] = useState<LearningPath[]>([]);
  const [pausedPaths, setPausedPaths] = useState<LearningPath[]>([]);
  const [suggestedPaths, setSuggestedPaths] = useState<LearningPath[]>([]);
  const [completedPaths, setCompletedPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // E18: Pre-flight scope narrowing (UI MVP)
  const [preflightStep, setPreflightStep] = useState<PreflightStep>("idle");
  const [preflightGoal, setPreflightGoal] = useState<string>("");
  const [originalGoal, setOriginalGoal] = useState<string>("");
  const [isOverview, setIsOverview] = useState(false);
  const [narrowSuggestions, setNarrowSuggestions] = useState<NarrowTopicSuggestion[]>([]);
  const [narrowDepth, setNarrowDepth] = useState(0);
  const [narrowHistory, setNarrowHistory] = useState<string[]>([]);
  const [calibrationPills, setCalibrationPills] = useState<CalibrationPill[]>([]);
  const [knownPills, setKnownPills] = useState<Set<string>>(new Set());
  const [somewhatPills, setSomewhatPills] = useState<Set<string>>(new Set());

  // E18-S4: Wave 2 targeted pills
  const [wave2Pills, setWave2Pills] = useState<CalibrationPill[]>([]);
  const [knownPillsW2, setKnownPillsW2] = useState<Set<string>>(new Set());
  const [somewhatPillsW2, setSomewhatPillsW2] = useState<Set<string>>(new Set());

  // Load paths on mount
  useEffect(() => {
    if (user) {
      loadPaths();
    }
  }, [user]);

  const loadPaths = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user) return;
      const response = await authFetch(user, "/api/paths");
      if (!response.ok) {
        throw new Error("Failed to load paths");
      }
      const data = await response.json();
      setPaths(data.paths || []);

      // Categorize paths
      const active = data.paths.filter((p: LearningPath) => p.status === "active");
      const paused = data.paths.filter((p: LearningPath) => p.status === "paused");
      const suggested = data.paths.filter((p: LearningPath) => p.status === "suggested");
      const completed = data.paths.filter((p: LearningPath) => p.status === "completed");

      setActivePaths(active);
      setPausedPaths(paused);
      setSuggestedPaths(suggested);
      setCompletedPaths(completed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load paths");
    } finally {
      setLoading(false);
    }
  };

  const resetPreflight = () => {
    setPreflightStep("idle");
    setPreflightGoal("");
    setOriginalGoal("");
    setIsOverview(false);
    setNarrowSuggestions([]);
    setNarrowDepth(0);
    setNarrowHistory([]);
    setCalibrationPills([]);
    setKnownPills(new Set());
    setSomewhatPills(new Set());
    setWave2Pills([]);
    setKnownPillsW2(new Set());
    setSomewhatPillsW2(new Set());
  };

  /**
   * Re-usable scope check: analyze a topic's broadness and either
   * show narrowing suggestions (if still too broad) or proceed to calibration pills.
   * Caps at MAX_NARROW_DEPTH to prevent infinite recursion.
   */
  const analyzeAndNarrowOrPills = async (goal: string, depth: number, history: string[]) => {
    if (!user) return;

    // If we've narrowed enough times, skip further analysis and go straight to pills
    if (depth >= MAX_NARROW_DEPTH) {
      setPreflightGoal(goal);
      await startPills(goal);
      return;
    }

    setPreflightStep("analyzing");
    setPreflightGoal(goal);
    setError(null);

    const scopeRes = await authFetch(user, "/api/paths/scope-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    });

    if (!scopeRes.ok) {
      throw new Error("Failed to analyze scope");
    }

    const scopeData = (await scopeRes.json()) as { analysis: TopicScopeAnalysis };

    if (scopeData.analysis.recommendedMode === "narrow") {
      const narrowRes = await authFetch(user, "/api/paths/narrow-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });

      if (!narrowRes.ok) {
        throw new Error("Failed to suggest narrower topics");
      }

      const narrowData = (await narrowRes.json()) as {
        suggestions: NarrowTopicSuggestion[];
      };

      setNarrowSuggestions(narrowData.suggestions || []);
      setNarrowDepth(depth + 1);
      setNarrowHistory([...history, goal]);
      setPreflightStep("narrow");
      return;
    }

    // Not broad: proceed to calibration pills
    await startPills(goal);
  };

  const generatePath = async (
    finalGoal: string,
    opts?: {
      declaredKnownConcepts?: string[];
      declaredFamiliarConcepts?: string[];
      skippedCalibration?: boolean;
      isOverview?: boolean;
      originalGoal?: string;
    }
  ) => {
    if (!finalGoal.trim()) {
      setError("Please enter a learning goal");
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      if (!user) return;
      const response = await authFetch(user, "/api/paths/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: finalGoal,
          ...(opts?.originalGoal ? { originalGoal: opts.originalGoal } : {}),
          ...(opts?.isOverview ? { isOverview: true } : {}),
          ...(opts?.skippedCalibration ? { skippedCalibration: true } : {}),
          ...(opts?.declaredKnownConcepts
            ? { declaredKnownConcepts: opts.declaredKnownConcepts }
            : {}),
          ...(opts?.declaredFamiliarConcepts
            ? { declaredFamiliarConcepts: opts.declaredFamiliarConcepts }
            : {}),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate path");
      }

      setGoalInput("");
      resetPreflight();
      await loadPaths(); // Reload to show new path
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate path");
    } finally {
      setGenerating(false);
    }
  };

  const startPills = async (goal: string) => {
    if (!user) return;
    setPreflightGoal(goal);
    setPreflightStep("loading_pills");
    setError(null);
    setCalibrationPills([]);
    setKnownPills(new Set());
    setSomewhatPills(new Set());

    const res = await authFetch(user, "/api/paths/calibration/wave-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    });

    if (!res.ok) {
      throw new Error("Failed to load calibration pills");
    }

    const data = (await res.json()) as { pills: CalibrationPill[] };
    setCalibrationPills(data.pills || []);
    setPreflightStep("pills");
  };

  const handleGeneratePath = async () => {
    if (!goalInput.trim()) {
      setError("Please enter a learning goal");
      return;
    }

    // Pre-flight: analyze scope and offer narrowing if needed
    try {
      if (!user) return;
      const goal = goalInput.trim();
      setOriginalGoal(goal);

      await analyzeAndNarrowOrPills(goal, 0, []);
    } catch (err) {
      resetPreflight();
      setError(err instanceof Error ? err.message : "Failed to generate path");
    }
  };

  const handleAcceptPath = async (pathId: string) => {
    try {
      if (!user) return;
      const response = await authFetch(user, `/api/paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept path");
      }

      await loadPaths();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept path");
    }
  };

  const handleAbandonPath = async (pathId: string) => {
    if (!window.confirm("Are you sure you want to abandon this path? Your progress will be saved but the path will be moved to abandoned.")) {
      return;
    }
    try {
      if (!user) return;
      const response = await authFetch(user, `/api/paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "abandon" }),
      });

      if (!response.ok) {
        throw new Error("Failed to abandon path");
      }

      await loadPaths();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to abandon path");
    }
  };

  const handlePausePath = async (pathId: string) => {
    try {
      if (!user) return;
      const response = await authFetch(user, `/api/paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });

      if (!response.ok) {
        throw new Error("Failed to pause path");
      }

      await loadPaths();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pause path");
    }
  };

  const handleResumePath = async (pathId: string) => {
    try {
      if (!user) return;
      const response = await authFetch(user, `/api/paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      });

      if (!response.ok) {
        throw new Error("Failed to resume path");
      }

      await loadPaths();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume path");
    }
  };

  const handleViewPath = (pathId: string) => {
    window.location.href = `/dashboard/learn/${pathId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Learning Paths</h1>
        <p className="text-gray-600 dark:text-gray-300">
          AI-guided learning paths personalized to your knowledge and goals
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Active Paths */}
      {activePaths.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Active Paths {activePaths.length > 1 && `(${activePaths.length})`}
          </h2>
          <div className="space-y-4">
            {activePaths.map((activePath) => (
              <div key={activePath.pathId} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-6 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                  <ProgressRing
                    progress={Math.round((activePath.progress || 0) * 100)}
                    size={140}
                    strokeWidth={10}
                  />
                  <div className="flex-1">
                    <PathCard
                      path={activePath}
                      onPause={handlePausePath}
                      onAbandon={handleAbandonPath}
                      onView={handleViewPath}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paused Paths */}
      {pausedPaths.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            ⏸ Paused Paths {pausedPaths.length > 1 && `(${pausedPaths.length})`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pausedPaths.map((path) => (
              <PathCard
                key={path.pathId}
                path={path}
                onResume={handleResumePath}
                onAbandon={handleAbandonPath}
                onView={handleViewPath}
              />
            ))}
          </div>
        </div>
      )}

      {/* Generate New Path */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Generate New Learning Path
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && goalInput.trim() && !generating && preflightStep !== "analyzing") {
                e.preventDefault();
                handleGeneratePath();
              }
            }}
            placeholder="What do you want to learn? (e.g., 'Master React hooks')"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={generating}
          />
          <button
            onClick={handleGeneratePath}
            disabled={generating || !goalInput.trim() || preflightStep === "analyzing"}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors sm:w-auto w-full"
          >
            {preflightStep === "analyzing" ? "Analyzing..." : generating ? "Generating..." : "Generate Path"}
          </button>
        </div>

        {preflightStep === "analyzing" && narrowDepth > 0 && (
          <div className="mt-4 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
            <div className="flex items-center gap-3 text-indigo-900 dark:text-indigo-300">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
              <span className="text-sm font-medium">Checking if &ldquo;{preflightGoal}&rdquo; needs further narrowing…</span>
            </div>
          </div>
        )}

        {preflightStep === "narrow" && (
          <div className="mt-4 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <div className="font-medium text-indigo-900 dark:text-indigo-300">
                  {narrowDepth > 1 ? "Still pretty broad — narrow further?" : "This topic is pretty broad."}
                </div>
                <div className="text-sm text-indigo-800 dark:text-indigo-400">
                  Pick a narrower starting path, or keep it high-level.
                </div>
              </div>
              <button
                onClick={() => {
                  // Keep high-level overview
                  const goal = preflightGoal || goalInput.trim();
                  setIsOverview(true);
                  void (async () => {
                    try {
                      await startPills(goal);
                    } catch (err) {
                      resetPreflight();
                      setError(err instanceof Error ? err.message : "Failed to start calibration");
                    }
                  })();
                }}
                className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 text-indigo-900 dark:text-indigo-300 text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                disabled={generating}
              >
                Keep high-level overview
              </button>
            </div>

            {/* Breadcrumb trail showing narrowing history */}
            {narrowHistory.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-1 text-xs text-indigo-700 dark:text-indigo-400">
                {narrowHistory.map((topic, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="max-w-[200px] truncate" title={topic}>{topic}</span>
                    <span>→</span>
                  </span>
                ))}
                <span className="font-medium max-w-[200px] truncate" title={preflightGoal}>{preflightGoal}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(narrowSuggestions || []).map((s) => (
                <button
                  key={`${s.order}-${s.title}`}
                  onClick={() => {
                    void (async () => {
                      try {
                        // Re-analyze the selected suggestion for broadness
                        await analyzeAndNarrowOrPills(s.title, narrowDepth, narrowHistory);
                      } catch (err) {
                        resetPreflight();
                        setError(err instanceof Error ? err.message : "Failed to analyze topic");
                      }
                    })();
                  }}
                  className="text-left p-3 rounded-lg bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                  disabled={generating}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{s.order}. {s.title}</div>
                  {s.description && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{s.description}</div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-3 flex justify-between">
              {narrowHistory.length > 0 ? (
                <button
                  onClick={() => {
                    // Go back to previous narrowing level
                    const prevHistory = [...narrowHistory];
                    const prevGoal = prevHistory.pop()!;
                    void (async () => {
                      try {
                        setNarrowDepth(prevHistory.length + 1);
                        setNarrowHistory(prevHistory);
                        await analyzeAndNarrowOrPills(prevGoal, prevHistory.length, prevHistory);
                      } catch (err) {
                        resetPreflight();
                        setError(err instanceof Error ? err.message : "Failed to go back");
                      }
                    })();
                  }}
                  className="px-3 py-2 rounded-md text-sm text-indigo-900 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex items-center gap-1"
                  disabled={generating}
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={resetPreflight}
                className="px-3 py-2 rounded-md text-sm text-indigo-900 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {(preflightStep === "loading_pills" || preflightStep === "pills") && (
          <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <div className="font-medium text-gray-900">Quick calibration</div>
                <div className="text-sm text-gray-700">
                  Tap what you already know (optional). Click again to mark as “somewhat”.
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const goal = preflightGoal || goalInput.trim();
                    const overview = isOverview;
                    const origGoal = originalGoal;
                    resetPreflight();
                    void generatePath(goal, {
                      skippedCalibration: true,
                      isOverview: overview || undefined,
                      originalGoal: origGoal || undefined,
                    });
                  }}
                  className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-900 text-sm hover:bg-gray-100"
                  disabled={generating}
                >
                  Skip — just build
                </button>
                <button
                  onClick={resetPreflight}
                  className="px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                  disabled={generating}
                >
                  Cancel
                </button>
              </div>
            </div>

            {preflightStep === "loading_pills" ? (
              <div className="text-sm text-gray-700">Loading concepts…</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {calibrationPills.map((p) => {
                    const isKnown = knownPills.has(p.concept);
                    const isSomewhat = somewhatPills.has(p.concept);
                    const selected = isKnown || isSomewhat;

                    const base =
                      "px-3 py-1.5 rounded-full border text-sm transition-colors";
                    const style = selected
                      ? isSomewhat
                        ? "bg-yellow-50 border-yellow-300 text-yellow-900 hover:bg-yellow-100"
                        : "bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100"
                      : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100";

                    return (
                      <button
                        key={p.concept}
                        type="button"
                        onClick={() => {
                          if (isKnown) {
                            // second click: move to Somewhat
                            setKnownPills((prev) => {
                              const next = new Set(prev);
                              next.delete(p.concept);
                              return next;
                            });
                            setSomewhatPills((prev) => {
                              const next = new Set(prev);
                              next.add(p.concept);
                              return next;
                            });
                          } else if (isSomewhat) {
                            // third click: clear
                            setSomewhatPills((prev) => {
                              const next = new Set(prev);
                              next.delete(p.concept);
                              return next;
                            });
                          } else {
                            // first click: mark Known
                            setKnownPills((prev) => {
                              const next = new Set(prev);
                              next.add(p.concept);
                              return next;
                            });
                          }
                        }}
                        className={`${base} ${style}`}
                        title={p.reason || undefined}
                      >
                        {p.concept}{isSomewhat ? " ~" : ""}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      const goal = preflightGoal || goalInput.trim();
                      const declaredKnownConcepts = Array.from(knownPills);
                      const declaredFamiliarConcepts = Array.from(somewhatPills);

                      // E18-S6: Persist pill selections to global knowledge profile
                      if (user && (declaredKnownConcepts.length || declaredFamiliarConcepts.length)) {
                        const entries = [
                          ...declaredKnownConcepts.map((c) => ({ concept: c, confidence: 1.0 })),
                          ...declaredFamiliarConcepts.map((c) => ({ concept: c, confidence: 0.5 })),
                        ];
                        void authFetch(user, "/api/profile/knowledge", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ entries }),
                        }).catch((err) =>
                          console.error("Failed to persist knowledge profile:", err)
                        );
                      }

                      // E18-S4: Check if Wave 2 is needed
                      void (async () => {
                        try {
                          if (!user) return;
                          setPreflightStep("loading_pills_w2");

                          const w2Res = await authFetch(user, "/api/paths/calibration/wave-2", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              goal,
                              wave1Pills: calibrationPills,
                              knownConcepts: declaredKnownConcepts,
                              familiarConcepts: declaredFamiliarConcepts,
                            }),
                          });

                          if (!w2Res.ok) {
                            throw new Error("Failed to check wave 2");
                          }

                          const w2Data = (await w2Res.json()) as {
                            needed: boolean;
                            pills: CalibrationPill[];
                            reason: string;
                          };

                          if (w2Data.needed && w2Data.pills.length > 0) {
                            setWave2Pills(w2Data.pills);
                            setKnownPillsW2(new Set());
                            setSomewhatPillsW2(new Set());
                            setPreflightStep("pills_w2");
                            return;
                          }

                          // No wave 2 needed — go straight to generate
                          const overview = isOverview;
                          const origGoal = originalGoal;
                          resetPreflight();
                          void generatePath(goal, {
                            declaredKnownConcepts,
                            declaredFamiliarConcepts,
                            isOverview: overview || undefined,
                            originalGoal: origGoal || undefined,
                          });
                        } catch {
                          // Wave 2 check failed — proceed to generate anyway
                          const overview = isOverview;
                          const origGoal = originalGoal;
                          resetPreflight();
                          void generatePath(goal, {
                            declaredKnownConcepts,
                            declaredFamiliarConcepts,
                            isOverview: overview || undefined,
                            originalGoal: origGoal || undefined,
                          });
                        }
                      })();
                    }}
                    className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300"
                    disabled={generating}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* E18-S4: Wave 2 targeted calibration pills */}
        {(preflightStep === "loading_pills_w2" || preflightStep === "pills_w2") && (
          <div className="mt-4 p-4 rounded-lg border border-amber-200 bg-amber-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <div className="font-medium text-amber-900">Quick follow-up</div>
                <div className="text-sm text-amber-800">
                  A few more concepts to pin down your starting level.
                </div>
              </div>
              <button
                onClick={() => {
                  // Skip Wave 2 — generate with Wave 1 data only
                  const goal = preflightGoal || goalInput.trim();
                  const declaredKnownConcepts = Array.from(knownPills);
                  const declaredFamiliarConcepts = Array.from(somewhatPills);
                  const overview = isOverview;
                  const origGoal = originalGoal;
                  resetPreflight();
                  void generatePath(goal, {
                    declaredKnownConcepts,
                    declaredFamiliarConcepts,
                    isOverview: overview || undefined,
                    originalGoal: origGoal || undefined,
                  });
                }}
                className="px-3 py-2 rounded-md bg-white border border-amber-300 text-amber-900 text-sm hover:bg-amber-100"
                disabled={generating}
              >
                Skip — just build
              </button>
            </div>

            {preflightStep === "loading_pills_w2" ? (
              <div className="text-sm text-amber-800">Checking for gaps…</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {wave2Pills.map((p) => {
                    const isKnown = knownPillsW2.has(p.concept);
                    const isSomewhat = somewhatPillsW2.has(p.concept);
                    const selected = isKnown || isSomewhat;

                    const base =
                      "px-3 py-1.5 rounded-full border text-sm transition-colors";
                    const style = selected
                      ? isSomewhat
                        ? "bg-yellow-50 border-yellow-300 text-yellow-900 hover:bg-yellow-100"
                        : "bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100"
                      : "bg-white border-amber-200 text-gray-900 hover:bg-amber-100";

                    return (
                      <button
                        key={p.concept}
                        type="button"
                        onClick={() => {
                          if (isKnown) {
                            setKnownPillsW2((prev) => {
                              const next = new Set(prev);
                              next.delete(p.concept);
                              return next;
                            });
                            setSomewhatPillsW2((prev) => {
                              const next = new Set(prev);
                              next.add(p.concept);
                              return next;
                            });
                          } else if (isSomewhat) {
                            setSomewhatPillsW2((prev) => {
                              const next = new Set(prev);
                              next.delete(p.concept);
                              return next;
                            });
                          } else {
                            setKnownPillsW2((prev) => {
                              const next = new Set(prev);
                              next.add(p.concept);
                              return next;
                            });
                          }
                        }}
                        className={`${base} ${style}`}
                        title={p.reason || undefined}
                      >
                        {p.concept}{isSomewhat ? " ~" : ""}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      const goal = preflightGoal || goalInput.trim();
                      // Merge Wave 1 + Wave 2 selections
                      const allKnown = [
                        ...Array.from(knownPills),
                        ...Array.from(knownPillsW2),
                      ];
                      const allFamiliar = [
                        ...Array.from(somewhatPills),
                        ...Array.from(somewhatPillsW2),
                      ];
                      const overview = isOverview;
                      const origGoal = originalGoal;

                      // E18-S6: Persist Wave 2 pill selections too
                      if (user && (knownPillsW2.size || somewhatPillsW2.size)) {
                        const entries = [
                          ...Array.from(knownPillsW2).map((c) => ({ concept: c, confidence: 1.0 })),
                          ...Array.from(somewhatPillsW2).map((c) => ({ concept: c, confidence: 0.5 })),
                        ];
                        void authFetch(user, "/api/profile/knowledge", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ entries }),
                        }).catch((err) =>
                          console.error("Failed to persist knowledge profile:", err)
                        );
                      }

                      resetPreflight();
                      void generatePath(goal, {
                        declaredKnownConcepts: allKnown,
                        declaredFamiliarConcepts: allFamiliar,
                        isOverview: overview || undefined,
                        originalGoal: origGoal || undefined,
                      });
                    }}
                    className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300"
                    disabled={generating}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Suggested Paths */}
      {suggestedPaths.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Suggested Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestedPaths.map((path) => (
              <PathCard
                key={path.pathId}
                path={path}
                onAccept={handleAcceptPath}
                onView={handleViewPath}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Paths */}
      {completedPaths.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Completed Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedPaths.map((path) => (
              <PathCard key={path.pathId} path={path} onView={handleViewPath} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {activePaths.length === 0 && pausedPaths.length === 0 && suggestedPaths.length === 0 && completedPaths.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No learning paths yet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Generate your first AI-guided learning path to get started
          </p>
        </div>
      )}
    </div>
  );
}
