/**
 * Tests for Learning Paths Firebase Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';

const mockAdd = vi.fn();
const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockWhere = vi.fn();
const mockDoc = vi.fn();
const mockOrderBy = vi.fn();

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      add: mockAdd,
      where: mockWhere,
      doc: mockDoc,
    })),
  })),
}));

import {
  createPath,
  getPath,
  getUserPaths,
  getActivePath,
  acceptPath,
  updatePathProgress,
  completeMilestone,
  abandonPath,
} from '@/lib/firebase/learningPaths';

describe('Learning Paths Firebase Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPath', () => {
    it('should create a new learning path', async () => {
      mockAdd.mockResolvedValue({ id: 'path-123' });

      const pathData = {
        userId: 'user-123',
        name: 'Master React',
        description: 'Learn React from basics to advanced',
        milestones: [
          {
            id: 'm1',
            title: 'Learn JSX',
            description: 'Understand JSX syntax',
            requiredConcepts: ['jsx', 'components'],
            estimatedHours: 2,
            status: 'available' as const,
            progress: 0,
          },
        ],
        estimatedHours: 20,
        status: 'suggested' as const,
      };

      const result = await createPath(pathData);

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          name: 'Master React',
          status: 'suggested',
          progressPercentage: 0,
        })
      );
      expect(result).toBe('path-123');
    });
  });

  describe('getPath', () => {
    it('should retrieve a path by ID', async () => {
      const mockPathData = {
        userId: 'user-123',
        name: 'Master React',
        status: 'active',
        progressPercentage: 25,
        milestones: [],
      };

      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'path-123',
          data: () => mockPathData,
        }),
      });

      const result = await getPath('user-123', 'path-123');

      expect(result).toEqual({
        id: 'path-123',
        ...mockPathData,
      });
    });

    it('should enforce ownership', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'other-user' }),
        }),
      });

      const result = await getPath('user-123', 'path-123');
      expect(result).toBeNull();
    });
  });

  describe('getActivePath', () => {
    it('should retrieve the active path for a user', async () => {
      const mockPath = {
        id: 'path-active',
        data: () => ({ userId: 'user-123', status: 'active', name: 'Active Path' }),
      };

      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              empty: false,
              docs: [mockPath],
            }),
          }),
        }),
      });

      const result = await getActivePath('user-123');

      expect(result).toBeTruthy();
      expect(result?.id).toBe('path-active');
    });

    it('should return null when no active path', async () => {
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ empty: true }),
          }),
        }),
      });

      const result = await getActivePath('user-123');
      expect(result).toBeNull();
    });
  });

  describe('acceptPath', () => {
    it('should activate a suggested path', async () => {
      // Mock active path check
      mockWhere.mockReturnValueOnce({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ empty: true }),
          }),
        }),
      });

      // Mock path retrieval
      const mockUpdate = vi.fn();
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'user-123', status: 'suggested' }),
          ref: { update: mockUpdate },
        }),
      });

      await acceptPath('user-123', 'path-123');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        })
      );
    });

    it('should prevent multiple active paths', async () => {
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              empty: false,
              docs: [{ id: 'existing-active' }],
            }),
          }),
        }),
      });

      await expect(acceptPath('user-123', 'path-123')).rejects.toThrow(
        'already have an active path'
      );
    });
  });

  describe('completeMilestone', () => {
    it('should mark milestone as completed', async () => {
      const mockMilestones = [
        { id: 'm1', status: 'completed', progress: 100 },
        { id: 'm2', status: 'in-progress', progress: 50 },
        { id: 'm3', status: 'locked', progress: 0 },
      ];

      const mockUpdate = vi.fn();
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            userId: 'user-123',
            milestones: mockMilestones,
            status: 'active',
          }),
          ref: { update: mockUpdate },
        }),
      });

      await completeMilestone('user-123', 'path-123', 'm2');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          milestones: expect.arrayContaining([
            expect.objectContaining({
              id: 'm2',
              status: 'completed',
              progress: 100,
            }),
          ]),
        })
      );
    });

    it('should complete path when all milestones done', async () => {
      const mockMilestones = [
        { id: 'm1', status: 'completed', progress: 100 },
        { id: 'm2', status: 'in-progress', progress: 80 },
      ];

      const mockUpdate = vi.fn();
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            userId: 'user-123',
            milestones: mockMilestones,
            status: 'active',
          }),
          ref: { update: mockUpdate },
        }),
      });

      await completeMilestone('user-123', 'path-123', 'm2');

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.status).toBe('completed');
      expect(updateCall.progressPercentage).toBe(100);
    });
  });

  describe('abandonPath', () => {
    it('should mark path as abandoned', async () => {
      const mockUpdate = vi.fn();
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'user-123', status: 'active' }),
          ref: { update: mockUpdate },
        }),
      });

      await abandonPath('user-123', 'path-123');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'abandoned',
        })
      );
    });
  });
});
