/**
 * Tests for Learning Paths API Routes
 * /api/paths - GET
 * /api/paths/generate - POST
 * /api/paths/[pathId] - GET, PATCH
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the service objects as they are exported
vi.mock("@/lib/firebase/learningPaths", () => ({
  pathsService: {
    getUserPaths: vi.fn(),
    getPath: vi.fn(),
    acceptPath: vi.fn(),
    abandonPath: vi.fn(),
    createPath: vi.fn(),
    pausePath: vi.fn(),
    resumePath: vi.fn(),
    updateMilestone: vi.fn(),
    completeMilestone: vi.fn(),
    updatePathProgress: vi.fn(),
    insertMilestone: vi.fn(),
  },
}));

vi.mock("@/lib/firebase/concepts", () => ({
  conceptsService: {
    getUserConcepts: vi.fn(),
    createConcept: vi.fn(),
    findConceptByName: vi.fn(),
    getConcept: vi.fn(),
    updateConcept: vi.fn(),
  },
}));

vi.mock("@/lib/ai/pathGeneration", () => ({
  generateLearningPath: vi.fn(),
}));

vi.mock("@/lib/ai/scopeAnalysis", () => ({
  analyzeTopicScope: vi.fn(),
}));

vi.mock("@/lib/ai/narrowSuggest", () => ({
  suggestNarrowTopics: vi.fn(),
}));

vi.mock("@/lib/ai/calibrationWave1", () => ({
  getCalibrationWave1: vi.fn(),
}));

vi.mock("@/lib/ai/calibrationWave2", () => ({
  getCalibrationWave2: vi.fn(),
}));

vi.mock("@/lib/firebase/knowledgeProfile", () => ({
  knowledgeProfileService: {
    getProfile: vi.fn(),
    upsertEntries: vi.fn(),
  },
}));

const {
  mockDbCollection,
  mockSessionsAdd,
  mockMessagesAdd,
} = vi.hoisted(() => ({
  mockDbCollection: vi.fn(),
  mockSessionsAdd: vi.fn(),
  mockMessagesAdd: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({
  getAdminDb: vi.fn(async () => ({
    collection: mockDbCollection,
  })),
}));

// Mock server auth to avoid Firebase Admin dependency
vi.mock("@/lib/auth/serverAuth", () => {
  class AuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }

  return {
    requireAuthUser: vi.fn(async () => ({
      uid: "user-123",
      email: "user-123@example.com",
    })),
    assertSameUser: (
      requestedUserId: string | null | undefined,
      authedUserId: string
    ) => {
      if (!requestedUserId) return;
      if (requestedUserId !== authedUserId)
        throw new AuthError("Forbidden", 403);
    },
    AuthError,
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

import { GET as getPathsList } from "@/app/api/paths/route";
import { POST as generatePath } from "@/app/api/paths/generate/route";
import { POST as scopeAnalyze } from "@/app/api/paths/scope-analyze/route";
import { POST as narrowSuggest } from "@/app/api/paths/narrow-suggest/route";
import { POST as calibrationWave1 } from "@/app/api/paths/calibration/wave-1/route";
import { POST as calibrationWave2 } from "@/app/api/paths/calibration/wave-2/route";
import {
  GET as getPathDetail,
  PATCH as updatePath,
} from "@/app/api/paths/[pathId]/route";
import { pathsService } from "@/lib/firebase/learningPaths";
import { conceptsService } from "@/lib/firebase/concepts";
import * as pathGeneration from "@/lib/ai/pathGeneration";
import * as scopeAnalysis from "@/lib/ai/scopeAnalysis";
import * as narrowSuggestLib from "@/lib/ai/narrowSuggest";
import * as calibrationWave1Lib from "@/lib/ai/calibrationWave1";
import * as calibrationWave2Lib from "@/lib/ai/calibrationWave2";
import { knowledgeProfileService } from "@/lib/firebase/knowledgeProfile";

describe("Paths API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: empty knowledge profile (most tests don't care about it)
    vi.mocked(knowledgeProfileService.getProfile).mockResolvedValue([]);

    mockDbCollection.mockImplementation((name: string) => {
      if (name === "sessions") {
        return { add: mockSessionsAdd };
      }
      if (name === "messages") {
        return { add: mockMessagesAdd };
      }
      throw new Error(`Unexpected collection ${name}`);
    });
    mockSessionsAdd.mockResolvedValue({ id: "session-screening-1" });
    mockMessagesAdd.mockResolvedValue({ id: "msg-1" });
  });

  describe("GET /api/paths", () => {
    it("should return all paths for authenticated user", async () => {
      const mockPaths = [
        { pathId: "p1", title: "Path 1", status: "active" },
        { pathId: "p2", title: "Path 2", status: "suggested" },
      ];

      vi.mocked(pathsService.getUserPaths).mockResolvedValue(mockPaths as any);

      const request = new NextRequest(
        "http://localhost:3000/api/paths?userId=user-123"
      );

      const response = await getPathsList(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.paths).toHaveLength(2);
      expect(data.paths[0].pathId).toBe("p1");
    });

    it("should filter paths by status", async () => {
      const mockActivePaths = [
        { pathId: "p1", title: "Active Path", status: "active" },
      ];

      vi.mocked(pathsService.getUserPaths).mockResolvedValue(
        mockActivePaths as any
      );

      const request = new NextRequest(
        "http://localhost:3000/api/paths?userId=user-123&status=active"
      );

      const response = await getPathsList(request);
      const data = await response.json();

      expect(data.paths).toHaveLength(1);
      expect(data.paths[0].status).toBe("active");
    });

    it("should allow omitting userId parameter", async () => {
      const mockPaths = [{ pathId: "p1", title: "Path 1", status: "active" }];
      vi.mocked(pathsService.getUserPaths).mockResolvedValue(mockPaths as any);

      const request = new NextRequest("http://localhost:3000/api/paths");

      const response = await getPathsList(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.paths).toHaveLength(1);
      expect(pathsService.getUserPaths).toHaveBeenCalledWith(
        "user-123",
        undefined
      );
    });
  });

  describe("POST /api/paths/generate", () => {
    it("should generate a new learning path", async () => {
      const mockConcepts = [
        { conceptId: "c1", name: "react", masteryLevel: "learning" },
        { conceptId: "c2", name: "hooks", masteryLevel: "exploring" },
      ];

      const mockGeneratedPath = {
        success: true,
        path: {
          title: "Master React Hooks",
          description: "Learn React hooks in depth",
          milestones: [
            {
              title: "Understand useState",
              description: "Learn state management",
              concepts: ["useState", "state"],
              estimatedMinutes: 180,
              objectives: ["Learn useState hook", "Understand state updates"],
              prerequisites: [], // Array of milestone indices that must be completed first
            },
          ],
          estimatedMinutes: 900,
        },
      };

      vi.mocked(conceptsService.getUserConcepts).mockResolvedValue(
        mockConcepts as any
      );
      vi.mocked(conceptsService.findConceptByName).mockResolvedValue(null);
      vi.mocked(conceptsService.createConcept).mockResolvedValue(
        "new-concept-id"
      );
      vi.mocked(pathGeneration.generateLearningPath).mockResolvedValue(
        mockGeneratedPath as any
      );
      vi.mocked(pathsService.createPath).mockResolvedValue("path-new");
      vi.mocked(pathsService.getPath).mockResolvedValue({
        pathId: "path-new",
        title: "Master React Hooks",
        status: "suggested",
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/paths/generate",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            userId: "user-123",
            goal: "Master React Hooks",
          }),
        }
      );

      const response = await generatePath(request);
      const data = await response.json();

      // Route returns 200 with path data (not 201)
      expect(response.status).toBe(200);
      expect(data.pathId).toBe("path-new");
    });

    it("should require goal parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/paths/generate",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ userId: "user-123" }),
        }
      );

      const response = await generatePath(request);

      expect(response.status).toBe(400);
    });

    it("should pass screening result into generation and save screening conversation session", async () => {
      vi.mocked(conceptsService.getUserConcepts).mockResolvedValue([] as any);
      vi.mocked(pathGeneration.generateLearningPath).mockResolvedValue({
        success: true,
        path: {
          title: "Node path",
          description: "desc",
          milestones: [
            {
              title: "M1",
              description: "d1",
              concepts: ["variables"],
              estimatedMinutes: 45,
              objectives: ["obj"],
              prerequisites: [],
            },
          ],
          estimatedMinutes: 45,
        },
      } as any);
      vi.mocked(conceptsService.findConceptByName).mockResolvedValue(null);
      vi.mocked(conceptsService.createConcept).mockResolvedValue("c-new");
      vi.mocked(pathsService.createPath).mockResolvedValue("path-1");
      vi.mocked(pathsService.getPath).mockResolvedValue({ pathId: "path-1" } as any);

      const screeningResult = {
        goal: "Learn Node APIs",
        narrowedGoal: "Build Node REST APIs",
        knownConcepts: ["variables"],
        familiarConcepts: ["loops"],
        assessedPrerequisites: [
          {
            conceptId: "p1",
            conceptName: "Variables",
            status: "assessed_known",
            confidence: 0.9,
          },
        ],
        gapTier: "small",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/paths/generate",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            goal: "Build Node REST APIs",
            screeningResult,
            screeningConversation: [
              { role: "assistant", content: "What experience do you have?" },
              { role: "user", content: "I know JS basics." },
            ],
          }),
        }
      );

      const response = await generatePath(request);
      expect(response.status).toBe(200);

      expect(pathGeneration.generateLearningPath).toHaveBeenCalledWith(
        expect.objectContaining({ screeningResult })
      );
      expect(mockSessionsAdd).toHaveBeenCalledTimes(1);
      expect(mockMessagesAdd).toHaveBeenCalledTimes(2);
    });

    it("should forward skippedCalibration flag to path generation and persist it", async () => {
      const mockConcepts = [
        { conceptId: "c1", name: "react", masteryLevel: "learning" },
      ];

      const mockGeneratedPath = {
        success: true,
        path: {
          title: "Learn TypeScript",
          description: "A thorough introduction to TypeScript",
          milestones: [
            {
              title: "TypeScript Basics",
              description: "Core types and syntax",
              concepts: ["types", "interfaces"],
              estimatedMinutes: 60,
              objectives: [
                "Demonstrate your current understanding of JavaScript fundamentals",
                "Understand basic TypeScript types",
              ],
              prerequisites: [],
            },
          ],
          estimatedMinutes: 180,
        },
      };

      vi.mocked(conceptsService.getUserConcepts).mockResolvedValue(
        mockConcepts as any
      );
      vi.mocked(conceptsService.findConceptByName).mockResolvedValue(null);
      vi.mocked(conceptsService.createConcept).mockResolvedValue(
        "new-concept-id"
      );
      vi.mocked(pathGeneration.generateLearningPath).mockResolvedValue(
        mockGeneratedPath as any
      );
      vi.mocked(pathsService.createPath).mockResolvedValue("path-skip");
      vi.mocked(pathsService.getPath).mockResolvedValue({
        pathId: "path-skip",
        title: "Learn TypeScript",
        status: "suggested",
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/paths/generate",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            goal: "Learn TypeScript",
            skippedCalibration: true,
          }),
        }
      );

      const response = await generatePath(request);
      expect(response.status).toBe(200);

      // Verify skippedCalibration was forwarded to generateLearningPath
      expect(pathGeneration.generateLearningPath).toHaveBeenCalledWith(
        expect.objectContaining({ skippedCalibration: true })
      );

      // Verify skippedCalibration was persisted in generatedFrom via createPath
      expect(pathsService.createPath).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({
          generatedFrom: expect.objectContaining({ skippedCalibration: true }),
        })
      );
    });

    it("should merge global knowledge profile into path generation and persist snapshot", async () => {
      const mockConcepts = [
        { conceptId: "c1", name: "react", masteryLevel: "learning" },
      ];

      // E18-S6: Global knowledge profile has closures=known, promises=familiar
      vi.mocked(knowledgeProfileService.getProfile).mockResolvedValue([
        {
          userId: "user-123",
          concept: "closures",
          confidence: 1.0,
          source: "calibration",
        },
        {
          userId: "user-123",
          concept: "promises",
          confidence: 0.5,
          source: "calibration",
        },
      ] as any);

      const mockGeneratedPath = {
        success: true,
        path: {
          title: "Learn React Hooks",
          description: "Deep dive into React Hooks",
          milestones: [
            {
              title: "Hooks Basics",
              description: "Core hooks",
              concepts: ["useState"],
              estimatedMinutes: 60,
              objectives: ["Understand useState"],
              prerequisites: [],
            },
          ],
          estimatedMinutes: 120,
        },
      };

      vi.mocked(conceptsService.getUserConcepts).mockResolvedValue(
        mockConcepts as any
      );
      vi.mocked(conceptsService.findConceptByName).mockResolvedValue(null);
      vi.mocked(conceptsService.createConcept).mockResolvedValue(
        "new-concept-id"
      );
      vi.mocked(pathGeneration.generateLearningPath).mockResolvedValue(
        mockGeneratedPath as any
      );
      vi.mocked(pathsService.createPath).mockResolvedValue("path-profile");
      vi.mocked(pathsService.getPath).mockResolvedValue({
        pathId: "path-profile",
        title: "Learn React Hooks",
        status: "suggested",
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/paths/generate",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            goal: "Learn React Hooks",
            // No declaredKnownConcepts — should be seeded from global profile
          }),
        }
      );

      const response = await generatePath(request);
      expect(response.status).toBe(200);

      // Verify global profile concepts were merged into generateLearningPath input
      expect(pathGeneration.generateLearningPath).toHaveBeenCalledWith(
        expect.objectContaining({
          declaredKnownConcepts: expect.arrayContaining(["closures"]),
          declaredFamiliarConcepts: expect.arrayContaining(["promises"]),
        })
      );

      // Verify knowledgeProfileSnapshot was persisted in generatedFrom
      expect(pathsService.createPath).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({
          generatedFrom: expect.objectContaining({
            knowledgeProfileSnapshot: expect.arrayContaining([
              expect.objectContaining({ concept: "closures", confidence: 1.0 }),
              expect.objectContaining({ concept: "promises", confidence: 0.5 }),
            ]),
          }),
        })
      );
    });
  });

  describe("POST /api/paths/scope-analyze", () => {
    it("should analyze scope for a goal", async () => {
      vi.mocked(conceptsService.getUserConcepts).mockResolvedValue([] as any);
      vi.mocked(scopeAnalysis.analyzeTopicScope).mockResolvedValue({
        scopeTier: "focused",
        confidence: 0.8,
        rationale: "React Hooks is a focused topic.",
        recommendedMode: "overview",
        suggestedNarrowTopics: [],
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/paths/scope-analyze",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            userId: "user-123",
            goal: "Learn React Hooks",
          }),
        }
      );

      const response = await scopeAnalyze(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analysis.scopeTier).toBe("focused");
      expect(scopeAnalysis.analyzeTopicScope).toHaveBeenCalled();
    });

    it("should require goal parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/paths/scope-analyze",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ userId: "user-123" }),
        }
      );

      const response = await scopeAnalyze(request);
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/paths/narrow-suggest", () => {
    it("should return narrowing suggestions", async () => {
      vi.mocked(conceptsService.getUserConcepts).mockResolvedValue([] as any);
      vi.mocked(narrowSuggestLib.suggestNarrowTopics).mockResolvedValue([
        {
          title: "React Hooks Fundamentals",
          description: "Core hooks and mental model.",
          order: 1,
        },
        {
          title: "State Management Patterns",
          description: "When to use context, reducers, and libraries.",
          order: 2,
        },
        {
          title: "Custom Hooks Workshop",
          description: "Build reusable abstractions with hooks.",
          order: 3,
        },
      ] as any);

      const request = new NextRequest(
        "http://localhost:3000/api/paths/narrow-suggest",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            goal: "Front-end web development",
          }),
        }
      );

      const response = await narrowSuggest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.suggestions)).toBe(true);
      expect(data.suggestions.length).toBeGreaterThan(0);
      expect(narrowSuggestLib.suggestNarrowTopics).toHaveBeenCalled();
    });

    it("should require goal parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/paths/narrow-suggest",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userId: "user-123" }),
        }
      );

      const response = await narrowSuggest(request);
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/paths/calibration/wave-1", () => {
    it("should return calibration pills for a goal", async () => {
      vi.mocked(conceptsService.getUserConcepts).mockResolvedValue([] as any);
      vi.mocked(calibrationWave1Lib.getCalibrationWave1).mockResolvedValue([
        { concept: "Promises", reason: "Async flow control" },
        { concept: "Components", reason: "UI building blocks" },
      ] as any);

      const request = new NextRequest(
        "http://localhost:3000/api/paths/calibration/wave-1",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            goal: "Learn React Hooks",
          }),
        }
      );

      const response = await calibrationWave1(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.pills)).toBe(true);
      expect(data.pills[0].concept).toBe("Promises");
      expect(calibrationWave1Lib.getCalibrationWave1).toHaveBeenCalled();
    });

    it("should require goal parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/paths/calibration/wave-1",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userId: "user-123" }),
        }
      );

      const response = await calibrationWave1(request);
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/paths/calibration/wave-2", () => {
    it("should return wave-2 pills when needed", async () => {
      vi.mocked(conceptsService.getUserConcepts).mockResolvedValue([] as any);
      vi.mocked(calibrationWave2Lib.getCalibrationWave2).mockResolvedValue({
        needed: true,
        pills: [
          { concept: "Closures", reason: "JS prerequisite" },
          { concept: "Event Loop", reason: "Async foundation" },
        ],
        reason: "User marked React known but skipped JS fundamentals.",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/paths/calibration/wave-2",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            goal: "Learn React Hooks",
            wave1Pills: [
              { concept: "Promises", reason: "Async flow" },
              { concept: "Components", reason: "UI building blocks" },
            ],
            knownConcepts: ["Components"],
            familiarConcepts: [],
          }),
        }
      );

      const response = await calibrationWave2(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.needed).toBe(true);
      expect(data.pills).toHaveLength(2);
      expect(data.pills[0].concept).toBe("Closures");
      expect(calibrationWave2Lib.getCalibrationWave2).toHaveBeenCalled();
    });

    it("should return needed=false when no wave 2 is needed", async () => {
      vi.mocked(conceptsService.getUserConcepts).mockResolvedValue([] as any);
      vi.mocked(calibrationWave2Lib.getCalibrationWave2).mockResolvedValue({
        needed: false,
        pills: [],
        reason: "User selections paint a clear picture.",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/paths/calibration/wave-2",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            goal: "Learn React Hooks",
            wave1Pills: [
              { concept: "Promises", reason: "Async flow" },
              { concept: "Components", reason: "UI building blocks" },
            ],
            knownConcepts: ["Promises", "Components"],
            familiarConcepts: [],
          }),
        }
      );

      const response = await calibrationWave2(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.needed).toBe(false);
      expect(data.pills).toHaveLength(0);
    });

    it("should require goal parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/paths/calibration/wave-2",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            wave1Pills: [{ concept: "x", reason: "y" }],
          }),
        }
      );

      const response = await calibrationWave2(request);
      expect(response.status).toBe(400);
    });

    it("should require wave1Pills array", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/paths/calibration/wave-2",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            goal: "Learn React Hooks",
          }),
        }
      );

      const response = await calibrationWave2(request);
      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/paths/[pathId]", () => {
    it("should return path details", async () => {
      const mockPath = {
        pathId: "path-123",
        title: "Path Name",
        status: "active",
        milestones: [],
        progress: 0.45,
      };

      vi.mocked(pathsService.getPath).mockResolvedValue(mockPath as any);

      const request = new NextRequest(
        "http://localhost:3000/api/paths/path-123?userId=user-123"
      );

      const response = await getPathDetail(request, {
        params: Promise.resolve({ pathId: "path-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.path.pathId).toBe("path-123");
    });

    it("should return 404 for non-existent path", async () => {
      vi.mocked(pathsService.getPath).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/paths/fake-id?userId=user-123"
      );

      const response = await getPathDetail(request, {
        params: Promise.resolve({ pathId: "fake-id" }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/paths/[pathId]", () => {
    it("should accept a path", async () => {
      vi.mocked(pathsService.acceptPath).mockResolvedValue(undefined);

      const request = new NextRequest(
        "http://localhost:3000/api/paths/path-123",
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ userId: "user-123", action: "accept" }),
        }
      );

      const response = await updatePath(request, {
        params: Promise.resolve({ pathId: "path-123" }),
      });

      expect(response.status).toBe(200);
      expect(pathsService.acceptPath).toHaveBeenCalledWith(
        "user-123",
        "path-123"
      );
    });

    it("should abandon a path", async () => {
      vi.mocked(pathsService.abandonPath).mockResolvedValue(undefined);

      const request = new NextRequest(
        "http://localhost:3000/api/paths/path-123",
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ userId: "user-123", action: "abandon" }),
        }
      );

      const response = await updatePath(request, {
        params: Promise.resolve({ pathId: "path-123" }),
      });

      expect(response.status).toBe(200);
      expect(pathsService.abandonPath).toHaveBeenCalledWith(
        "user-123",
        "path-123"
      );
    });

    it("should insert a prerequisite milestone", async () => {
      vi.mocked(pathsService.getPath).mockResolvedValue({
        pathId: "path-123",
        status: "active",
        currentMilestoneIndex: 1,
        milestones: [{ milestoneId: "m1" }, { milestoneId: "m2" }],
      } as any);
      vi.mocked(pathsService.insertMilestone).mockResolvedValue(undefined);

      const request = new NextRequest(
        "http://localhost:3000/api/paths/path-123",
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            action: "insert_milestone",
            title: "Prerequisite: Functions",
            description: "Bridge gap",
            conceptName: "Functions",
            beforeMilestoneId: "m2",
          }),
        }
      );

      const response = await updatePath(request, {
        params: Promise.resolve({ pathId: "path-123" }),
      });

      expect(response.status).toBe(200);
      expect(pathsService.insertMilestone).toHaveBeenCalled();
    });

    it("should record prerequisite self-assessment as known", async () => {
      vi.mocked(conceptsService.getConcept).mockResolvedValue({
        conceptId: "c1",
        understanding: 0.2,
      } as any);
      vi.mocked(conceptsService.updateConcept).mockResolvedValue(undefined);

      const request = new NextRequest(
        "http://localhost:3000/api/paths/path-123",
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            action: "self_assess_prerequisite_known",
            conceptId: "c1",
            confidence: 0.9,
          }),
        }
      );

      const response = await updatePath(request, {
        params: Promise.resolve({ pathId: "path-123" }),
      });

      expect(response.status).toBe(200);
      expect(conceptsService.updateConcept).toHaveBeenCalled();
    });

    it("should validate action parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/paths/path-123",
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ userId: "user-123", action: "invalid" }),
        }
      );

      const response = await updatePath(request, {
        params: Promise.resolve({ pathId: "path-123" }),
      });

      expect(response.status).toBe(400);
    });
  });
});
