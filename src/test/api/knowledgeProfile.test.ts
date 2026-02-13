/**
 * Tests for Knowledge Profile API Routes (E18-S6)
 * GET  /api/profile/knowledge
 * POST /api/profile/knowledge
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock knowledge profile service
vi.mock("@/lib/firebase/knowledgeProfile", () => ({
  knowledgeProfileService: {
    getProfile: vi.fn(),
    upsertEntries: vi.fn(),
  },
}));

// Mock server auth
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

import {
  GET as getProfile,
  POST as postProfile,
} from "@/app/api/profile/knowledge/route";
import { knowledgeProfileService } from "@/lib/firebase/knowledgeProfile";

describe("Knowledge Profile API Routes (E18-S6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/profile/knowledge", () => {
    it("should return the user's knowledge profile", async () => {
      const mockEntries = [
        { userId: "user-123", concept: "closures", confidence: 1.0, source: "calibration" },
        { userId: "user-123", concept: "promises", confidence: 0.5, source: "calibration" },
      ];

      vi.mocked(knowledgeProfileService.getProfile).mockResolvedValue(
        mockEntries as any
      );

      const request = new NextRequest(
        "http://localhost:3000/api/profile/knowledge?userId=user-123"
      );

      const response = await getProfile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.entries).toHaveLength(2);
      expect(data.entries[0].concept).toBe("closures");
      expect(data.entries[0].confidence).toBe(1.0);
      expect(knowledgeProfileService.getProfile).toHaveBeenCalledWith(
        "user-123"
      );
    });

    it("should return empty entries for a user with no profile", async () => {
      vi.mocked(knowledgeProfileService.getProfile).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/profile/knowledge"
      );

      const response = await getProfile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.entries).toHaveLength(0);
    });
  });

  describe("POST /api/profile/knowledge", () => {
    it("should upsert knowledge entries and return updated profile", async () => {
      vi.mocked(knowledgeProfileService.upsertEntries).mockResolvedValue(
        undefined
      );
      vi.mocked(knowledgeProfileService.getProfile).mockResolvedValue([
        { userId: "user-123", concept: "closures", confidence: 1.0, source: "calibration" },
        { userId: "user-123", concept: "promises", confidence: 0.5, source: "calibration" },
      ] as any);

      const request = new NextRequest(
        "http://localhost:3000/api/profile/knowledge",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            entries: [
              { concept: "closures", confidence: 1.0 },
              { concept: "promises", confidence: 0.5 },
            ],
          }),
        }
      );

      const response = await postProfile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.entries).toHaveLength(2);
      expect(knowledgeProfileService.upsertEntries).toHaveBeenCalledWith(
        "user-123",
        [
          { concept: "closures", confidence: 1.0 },
          { concept: "promises", confidence: 0.5 },
        ]
      );
    });

    it("should require entries array", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/profile/knowledge",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userId: "user-123" }),
        }
      );

      const response = await postProfile(request);
      expect(response.status).toBe(400);
    });

    it("should reject entries with missing concept", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/profile/knowledge",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            entries: [{ confidence: 1.0 }],
          }),
        }
      );

      const response = await postProfile(request);
      expect(response.status).toBe(400);
    });

    it("should reject entries with invalid confidence", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/profile/knowledge",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            entries: [{ concept: "closures", confidence: 2.0 }],
          }),
        }
      );

      const response = await postProfile(request);
      expect(response.status).toBe(400);
    });

    it("should reject empty entries array", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/profile/knowledge",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            entries: [],
          }),
        }
      );

      const response = await postProfile(request);
      expect(response.status).toBe(400);
    });
  });
});
