/**
 * Tests for Users API Route
 * /api/users - POST, GET, PATCH
 * 
 * Note: These tests focus on validation logic. Full Firebase integration
 * should be tested via E2E tests with a real or emulated database.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest } from '@/test/apiTestUtils';

// Mock server auth (avoid requiring real Firebase Admin credentials)
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
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({
          exists: true,
          id: 'test-user-123',
          data: () => ({
            userId: 'test-user-123',
            email: 'test@example.com',
            displayName: 'Test User',
            learningGoal: 'Learn programming',
            preferredPace: 'moderate',
          }),
        })),
        set: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve()),
      })),
    })),
  })),
}));

describe('Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/users - Validation', () => {
    it('should return 403 if userId mismatches auth', async () => {
      const { POST } = await import('@/app/api/users/route');
      
      const request = createMockRequest('/api/users', {
        method: 'POST',
        body: {
          userId: 'other-user',
          email: 'test@example.com',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBeDefined();
    }, 15000); // Increase timeout for first test with dynamic import

    it('should return 403 if email mismatches auth', async () => {
      const { POST } = await import('@/app/api/users/route');
      
      const request = createMockRequest('/api/users', {
        method: 'POST',
        body: {
          userId: 'test-user-123',
          email: 'other@example.com',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/users - Validation', () => {
    it('should return user profile without userId param', async () => {
      const { GET } = await import('@/app/api/users/route');
      
      const request = createMockRequest('/api/users', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeDefined();
    });
  });

  describe('PATCH /api/users - Validation', () => {
    it('should return 400 if no fields are provided', async () => {
      const { PATCH } = await import('@/app/api/users/route');
      
      const request = createMockRequest('/api/users', {
        method: 'PATCH',
        body: {},
      });

      const response = await PATCH(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
