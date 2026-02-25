import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockChatCreate, mockGetPrerequisiteChain } = vi.hoisted(() => ({
  mockChatCreate: vi.fn(),
  mockGetPrerequisiteChain: vi.fn(),
}));

vi.mock("@/lib/ai/config", () => ({
  AI_CONFIG: { PRIMARY_MODEL: "gpt-4-test" },
  getOpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: mockChatCreate,
      },
    },
  })),
}));

vi.mock("@/lib/learning/prerequisiteChain", () => ({
  getPrerequisiteChain: mockGetPrerequisiteChain,
}));

import {
  __internal,
  checkAutoSkip,
  conductScreeningTurn,
} from "@/lib/ai/prerequisiteScreening";
import type { PrerequisiteChainResult } from "@/lib/learning/prerequisiteChain";

function createChain(
  overrides?: Partial<PrerequisiteChainResult>
): PrerequisiteChainResult {
  return {
    targetConceptId: "target",
    prerequisites: [
      {
        conceptId: "p1",
        conceptName: "Variables",
        depth: 1,
        mastery: 0.9,
        readiness: "likely_known",
        source: "graph",
      },
      {
        conceptId: "p2",
        conceptName: "Control flow",
        depth: 1,
        mastery: 0.2,
        readiness: "needs_assessment",
        source: "graph",
      },
    ],
    cycleDetected: false,
    usedInferredPrerequisites: false,
    ...overrides,
  };
}

describe("prerequisiteScreening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles broad goal narrowing response", async () => {
    const chain = createChain();
    mockChatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              reply: "Let's narrow to backend APIs in Node.js.",
              done: false,
              progress: {
                turnCount: 2,
                assessedCount: 1,
                pendingCount: 1,
                narrowedGoal: true,
                broadenedProbe: false,
              },
            }),
          },
        },
      ],
    });

    const result = await conductScreeningTurn(
      "Learn programming",
      [{ role: "assistant", content: "What area interests you most?" }],
      { type: "message", content: "Everything." },
      chain
    );

    expect(result.done).toBe(false);
    expect(result.reply).toContain("narrow");
    expect(result.progress.narrowedGoal).toBe(true);
  });

  it("handles dont_know by broadening probe", async () => {
    const chain = createChain();
    mockChatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              reply: "No worries — have you written any code before?",
              done: false,
              progress: {
                turnCount: 3,
                assessedCount: 0,
                pendingCount: 2,
                narrowedGoal: false,
                broadenedProbe: true,
              },
            }),
          },
        },
      ],
    });

    const result = await conductScreeningTurn(
      "Learn recursion",
      [{ role: "assistant", content: "Can you explain stack frames?" }],
      { type: "dont_know" },
      chain
    );

    expect(result.done).toBe(false);
    expect(result.progress.broadenedProbe).toBe(true);
  });

  it("returns immediate screening result on generate_now", async () => {
    const chain = createChain();

    const result = await conductScreeningTurn(
      "Learn recursion",
      [],
      { type: "generate_now" },
      chain
    );

    expect(result.done).toBe(true);
    expect(result.screeningResult).toBeDefined();
    expect(result.screeningResult?.assessedPrerequisites.length).toBe(2);
    expect(mockChatCreate).not.toHaveBeenCalled();
  });

  it("auto-skips when all prerequisites are likely_known", async () => {
    mockGetPrerequisiteChain.mockResolvedValue(
      createChain({
        prerequisites: [
          {
            conceptId: "p1",
            conceptName: "Functions",
            depth: 1,
            mastery: 0.92,
            readiness: "likely_known",
            source: "graph",
          },
          {
            conceptId: "p2",
            conceptName: "Loops",
            depth: 2,
            mastery: 0.88,
            readiness: "likely_known",
            source: "graph",
          },
        ],
      })
    );

    const result = await checkAutoSkip("u1", "target");

    expect(result.skipScreening).toBe(true);
    expect(result.reason).toContain("Based on your history");
  });

  it("classifies gap tiers by missing prerequisite counts", () => {
    const small = __internal.classifyGapTier([
      { conceptId: "1", conceptName: "A", status: "missing", confidence: 0.2 },
    ]);
    const medium = __internal.classifyGapTier(
      Array.from({ length: 5 }).map((_, idx) => ({
        conceptId: `${idx}`,
        conceptName: `C${idx}`,
        status: "unknown" as const,
        confidence: 0.2,
      }))
    );
    const large = __internal.classifyGapTier(
      Array.from({ length: 10 }).map((_, idx) => ({
        conceptId: `${idx}`,
        conceptName: `C${idx}`,
        status: "missing" as const,
        confidence: 0.2,
      }))
    );

    expect(small).toBe("small");
    expect(medium).toBe("medium");
    expect(large).toBe("large");
  });
});
