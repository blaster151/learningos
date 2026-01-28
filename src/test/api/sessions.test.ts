/**
 * Tests for Sessions API Route
 * /api/sessions - POST, GET, PATCH
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
      add: vi.fn(() => Promise.resolve({ id: 'new-session-123' })),
      doc: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({
          exists: true,
          id: 'session-123',
          data: () => ({
            userId: 'test-user-123',
            topic: 'Test Topic',
            status: 'active',
            messageCount: 5,
            totalSessions: 1,
          }),
        })),
        update: vi.fn(() => Promise.resolve()),
      })),
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve({
              docs: [
                {
                  id: 'session-1',
                  data: () => ({
                    userId: 'test-user-123',
                    topic: 'Topic 1',
                    status: 'active',
                    messageCount: 10,
                    startedAt: { toDate: () => new Date() },
                    lastActivity: { toDate: () => new Date() },
                  }),
                },
              ],
            })),
          })),
        })),
      })),
    })),
  })),
}));

describe('Sessions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/sessions - Validation', () => {
    it('should return 400 if userId is missing', async () => {
      const { POST } = await import('@/app/api/sessions/route');
      
      const request = createMockRequest('/api/sessions', {
        method: 'POST',
        body: {
          topic: 'JavaScript Basics',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    }, 15000); // Increase timeout for first test with dynamic import
  });

  describe('GET /api/sessions - Validation', () => {
    it('should return 400 if no userId or sessionId provided', async () => {
      const { GET } = await import('@/app/api/sessions/route');
      
      const request = createMockRequest('/api/sessions', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('PATCH /api/sessions - Validation', () => {
    it('should return 400 if session id is missing', async () => {
      const { PATCH } = await import('@/app/api/sessions/route');
      
      const request = createMockRequest('/api/sessions', {
        method: 'PATCH',
        body: {
          status: 'completed',
        },
      });

      const response = await PATCH(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
