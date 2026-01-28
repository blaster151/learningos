/**
 * Tests for Users API Route
 * /api/users - POST, GET, PATCH
 * 
 * Note: These tests focus on validation logic. Full Firebase integration
 * should be tested via E2E tests with a real or emulated database.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest } from '@/test/apiTestUtils';

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
    it('should return 400 if userId is missing', async () => {
      const { POST } = await import('@/app/api/users/route');
      
      const request = createMockRequest('/api/users', {
        method: 'POST',
        body: {
          email: 'test@example.com',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    }, 15000); // Increase timeout for first test with dynamic import

    it('should return 400 if email is missing', async () => {
      const { POST } = await import('@/app/api/users/route');
      
      const request = createMockRequest('/api/users', {
        method: 'POST',
        body: {
          userId: 'test-user-123',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/users - Validation', () => {
    it('should return 400 if userId is missing', async () => {
      const { GET } = await import('@/app/api/users/route');
      
      const request = createMockRequest('/api/users', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('PATCH /api/users - Validation', () => {
    it('should return 400 if userId is missing', async () => {
      const { PATCH } = await import('@/app/api/users/route');
      
      const request = createMockRequest('/api/users', {
        method: 'PATCH',
        body: {
          learningGoal: 'Updated Goal',
        },
      });

      const response = await PATCH(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
