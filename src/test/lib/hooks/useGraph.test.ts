/**
 * Tests for useGraph hook - FIXED VERSION
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { useGraph } from "@/lib/hooks/useGraph";
import type { GraphData, GraphFilters } from "@/types";

// Mock fetch
global.fetch = vi.fn();

describe("useGraph", () => {
  const mockGraphData: GraphData = {
    nodes: [
      {
        id: "concept-1",
        name: "JavaScript",
        displayName: "JavaScript",
        mastery: 0.7,
        domain: "Programming",
        size: 10,
        color: "#10b981",
        conceptCount: 5,
      },
    ],
    links: [],
  };

  const mockResponse = {
    graph: mockGraphData,
    availableDomains: ["Programming", "Frontend"],
    stats: {
      totalConcepts: 10,
      averageMastery: 0.65,
      domainCount: 2,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() => useGraph({ userId: "user-123" }));

    expect(result.current.graphData).toBeNull();
    expect(result.current.filters).toEqual({
      domains: [],
      masteryLevels: [],
      searchQuery: "",
    });
    expect(result.current.availableDomains).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("fetches graph data on mount", async () => {
    const { result } = renderHook(() => useGraph({ userId: "user-123" }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalled();
    expect(result.current.graphData).toEqual(mockGraphData);
    expect(result.current.availableDomains).toEqual(["Programming", "Frontend"]);
  });

  it("updates filters", async () => {
    const { result } = renderHook(() => useGraph({ userId: "user-123" }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newFilters: GraphFilters = {
      domains: ["Programming"],
      masteryLevels: ["practicing"],
      searchQuery: "React",
    };

    act(() => {
      result.current.setFilters(newFilters);
    });

    expect(result.current.filters).toEqual(newFilters);
  });

  it("refetches data when filters change", async () => {
    const { result } = renderHook(() => useGraph({ userId: "user-123" }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = (global.fetch as any).mock.calls.length;

    act(() => {
      result.current.setFilters({
        domains: ["Programming"],
        masteryLevels: [],
        searchQuery: "",
      });
    });

    await waitFor(() => {
      expect((global.fetch as any).mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it("handles fetch errors", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useGraph({ userId: "user-123" }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.graphData).toBeNull();
  });

  it("handles API error responses", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    });

    const { result } = renderHook(() => useGraph({ userId: "user-123" }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it("sets loading state during fetch", async () => {
    const { result } = renderHook(() => useGraph({ userId: "user-123" }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("provides stats from API response", async () => {
    const { result } = renderHook(() => useGraph({ userId: "user-123" }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual({
      totalConcepts: 10,
      averageMastery: 0.65,
      domainCount: 2,
    });
  });

  it("clears error on successful refetch", async () => {
    // First call fails
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useGraph({ userId: "user-123" }));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Second call succeeds
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    act(() => {
      result.current.setFilters({ domains: [], masteryLevels: [], searchQuery: "" });
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});
