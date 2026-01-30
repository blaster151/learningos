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
  conceptsLearned: [],
  conceptsReviewed: [],
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
  domain: 'programming',
  userId: 'test-user-123',
  confidence: 0.5,
  understanding: 0.5,
  masteryLevel: 'learning',
  firstEncountered: mockTimestamp(),
  lastReviewed: mockTimestamp(),
  sessionIds: [],
  definitionHistory: [],
  isEmergent: false,
  discoveredBy: 'system',
  ...overrides,
})

// Mock Concept Relation
export const mockConceptRelation = (overrides?: Partial<ConceptRelation>): ConceptRelation => ({
  relationId: 'relation-123',
  userId: 'test-user-123',
  sourceConceptId: 'concept-1',
  targetConceptId: 'concept-2',
  relationType: 'prerequisite',
  strength: 0.8,
  discoveredAt: mockTimestamp(),
  isEmergent: false,
  discoveredBy: 'system',
  ...overrides,
})

// Mock Learning Path
export const mockLearningPath = (overrides?: Partial<LearningPath>): LearningPath => ({
  pathId: 'path-123',
  userId: 'test-user-123',
  title: 'TypeScript Path',
  description: 'A path to learn TypeScript',
  goal: 'Learn TypeScript',
  createdAt: mockTimestamp(),
  lastActivityAt: mockTimestamp(),
  milestones: [
    {
      milestoneId: 'milestone-1',
      order: 0,
      title: 'TypeScript Basics',
      description: 'Learn the fundamentals',
      conceptIds: ['variables', 'types'],
      conceptNames: ['Variables', 'Types'],
      estimatedMinutes: 30,
      objectives: ['Understand variables', 'Learn types'],
      status: 'not_started',
      progress: 0,
      prerequisiteMilestoneIds: [],
    },
  ],
  estimatedMinutes: 30,
  status: 'active',
  progress: 0,
  currentMilestoneIndex: 0,
  generatedFrom: {
    userGoal: 'Learn TypeScript',
    knownConceptIds: [],
    userLevel: 'beginner',
  },
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
