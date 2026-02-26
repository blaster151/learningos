/**
 * Tests for extractPrerequisiteGaps utility (E14-S5, Sub-task A)
 *
 * Tests gap extraction from assessed prerequisites and milestone provenance,
 * deduplication, and filtering by path status.
 */

import { describe, it, expect } from "vitest";
import {
  extractGapsForPath,
  extractAllGaps,
  type PrerequisiteGap,
} from "@/lib/learning/extractPrerequisiteGaps";
import { mockLearningPath, mockTimestamp } from "@/test/mockData";
import type { LearningPath, PathMilestone, AssessedPrerequisite } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMilestone(overrides?: Partial<PathMilestone>): PathMilestone {
  return {
    milestoneId: "m-1",
    order: 0,
    title: "Test Milestone",
    description: "desc",
    conceptIds: ["c1"],
    conceptNames: ["Concept 1"],
    estimatedMinutes: 15,
    objectives: ["obj"],
    status: "not_started",
    progress: 0,
    prerequisiteMilestoneIds: [],
    ...overrides,
  };
}

function makeAssessed(overrides?: Partial<AssessedPrerequisite>): AssessedPrerequisite {
  return {
    conceptId: "concept-1",
    conceptName: "JavaScript Closures",
    status: "missing",
    confidence: 0.1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// extractGapsForPath
// ---------------------------------------------------------------------------

describe("extractGapsForPath", () => {
  it("returns gaps from assessed prerequisites with status missing", () => {
    const path = mockLearningPath({
      generatedFrom: {
        userGoal: "React Hooks",
        knownConceptIds: [],
        userLevel: "beginner",
        assessedPrerequisites: [
          makeAssessed({ conceptName: "Closures", status: "missing" }),
          makeAssessed({ conceptName: "Scope", status: "missing" }),
        ],
      },
    });

    const gaps = extractGapsForPath(path);
    expect(gaps).toHaveLength(2);
    expect(gaps[0].conceptName).toBe("Closures");
    expect(gaps[0].source).toBe("screening");
    expect(gaps[1].conceptName).toBe("Scope");
  });

  it("ignores assessed prerequisites that are not missing", () => {
    const path = mockLearningPath({
      generatedFrom: {
        userGoal: "React Hooks",
        knownConceptIds: [],
        userLevel: "beginner",
        assessedPrerequisites: [
          makeAssessed({ conceptName: "Closures", status: "assessed_known" }),
          makeAssessed({ conceptName: "Scope", status: "assessed_familiar" }),
          makeAssessed({ conceptName: "Modules", status: "unknown" }),
        ],
      },
    });

    const gaps = extractGapsForPath(path);
    expect(gaps).toHaveLength(0);
  });

  it("returns gaps from milestone provenance with prerequisite_gap reason", () => {
    const path = mockLearningPath({
      milestones: [
        makeMilestone({
          milestoneId: "prereq_1",
          title: "HTTP Basics",
          status: "not_started",
          provenance: {
            reason: "prerequisite_gap",
            detectedInMilestoneId: "m-2",
            insertedAt: "2026-01-01T00:00:00Z",
          },
        }),
        makeMilestone({
          milestoneId: "m-2",
          order: 1,
          title: "Build REST APIs",
          status: "in_progress",
        }),
      ],
    });

    const gaps = extractGapsForPath(path);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].conceptName).toBe("HTTP Basics");
    expect(gaps[0].source).toBe("milestone_provenance");
  });

  it("excludes completed provenance milestones", () => {
    const path = mockLearningPath({
      milestones: [
        makeMilestone({
          milestoneId: "prereq_1",
          title: "HTTP Basics",
          status: "completed",
          provenance: {
            reason: "prerequisite_gap",
            insertedAt: "2026-01-01T00:00:00Z",
          },
        }),
      ],
    });

    const gaps = extractGapsForPath(path);
    expect(gaps).toHaveLength(0);
  });

  it("deduplicates by concept name (case insensitive)", () => {
    const path = mockLearningPath({
      generatedFrom: {
        userGoal: "React",
        knownConceptIds: [],
        userLevel: "beginner",
        assessedPrerequisites: [
          makeAssessed({ conceptName: "Closures", status: "missing" }),
        ],
      },
      milestones: [
        makeMilestone({
          milestoneId: "prereq_1",
          title: "closures", // same concept, different casing
          status: "not_started",
          provenance: {
            reason: "prerequisite_gap",
            insertedAt: "2026-01-01T00:00:00Z",
          },
        }),
      ],
    });

    const gaps = extractGapsForPath(path);
    expect(gaps).toHaveLength(1);
    // First source wins (screening)
    expect(gaps[0].source).toBe("screening");
  });

  it("returns empty array for path with no gaps", () => {
    const path = mockLearningPath({
      generatedFrom: {
        userGoal: "Python",
        knownConceptIds: [],
        userLevel: "beginner",
        assessedPrerequisites: [
          makeAssessed({ conceptName: "Variables", status: "assessed_known" }),
        ],
      },
      milestones: [
        makeMilestone({ title: "Learn Variables", status: "in_progress" }),
      ],
    });

    const gaps = extractGapsForPath(path);
    expect(gaps).toHaveLength(0);
  });

  it("handles path with no assessedPrerequisites or milestones gracefully", () => {
    const path = mockLearningPath({
      generatedFrom: {
        userGoal: "Python",
        knownConceptIds: [],
        userLevel: "beginner",
      },
      milestones: [],
    });

    const gaps = extractGapsForPath(path);
    expect(gaps).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// extractAllGaps
// ---------------------------------------------------------------------------

describe("extractAllGaps", () => {
  it("returns gaps grouped by path ID for active and suggested paths", () => {
    const activePath = mockLearningPath({
      pathId: "active-1",
      title: "React Hooks",
      status: "active",
      generatedFrom: {
        userGoal: "React Hooks",
        knownConceptIds: [],
        userLevel: "beginner",
        assessedPrerequisites: [
          makeAssessed({ conceptName: "Closures", status: "missing" }),
        ],
      },
    });

    const suggestedPath = mockLearningPath({
      pathId: "suggested-1",
      title: "Build APIs",
      status: "suggested",
      milestones: [
        makeMilestone({
          milestoneId: "prereq_http",
          title: "HTTP Basics",
          status: "not_started",
          provenance: {
            reason: "prerequisite_gap",
            insertedAt: "2026-01-01T00:00:00Z",
          },
        }),
      ],
    });

    const result = extractAllGaps([activePath, suggestedPath]);
    expect(result.size).toBe(2);
    expect(result.get("active-1")).toHaveLength(1);
    expect(result.get("active-1")![0].conceptName).toBe("Closures");
    expect(result.get("suggested-1")).toHaveLength(1);
    expect(result.get("suggested-1")![0].conceptName).toBe("HTTP Basics");
  });

  it("excludes completed and abandoned paths", () => {
    const completedPath = mockLearningPath({
      pathId: "completed-1",
      status: "completed",
      generatedFrom: {
        userGoal: "Python",
        knownConceptIds: [],
        userLevel: "beginner",
        assessedPrerequisites: [
          makeAssessed({ conceptName: "Lists", status: "missing" }),
        ],
      },
    });

    const abandonedPath = mockLearningPath({
      pathId: "abandoned-1",
      status: "abandoned",
      generatedFrom: {
        userGoal: "Rust",
        knownConceptIds: [],
        userLevel: "beginner",
        assessedPrerequisites: [
          makeAssessed({ conceptName: "Memory", status: "missing" }),
        ],
      },
    });

    const result = extractAllGaps([completedPath, abandonedPath]);
    expect(result.size).toBe(0);
  });

  it("omits paths with no gaps from the result map", () => {
    const cleanPath = mockLearningPath({
      pathId: "clean-1",
      status: "active",
      generatedFrom: {
        userGoal: "Python",
        knownConceptIds: [],
        userLevel: "beginner",
      },
      milestones: [
        makeMilestone({ title: "Basics", status: "in_progress" }),
      ],
    });

    const result = extractAllGaps([cleanPath]);
    expect(result.size).toBe(0);
    expect(result.has("clean-1")).toBe(false);
  });

  it("handles empty paths array", () => {
    const result = extractAllGaps([]);
    expect(result.size).toBe(0);
  });
});
