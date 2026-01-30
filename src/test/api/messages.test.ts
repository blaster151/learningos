/**
 * Tests for Messages API Route
 * /api/messages - GET
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
      if (collectionName === 'sessions') {
        return {
          doc: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve({
              exists: true,
              data: () => ({ userId: 'test-user-123' }),
            })),
          })),
        };
      }
      if (collectionName === 'messages') {
        return {
          doc: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve({
              exists: true,
            })),
          })),
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                startAfter: vi.fn(() => ({
                  get: vi.fn(() => Promise.resolve({
                    docs: [],
                  })),
                })),
                get: vi.fn(() => Promise.resolve({
                  docs: [
                    {
                      id: 'msg-1',
                      data: () => ({
                        sessionId: 'session-123',
                        role: 'user',
                        content: 'What is a closure?',
                        timestamp: { toDate: () => new Date() },
                        conceptIds: [],
                      }),
                    },
                    {
                      id: 'msg-2',
                      data: () => ({
                        sessionId: 'session-123',
                        role: 'assistant',
                        content: 'A closure is a function that...',
                        timestamp: { toDate: () => new Date() },
                        conceptIds: ['concept-closures'],
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

describe('Messages API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/messages', () => {
    it('should return messages for a session', async () => {
      const { GET } = await import('@/app/api/messages/route');
      
      const request = createMockRequest('/api/messages', {
        method: 'GET',
        searchParams: { sessionId: 'session-123' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.messages).toBeDefined();
      expect(Array.isArray(data.messages)).toBe(true);
    });

    it('should return messages array from mock', async () => {
      const { GET } = await import('@/app/api/messages/route');
      
      const request = createMockRequest('/api/messages', {
        method: 'GET',
        searchParams: { sessionId: 'session-123' },
      });

      const response = await GET(request);
      const data = await response.json();

      // Just verify we get messages back from the mock
      expect(data.messages).toBeDefined();
      expect(data.messages.length).toBeGreaterThan(0);
      // Verify message structure
      expect(data.messages[0]).toHaveProperty('role');
      expect(data.messages[0]).toHaveProperty('content');
    });

    it('should return hasMore pagination flag', async () => {
      const { GET } = await import('@/app/api/messages/route');
      
      const request = createMockRequest('/api/messages', {
        method: 'GET',
        searchParams: { sessionId: 'session-123' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.hasMore).toBeDefined();
      expect(typeof data.hasMore).toBe('boolean');
    });

    it('should return 400 if sessionId is missing', async () => {
      const { GET } = await import('@/app/api/messages/route');
      
      const request = createMockRequest('/api/messages', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should support limit parameter', async () => {
      const { GET } = await import('@/app/api/messages/route');
      
      const request = createMockRequest('/api/messages', {
        method: 'GET',
        searchParams: { 
          sessionId: 'session-123',
          limit: '10',
        },
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});
