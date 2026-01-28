// Test utilities for creating mock data
import type {
  UserProfile,
  LearningSession,
  Message,
  ConceptNode,
  ConceptRelation,
  LearningPath,
  ReflectionEvent,
} from '@/types'
import { Timestamp } from 'firebase/firestore'

// Helper to create mock Firestore Timestamp
export const mockTimestamp = (date?: Date): Timestamp => {
  const d = date || new Date()
  return {
    seconds: Math.floor(d.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => d,
    toMillis: () => d.getTime(),
    isEqual: (other: Timestamp) => d.getTime() === other.toMillis(),
    valueOf: () => '',
  } as Timestamp
}

// Mock User Profile
export const mockUserProfile = (overrides?: Partial<UserProfile>): UserProfile => ({
  userId: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: mockTimestamp(),
  lastLoginAt: mockTimestamp(),
  learningGoal: 'Learn TypeScript',
  selectedTopics: ['typescript', 'react'],
  totalSessions: 0,
  totalMessages: 0,
  ...overrides,
})

// Mock Learning Session
export const mockLearningSession = (overrides?: Partial<LearningSession>): LearningSession => ({
  sessionId: 'session-123',
  userId: 'test-user-123',
  startedAt: mockTimestamp(),
  lastActivity: mockTimestamp(),
  topic: 'TypeScript Basics',
  initialConcepts: ['variables', 'types'],
  messageCount: 0,
  conceptsCovered: [],
  status: 'active',
  ...overrides,
})

// Mock Message
export const mockMessage = (overrides?: Partial<Message>): Message => ({
  messageId: 'msg-123',
  sessionId: 'session-123',
  userId: 'test-user-123',
  timestamp: mockTimestamp(),
  role: 'user',
  content: 'What is a variable?',
  ...overrides,
})

// Mock Concept Node
export const mockConceptNode = (overrides?: Partial<ConceptNode>): ConceptNode => ({
  conceptId: 'concept-123',
  name: 'Variables',
  definition: 'A named storage location in memory',
  confidence: 0.5,
  understanding: 0.5,
  firstEncountered: mockTimestamp(),
  lastReviewed: mockTimestamp(),
  ...overrides,
})

// Mock Concept Relation
export const mockConceptRelation = (overrides?: Partial<ConceptRelation>): ConceptRelation => ({
  relationId: 'relation-123',
  userId: 'test-user-123',
  sourceConceptId: 'concept-1',
  targetConceptId: 'concept-2',
  relationType: 'PREREQUISITE',
  strength: 0.8,
  discoveredAt: mockTimestamp(),
  ...overrides,
})

// Mock Learning Path
export const mockLearningPath = (overrides?: Partial<LearningPath>): LearningPath => ({
  pathId: 'path-123',
  userId: 'test-user-123',
  goal: 'Learn TypeScript',
  createdAt: mockTimestamp(),
  updatedAt: mockTimestamp(),
  milestones: [
    {
      milestoneId: 'milestone-1',
      title: 'TypeScript Basics',
      description: 'Learn the fundamentals',
      concepts: ['variables', 'types'],
      isCompleted: false,
    },
  ],
  currentMilestoneIndex: 0,
  completedMilestones: [],
  status: 'active',
  ...overrides,
})

// Mock Reflection Event
export const mockReflectionEvent = (overrides?: Partial<ReflectionEvent>): ReflectionEvent => ({
  reflectionId: 'reflection-123',
  userId: 'test-user-123',
  sessionId: 'session-123',
  conceptId: 'concept-123',
  timestamp: mockTimestamp(),
  confidenceRating: 3,
  ...overrides,
})
