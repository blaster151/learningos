/**
 * Tests for Learning Paths API Routes
 * /api/paths - GET
 * /api/paths/generate - POST
 * /api/paths/[pathId] - GET, PATCH
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the service objects as they are exported
vi.mock('@/lib/firebase/learningPaths', () => ({
  pathsService: {
    getUserPaths: vi.fn(),
    getPath: vi.fn(),
    acceptPath: vi.fn(),
    abandonPath: vi.fn(),
    createPath: vi.fn(),
  },
}));

vi.mock('@/lib/firebase/concepts', () => ({
  conceptsService: {
    getUserConcepts: vi.fn(),
    createConcept: vi.fn(),
    findConceptByName: vi.fn(),
  },
}));

vi.mock('@/lib/ai/pathGeneration', () => ({
  generateLearningPath: vi.fn(),
}));

import { GET as getPathsList } from '@/app/api/paths/route';
import { POST as generatePath } from '@/app/api/paths/generate/route';
import { GET as getPathDetail, PATCH as updatePath } from '@/app/api/paths/[pathId]/route';
import { pathsService } from '@/lib/firebase/learningPaths';
import { conceptsService } from '@/lib/firebase/concepts';
import * as pathGeneration from '@/lib/ai/pathGeneration';

describe('Paths API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/paths', () => {
    it('should return all paths for authenticated user', async () => {
      const mockPaths = [
        { pathId: 'p1', title: 'Path 1', status: 'active' },
        { pathId: 'p2', title: 'Path 2', status: 'suggested' },
      ];

      vi.mocked(pathsService.getUserPaths).mockResolvedValue(mockPaths as any);

      const request = new NextRequest('http://localhost:3000/api/paths?userId=user-123');

      const response = await getPathsList(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.paths).toHaveLength(2);
      expect(data.paths[0].pathId).toBe('p1');
    });

    it('should filter paths by status', async () => {
      const mockActivePaths = [{ pathId: 'p1', title: 'Active Path', status: 'active' }];

      vi.mocked(pathsService.getUserPaths).mockResolvedValue(mockActivePaths as any);

      const request = new NextRequest('http://localhost:3000/api/paths?userId=user-123&status=active');

      const response = await getPathsList(request);
      const data = await response.json();

      expect(data.paths).toHaveLength(1);
      expect(data.paths[0].status).toBe('active');
    });

    it('should require userId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/paths');

      const response = await getPathsList(request);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/paths/generate', () => {
    it('should generate a new learning path', async () => {
      const mockConcepts = [
        { conceptId: 'c1', name: 'react', masteryLevel: 'learning' },
        { conceptId: 'c2', name: 'hooks', masteryLevel: 'exploring' },
      ];

      const mockGeneratedPath = {
        success: true,
        path: {
          title: 'Master React Hooks',
          description: 'Learn React hooks in depth',
          milestones: [
            {
              title: 'Understand useState',
              description: 'Learn state management',
              concepts: ['useState', 'state'],
              estimatedMinutes: 180,
              objectives: ['Learn useState hook', 'Understand state updates'],
              prerequisites: [], // Array of milestone indices that must be completed first
            },
          ],
          estimatedMinutes: 900,
        },
      };

      vi.mocked(conceptsService.getUserConcepts).mockResolvedValue(mockConcepts as any);
      vi.mocked(conceptsService.findConceptByName).mockResolvedValue(null);
      vi.mocked(conceptsService.createConcept).mockResolvedValue('new-concept-id');
      vi.mocked(pathGeneration.generateLearningPath).mockResolvedValue(mockGeneratedPath as any);
      vi.mocked(pathsService.createPath).mockResolvedValue('path-new');
      vi.mocked(pathsService.getPath).mockResolvedValue({
        pathId: 'path-new',
        title: 'Master React Hooks',
        status: 'suggested',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/paths/generate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ userId: 'user-123', goal: 'Master React Hooks' }),
      });

      const response = await generatePath(request);
      const data = await response.json();

      // Route returns 200 with path data (not 201)
      expect(response.status).toBe(200);
      expect(data.pathId).toBe('path-new');
    });

    it('should require goal parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/paths/generate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await generatePath(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/paths/[pathId]', () => {
    it('should return path details', async () => {
      const mockPath = {
        pathId: 'path-123',
        title: 'Path Name',
        status: 'active',
        milestones: [],
        progress: 0.45,
      };

      vi.mocked(pathsService.getPath).mockResolvedValue(mockPath as any);

      const request = new NextRequest('http://localhost:3000/api/paths/path-123?userId=user-123');

      const response = await getPathDetail(request, { params: { pathId: 'path-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.path.pathId).toBe('path-123');
    });

    it('should return 404 for non-existent path', async () => {
      vi.mocked(pathsService.getPath).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/paths/fake-id?userId=user-123');

      const response = await getPathDetail(request, { params: { pathId: 'fake-id' } });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/paths/[pathId]', () => {
    it('should accept a path', async () => {
      vi.mocked(pathsService.acceptPath).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/paths/path-123', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ userId: 'user-123', action: 'accept' }),
      });

      const response = await updatePath(request, { params: { pathId: 'path-123' } });

      expect(response.status).toBe(200);
      expect(pathsService.acceptPath).toHaveBeenCalledWith('user-123', 'path-123');
    });

    it('should abandon a path', async () => {
      vi.mocked(pathsService.abandonPath).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/paths/path-123', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ userId: 'user-123', action: 'abandon' }),
      });

      const response = await updatePath(request, { params: { pathId: 'path-123' } });

      expect(response.status).toBe(200);
      expect(pathsService.abandonPath).toHaveBeenCalledWith('user-123', 'path-123');
    });

    it('should validate action parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/paths/path-123', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ userId: 'user-123', action: 'invalid' }),
      });

      const response = await updatePath(request, { params: { pathId: 'path-123' } });

      expect(response.status).toBe(400);
    });
  });
});
