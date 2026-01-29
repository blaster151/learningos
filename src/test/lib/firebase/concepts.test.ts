/**
 * Tests for Concepts Firebase Service
 * 
 * These tests verify the conceptsService methods work correctly
 * by mocking the Firebase Admin SDK.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase Admin
const mockAdd = vi.fn();
const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => Promise.resolve({
    collection: mockCollection,
  })),
}));

// Set up mock collection to return proper chainable interface
mockCollection.mockImplementation(() => ({
  add: mockAdd,
  where: mockWhere,
  orderBy: mockOrderBy,
  doc: mockDoc,
}));

import { conceptsService } from '@/lib/firebase/concepts';

describe('Concepts Firebase Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock chain
    mockCollection.mockImplementation(() => ({
      add: mockAdd,
      where: mockWhere,
      orderBy: mockOrderBy,
      doc: mockDoc,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createConcept', () => {
    it('should create a new concept and return its ID', async () => {
      mockAdd.mockResolvedValue({ id: 'concept-123' });

      const mockConcept = {
        name: 'closures',
        definition: 'Functions that capture variables',
        domain: 'programming',
        userId: 'user-123',
        confidence: 0.5,
        understanding: 0.3,
        masteryLevel: 'exploring' as const,
        firstEncountered: { seconds: 123, nanoseconds: 0 },
        lastReviewed: { seconds: 123, nanoseconds: 0 },
        sessionIds: [],
        definitionHistory: [],
        isEmergent: false,
      };

      const result = await conceptsService.createConcept('user-123', mockConcept);

      expect(mockAdd).toHaveBeenCalled();
      expect(result).toBe('concept-123');
    });
  });

  describe('getConcept', () => {
    it('should retrieve a concept by ID', async () => {
      const mockConceptData = {
        userId: 'user-123',
        name: 'closures',
        definition: 'Functions that capture variables',
        masteryLevel: 'learning',
      };

      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'concept-123',
          data: () => mockConceptData,
        }),
      });

      const result = await conceptsService.getConcept('user-123', 'concept-123');

      expect(result).toEqual({
        conceptId: 'concept-123',
        ...mockConceptData,
      });
    });

    it('should return null for non-existent concept', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: false,
        }),
      });

      const result = await conceptsService.getConcept('user-123', 'fake-id');
      expect(result).toBeNull();
    });

    it('should return null for concept owned by different user', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'other-user' }),
        }),
      });

      const result = await conceptsService.getConcept('user-123', 'concept-123');
      expect(result).toBeNull();
    });
  });

  describe('getUserConcepts', () => {
    it('should retrieve all concepts for a user', async () => {
      const mockConcepts = [
        { id: 'c1', data: () => ({ name: 'concept1', masteryLevel: 'learning' }) },
        { id: 'c2', data: () => ({ name: 'concept2', masteryLevel: 'mastered' }) },
      ];

      mockWhere.mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: mockConcepts }),
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ docs: mockConcepts }),
          }),
        }),
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ docs: mockConcepts }),
          }),
        }),
      });

      const result = await conceptsService.getUserConcepts('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].conceptId).toBe('c1');
      expect(result[1].conceptId).toBe('c2');
    });

    it('should return empty array when user has no concepts', async () => {
      mockWhere.mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: [] }),
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ docs: [] }),
          }),
        }),
      });

      const result = await conceptsService.getUserConcepts('user-123');
      expect(result).toEqual([]);
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

      const result = await conceptsService.findConceptByName('user-123', 'closures');
      expect(result).toBeTruthy();
      expect(result?.conceptId).toBe('c1');
    });

    it('should return null when concept not found', async () => {
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
          }),
        }),
      });

      const result = await conceptsService.findConceptByName('user-123', 'nonexistent');
      expect(result).toBeNull();
    });
  });
});

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
