/**
 * Tests for User Profile API Client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('User Profile API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createUserProfile', () => {
    it('should create a user profile with Firebase User object', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          isNew: true,
          userId: 'test-123',
        }),
      });

      const { createUserProfile } = await import('@/lib/api/userProfile');
      
      // Mock a Firebase User object
      const mockUser = {
        uid: 'test-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        getIdToken: vi.fn().mockResolvedValue('test-token'),
      } as unknown as import('firebase/auth').User;

      const result = await createUserProfile(mockUser);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/users');
      expect(init.method).toBe('POST');
      expect(init.body).toBe(
        JSON.stringify({
          userId: 'test-123',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
        })
      );
      expect(init.headers.get('Authorization')).toBe('Bearer test-token');
      expect(init.headers.get('Content-Type')).toBe('application/json');
      expect(result.isNew).toBe(true);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to create' }),
      });

      const { createUserProfile } = await import('@/lib/api/userProfile');
      
      const mockUser = {
        uid: 'test-123',
        email: 'test@example.com',
        displayName: null,
        photoURL: null,
        getIdToken: vi.fn().mockResolvedValue('test-token'),
      } as unknown as import('firebase/auth').User;

      await expect(createUserProfile(mockUser)).rejects.toThrow();
    });
  });

  describe('getUserProfile', () => {
    it('should get a user profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          user: {
            userId: 'test-123',
            email: 'test@example.com',
            displayName: 'Test User',
            learningGoal: 'Learn TypeScript',
          },
        }),
      });

      const { getUserProfile } = await import('@/lib/api/userProfile');

      const mockUser = {
        uid: 'test-123',
        getIdToken: vi.fn().mockResolvedValue('test-token'),
      } as unknown as import('firebase/auth').User;
      
      const result = await getUserProfile(mockUser);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/users?userId=test-123');
      expect(init.headers.get('Authorization')).toBe('Bearer test-token');
      expect(result?.userId).toBe('test-123');
      expect(result?.learningGoal).toBe('Learn TypeScript');
    });

    it('should return null for non-existent user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { getUserProfile } = await import('@/lib/api/userProfile');

      const mockUser = {
        uid: 'non-existent',
        getIdToken: vi.fn().mockResolvedValue('test-token'),
      } as unknown as import('firebase/auth').User;
      
      const result = await getUserProfile(mockUser);

      expect(result).toBeNull();
    });
  });

  describe('completeOnboarding', () => {
    it('should complete onboarding with data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { completeOnboarding } = await import('@/lib/api/userProfile');

      const mockUser = {
        uid: 'test-123',
        getIdToken: vi.fn().mockResolvedValue('test-token'),
      } as unknown as import('firebase/auth').User;
      
      await completeOnboarding(mockUser, {
        learningGoal: 'Master JavaScript',
        experienceLevel: 'intermediate',
        selectedTopics: ['javascript', 'typescript'],
        preferredPace: 'moderate',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/users/onboarding?userId=test-123');
      expect(init.method).toBe('POST');
      expect(init.headers.get('Authorization')).toBe('Bearer test-token');
      expect(init.headers.get('Content-Type')).toBe('application/json');
      expect(init.body).toBe(
        JSON.stringify({
          learningGoal: 'Master JavaScript',
          experienceLevel: 'intermediate',
          selectedTopics: ['javascript', 'typescript'],
          preferredPace: 'moderate',
        })
      );
    });
  });

  describe('checkOnboardingStatus', () => {
    it('should check onboarding status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          exists: true,
          onboardingCompleted: true,
        }),
      });

      const { checkOnboardingStatus } = await import('@/lib/api/userProfile');

      const mockUser = {
        uid: 'test-123',
        getIdToken: vi.fn().mockResolvedValue('test-token'),
      } as unknown as import('firebase/auth').User;
      
      const result = await checkOnboardingStatus(mockUser);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/users/onboarding?userId=test-123');
      expect(init.headers.get('Authorization')).toBe('Bearer test-token');
      expect(result.exists).toBe(true);
      expect(result.onboardingCompleted).toBe(true);
    });

    it('should return not completed for new user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          exists: true,
          onboardingCompleted: false,
        }),
      });

      const { checkOnboardingStatus } = await import('@/lib/api/userProfile');

      const mockUser = {
        uid: 'new-user',
        getIdToken: vi.fn().mockResolvedValue('test-token'),
      } as unknown as import('firebase/auth').User;
      
      const result = await checkOnboardingStatus(mockUser);

      expect(result.onboardingCompleted).toBe(false);
    });
  });

  describe('updateUserProfile', () => {
    it('should update a user profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { updateUserProfile } = await import('@/lib/api/userProfile');

      const mockUser = {
        uid: 'test-123',
        getIdToken: vi.fn().mockResolvedValue('test-token'),
      } as unknown as import('firebase/auth').User;
      
      await updateUserProfile(mockUser, {
        learningGoal: 'Updated Goal',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/users?userId=test-123');
      expect(init.method).toBe('PATCH');
      expect(init.headers.get('Authorization')).toBe('Bearer test-token');
      expect(init.headers.get('Content-Type')).toBe('application/json');
      expect(init.body).toBe(JSON.stringify({ learningGoal: 'Updated Goal' }));
    });
  });
});
