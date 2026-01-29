/**
 * Tests for Concepts Firebase Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';

// Mock Firebase Admin
const mockGet = vi.fn();
const mockAdd = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockDoc = vi.fn();

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      add: mockAdd,
      where: mockWhere,
      orderBy: mockOrderBy,
      doc: mockDoc,
    })),
  })),
}));

import {
  createConcept,
  getConcept,
  getUserConcepts,
  updateConcept,
  deleteConcept,
  findConceptByName,
  getConceptsByIds,
  searchConcepts,
} from '@/lib/firebase/concepts';

describe('Concepts Firebase Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createConcept', () => {
    it('should create a new concept with all fields', async () => {
      const mockRef = { id: 'concept-123' };
      mockAdd.mockResolvedValue(mockRef);

      const result = await createConcept(
        'user-123',
        'closures',
        'Closures',
        'Functions that capture variables',
        'programming'
      );

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          name: 'closures',
          displayName: 'Closures',
          description: 'Functions that capture variables',
          category: 'programming',
          masteryLevel: 0,
          exposureCount: 1,
          sessionIds: [],
        })
      );
      expect(result).toBe('concept-123');
    });

    it('should handle creation errors', async () => {
      mockAdd.mockRejectedValue(new Error('Database error'));

      await expect(
        createConcept('user-123', 'test', 'Test', 'Desc', 'cat')
      ).rejects.toThrow('Failed to create concept');
    });
  });

  describe('getConcept', () => {
    it('should retrieve a concept by ID', async () => {
      const mockConceptData = {
        userId: 'user-123',
        name: 'closures',
        displayName: 'Closures',
        masteryLevel: 50,
      };

      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'concept-123',
          data: () => mockConceptData,
        }),
      });

      const result = await getConcept('user-123', 'concept-123');

      expect(result).toEqual({
        id: 'concept-123',
        ...mockConceptData,
      });
    });

    it('should return null for non-existent concept', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: false,
        }),
      });

      const result = await getConcept('user-123', 'fake-id');
      expect(result).toBeNull();
    });

    it('should enforce ownership', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'other-user' }),
        }),
      });

      const result = await getConcept('user-123', 'concept-123');
      expect(result).toBeNull();
    });
  });

  describe('getUserConcepts', () => {
    it('should retrieve all concepts for a user', async () => {
      const mockConcepts = [
        { id: 'c1', data: () => ({ name: 'concept1', masteryLevel: 30 }) },
        { id: 'c2', data: () => ({ name: 'concept2', masteryLevel: 60 }) },
      ];

      mockWhere.mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: mockConcepts }),
        }),
      });

      const result = await getUserConcepts('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('c1');
      expect(result[1].id).toBe('c2');
    });

    it('should handle empty results', async () => {
      mockWhere.mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: [] }),
        }),
      });

      const result = await getUserConcepts('user-123');
      expect(result).toEqual([]);
    });
  });

  describe('updateConcept', () => {
    it('should update concept fields', async () => {
      const mockRef = { update: mockUpdate };
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'user-123' }),
          ref: mockRef,
        }),
      });

      await updateConcept('user-123', 'concept-123', {
        masteryLevel: 75,
        description: 'Updated description',
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          masteryLevel: 75,
          description: 'Updated description',
        })
      );
    });

    it('should throw error for non-existent concept', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: false }),
      });

      await expect(
        updateConcept('user-123', 'fake-id', { masteryLevel: 50 })
      ).rejects.toThrow('Concept not found');
    });
  });

  describe('findConceptByName', () => {
    it('should find concept by exact name match', async () => {
      const mockConcept = {
        id: 'c1',
        data: () => ({ name: 'closures', userId: 'user-123' }),
      };

      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              empty: false,
              docs: [mockConcept],
            }),
          }),
        }),
      });

      const result = await findConceptByName('user-123', 'closures');
      expect(result).toBeTruthy();
      expect(result?.id).toBe('c1');
    });

    it('should return null when not found', async () => {
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ empty: true }),
          }),
        }),
      });

      const result = await findConceptByName('user-123', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('searchConcepts', () => {
    it('should search concepts by query string', async () => {
      const mockResults = [
        { id: 'c1', data: () => ({ name: 'closures', displayName: 'Closures' }) },
        { id: 'c2', data: () => ({ name: 'promises', displayName: 'Promises' }) },
      ];

      mockWhere.mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: mockResults }),
      });

      const result = await searchConcepts('user-123', 'clo');
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBe('c1');
    });

    it('should handle empty search results', async () => {
      mockWhere.mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: [] }),
      });

      const result = await searchConcepts('user-123', 'xyz');
      expect(result).toEqual([]);
    });
  });
});
