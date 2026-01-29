/**
 * Tests for Concept Relations Firebase Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { relationsService } from '@/lib/firebase/conceptRelations';

describe('Concept Relations Firebase Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockCollection.mockImplementation(() => ({
      add: mockAdd,
      where: mockWhere,
      doc: mockDoc,
    }));
  });

  describe('createRelation', () => {
    it('should create a new relation', async () => {
      // Mock relationExists returning false (no existing relation)
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ empty: true }),
            }),
          }),
        }),
      });

      mockAdd.mockResolvedValue({ id: 'relation-123' });

      const result = await relationsService.createRelation(
        'user-123',
        {
          sourceConceptId: 'concept-a',
          targetConceptId: 'concept-b',
          relationType: 'prerequisite',
          strength: 0.8,
        }
      );

      expect(mockAdd).toHaveBeenCalled();
      expect(result).toBe('relation-123');
    });

    it('should throw error if relation already exists', async () => {
      // Mock relationExists returning true
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ empty: false }),
            }),
          }),
        }),
      });

      await expect(
        relationsService.createRelation('user-123', {
          sourceConceptId: 'concept-a',
          targetConceptId: 'concept-b',
          relationType: 'prerequisite',
          strength: 0.8,
        })
      ).rejects.toThrow('Relation already exists');
    });
  });

  describe('getConceptRelations', () => {
    it('should retrieve all relations for a concept', async () => {
      const mockRelations = [
        {
          id: 'r1',
          data: () => ({
            sourceConceptId: 'concept-a',
            targetConceptId: 'concept-b',
            relationType: 'prerequisite',
            strength: 0.9,
          }),
        },
      ];

      // Mock where chain for getting relations
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: mockRelations }),
        }),
      });

      const result = await relationsService.getConceptRelations('user-123', 'concept-a');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].relationId).toBe('r1');
    });
  });

  describe('updateRelationStrength', () => {
    it('should update relation strength', async () => {
      mockDoc.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockResolvedValue(undefined);

      await relationsService.updateRelationStrength('relation-123', 0.95);

      expect(mockDoc).toHaveBeenCalledWith('relation-123');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          strength: 0.95,
        })
      );
    });

    it('should throw error for invalid strength values', async () => {
      await expect(
        relationsService.updateRelationStrength('relation-123', 1.5)
      ).rejects.toThrow('Strength must be between 0 and 1');

      await expect(
        relationsService.updateRelationStrength('relation-123', -0.5)
      ).rejects.toThrow('Strength must be between 0 and 1');
    });
  });

  describe('deleteRelation', () => {
    it('should delete a relation', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
        }),
        delete: mockDelete,
      });
      mockDelete.mockResolvedValue(undefined);

      await relationsService.deleteRelation('relation-123');

      expect(mockDoc).toHaveBeenCalledWith('relation-123');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error for non-existent relation', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: false }),
      });

      await expect(
        relationsService.deleteRelation('fake-id')
      ).rejects.toThrow('not found');
    });
  });

  describe('relationExists', () => {
    it('should return true if relation exists', async () => {
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ empty: false }),
            }),
          }),
        }),
      });

      const result = await relationsService.relationExists('user-123', 'concept-a', 'concept-b');

      expect(result).toBe(true);
    });

    it('should return false if relation does not exist', async () => {
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ empty: true }),
            }),
          }),
        }),
      });

      const result = await relationsService.relationExists('user-123', 'concept-a', 'concept-b');

      expect(result).toBe(false);
    });
  });
});
