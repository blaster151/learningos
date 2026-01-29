/**
 * Tests for reflections Firebase service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import * as reflectionsService from "@/lib/firebase/reflections";

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => ({
  getAdminDb: vi.fn(),
}));

const { getAdminDb } = await import("@/lib/firebase/admin");

describe("Reflections Firebase Service", () => {
  let mockDb: any;
  let mockCollection: any;
  let mockDoc: any;
  let mockQuery: any;

  beforeEach(() => {
    // Setup mock chain
    mockDoc = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };

    mockQuery = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn(),
    };

    mockCollection = {
      doc: vi.fn(() => mockDoc),
      add: vi.fn(),
      where: vi.fn(() => mockQuery),
      orderBy: vi.fn(() => mockQuery),
      limit: vi.fn(() => mockQuery),
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

  describe("createPrompt", () => {
    it("creates a reflection prompt", async () => {
      mockCollection.add.mockResolvedValue({ id: "prompt-123" });

      const promptData = {
        sessionId: "session-456",
        conceptIds: ["concept-1", "concept-2"],
        promptText: "Explain React Hooks",
        hints: ["Consider useState"],
        minWords: 50,
        maxWords: 200,
      };

      const promptId = await reflectionsService.createPrompt(promptData);

      expect(mockDb.collection).toHaveBeenCalledWith("reflection_prompts");
      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...promptData,
          createdAt: expect.any(Object),
          usedAt: null,
        })
      );
      expect(promptId).toBe("prompt-123");
    });
  });

  describe("getPrompt", () => {
    it("retrieves a prompt by ID", async () => {
      const mockPromptData = {
        sessionId: "session-456",
        conceptIds: ["concept-1"],
        promptText: "Test prompt",
        hints: [],
        minWords: 50,
        maxWords: 200,
        createdAt: Timestamp.now(),
      };

      mockDoc.get.mockResolvedValue({
        exists: true,
        id: "prompt-123",
        data: () => mockPromptData,
      });

      const prompt = await reflectionsService.getPrompt("prompt-123");

      expect(mockDb.collection).toHaveBeenCalledWith("reflection_prompts");
      expect(mockCollection.doc).toHaveBeenCalledWith("prompt-123");
      expect(prompt).toEqual({
        promptId: "prompt-123",
        ...mockPromptData,
      });
    });

    it("returns null for non-existent prompt", async () => {
      mockDoc.get.mockResolvedValue({ exists: false });

      const prompt = await reflectionsService.getPrompt("nonexistent");

      expect(prompt).toBeNull();
    });
  });

  describe("createSubmission", () => {
    it("creates a reflection submission", async () => {
      mockCollection.add.mockResolvedValue({ id: "reflection-123" });

      const submissionData = {
        userId: "user-123",
        sessionId: "session-456",
        promptId: "prompt-789",
        content: "React Hooks are...",
        wordCount: 150,
        skipped: false,
      };

      const reflectionId = await reflectionsService.createSubmission(submissionData);

      expect(mockDb.collection).toHaveBeenCalledWith("reflections");
      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...submissionData,
          submittedAt: expect.any(Object),
        })
      );
      expect(reflectionId).toBe("reflection-123");
    });
  });

  describe("getSubmission", () => {
    it("retrieves a submission by ID", async () => {
      const mockSubmissionData = {
        userId: "user-123",
        sessionId: "session-456",
        promptId: "prompt-789",
        content: "Test content",
        wordCount: 100,
        skipped: false,
        submittedAt: Timestamp.now(),
      };

      mockDoc.get.mockResolvedValue({
        exists: true,
        id: "reflection-123",
        data: () => mockSubmissionData,
      });

      const submission = await reflectionsService.getSubmission("reflection-123");

      expect(submission).toEqual({
        reflectionId: "reflection-123",
        ...mockSubmissionData,
      });
    });
  });

  describe("saveAnalysis", () => {
    it("saves reflection analysis", async () => {
      const analysisData = {
        reflectionId: "reflection-123",
        overallScore: 85,
        strengths: ["Clear explanation"],
        suggestions: ["Add examples"],
        misconceptions: [],
        conceptUpdates: [],
      };

      await reflectionsService.saveAnalysis(analysisData);

      expect(mockDb.collection).toHaveBeenCalledWith("reflection_analyses");
      expect(mockCollection.doc).toHaveBeenCalledWith("reflection-123");
      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          ...analysisData,
          analyzedAt: expect.any(Object),
        })
      );
    });
  });

  describe("getAnalysis", () => {
    it("retrieves analysis by reflection ID", async () => {
      const mockAnalysisData = {
        overallScore: 85,
        strengths: ["Good"],
        suggestions: ["Better"],
        misconceptions: [],
        conceptUpdates: [],
        analyzedAt: Timestamp.now(),
      };

      mockDoc.get.mockResolvedValue({
        exists: true,
        id: "reflection-123",
        data: () => mockAnalysisData,
      });

      const analysis = await reflectionsService.getAnalysis("reflection-123");

      expect(analysis).toEqual({
        reflectionId: "reflection-123",
        ...mockAnalysisData,
      });
    });
  });

  describe("getUserReflections", () => {
    it("retrieves all reflections for a user", async () => {
      const mockReflections = [
        {
          id: "r1",
          data: () => ({
            content: "Reflection 1",
            submittedAt: Timestamp.now(),
          }),
        },
        {
          id: "r2",
          data: () => ({
            content: "Reflection 2",
            submittedAt: Timestamp.now(),
          }),
        },
      ];

      mockQuery.get.mockResolvedValue({ docs: mockReflections });

      const reflections = await reflectionsService.getUserReflections("user-123");

      expect(mockCollection.where).toHaveBeenCalledWith("userId", "==", "user-123");
      expect(mockQuery.orderBy).toHaveBeenCalledWith("submittedAt", "desc");
      expect(reflections).toHaveLength(2);
    });
  });

  describe("getSessionReflections", () => {
    it("retrieves reflections for a session", async () => {
      const mockReflections = [
        {
          id: "r1",
          data: () => ({ content: "Test" }),
        },
      ];

      mockQuery.get.mockResolvedValue({ docs: mockReflections });

      const reflections = await reflectionsService.getSessionReflections("session-456");

      expect(mockCollection.where).toHaveBeenCalledWith("sessionId", "==", "session-456");
      expect(reflections).toHaveLength(1);
    });
  });

  describe("markPromptUsed", () => {
    it("marks a prompt as used", async () => {
      await reflectionsService.markPromptUsed("prompt-123");

      expect(mockCollection.doc).toHaveBeenCalledWith("prompt-123");
      expect(mockDoc.update).toHaveBeenCalledWith({
        usedAt: expect.any(Object),
      });
    });
  });

  describe("getReflectionStats", () => {
    it("calculates reflection statistics", async () => {
      const mockReflections = [
        { id: "r1", data: () => ({ skipped: false }) },
        { id: "r2", data: () => ({ skipped: false }) },
        { id: "r3", data: () => ({ skipped: true }) },
      ];

      const mockAnalyses = [
        { id: "r1", data: () => ({ overallScore: 80 }) },
        { id: "r2", data: () => ({ overallScore: 90 }) },
      ];

      mockQuery.get
        .mockResolvedValueOnce({ docs: mockReflections })
        .mockResolvedValueOnce({ docs: mockAnalyses });

      const stats = await reflectionsService.getReflectionStats("user-123");

      expect(stats.totalReflections).toBe(3);
      expect(stats.completedReflections).toBe(2);
      expect(stats.averageScore).toBe(85);
    });
  });
});
