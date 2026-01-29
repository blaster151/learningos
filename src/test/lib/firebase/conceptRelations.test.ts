/**
 * Tests for Concept Relations Firebase Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';

const mockAdd = vi.fn();
const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockWhere = vi.fn();
const mockDoc = vi.fn();

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
  createRelation,
  getConceptRelations,
  updateRelationStrength,
  deleteRelation,
  relationExists,
} from '@/lib/firebase/conceptRelations';

describe('Concept Relations Firebase Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRelation', () => {
    it('should create a new relation', async () => {
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue({ empty: true }),
              }),
            }),
          }),
        }),
      });

      mockAdd.mockResolvedValue({ id: 'relation-123' });

      const result = await createRelation(
        'user-123',
        'concept-a',
        'concept-b',
        'prerequisite',
        0.8
      );

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          sourceConceptId: 'concept-a',
          targetConceptId: 'concept-b',
          relationType: 'prerequisite',
          strength: 0.8,
        })
      );
      expect(result).toBe('relation-123');
    });

    it('should prevent duplicate relations', async () => {
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: 'existing' }],
                }),
              }),
            }),
          }),
        }),
      });

      await expect(
        createRelation('user-123', 'c-a', 'c-b', 'prerequisite', 0.8)
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

      mockWhere.mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: mockRelations }),
      });

      const result = await getConceptRelations('user-123', 'concept-a');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('r1');
      expect(result[0].sourceConceptId).toBe('concept-a');
    });

    it('should handle concepts with no relations', async () => {
      mockWhere.mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: [] }),
      });

      const result = await getConceptRelations('user-123', 'concept-isolated');
      expect(result).toEqual([]);
    });
  });

  describe('updateRelationStrength', () => {
    it('should update relation strength', async () => {
      const mockUpdate = vi.fn();
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'user-123' }),
          ref: { update: mockUpdate },
        }),
      });

      await updateRelationStrength('user-123', 'relation-123', 0.95);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          strength: 0.95,
        })
      );
    });

    it('should validate strength range', async () => {
      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'user-123' }),
          ref: { update: vi.fn() },
        }),
      });

      await expect(
        updateRelationStrength('user-123', 'relation-123', 1.5)
      ).rejects.toThrow('Strength must be between 0 and 1');
    });
  });

  describe('relationExists', () => {
    it('should return true for existing relation', async () => {
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: 'rel-123' }],
                }),
              }),
            }),
          }),
        }),
      });

      const result = await relationExists(
        'user-123',
        'concept-a',
        'concept-b',
        'prerequisite'
      );

      expect(result).toBe(true);
    });

    it('should return false for non-existent relation', async () => {
      mockWhere.mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue({ empty: true }),
              }),
            }),
          }),
        }),
      });

      const result = await relationExists(
        'user-123',
        'concept-a',
        'concept-b',
        'prerequisite'
      );

      expect(result).toBe(false);
    });
  });
});
