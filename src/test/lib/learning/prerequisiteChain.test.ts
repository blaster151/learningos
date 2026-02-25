import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConceptDocGet = vi.fn();
const mockConceptCollectionDoc = vi.fn();
const mockConceptCollection = vi.fn();
const mockRelationsGet = vi.fn();
const mockRelationsWhereRelationType = vi.fn();
const mockRelationsWhereUserId = vi.fn();
const mockRelationsCollection = vi.fn();
const mockDbCollection = vi.fn();

const mockChatCreate = vi.fn();

vi.mock("@/lib/firebase/admin", () => ({
  getAdminDb: vi.fn(async () => ({
    collection: mockDbCollection,
  })),
}));

vi.mock("@/lib/ai/config", () => ({
  AI_CONFIG: { FALLBACK_MODEL: "test-model" },
  getOpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: mockChatCreate,
      },
    },
  })),
}));

import { getPrerequisiteChain } from "@/lib/learning/prerequisiteChain";

describe("getPrerequisiteChain", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDbCollection.mockImplementation((name: string) => {
      if (name === "concepts") {
        return mockConceptCollection();
      }

      if (name === "concept_relations") {
        return mockRelationsCollection();
      }

      throw new Error(`Unexpected collection: ${name}`);
    });

    mockConceptCollection.mockReturnValue({
      doc: mockConceptCollectionDoc,
    });

    mockConceptCollectionDoc.mockReturnValue({
      get: mockConceptDocGet,
    });

    mockRelationsCollection.mockReturnValue({
      where: mockRelationsWhereUserId,
    });

    mockRelationsWhereUserId.mockReturnValue({
      where: mockRelationsWhereRelationType,
    });

    mockRelationsWhereRelationType.mockReturnValue({
      get: mockRelationsGet,
    });
  });

  it("walks transitive prerequisites and classifies readiness", async () => {
    mockConceptDocGet.mockImplementation(async () => ({
      exists: true,
      id: "", // filled per call below using call args
      data: () => ({}),
    }));

    mockConceptCollectionDoc.mockImplementation((id: string) => ({
      get: vi.fn(async () => {
        const concepts: Record<
          string,
          {
            name: string;
            understanding: number;
            confidence: number;
            domain: string;
          }
        > = {
          target: {
            name: "Target",
            understanding: 0.4,
            confidence: 0.4,
            domain: "programming",
          },
          a: {
            name: "A",
            understanding: 0.9,
            confidence: 0.9,
            domain: "programming",
          },
          b: {
            name: "B",
            understanding: 0.2,
            confidence: 0.2,
            domain: "programming",
          },
          c: {
            name: "C",
            understanding: 0.5,
            confidence: 0.5,
            domain: "programming",
          },
        };

        return {
          exists: Boolean(concepts[id]),
          id,
          data: () => concepts[id],
        };
      }),
    }));

    mockRelationsGet.mockResolvedValue({
      docs: [
        {
          id: "r1",
          data: () => ({
            userId: "u1",
            sourceConceptId: "a",
            targetConceptId: "target",
            relationType: "prerequisite",
          }),
        },
        {
          id: "r2",
          data: () => ({
            userId: "u1",
            sourceConceptId: "b",
            targetConceptId: "a",
            relationType: "prerequisite",
          }),
        },
        {
          id: "r3",
          data: () => ({
            userId: "u1",
            sourceConceptId: "c",
            targetConceptId: "target",
            relationType: "prerequisite",
          }),
        },
      ],
    });

    const result = await getPrerequisiteChain("u1", "target");

    expect(result.usedInferredPrerequisites).toBe(false);
    expect(result.prerequisites.map((p) => p.conceptId)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(
      result.prerequisites.find((p) => p.conceptId === "a")?.readiness
    ).toBe("likely_known");
    expect(
      result.prerequisites.find((p) => p.conceptId === "b")?.readiness
    ).toBe("needs_assessment");
    expect(
      result.prerequisites.find((p) => p.conceptId === "c")?.readiness
    ).toBe("reinforce");
  });

  it("detects cycles without failing", async () => {
    mockConceptCollectionDoc.mockImplementation((id: string) => ({
      get: vi.fn(async () => ({
        exists: true,
        id,
        data: () => ({
          name: id,
          understanding: 0.4,
          confidence: 0.4,
          domain: "programming",
        }),
      })),
    }));

    mockRelationsGet.mockResolvedValue({
      docs: [
        {
          id: "r1",
          data: () => ({
            userId: "u1",
            sourceConceptId: "a",
            targetConceptId: "target",
            relationType: "prerequisite",
          }),
        },
        {
          id: "r2",
          data: () => ({
            userId: "u1",
            sourceConceptId: "target",
            targetConceptId: "a",
            relationType: "prerequisite",
          }),
        },
      ],
    });

    const result = await getPrerequisiteChain("u1", "target");

    expect(result.cycleDetected).toBe(true);
    expect(result.prerequisites.length).toBeGreaterThan(0);
  });

  it("falls back to inferred prerequisites when graph has none", async () => {
    mockConceptCollectionDoc.mockImplementation((id: string) => ({
      get: vi.fn(async () => ({
        exists: true,
        id,
        data: () => ({
          name: "Recursion",
          domain: "programming",
          understanding: 0.1,
          confidence: 0.1,
        }),
      })),
    }));

    mockRelationsGet.mockResolvedValue({ docs: [] });
    mockChatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              prereqs: [{ name: "Functions" }, { name: "Call stack" }],
            }),
          },
        },
      ],
    });

    const result = await getPrerequisiteChain("u1", "target");

    expect(result.usedInferredPrerequisites).toBe(true);
    expect(result.prerequisites).toHaveLength(2);
    expect(result.prerequisites.every((p) => p.source === "inferred")).toBe(
      true
    );
    expect(mockChatCreate).toHaveBeenCalled();
  });
});
