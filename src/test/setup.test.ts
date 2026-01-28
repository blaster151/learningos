// Sample test to verify testing setup
import { describe, it, expect } from 'vitest'
import { mockUserProfile, mockLearningSession } from '@/test/mockData'

describe('Testing Infrastructure', () => {
  describe('Mock Data Utilities', () => {
    it('should create a mock user profile', () => {
      const user = mockUserProfile()

      expect(user.userId).toBe('test-user-123')
      expect(user.email).toBe('test@example.com')
      expect(user.learningGoal).toBe('Learn TypeScript')
    })

    it('should allow overriding mock data', () => {
      const user = mockUserProfile({
        email: 'custom@example.com',
        learningGoal: 'Learn React',
      })

      expect(user.email).toBe('custom@example.com')
      expect(user.learningGoal).toBe('Learn React')
    })

    it('should create a mock learning session', () => {
      const session = mockLearningSession()

      expect(session.sessionId).toBe('session-123')
      expect(session.status).toBe('active')
      expect(session.topic).toBe('TypeScript Basics')
    })
  })

  describe('Environment Setup', () => {
    it('should have test environment variables', () => {
      expect(process.env.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('test-api-key')
      expect(process.env.OPENAI_API_KEY).toBe('sk-test-key')
    })
  })
})
