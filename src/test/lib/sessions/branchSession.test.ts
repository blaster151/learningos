/**
 * Tests for Session Branching Logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn();
const mockAdd = vi.fn();
const mockUpdate = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => Promise.resolve({
    collection: mockCollection,
  })),
}));

mockCollection.mockImplementation(() => ({
  add: mockAdd,
  doc: mockDoc,
}));

import { branchSession, returnToParentSession } from '@/lib/sessions/branchSession';

describe('Session Branching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockImplementation(() => ({
      add: mockAdd,
      doc: mockDoc,
    }));
  });

  describe('branchSession', () => {
    it('should create a branch from parent session', async () => {
      const mockParentData = {
        userId: 'user-123',
        topic: 'Parent Topic',
        pathId: 'path-123',
        status: 'active',
        conceptsCovered: ['concept1', 'concept2'],
      };

      // First call returns parent session, subsequent calls handle branch
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'parent-123',
          data: () => mockParentData,
        }),
      });

      mockAdd.mockResolvedValue({
        id: 'branch-456',
        get: vi.fn().mockResolvedValue({
          id: 'branch-456',
          data: () => ({
            userId: 'user-123',
            topic: 'Branch Topic',
            parentSessionId: 'parent-123',
          }),
        }),
      });

      const result = await branchSession('user-123', 'parent-123', 'Branch Topic');

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          topic: 'Branch Topic',
          parentSessionId: 'parent-123',
          pathId: 'path-123',
          status: 'active',
        })
      );
      expect(result.parentSessionId).toBe('parent-123');
    });

    it('should throw error for non-existent parent', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: false }),
      });

      await expect(
        branchSession('user-123', 'fake-parent', 'Branch Topic')
      ).rejects.toThrow('Parent session not found');
    });

    it('should enforce ownership when branching', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'other-user' }),
        }),
      });

      await expect(
        branchSession('user-123', 'parent-123', 'Branch Topic')
      ).rejects.toThrow('Not authorized');
    });
  });

  describe('returnToParentSession', () => {
    it('should close branch and reactivate parent', async () => {
      const mockBranchUpdate = vi.fn();
      const mockParentUpdate = vi.fn();

      // The doc method is called twice - once for branch, once for parent
      mockDoc.mockImplementation((id: string) => {
        return {
          get: vi.fn().mockResolvedValue({
            exists: true,
            id,
            data: () =>
              id === 'branch-123'
                ? { userId: 'user-123', parentSessionId: 'parent-123', status: 'active' }
                : { userId: 'user-123', status: 'paused' },
            ref: {
              update: id === 'branch-123' ? mockBranchUpdate : mockParentUpdate,
            },
          }),
        };
      });

      const result = await returnToParentSession('user-123', 'branch-123');

      expect(mockBranchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
        })
      );
      expect(mockParentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        })
      );
      expect(result.sessionId).toBe('parent-123');
    });

    it('should throw error if session is not a branch', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'user-123', parentSessionId: null }),
          ref: { update: vi.fn() },
        }),
      });

      await expect(
        returnToParentSession('user-123', 'session-123')
      ).rejects.toThrow('not a branch');
    });

    it('should enforce ownership when returning', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'other-user', parentSessionId: 'parent-123' }),
          ref: { update: vi.fn() },
        }),
      });

      await expect(
        returnToParentSession('user-123', 'branch-123')
      ).rejects.toThrow('Not authorized');
    });
  });
});
