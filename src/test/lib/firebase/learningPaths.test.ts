/**
 * Tests for Learning Paths Firebase Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAdd = vi.fn();
const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockWhere = vi.fn();
const mockDoc = vi.fn();
const mockOrderBy = vi.fn();
const mockCollection = vi.fn();

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => Promise.resolve({
    collection: mockCollection,
  })),
}));

mockCollection.mockImplementation(() => ({
  add: mockAdd,
  where: mockWhere,
  doc: mockDoc,
  orderBy: mockOrderBy,
}));

import { pathsService } from '@/lib/firebase/learningPaths';

describe('Learning Paths Firebase Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockImplementation(() => ({
      add: mockAdd,
      where: mockWhere,
      doc: mockDoc,
      orderBy: mockOrderBy,
    }));
  });

  describe('createPath', () => {
    it('should create a new learning path', async () => {
      mockAdd.mockResolvedValue({ id: 'path-123' });

      const pathData = {
        userId: 'user-123',
        title: 'Master React',
        description: 'Learn React from basics to advanced',
        goal: 'Master React',
        milestones: [],
        estimatedMinutes: 1200,
        status: 'suggested' as const,
        progress: 0,
        currentMilestoneIndex: 0,
        generatedFrom: {
          userGoal: 'Master React',
          knownConceptIds: [],
          userLevel: 'beginner' as const,
        },
        createdAt: { seconds: 123, nanoseconds: 0, toDate: () => new Date(123000), toMillis: () => 123000 },
        lastActivityAt: { seconds: 123, nanoseconds: 0, toDate: () => new Date(123000), toMillis: () => 123000 },
      };

      const result = await pathsService.createPath('user-123', pathData);

      expect(mockAdd).toHaveBeenCalled();
      expect(result).toBe('path-123');
    });
  });

  describe('getPath', () => {
    it('should retrieve a path by ID', async () => {
      const mockPathData = {
        userId: 'user-123',
        title: 'Master React',
        status: 'active',
        progress: 0.25,
        milestones: [],
      };

      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'path-123',
          data: () => mockPathData,
        }),
      });

      const result = await pathsService.getPath('user-123', 'path-123');

      expect(result).toEqual({
        pathId: 'path-123',
        ...mockPathData,
      });
    });

    it('should return null for non-existent path', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: false }),
      });

      const result = await pathsService.getPath('user-123', 'fake-id');
      expect(result).toBeNull();
    });

    it('should return null for path owned by different user', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'other-user' }),
        }),
      });

      const result = await pathsService.getPath('user-123', 'path-123');
      expect(result).toBeNull();
    });
  });

  describe('getUserPaths', () => {
    it('should retrieve all paths for a user', async () => {
      const mockPaths = [
        { id: 'p1', data: () => ({ title: 'Path 1', status: 'active' }) },
        { id: 'p2', data: () => ({ title: 'Path 2', status: 'suggested' }) },
      ];

      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ docs: mockPaths }),
          }),
        }),
        orderBy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: mockPaths }),
        }),
      });

      const result = await pathsService.getUserPaths('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].pathId).toBe('p1');
    });

    it('should filter by status when provided', async () => {
      const mockActivePath = [
        { id: 'p1', data: () => ({ title: 'Active Path', status: 'active' }) },
      ];

      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ docs: mockActivePath }),
          }),
        }),
      });

      const result = await pathsService.getUserPaths('user-123', 'active');

      expect(result).toHaveLength(1);
      expect(result[0].pathId).toBe('p1');
    });
  });

  describe('getActivePath', () => {
    it('should retrieve the active path for a user', async () => {
      const mockPath = {
        id: 'path-active',
        data: () => ({ userId: 'user-123', status: 'active', title: 'Active Path' }),
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

      const result = await pathsService.getActivePath('user-123');

      expect(result).toBeTruthy();
      expect(result?.pathId).toBe('path-active');
    });

    it('should return null when no active path', async () => {
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
          }),
        }),
      });

      const result = await pathsService.getActivePath('user-123');
      expect(result).toBeNull();
    });
  });

  describe('acceptPath', () => {
    it('should activate a suggested path', async () => {
      // Mock no existing active path
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
          }),
        }),
      });

      // The service uses pathRef.update() directly, not pathRef.get().ref.update()
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'user-123', status: 'suggested' }),
        }),
        update: mockUpdate,
      });

      await pathsService.acceptPath('user-123', 'path-123');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        })
      );
    });
  });

  describe('abandonPath', () => {
    it('should mark path as abandoned', async () => {
      // The service uses pathRef.update() directly
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'user-123', status: 'active' }),
        }),
        update: mockUpdate,
      });

      await pathsService.abandonPath('user-123', 'path-123');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'abandoned',
        })
      );
    });
  });
});
