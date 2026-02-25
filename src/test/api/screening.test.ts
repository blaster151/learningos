import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockRequireAuthUser, mockCheckAutoSkip, mockConductScreeningTurn, mockGetPrerequisiteChain } =
  vi.hoisted(() => ({
    mockRequireAuthUser: vi.fn(),
    mockCheckAutoSkip: vi.fn(),
    mockConductScreeningTurn: vi.fn(),
    mockGetPrerequisiteChain: vi.fn(),
  }));

vi.mock("@/lib/auth/serverAuth", () => {
  class AuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }

  return {
    requireAuthUser: mockRequireAuthUser,
    assertSameUser: (requestedUserId: string | null | undefined, authedUserId: string) => {
      if (!requestedUserId) return;
      if (requestedUserId !== authedUserId) {
        throw new AuthError("Forbidden", 403);
      }
    },
    authErrorResponse: (error: unknown) => {
      if (error instanceof AuthError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.status,
          headers: { "Content-Type": "application/json" },
        });
      }
      return null;
    },
  };
});

vi.mock("@/lib/ai/prerequisiteScreening", () => ({
  checkAutoSkip: mockCheckAutoSkip,
  conductScreeningTurn: mockConductScreeningTurn,
}));

vi.mock("@/lib/learning/prerequisiteChain", () => ({
  getPrerequisiteChain: mockGetPrerequisiteChain,
}));

import { POST as screeningPreflight } from "@/app/api/paths/screening/preflight/route";
import { POST as screeningTurn } from "@/app/api/paths/screening/route";

describe("Screening API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthUser.mockResolvedValue({ uid: "user-123", email: "u@example.com" });
  });

  describe("POST /api/paths/screening/preflight", () => {
    it("returns skipScreening true when preflight says skip", async () => {
      mockCheckAutoSkip.mockResolvedValue({
        skipScreening: true,
        reason: "Based on your history, you're ready — generating now.",
      });

      const request = new NextRequest("http://localhost:3000/api/paths/screening/preflight", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: "user-123", goal: "Learn recursion" }),
      });

      const response = await screeningPreflight(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skipScreening).toBe(true);
      expect(mockCheckAutoSkip).toHaveBeenCalledWith("user-123", "Learn recursion");
    });

    it("returns 400 when goal is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/paths/screening/preflight", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: "user-123" }),
      });

      const response = await screeningPreflight(request);

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/paths/screening", () => {
    it("returns reply and updated messages", async () => {
      mockGetPrerequisiteChain.mockResolvedValue({
        targetConceptId: "goal",
        prerequisites: [],
        cycleDetected: false,
        usedInferredPrerequisites: false,
      });
      mockConductScreeningTurn.mockResolvedValue({
        reply: "Great, what experience do you already have?",
        done: false,
        progress: {
          turnCount: 2,
          assessedCount: 0,
          pendingCount: 3,
          narrowedGoal: false,
          broadenedProbe: false,
        },
      });

      const request = new NextRequest("http://localhost:3000/api/paths/screening", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          goal: "Learn Node APIs",
          messages: [{ role: "user", content: "I want backend" }],
          userAction: { type: "message", content: "I built a todo app" },
        }),
      });

      const response = await screeningTurn(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toContain("experience");
      expect(data.messages).toHaveLength(2);
      expect(mockConductScreeningTurn).toHaveBeenCalled();
    });

    it("returns done=true and screeningResult for generate_now", async () => {
      mockGetPrerequisiteChain.mockResolvedValue({
        targetConceptId: "goal",
        prerequisites: [],
        cycleDetected: false,
        usedInferredPrerequisites: false,
      });
      mockConductScreeningTurn.mockResolvedValue({
        reply: "Generating now.",
        done: true,
        screeningResult: {
          goal: "Learn Node APIs",
          narrowedGoal: "Learn Node APIs",
          knownConcepts: ["Variables"],
          familiarConcepts: [],
          assessedPrerequisites: [],
          gapTier: "small",
        },
        progress: {
          turnCount: 1,
          assessedCount: 1,
          pendingCount: 1,
          narrowedGoal: false,
          broadenedProbe: false,
        },
      });

      const request = new NextRequest("http://localhost:3000/api/paths/screening", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          goal: "Learn Node APIs",
          messages: [],
          userAction: { type: "generate_now" },
        }),
      });

      const response = await screeningTurn(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.done).toBe(true);
      expect(data.screeningResult).toBeDefined();
    });

    it("returns 400 when goal is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/paths/screening", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          messages: [],
          userAction: { type: "generate_now" },
        }),
      });

      const response = await screeningTurn(request);

      expect(response.status).toBe(400);
    });

    it("returns 429 when messages exceed 20", async () => {
      const messages = Array.from({ length: 21 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "assistant",
        content: `m-${i}`,
      }));

      const request = new NextRequest("http://localhost:3000/api/paths/screening", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "user-123",
          goal: "Learn Node APIs",
          messages,
          userAction: { type: "message", content: "hello" },
        }),
      });

      const response = await screeningTurn(request);

      expect(response.status).toBe(429);
      expect(mockConductScreeningTurn).not.toHaveBeenCalled();
    });
  });
});
