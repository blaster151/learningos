// Core TypeScript types for LearningOS data models
// Based on technical-architecture.md

import type { Timestamp } from "firebase/firestore";

// ===================================
// User Profile
// ===================================

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  
  // Learning preferences
  learningGoal: string;
  selectedTopics: string[];
  metaGoal?: string; // Future: higher-level goal
  
  // Personalization (Future-proofing)
  selectedPersona?: string;
  unlockedPersonas?: string[];
  language?: string;
  bilingualMode?: boolean;
  
  // Gamification (Future-proofing)
  gamificationEnabled?: boolean;
  achievements?: string[];
  
  // Stats
  totalSessions: number;
  totalMessages: number;
  streak?: number;
}

// ===================================
// Learning Session
// ===================================

export interface LearningSession {
  sessionId: string;
  userId: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  lastActivity: Timestamp;
  
  // Context
  topic: string;
  goal?: string;
  initialConcepts: string[]; // Concept IDs
  
  // Stats
  messageCount: number;
  conceptsCovered: string[]; // Unique concept IDs discussed
  
  // Status
  status: "active" | "completed" | "abandoned";
  
  // Metadata
  branch?: {
    fromSessionId: string;
    reason: string;
  };
}

// ===================================
// Message
// ===================================

export interface Message {
  messageId: string;
  sessionId: string;
  userId: string;
  timestamp: Timestamp;
  
  // Content
  role: "user" | "assistant" | "system";
  content: string;
  
  // Concept tagging
  conceptIds?: string[];
  
  // Metadata
  metadata?: {
    model?: string;
    tokens?: number;
    latency?: number;
  };
}

// ===================================
// Concept Node
// ===================================

export interface ConceptNode {
  conceptId: string;
  name: string;
  definition: string;
  domain?: string; // Future: for domain-specific abstractions
  
  // Learning tracking (per user)
  userId?: string; // Only for user-specific concepts
  confidence: number; // 0-1
  understanding: number; // 0-1
  
  // Timestamps
  firstEncountered: Timestamp;
  lastReviewed: Timestamp;
  lastReflected?: Timestamp;
  
  // Metadata
  exampleContext?: string;
  abstractPattern?: string; // Future: for abstraction scaffolding
  definitionHistory?: Array<{
    definition: string;
    timestamp: Timestamp;
  }>;
  
  // Status
  isEmergent?: boolean; // Future: user-discovered concepts
}

// ===================================
// Concept Relation
// ===================================

export type RelationType =
  | "PREREQUISITE"
  | "BUILDS_ON"
  | "SIMILAR_TO"
  | "CONTRASTS_WITH"
  | "ABSTRACTS_TO"
  | "APPLIES_TO";

export interface ConceptRelation {
  relationId: string;
  userId: string;
  sourceConceptId: string;
  targetConceptId: string;
  relationType: RelationType;
  strength: number; // 0-1
  
  // Discovery tracking
  discoveredAt: Timestamp;
  isEmergent?: boolean;
  discoveryInsight?: string;
  discoveredBy?: "user" | "system";
}

// ===================================
// Learning Path
// ===================================

export interface LearningPath {
  pathId: string;
  userId: string;
  goal: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Path structure
  milestones: Milestone[];
  
  // Progress
  currentMilestoneIndex: number;
  completedMilestones: string[];
  
  // Status
  status: "active" | "completed" | "abandoned";
}

export interface Milestone {
  milestoneId: string;
  title: string;
  description: string;
  concepts: string[]; // Concept IDs to cover
  estimatedTime?: number; // minutes
  
  // Progress
  isCompleted: boolean;
  completedAt?: Timestamp;
  
  // Prerequisites
  prerequisites?: string[]; // Other milestone IDs
}

// ===================================
// Reflection Event
// ===================================

export interface ReflectionEvent {
  reflectionId: string;
  userId: string;
  sessionId: string;
  conceptId: string;
  timestamp: Timestamp;
  
  // Self-assessment
  confidenceRating: number; // 1-5
  explanation?: string;
  
  // AI assessment
  feedback?: string;
  assessedUnderstanding?: number; // 0-1
  gap?: {
    detected: boolean;
    type: "overconfident" | "imposter" | "none";
  };
}

// ===================================
// Helper Types
// ===================================

export interface SessionContext {
  userId: string;
  sessionId: string;
  topic: string;
  recentMessages: Message[];
  activeConcepts: ConceptNode[];
}

export interface AIRequest {
  context: SessionContext;
  userMessage: string;
  useStreaming?: boolean;
}

export interface AIResponse {
  content: string;
  conceptIds: string[];
  metadata: {
    model: string;
    tokens: number;
    latency: number;
  };
}
