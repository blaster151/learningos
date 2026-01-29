/**
 * Tests for useReflection hook - FIXED VERSION
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { useReflection } from "@/lib/hooks/useReflection";
import type { ReflectionAnalysis } from "@/types";

// Mock fetch
global.fetch = vi.fn();

// Define the GeneratedPrompt type locally to match hook
interface GeneratedPrompt {
  promptId: string;
  sessionId: string;
  promptText: string;
  hints: string[];
  conceptsToAddress: string[];
  minWords: number;
  maxWords: number;
}

describe("useReflection", () => {
  const mockUserId = "user-123";
  const mockSessionId = "session-456";

  const mockPrompt: GeneratedPrompt = {
    promptId: "prompt-123",
    sessionId: mockSessionId,
    promptText: "Explain React Hooks",
    hints: ["Consider useState"],
    conceptsToAddress: ["concept-1"],
    minWords: 50,
    maxWords: 200,
  };

  const mockAnalysis: ReflectionAnalysis = {
    reflectionId: "reflection-123",
    overallScore: 85,
    strengths: ["Clear explanation"],
    suggestions: ["Add examples"],
    misconceptions: [],
    conceptUpdates: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() => useReflection({ userId: mockUserId, sessionId: mockSessionId }));

    expect(result.current.shouldReflect).toBe(false);
    expect(result.current.prompt).toBeNull();
    expect(result.current.promptLoading).toBe(false);
    expect(result.current.submitting).toBe(false);
    expect(result.current.analysis).toBeNull();
    expect(result.current.recentReflections).toEqual([]);
  });

  it("checks for reflection prompt", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ shouldReflect: true, prompt: mockPrompt }),
    });

    const { result } = renderHook(() => useReflection({ userId: mockUserId, sessionId: mockSessionId }));

    await act(async () => {
      await result.current.checkForReflection();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/reflect/prompt")
    );
    expect(result.current.shouldReflect).toBe(true);
    expect(result.current.prompt).toEqual(mockPrompt);
  });

  it("handles no available prompt", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ shouldReflect: false, prompt: null }),
    });

    const { result } = renderHook(() => useReflection({ userId: mockUserId, sessionId: mockSessionId }));

    await act(async () => {
      await result.current.checkForReflection();
    });

    expect(result.current.shouldReflect).toBe(false);
    expect(result.current.prompt).toBeNull();
  });

  it("submits reflection and receives analysis", async () => {
    // First check for prompt
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shouldReflect: true, prompt: mockPrompt }),
    });

    const { result } = renderHook(() => useReflection({ userId: mockUserId, sessionId: mockSessionId }));

    await act(async () => {
      await result.current.checkForReflection();
    });

    // Now mock the submit response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, analysis: mockAnalysis }),
    });

    const reflectionText = "React Hooks are functions that...";

    await act(async () => {
      const analysis = await result.current.submitReflection(reflectionText);
      expect(analysis).toEqual(mockAnalysis);
    });

    expect(result.current.analysis).toEqual(mockAnalysis);
    expect(result.current.shouldReflect).toBe(false);
    expect(result.current.prompt).toBeNull();
  });

  it("sets submitting state during submission", async () => {
    // First set up the prompt
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shouldReflect: true, prompt: mockPrompt }),
    });

    const { result } = renderHook(() => useReflection({ userId: mockUserId, sessionId: mockSessionId }));

    await act(async () => {
      await result.current.checkForReflection();
    });

    let resolveSubmit: any;
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });

    (global.fetch as any).mockReturnValue(
      submitPromise.then(() => ({
        ok: true,
        json: async () => ({ success: true, analysis: mockAnalysis }),
      }))
    );

    const submitPromiseRef = result.current.submitReflection("Test reflection");

    await waitFor(() => {
      expect(result.current.submitting).toBe(true);
    });

    await act(async () => {
      resolveSubmit();
      await submitPromise;
      await submitPromiseRef;
    });

    expect(result.current.submitting).toBe(false);
  });

  it("skips reflection and dismisses prompt", async () => {
    // First set up the prompt
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shouldReflect: true, prompt: mockPrompt }),
    });

    const { result } = renderHook(() => useReflection({ userId: mockUserId, sessionId: mockSessionId }));

    await act(async () => {
      await result.current.checkForReflection();
    });

    // Now mock the dismiss call
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      await result.current.skipReflection();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/reflect/dismiss"),
      expect.any(Object)
    );
    expect(result.current.shouldReflect).toBe(false);
    expect(result.current.prompt).toBeNull();
  });

  it("loads reflection history", async () => {
    const mockHistory = [
      {
        reflectionId: "r1",
        overallScore: 80,
        conceptCount: 2,
        createdAt: "2024-01-01",
      },
      {
        reflectionId: "r2",
        overallScore: 90,
        conceptCount: 3,
        createdAt: "2024-01-02",
      },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ reflections: mockHistory }),
    });

    const { result } = renderHook(() => useReflection({ userId: mockUserId, sessionId: mockSessionId }));

    await act(async () => {
      await result.current.loadHistory();
    });

    expect(result.current.recentReflections).toEqual(mockHistory);
    expect(result.current.historyLoading).toBe(false);
  });

  it("handles submission errors", async () => {
    // First set up the prompt
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shouldReflect: true, prompt: mockPrompt }),
    });

    const { result } = renderHook(() => useReflection({ userId: mockUserId, sessionId: mockSessionId }));

    await act(async () => {
      await result.current.checkForReflection();
    });

    // Now mock submission error
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    await act(async () => {
      const analysis = await result.current.submitReflection("Test");
      expect(analysis).toBeNull();
    });

    expect(result.current.submitting).toBe(false);
    expect(result.current.submitError).toBeTruthy();
  });

  it("handles API error responses", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useReflection({ userId: mockUserId, sessionId: mockSessionId }));

    await act(async () => {
      await result.current.checkForReflection();
    });

    expect(result.current.promptError).toBeTruthy();
  });
});
