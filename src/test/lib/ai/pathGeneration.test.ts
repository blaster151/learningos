import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockChatCreate, mockTrackTokenUsage, mockLogAICall } = vi.hoisted(() => ({
  mockChatCreate: vi.fn(),
  mockTrackTokenUsage: vi.fn(),
  mockLogAICall: vi.fn(),
}));

vi.mock("@/lib/ai/config", () => ({
  AI_CONFIG: { PRIMARY_MODEL: "gpt-4-test" },
  openai: {
    chat: {
      completions: {
        create: mockChatCreate,
      },
    },
  },
}));

vi.mock("@/lib/ai/tokenTracker", () => ({
  trackTokenUsage: mockTrackTokenUsage,
}));

vi.mock("@/lib/ai/aiLogger", () => ({
  logAICall: mockLogAICall,
}));

import { generateLearningPath } from "@/lib/ai/pathGeneration";

describe("generateLearningPath screening context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrackTokenUsage.mockResolvedValue(undefined);
    mockChatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "Path",
              description: "desc",
              milestones: [
                {
                  title: "M1",
                  description: "D1",
                  concepts: ["c1", "c2"],
                  objectives: ["o1", "o2"],
                  estimatedMinutes: 45,
                  prerequisites: [],
                },
              ],
              estimatedMinutes: 45,
            }),
          },
        },
      ],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });
  });

  it("includes assessed prerequisites and screening conversation in prompt", async () => {
    await generateLearningPath({
      userId: "u1",
      goal: "Build Node REST APIs",
      knownConcepts: [],
      userLevel: "beginner",
      screeningResult: {
        goal: "Learn backend",
        narrowedGoal: "Build Node REST APIs",
        knownConcepts: ["variables"],
        familiarConcepts: ["functions"],
        assessedPrerequisites: [
          {
            conceptId: "p1",
            conceptName: "HTTP basics",
            status: "missing",
            confidence: 0.4,
          },
        ],
        gapTier: "small",
      },
      screeningConversation: [
        { role: "assistant", content: "Have you used APIs before?" },
        { role: "user", content: "A little bit." },
      ],
    });

    const userPrompt = mockChatCreate.mock.calls[0][0].messages[1].content as string;
    expect(userPrompt).toContain("SCREENING RESULT");
    expect(userPrompt).toContain("HTTP basics");
    expect(userPrompt).toContain("SCREENING CONVERSATION EXCERPT");
    expect(userPrompt).toContain("USER: A little bit.");
  });
});
