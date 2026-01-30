/**
 * Tests for Concepts API Route
 * /api/concepts - POST, GET
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

// Mock Firebase Admin
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => Promise.resolve({
    collection: vi.fn((collectionName: string) => {
      if (collectionName === 'concepts') {
        return {
          add: vi.fn(() => Promise.resolve({ id: 'new-concept-123' })),
          where: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => ({
                get: vi.fn(() => Promise.resolve({
                  empty: true,
                  docs: [],
                })),
              })),
            })),
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                get: vi.fn(() => Promise.resolve({
                  docs: [
                    {
                      id: 'concept-1',
                      data: () => ({
                        userId: 'test-user-123',
                        name: 'closures',
                        displayName: 'Closures',
                        description: 'Functions that capture variables',
                        category: 'programming',
                        masteryLevel: 45,
                        exposureCount: 3,
                        lastPracticed: { toDate: () => new Date() },
                        createdAt: { toDate: () => new Date() },
                      }),
                    },
                    {
                      id: 'concept-2',
                      data: () => ({
                        userId: 'test-user-123',
                        name: 'promises',
                        displayName: 'Promises',
                        description: 'Async handling in JS',
                        category: 'programming',
                        masteryLevel: 80,
                        exposureCount: 8,
                        lastPracticed: { toDate: () => new Date() },
                        createdAt: { toDate: () => new Date() },
                      }),
                    },
                  ],
                })),
              })),
            })),
          })),
        };
      }
      return {};
    }),
  })),
}));

describe('Concepts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/concepts - Validation', () => {
    it('should allow creating a concept without userId in body', async () => {
      const { POST } = await import('@/app/api/concepts/route');
      
      const request = createMockRequest('/api/concepts', {
        method: 'POST',
        body: {
          name: 'React Hooks',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    }, 15000); // Increase timeout for first test with dynamic import

    it('should return 400 if name is missing', async () => {
      const { POST } = await import('@/app/api/concepts/route');
      
      const request = createMockRequest('/api/concepts', {
        method: 'POST',
        body: {
          userId: 'test-user-123',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/concepts', () => {
    it('should return concepts for a user', async () => {
      const { GET } = await import('@/app/api/concepts/route');
      
      const request = createMockRequest('/api/concepts', {
        method: 'GET',
        searchParams: { userId: 'test-user-123' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.concepts).toBeDefined();
      expect(Array.isArray(data.concepts)).toBe(true);
      expect(data.stats).toBeDefined();
    });

    it('should return stats with concepts', async () => {
      const { GET } = await import('@/app/api/concepts/route');
      
      const request = createMockRequest('/api/concepts', {
        method: 'GET',
        searchParams: { userId: 'test-user-123' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.stats.total).toBeDefined();
      expect(data.stats.avgMastery).toBeDefined();
      expect(data.stats.mastered).toBeDefined();
      expect(data.stats.learning).toBeDefined();
      expect(data.stats.new).toBeDefined();
    });

    it('should return concepts without userId param', async () => {
      const { GET } = await import('@/app/api/concepts/route');
      
      const request = createMockRequest('/api/concepts', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should support sorting by mastery level', async () => {
      const { GET } = await import('@/app/api/concepts/route');
      
      const request = createMockRequest('/api/concepts', {
        method: 'GET',
        searchParams: { 
          userId: 'test-user-123',
          sortBy: 'masteryLevel',
        },
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});
