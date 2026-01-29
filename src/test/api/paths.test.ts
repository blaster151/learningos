/**
 * Tests for Learning Paths API Routes
 * /api/paths - GET
 * /api/paths/generate - POST
 * /api/paths/[pathId] - GET, PATCH
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/firebase/learningPaths', () => ({
  getUserPaths: vi.fn(),
  getPath: vi.fn(),
  acceptPath: vi.fn(),
  abandonPath: vi.fn(),
  createPath: vi.fn(),
}));

vi.mock('@/lib/firebase/concepts', () => ({
  getUserConcepts: vi.fn(),
  createConcept: vi.fn(),
}));

vi.mock('@/lib/ai/pathGeneration', () => ({
  generateLearningPath: vi.fn(),
}));

import { GET as getPathsList } from '@/app/api/paths/route';
import { POST as generatePath } from '@/app/api/paths/generate/route';
import { GET as getPathDetail, PATCH as updatePath } from '@/app/api/paths/[pathId]/route';
import * as pathsService from '@/lib/firebase/learningPaths';
import * as conceptsService from '@/lib/firebase/concepts';
import * as pathGeneration from '@/lib/ai/pathGeneration';

describe('Paths API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/paths', () => {
    it('should return all paths for authenticated user', async () => {
      const mockPaths = [
        { id: 'p1', name: 'Path 1', status: 'active' },
        { id: 'p2', name: 'Path 2', status: 'suggested' },
      ];

      vi.mocked(pathsService.getUserPaths).mockResolvedValue(mockPaths as any);

      const request = new NextRequest('http://localhost:3000/api/paths', {
        headers: { 'x-user-id': 'user-123' },
      });

      const response = await getPathsList(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.paths).toHaveLength(2);
      expect(data.paths[0].id).toBe('p1');
    });

    it('should filter paths by status', async () => {
      const mockActivePaths = [{ id: 'p1', name: 'Active Path', status: 'active' }];

      vi.mocked(pathsService.getUserPaths).mockResolvedValue(mockActivePaths as any);

      const request = new NextRequest('http://localhost:3000/api/paths?status=active', {
        headers: { 'x-user-id': 'user-123' },
      });

      const response = await getPathsList(request);
      const data = await response.json();

      expect(data.paths).toHaveLength(1);
      expect(data.paths[0].status).toBe('active');
    });

    it('should require authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/paths');

      const response = await getPathsList(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/paths/generate', () => {
    it('should generate a new learning path', async () => {
      const mockConcepts = [
        { id: 'c1', name: 'react', masteryLevel: 30 },
        { id: 'c2', name: 'hooks', masteryLevel: 20 },
      ];

      const mockGeneratedPath = {
        name: 'Master React Hooks',
        description: 'Learn React hooks in depth',
        milestones: [
          {
            id: 'm1',
            title: 'Understand useState',
            description: 'Learn state management',
            requiredConcepts: ['useState', 'state'],
            estimatedHours: 3,
            status: 'available',
            progress: 0,
          },
        ],
        estimatedHours: 15,
      };

      vi.mocked(conceptsService.getUserConcepts).mockResolvedValue(mockConcepts as any);
      vi.mocked(pathGeneration.generateLearningPath).mockResolvedValue(
        mockGeneratedPath as any
      );
      vi.mocked(pathsService.createPath).mockResolvedValue('path-new');

      const request = new NextRequest('http://localhost:3000/api/paths/generate', {
        method: 'POST',
        headers: {
          'x-user-id': 'user-123',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ goal: 'Master React Hooks' }),
      });

      const response = await generatePath(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.pathId).toBe('path-new');
      expect(data.path.name).toBe('Master React Hooks');
    });

    it('should require goal parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/paths/generate', {
        method: 'POST',
        headers: {
          'x-user-id': 'user-123',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await generatePath(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/paths/[pathId]', () => {
    it('should return path details', async () => {
      const mockPath = {
        id: 'path-123',
        name: 'Path Name',
        status: 'active',
        milestones: [],
        progressPercentage: 45,
      };

      vi.mocked(pathsService.getPath).mockResolvedValue(mockPath as any);

      const request = new NextRequest('http://localhost:3000/api/paths/path-123', {
        headers: { 'x-user-id': 'user-123' },
      });

      const response = await getPathDetail(request, { params: { pathId: 'path-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.path.id).toBe('path-123');
    });

    it('should return 404 for non-existent path', async () => {
      vi.mocked(pathsService.getPath).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/paths/fake-id', {
        headers: { 'x-user-id': 'user-123' },
      });

      const response = await getPathDetail(request, { params: { pathId: 'fake-id' } });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/paths/[pathId]', () => {
    it('should accept a path', async () => {
      vi.mocked(pathsService.acceptPath).mockResolvedValue();

      const request = new NextRequest('http://localhost:3000/api/paths/path-123', {
        method: 'PATCH',
        headers: {
          'x-user-id': 'user-123',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' }),
      });

      const response = await updatePath(request, { params: { pathId: 'path-123' } });

      expect(response.status).toBe(200);
      expect(pathsService.acceptPath).toHaveBeenCalledWith('user-123', 'path-123');
    });

    it('should abandon a path', async () => {
      vi.mocked(pathsService.abandonPath).mockResolvedValue();

      const request = new NextRequest('http://localhost:3000/api/paths/path-123', {
        method: 'PATCH',
        headers: {
          'x-user-id': 'user-123',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action: 'abandon' }),
      });

      const response = await updatePath(request, { params: { pathId: 'path-123' } });

      expect(response.status).toBe(200);
      expect(pathsService.abandonPath).toHaveBeenCalledWith('user-123', 'path-123');
    });

    it('should validate action parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/paths/path-123', {
        method: 'PATCH',
        headers: {
          'x-user-id': 'user-123',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action: 'invalid' }),
      });

      const response = await updatePath(request, { params: { pathId: 'path-123' } });

      expect(response.status).toBe(400);
    });
  });
});
