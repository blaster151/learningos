/**
 * Tests for graphData Firebase service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { graphDataService } from "@/lib/firebase/graphData";
import type { GraphFilters } from "@/types";

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => ({
  getAdminDb: vi.fn(),
}));

// Mock transformGraphData to return a simple structure
vi.mock("@/lib/graph/transformGraphData", () => ({
  transformGraphData: vi.fn((concepts, relations) => ({
    nodes: concepts.map((c: any) => ({
      id: c.conceptId,
      name: c.name,
      domain: c.domain,
      masteryLevel: c.masteryLevel,
    })),
    links: relations.map((r: any) => ({
      source: r.sourceConceptId,
      target: r.targetConceptId,
      type: r.relationType,
    })),
  })),
}));

const { getAdminDb } = await import("@/lib/firebase/admin");

describe("GraphData Firebase Service", () => {
  let mockDb: any;
  let mockCollection: any;
  let mockQuery: any;
  let mockDoc: any;

  beforeEach(() => {
    mockDoc = {
      get: vi.fn(),
    };

    mockQuery = {
      where: vi.fn().mockReturnThis(),
      get: vi.fn(),
    };

    mockCollection = {
      where: vi.fn(() => mockQuery),
      doc: vi.fn(() => mockDoc),
      get: vi.fn(),
    };

    mockDb = {
      collection: vi.fn(() => mockCollection),
    };

    (getAdminDb as any).mockResolvedValue(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserGraph", () => {
    it("fetches user concepts and relations", async () => {
      const mockConcepts = [
        {
          id: "concept-1",
          data: () => ({
            name: "JavaScript",
            domain: "Programming",
            masteryLevel: "practicing",
            userId: "user-123",
          }),
        },
        {
          id: "concept-2",
          data: () => ({
            name: "React",
            domain: "Frontend",
            masteryLevel: "learning",
            userId: "user-123",
          }),
        },
      ];

      const mockRelations = [
        {
          id: "rel-1",
          data: () => ({
            sourceConceptId: "concept-1",
            targetConceptId: "concept-2",
            relationType: "prerequisite",
            strength: 0.8,
          }),
        },
      ];

      mockQuery.get
        .mockResolvedValueOnce({ docs: mockConcepts })
        .mockResolvedValueOnce({ docs: mockRelations });

      const graphData = await graphDataService.getUserGraph("user-123");

      expect(mockDb.collection).toHaveBeenCalledWith("concepts");
      expect(mockCollection.where).toHaveBeenCalledWith("userId", "==", "user-123");
      expect(graphData.nodes).toHaveLength(2);
      expect(graphData.links).toHaveLength(1);
    });

    it("applies domain filters", async () => {
      const mockConcepts = [
        {
          id: "concept-1",
          data: () => ({
            name: "JavaScript",
            domain: "Programming",
            masteryLevel: "practicing",
          }),
        },
      ];

      mockQuery.get
        .mockResolvedValueOnce({ docs: mockConcepts })
        .mockResolvedValueOnce({ docs: [] });

      const filters = {
        domains: ["Programming"],
        masteryLevels: [],
        searchQuery: "",
      };

      await graphDataService.getUserGraph("user-123", filters);

      // Should have called where with domain filter
      expect(mockQuery.where).toHaveBeenCalledWith("domain", "in", ["Programming"]);
    });

    it("applies mastery level filters", async () => {
      const mockConcepts = [
        {
          id: "concept-1",
          data: () => ({
            name: "JavaScript",
            domain: "Programming",
            masteryLevel: "practicing",
          }),
        },
      ];

      mockQuery.get
        .mockResolvedValueOnce({ docs: mockConcepts })
        .mockResolvedValueOnce({ docs: [] });

      const filters: GraphFilters = {
        domains: [],
        masteryLevels: ["practicing"],
        searchQuery: "",
      };

      await graphDataService.getUserGraph("user-123", filters);

      // Should have called where with masteryLevel filter
      expect(mockQuery.where).toHaveBeenCalledWith("masteryLevel", "in", ["practicing"]);
    });

    it("applies search query filter", async () => {
      const mockConcepts = [
        {
          id: "concept-1",
          data: () => ({
            name: "JavaScript",
            domain: "Programming",
            definition: "A programming language",
          }),
        },
        {
          id: "concept-2",
          data: () => ({
            name: "React",
            domain: "Frontend",
            definition: "A UI library",
          }),
        },
      ];

      mockQuery.get
        .mockResolvedValueOnce({ docs: mockConcepts })
        .mockResolvedValueOnce({ docs: [] });

      const filters = {
        domains: [],
        masteryLevels: [],
        searchQuery: "react",
      };

      const graphData = await graphDataService.getUserGraph("user-123", filters);

      // Should filter in memory to only include React
      expect(graphData.nodes.some((n: any) => n.name === "React")).toBe(true);
      expect(graphData.nodes.some((n: any) => n.name === "JavaScript")).toBe(false);
    });

    it("handles empty results", async () => {
      mockQuery.get
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] });

      const graphData = await graphDataService.getUserGraph("user-123");

      expect(graphData.nodes).toEqual([]);
      expect(graphData.links).toEqual([]);
    });
  });

  describe("getAvailableDomains", () => {
    it("returns unique domains from user concepts sorted alphabetically", async () => {
      const mockConcepts = [
        { data: () => ({ domain: "Programming" }) },
        { data: () => ({ domain: "Frontend" }) },
        { data: () => ({ domain: "Programming" }) }, // Duplicate
        { data: () => ({ domain: "Backend" }) },
      ];

      mockQuery.get.mockResolvedValue({ docs: mockConcepts });

      const domains = await graphDataService.getAvailableDomains("user-123");

      // Sorted alphabetically
      expect(domains).toEqual(["Backend", "Frontend", "Programming"]);
      expect(domains).toHaveLength(3); // No duplicates
    });

    it("handles no concepts", async () => {
      mockQuery.get.mockResolvedValue({ docs: [] });

      const domains = await graphDataService.getAvailableDomains("user-123");

      expect(domains).toEqual([]);
    });

    it("filters out undefined domains", async () => {
      const mockConcepts = [
        { data: () => ({ domain: "Programming" }) },
        { data: () => ({}) }, // No domain field
        { data: () => ({ domain: null }) }, // Null domain
      ];

      mockQuery.get.mockResolvedValue({ docs: mockConcepts });

      const domains = await graphDataService.getAvailableDomains("user-123");

      expect(domains).toEqual(["Programming"]);
    });
  });

  describe("getGraphStats", () => {
    it("calculates graph statistics", async () => {
      const mockConcepts = [
        { data: () => ({ masteryLevel: "practicing", domain: "Programming" }) },
        { data: () => ({ masteryLevel: "learning", domain: "Frontend" }) },
        { data: () => ({ masteryLevel: "expert", domain: "Programming" }) },
      ];

      const mockRelations = [
        { data: () => ({}) },
        { data: () => ({}) },
      ];

      mockQuery.get
        .mockResolvedValueOnce({ docs: mockConcepts, size: 3 })
        .mockResolvedValueOnce({ docs: mockRelations, size: 2 });

      const stats = await graphDataService.getGraphStats("user-123");

      expect(stats.totalConcepts).toBe(3);
      expect(stats.totalRelations).toBe(2);
      expect(stats.domainCounts).toEqual({ Programming: 2, Frontend: 1 });
      expect(stats.masteryDistribution.practicing).toBe(1);
      expect(stats.masteryDistribution.learning).toBe(1);
      expect(stats.masteryDistribution.expert).toBe(1);
    });

    it("handles no concepts", async () => {
      mockQuery.get
        .mockResolvedValueOnce({ docs: [], size: 0 })
        .mockResolvedValueOnce({ docs: [], size: 0 });

      const stats = await graphDataService.getGraphStats("user-123");

      expect(stats.totalConcepts).toBe(0);
      expect(stats.totalRelations).toBe(0);
    });
  });

  describe("getConceptNeighborhood", () => {
    it("fetches related concepts for a given concept", async () => {
      // Mock the main concept
      mockDoc.get.mockResolvedValueOnce({
        exists: true,
        id: "concept-1",
        data: () => ({ name: "JavaScript", domain: "Programming" }),
      });

      // Mock outgoing relations
      const outgoingRelations = [
        {
          id: "rel-1",
          data: () => ({
            sourceConceptId: "concept-1",
            targetConceptId: "concept-2",
            relationType: "prerequisite",
          }),
        },
      ];

      // Mock incoming relations
      const incomingRelations = [
        {
          id: "rel-2",
          data: () => ({
            sourceConceptId: "concept-3",
            targetConceptId: "concept-1",
            relationType: "related",
          }),
        },
      ];

      mockQuery.get
        .mockResolvedValueOnce({ docs: outgoingRelations })
        .mockResolvedValueOnce({ docs: incomingRelations });

      // Mock neighbor concepts
      mockDoc.get
        .mockResolvedValueOnce({
          exists: true,
          id: "concept-2",
          data: () => ({ name: "React", domain: "Frontend" }),
        })
        .mockResolvedValueOnce({
          exists: true,
          id: "concept-3",
          data: () => ({ name: "TypeScript", domain: "Programming" }),
        });

      const neighborhood = await graphDataService.getConceptNeighborhood("user-123", "concept-1");

      // Should have 3 nodes: concept-1, concept-2, concept-3
      expect(neighborhood.nodes).toHaveLength(3);
      // Should have 2 relations
      expect(neighborhood.links).toHaveLength(2);
    });

    it("handles concept with no relations", async () => {
      mockDoc.get.mockResolvedValueOnce({
        exists: true,
        id: "concept-1",
        data: () => ({ name: "JavaScript", domain: "Programming" }),
      });

      mockQuery.get
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] });

      const neighborhood = await graphDataService.getConceptNeighborhood("user-123", "concept-1");

      // Should have just the original concept
      expect(neighborhood.nodes).toHaveLength(1);
      expect(neighborhood.links).toEqual([]);
    });

    it("returns empty graph for non-existent concept", async () => {
      mockDoc.get.mockResolvedValueOnce({
        exists: false,
      });

      const neighborhood = await graphDataService.getConceptNeighborhood("user-123", "nonexistent");

      expect(neighborhood.nodes).toEqual([]);
      expect(neighborhood.links).toEqual([]);
    });
  });
});
