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
      } as import('firebase/auth').User;

      const result = await createUserProfile(mockUser);

      expect(mockFetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-123',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
        }),
      });
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
      } as import('firebase/auth').User;

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
      
      const result = await getUserProfile('test-123');

      expect(mockFetch).toHaveBeenCalledWith('/api/users?userId=test-123');
      expect(result?.userId).toBe('test-123');
      expect(result?.learningGoal).toBe('Learn TypeScript');
    });

    it('should return null for non-existent user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { getUserProfile } = await import('@/lib/api/userProfile');
      
      const result = await getUserProfile('non-existent');

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
      
      await completeOnboarding('test-123', {
        learningGoal: 'Master JavaScript',
        experienceLevel: 'intermediate',
        selectedTopics: ['javascript', 'typescript'],
        preferredPace: 'moderate',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users/onboarding?userId=test-123',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            learningGoal: 'Master JavaScript',
            experienceLevel: 'intermediate',
            selectedTopics: ['javascript', 'typescript'],
            preferredPace: 'moderate',
          }),
        }
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
      
      const result = await checkOnboardingStatus('test-123');

      expect(mockFetch).toHaveBeenCalledWith('/api/users/onboarding?userId=test-123');
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
      
      const result = await checkOnboardingStatus('new-user');

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
      
      await updateUserProfile('test-123', {
        learningGoal: 'Updated Goal',
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/users?userId=test-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learningGoal: 'Updated Goal',
        }),
      });
    });
  });
});
