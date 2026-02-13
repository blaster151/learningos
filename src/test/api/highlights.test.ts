/**
 * Tests for Highlights API Route
 * /api/highlights - GET, POST, DELETE
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest } from '@/test/apiTestUtils';

// Mock server auth
vi.mock('@/lib/auth/serverAuth', () => {
  class AuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }

  return {
    requireAuthUser: vi.fn(async () => ({ uid: 'test-user-123', email: 'test@example.com' })),
    assertSameUser: (requestedUserId: string | null | undefined, authedUserId: string) => {
      if (!requestedUserId) return;
      if (requestedUserId !== authedUserId) throw new AuthError('Forbidden', 403);
    },
    AuthError,
    authErrorResponse: (error: unknown) => {
      if (error instanceof AuthError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return null;
    },
  };
});

// Mock Firestore data store
const mockHighlights = new Map<string, Record<string, unknown>>();
let nextId = 1;

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => Promise.resolve({
    collection: vi.fn((name: string) => {
      if (name === 'highlights') {
        return {
          where: vi.fn(function (this: unknown, field: string, _op: string, value: unknown) {
            const chainable = {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              where: vi.fn(function (_f: string, _o: string, _v: unknown) { return chainable; }),
              orderBy: vi.fn(function () { return chainable; }),
              get: vi.fn(async () => {
                const docs = Array.from(mockHighlights.entries())
                  .filter(([, data]) => data[field] === value)
                  .map(([id, data]) => ({
                    id,
                    data: () => data,
                  }));
                return { docs };
              }),
            };
            return chainable;
          }),
          add: vi.fn(async (data: Record<string, unknown>) => {
            const id = `highlight-${nextId++}`;
            mockHighlights.set(id, data);
            return { id };
          }),
          doc: vi.fn((id: string) => ({
            get: vi.fn(async () => {
              const data = mockHighlights.get(id);
              return {
                exists: !!data,
                data: () => data,
              };
            }),
            delete: vi.fn(async () => {
              mockHighlights.delete(id);
            }),
          })),
        };
      }
      return {};
    }),
  })),
}));

describe('Highlights API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHighlights.clear();
    nextId = 1;
  });

  describe('POST /api/highlights - Create', () => {
    it('should create a highlight successfully', async () => {
      const { POST } = await import('@/app/api/highlights/route');

      const request = createMockRequest('/api/highlights', {
        method: 'POST',
        body: {
          sessionId: 'session-1',
          messageId: 'msg-1',
          text: 'This is an important concept',
          startOffset: 10,
          endOffset: 38,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.highlight).toBeDefined();
      expect(data.highlight.highlightId).toBe('highlight-1');
      expect(data.highlight.text).toBe('This is an important concept');
      expect(data.highlight.sessionId).toBe('session-1');
      expect(data.highlight.messageId).toBe('msg-1');
      expect(data.highlight.userId).toBe('test-user-123');
    }, 15000);

    it('should create a highlight with a note', async () => {
      const { POST } = await import('@/app/api/highlights/route');

      const request = createMockRequest('/api/highlights', {
        method: 'POST',
        body: {
          sessionId: 'session-1',
          messageId: 'msg-1',
          text: 'Key idea here',
          startOffset: 0,
          endOffset: 13,
          note: 'Review this later',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.highlight.note).toBe('Review this later');
    });

    it('should return 400 if required fields are missing', async () => {
      const { POST } = await import('@/app/api/highlights/route');

      const request = createMockRequest('/api/highlights', {
        method: 'POST',
        body: {
          sessionId: 'session-1',
          // missing messageId, text, startOffset, endOffset
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/highlights - List', () => {
    it('should return highlights for a user', async () => {
      // Seed some highlights
      mockHighlights.set('h1', {
        userId: 'test-user-123',
        sessionId: 'session-1',
        messageId: 'msg-1',
        text: 'First highlight',
        startOffset: 0,
        endOffset: 15,
        createdAt: { seconds: 1000, nanoseconds: 0 },
      });
      mockHighlights.set('h2', {
        userId: 'test-user-123',
        sessionId: 'session-1',
        messageId: 'msg-2',
        text: 'Second highlight',
        startOffset: 5,
        endOffset: 21,
        createdAt: { seconds: 2000, nanoseconds: 0 },
      });

      const { GET } = await import('@/app/api/highlights/route');

      const request = createMockRequest('/api/highlights', {
        method: 'GET',
        searchParams: { userId: 'test-user-123' },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.highlights).toBeDefined();
      expect(data.highlights.length).toBe(2);
    });

    it('should return 403 for mismatched userId', async () => {
      const { GET } = await import('@/app/api/highlights/route');

      const request = createMockRequest('/api/highlights', {
        method: 'GET',
        searchParams: { userId: 'other-user' },
      });

      const response = await GET(request);
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/highlights - Remove', () => {
    it('should delete a highlight owned by the user', async () => {
      mockHighlights.set('h1', {
        userId: 'test-user-123',
        sessionId: 'session-1',
        messageId: 'msg-1',
        text: 'To delete',
        startOffset: 0,
        endOffset: 9,
      });

      const { DELETE } = await import('@/app/api/highlights/route');

      const request = createMockRequest('/api/highlights', {
        method: 'DELETE',
        searchParams: { highlightId: 'h1' },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toBe('Highlight deleted');
    });

    it('should return 400 if highlightId is missing', async () => {
      const { DELETE } = await import('@/app/api/highlights/route');

      const request = createMockRequest('/api/highlights', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent highlight', async () => {
      const { DELETE } = await import('@/app/api/highlights/route');

      const request = createMockRequest('/api/highlights', {
        method: 'DELETE',
        searchParams: { highlightId: 'nonexistent' },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(404);
    });

    it('should return 403 for highlight owned by another user', async () => {
      mockHighlights.set('h-other', {
        userId: 'other-user',
        sessionId: 'session-1',
        messageId: 'msg-1',
        text: 'Not yours',
        startOffset: 0,
        endOffset: 9,
      });

      const { DELETE } = await import('@/app/api/highlights/route');

      const request = createMockRequest('/api/highlights', {
        method: 'DELETE',
        searchParams: { highlightId: 'h-other' },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(403);
    });
  });
});
