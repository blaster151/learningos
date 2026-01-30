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
      doc: mockDoc,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockConceptData = {
    name: 'closures',
    displayName: 'Closures',
    description: 'Understanding JavaScript closures',
    domain: 'javascript',
    masteryLevel: 'learning' as const,
    confidenceScore: 0.6,
    userId: 'user-123',
  };

  describe('createConcept', () => {
    it('should create a new concept and return its ID', async () => {
      mockAdd.mockResolvedValue({ id: 'new-concept-id' });

      const result = await conceptsService.createConcept('user-123', {
        name: 'closures',
        definition: 'Understanding closures',
        domain: 'javascript',
        masteryLevel: 'learning',
        confidence: 0.5,
        understanding: 0.5,
        userId: 'user-123',
        firstEncountered: { seconds: 1000, nanoseconds: 0, toDate: () => new Date(), toMillis: () => 1000000 },
        lastReviewed: { seconds: 1000, nanoseconds: 0, toDate: () => new Date(), toMillis: () => 1000000 },
        sessionIds: [],
        isEmergent: false,
        discoveredBy: 'system',
        definitionHistory: [],
      });

      expect(result).toBe('new-concept-id');
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'closures',
          userId: 'user-123',
        })
      );
    });
  });

  describe('getConcept', () => {
    it('should retrieve a concept by ID', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'concept-123',
          data: () => mockConceptData,
        }),
      });

      const result = await conceptsService.getConcept('user-123', 'concept-123');

      expect(result).toMatchObject({
        conceptId: 'concept-123',
        name: 'closures',
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
        { id: 'c2', data: () => ({ name: 'concept2', masteryLevel: 'comfortable' }) },
      ];

      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: mockConcepts }),
      });

      const result = await conceptsService.getUserConcepts('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].conceptId).toBe('c1');
      expect(result[1].conceptId).toBe('c2');
    });

    it('should return empty array when user has no concepts', async () => {
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: [] }),
      });

      const result = await conceptsService.getUserConcepts('user-123');
      expect(result).toEqual([]);
    });

    it('should apply domain filter', async () => {
      const mockConcepts = [
        { id: 'c1', data: () => ({ name: 'concept1', domain: 'javascript' }) },
      ];

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: mockConcepts }),
      };
      mockWhere.mockReturnValue(mockWhereChain);

      const result = await conceptsService.getUserConcepts('user-123', { domain: 'javascript' });

      expect(result).toHaveLength(1);
      expect(mockWhereChain.where).toHaveBeenCalledWith('domain', '==', 'javascript');
    });

    it('should apply masteryLevel filter', async () => {
      const mockConcepts = [
        { id: 'c1', data: () => ({ name: 'concept1', masteryLevel: 'expert' }) },
      ];

      const mockWhereChain = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: mockConcepts }),
      };
      mockWhere.mockReturnValue(mockWhereChain);

      const result = await conceptsService.getUserConcepts('user-123', { masteryLevel: 'expert' });

      expect(result).toHaveLength(1);
      expect(mockWhereChain.where).toHaveBeenCalledWith('masteryLevel', '==', 'expert');
    });
  });

  describe('updateConcept', () => {
    it('should update concept fields', async () => {
      const mockRef = { 
        update: mockUpdate,
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'user-123' }),
        }),
      };
      mockDoc.mockReturnValue(mockRef);

      await conceptsService.updateConcept('user-123', 'concept-123', {
        masteryLevel: 'comfortable',
        definition: 'Updated definition',
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          masteryLevel: 'comfortable',
          definition: 'Updated definition',
        })
      );
    });

    it('should throw error for non-existent concept', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: false }),
      });

      await expect(
        conceptsService.updateConcept('user-123', 'fake-id', { masteryLevel: 'learning' })
      ).rejects.toThrow('not found');
    });

    it('should throw error for unauthorized access', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'other-user' }),
        }),
      });

      await expect(
        conceptsService.updateConcept('user-123', 'concept-123', { masteryLevel: 'learning' })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteConcept', () => {
    it('should delete a concept', async () => {
      const mockRef = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'user-123' }),
        }),
        delete: mockDelete,
      };
      mockDoc.mockReturnValue(mockRef);

      await conceptsService.deleteConcept('user-123', 'concept-123');

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error for non-existent concept', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: false }),
      });

      await expect(
        conceptsService.deleteConcept('user-123', 'fake-id')
      ).rejects.toThrow('not found');
    });

    it('should throw error for unauthorized deletion', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'other-user' }),
        }),
      });

      await expect(
        conceptsService.deleteConcept('user-123', 'concept-123')
      ).rejects.toThrow('Unauthorized');
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

  describe('getConceptsByIds', () => {
    it('should return empty array for empty input', async () => {
      const result = await conceptsService.getConceptsByIds('user-123', []);
      expect(result).toEqual([]);
    });

    it('should fetch concepts by IDs in batches', async () => {
      const mockConcepts = [
        { id: 'c1', data: () => ({ name: 'concept1' }) },
        { id: 'c2', data: () => ({ name: 'concept2' }) },
      ];

      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: mockConcepts }),
        }),
      });

      const result = await conceptsService.getConceptsByIds('user-123', ['c1', 'c2']);
      
      expect(result).toHaveLength(2);
      expect(result[0].conceptId).toBe('c1');
      expect(result[1].conceptId).toBe('c2');
    });
  });

  describe('searchConcepts', () => {
    it('should search concepts by query string (in-memory filter)', async () => {
      // searchConcepts fetches all user concepts and filters in memory
      const mockResults = [
        { id: 'c1', data: () => ({ name: 'closures', displayName: 'Closures' }) },
        { id: 'c2', data: () => ({ name: 'promises', displayName: 'Promises' }) },
        { id: 'c3', data: () => ({ name: 'closure-patterns', displayName: 'Closure Patterns' }) },
      ];

      mockWhere.mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: mockResults }),
      });

      const result = await conceptsService.searchConcepts('user-123', 'clo');
      
      // Should match 'closures' and 'closure-patterns' but not 'promises'
      expect(result).toHaveLength(2);
      expect(result.every(c => c.name.includes('clo'))).toBe(true);
    });

    it('should handle empty search results', async () => {
      const mockResults = [
        { id: 'c1', data: () => ({ name: 'closures', displayName: 'Closures' }) },
      ];

      mockWhere.mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: mockResults }),
      });

      const result = await conceptsService.searchConcepts('user-123', 'xyz');
      expect(result).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      const mockResults = [
        { id: 'c1', data: () => ({ name: 'react-hooks', displayName: 'React Hooks' }) },
        { id: 'c2', data: () => ({ name: 'react-state', displayName: 'React State' }) },
        { id: 'c3', data: () => ({ name: 'react-context', displayName: 'React Context' }) },
        { id: 'c4', data: () => ({ name: 'react-router', displayName: 'React Router' }) },
      ];

      mockWhere.mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: mockResults }),
      });

      const result = await conceptsService.searchConcepts('user-123', 'react', 2);
      expect(result).toHaveLength(2);
    });
  });
});
