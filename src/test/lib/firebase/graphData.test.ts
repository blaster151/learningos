/**
 * Tests for graphData Firebase service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import * as graphDataService from "@/lib/firebase/graphData";

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => ({
  getAdminDb: vi.fn(),
}));

// Mock transformGraphData
vi.mock("@/lib/ai/transformGraphData", () => ({
  transformGraphData: vi.fn((concepts, relations) => ({
    nodes: concepts.map((c: any) => ({
      id: c.id,
      name: c.name,
      displayName: c.name,
      mastery: c.mastery,
      domain: c.domain,
      size: 10,
      color: "#10b981",
      conceptCount: 1,
    })),
    links: relations.map((r: any) => ({
      source: r.fromConceptId,
      target: r.toConceptId,
      type: r.relationType,
      strength: r.strength || 0.5,
      color: "#6366f1",
    })),
  })),
}));

const { getAdminDb } = await import("@/lib/firebase/admin");

describe("GraphData Firebase Service", () => {
  let mockDb: any;
  let mockCollection: any;
  let mockQuery: any;

  beforeEach(() => {
    mockQuery = {
      where: vi.fn().mockReturnThis(),
      get: vi.fn(),
    };

    mockCollection = {
      where: vi.fn(() => mockQuery),
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
            mastery: 0.7,
            userId: "user-123",
          }),
        },
        {
          id: "concept-2",
          data: () => ({
            name: "React",
            domain: "Frontend",
            mastery: 0.5,
            userId: "user-123",
          }),
        },
      ];

      const mockRelations = [
        {
          id: "rel-1",
          data: () => ({
            fromConceptId: "concept-1",
            toConceptId: "concept-2",
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
      expect(mockDb.collection).toHaveBeenCalledWith("concept_relations");
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
            mastery: 0.7,
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

      const graphData = await graphDataService.getUserGraph("user-123", filters);

      expect(graphData.nodes).toHaveLength(1);
    });

    it("applies mastery level filters", async () => {
      const mockConcepts = [
        {
          id: "concept-1",
          data: () => ({
            name: "JavaScript",
            domain: "Programming",
            mastery: 0.7, // practicing level
          }),
        },
        {
          id: "concept-2",
          data: () => ({
            name: "React",
            domain: "Frontend",
            mastery: 0.3, // learning level
          }),
        },
      ];

      mockQuery.get
        .mockResolvedValueOnce({ docs: mockConcepts })
        .mockResolvedValueOnce({ docs: [] });

      const filters = {
        domains: [],
        masteryLevels: ["practicing"],
        searchQuery: "",
      };

      const graphData = await graphDataService.getUserGraph("user-123", filters);

      // Should only include concepts at practicing level
      expect(graphData.nodes.some((n: any) => n.name === "JavaScript")).toBe(true);
      expect(graphData.nodes.some((n: any) => n.name === "React")).toBe(false);
    });

    it("applies search query filter", async () => {
      const mockConcepts = [
        {
          id: "concept-1",
          data: () => ({
            name: "JavaScript",
            domain: "Programming",
            mastery: 0.7,
          }),
        },
        {
          id: "concept-2",
          data: () => ({
            name: "React",
            domain: "Frontend",
            mastery: 0.5,
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
    it("returns unique domains from user concepts", async () => {
      const mockConcepts = [
        { data: () => ({ domain: "Programming" }) },
        { data: () => ({ domain: "Frontend" }) },
        { data: () => ({ domain: "Programming" }) }, // Duplicate
        { data: () => ({ domain: "Backend" }) },
      ];

      mockQuery.get.mockResolvedValue({ docs: mockConcepts });

      const domains = await graphDataService.getAvailableDomains("user-123");

      expect(domains).toEqual(["Programming", "Frontend", "Backend"]);
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
        { data: () => ({ mastery: 0.7, domain: "Programming" }) },
        { data: () => ({ mastery: 0.5, domain: "Frontend" }) },
        { data: () => ({ mastery: 0.9, domain: "Programming" }) },
      ];

      mockQuery.get.mockResolvedValue({ docs: mockConcepts });

      const stats = await graphDataService.getGraphStats("user-123");

      expect(stats.totalConcepts).toBe(3);
      expect(stats.averageMastery).toBeCloseTo(0.7, 1);
      expect(stats.domainCount).toBe(2);
    });

    it("handles single concept", async () => {
      const mockConcepts = [
        { data: () => ({ mastery: 0.8, domain: "Programming" }) },
      ];

      mockQuery.get.mockResolvedValue({ docs: mockConcepts });

      const stats = await graphDataService.getGraphStats("user-123");

      expect(stats.totalConcepts).toBe(1);
      expect(stats.averageMastery).toBe(0.8);
      expect(stats.domainCount).toBe(1);
    });

    it("returns zero stats for no concepts", async () => {
      mockQuery.get.mockResolvedValue({ docs: [] });

      const stats = await graphDataService.getGraphStats("user-123");

      expect(stats.totalConcepts).toBe(0);
      expect(stats.averageMastery).toBe(0);
      expect(stats.domainCount).toBe(0);
    });
  });

  describe("getConceptNeighborhood", () => {
    it("fetches related concepts for a given concept", async () => {
      const mockRelations = [
        {
          data: () => ({
            fromConceptId: "concept-1",
            toConceptId: "concept-2",
            relationType: "prerequisite",
          }),
        },
        {
          data: () => ({
            fromConceptId: "concept-3",
            toConceptId: "concept-1",
            relationType: "related",
          }),
        },
      ];

      const mockConcepts = [
        {
          id: "concept-2",
          data: () => ({ name: "React", domain: "Frontend" }),
        },
        {
          id: "concept-3",
          data: () => ({ name: "TypeScript", domain: "Programming" }),
        },
      ];

      mockQuery.get
        .mockResolvedValueOnce({ docs: mockRelations }) // First where clause
        .mockResolvedValueOnce({ docs: [] }) // Second where clause
        .mockResolvedValueOnce({ docs: mockConcepts }); // Concepts fetch

      const neighborhood = await graphDataService.getConceptNeighborhood("concept-1");

      expect(neighborhood).toHaveLength(2);
      expect(neighborhood.some((c: any) => c.name === "React")).toBe(true);
      expect(neighborhood.some((c: any) => c.name === "TypeScript")).toBe(true);
    });

    it("handles concept with no relations", async () => {
      mockQuery.get
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] });

      const neighborhood = await graphDataService.getConceptNeighborhood("isolated-concept");

      expect(neighborhood).toEqual([]);
    });
  });
});
