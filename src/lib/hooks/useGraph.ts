"use client";

import { useState, useEffect, useCallback } from "react";
import type { GraphData, GraphFilters } from "@/types";

interface UseGraphOptions {
  userId: string;
  initialFilters?: GraphFilters;
}

interface UseGraphReturn {
  graphData: GraphData | null;
  filters: GraphFilters;
  setFilters: (filters: GraphFilters) => void;
  availableDomains: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: {
    totalConcepts: number;
    totalRelations: number;
    domainCounts: Record<string, number>;
    masteryDistribution: Record<string, number>;
  } | null;
}

/**
 * Hook for managing graph data and filters
 */
export function useGraph({
  userId,
  initialFilters,
}: UseGraphOptions): UseGraphReturn {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [filters, setFilters] = useState<GraphFilters>(
    initialFilters || {
      domains: [],
      masteryLevels: [],
      searchQuery: "",
    }
  );
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UseGraphReturn["stats"]>(null);

  const fetchGraphData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch graph data with filters
      const params = new URLSearchParams({ userId });
      
      if (filters.domains.length > 0) {
        params.append("domains", filters.domains.join(","));
      }
      
      if (filters.masteryLevels.length > 0) {
        params.append("masteryLevels", filters.masteryLevels.join(","));
      }
      
      if (filters.searchQuery) {
        params.append("search", filters.searchQuery);
      }

      const response = await fetch(`/api/graph?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch graph data");
      }

      const data = await response.json();
      setGraphData(data.graph);
      setAvailableDomains(data.availableDomains || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setGraphData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, filters]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  return {
    graphData,
    filters,
    setFilters,
    availableDomains,
    loading,
    error,
    refetch: fetchGraphData,
    stats,
  };
}
