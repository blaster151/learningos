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

mockCollection.mockImplementation(() => ({
  add: mockAdd,
  where: mockWhere,
  doc: mockDoc,
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
      // Mock no existing relation
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
            }),
          }),
        }),
      });

      mockAdd.mockResolvedValue({ id: 'relation-123' });

      const result = await relationsService.createRelation(
        'user-123',
        'concept-a',
        'concept-b',
        'prerequisite',
        0.8
      );

      expect(mockAdd).toHaveBeenCalled();
      expect(result).toBe('relation-123');
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

      // For source relations
      mockWhere.mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: mockRelations }),
      });

      const result = await relationsService.getConceptRelations('user-123', 'concept-a');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].relationId).toBe('r1');
    });
  });

  describe('updateRelationStrength', () => {
    it('should update relation strength', async () => {
      const mockRelationUpdate = vi.fn();
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'user-123' }),
          ref: { update: mockRelationUpdate },
        }),
      });

      await relationsService.updateRelationStrength('user-123', 'relation-123', 0.95);

      expect(mockRelationUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          strength: 0.95,
        })
      );
    });
  });

  describe('deleteRelation', () => {
    it('should delete a relation', async () => {
      const mockRelationDelete = vi.fn();
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'user-123' }),
          ref: { delete: mockRelationDelete },
        }),
      });

      await relationsService.deleteRelation('user-123', 'relation-123');

      expect(mockRelationDelete).toHaveBeenCalled();
    });

    it('should throw error for non-existent relation', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: false }),
      });

      await expect(
        relationsService.deleteRelation('user-123', 'fake-id')
      ).rejects.toThrow();
    });
  });
});
