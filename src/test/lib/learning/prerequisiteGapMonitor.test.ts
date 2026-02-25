import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/learning/prerequisiteChain", () => ({
  getPrerequisiteChain: vi.fn(),
}));

vi.mock("@/lib/firebase/concepts", () => ({
  conceptsService: {
    getConcept: vi.fn(),
    findConceptByName: vi.fn(),
    createConcept: vi.fn(),
  },
}));

vi.mock("@/lib/firebase/conceptRelations", () => ({
  relationsService: {
    getRelationByType: vi.fn(),
    createRelation: vi.fn(),
  },
}));

import { getPrerequisiteChain } from "@/lib/learning/prerequisiteChain";
import { conceptsService } from "@/lib/firebase/concepts";
import { relationsService } from "@/lib/firebase/conceptRelations";
import { detectPrerequisiteGap } from "@/lib/learning/prerequisiteGapMonitor";

describe("detectPrerequisiteGap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no alert when confusion is not detected", async () => {
    const result = await detectPrerequisiteGap({
      userId: "u1",
      userMessage: "Tell me more",
      assistantResponse: "Here is a deeper explanation.",
      targetConceptId: "target",
    });

    expect(result.detected).toBe(false);
    expect(getPrerequisiteChain).not.toHaveBeenCalled();
  });

  it("flags prerequisite gap and creates missing relation", async () => {
    vi.mocked(getPrerequisiteChain).mockResolvedValue({
      targetConceptId: "target",
      prerequisites: [
        {
          conceptId: "c-prereq",
          conceptName: "functions",
          depth: 1,
          mastery: 0.1,
          readiness: "needs_assessment",
          source: "graph",
        },
      ],
      cycleDetected: false,
      usedInferredPrerequisites: false,
    });

    vi.mocked(conceptsService.getConcept).mockResolvedValue({
      conceptId: "c-prereq",
      userId: "u1",
      name: "functions",
      definition: "",
      domain: "programming",
      confidence: 0.2,
      understanding: 0.2,
      masteryLevel: "exploring",
      firstEncountered: {
        seconds: 0,
        nanoseconds: 0,
        toDate: () => new Date(),
        toMillis: () => 0,
      },
      lastReviewed: {
        seconds: 0,
        nanoseconds: 0,
        toDate: () => new Date(),
        toMillis: () => 0,
      },
      sessionIds: [],
      definitionHistory: [],
      isEmergent: false,
      discoveredBy: "system",
    });

    vi.mocked(relationsService.getRelationByType).mockResolvedValue(null);
    vi.mocked(relationsService.createRelation).mockResolvedValue("rel-1");

    const result = await detectPrerequisiteGap({
      userId: "u1",
      userMessage: "I'm confused. I don't understand this.",
      assistantResponse: "Let's step back and check the foundation.",
      targetConceptId: "target",
    });

    expect(result.detected).toBe(true);
    expect(result.prerequisiteConceptId).toBe("c-prereq");
    expect(relationsService.createRelation).toHaveBeenCalled();
  });
});
