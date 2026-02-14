// Core TypeScript types for LearningOS data models
// Based on technical-architecture.md

// Define a minimal Timestamp interface compatible with both firebase and firebase-admin
// This avoids the conflict between client Timestamp (from firebase/firestore) 
// and admin Timestamp (from firebase-admin/firestore)
export interface Timestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}

// ===================================
// Path Scope & Calibration
// ===================================

export type PathScopeTier = "micro" | "focused" | "domain" | "field";

export type TopicScopeAnalysis = {
  scopeTier: PathScopeTier;
  confidence: number; // 0-1
  rationale: string;
  recommendedMode: "overview" | "narrow";
  suggestedNarrowTopics: Array<{ title: string; description: string; order: number }>;
};

export interface CalibrationPill {
  concept: string;
  reason: string;
}

/** Global per-user concept → confidence entry (E18-S6) */
export interface KnowledgeProfileEntry {
  userId: string;
  concept: string;
  /** 0 = unknown, 0.5 = somewhat familiar, 1.0 = known */
  confidence: number;
  source: "calibration" | "quiz" | "reflection";
  updatedAt?: Timestamp;
}

// ===================================
// Chat Highlights (E16)
// ===================================

export interface ChatHighlight {
  highlightId: string;
  userId: string;
  sessionId: string;
  messageId: string;
  text: string;
  startOffset: number;
  endOffset: number;
  note?: string;
  createdAt: Timestamp;
}

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
  
  // Feature toggles
  highlightsEnabled?: boolean;
  
  // Stats
  totalSessions: number;
  totalMessages: number;
  streak?: number;
}

// ===================================
// Learning Session
// ===================================

export type SessionStatus = "active" | "completed" | "abandoned";

export interface LearningSession {
  sessionId: string;
  userId: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  lastActivity: Timestamp;
  
  // Context
  topic: string;
  goal?: string;
  initialConcepts: string[]; // Concept IDs present at start
  
  // Stats
  messageCount: number;
  conceptsCovered: string[]; // Unique concept IDs discussed
  conceptsLearned: string[]; // Concepts with increased understanding
  conceptsReviewed: string[]; // Concepts revisited
  
  // Path integration
  pathId?: string; // If session is working through a path
  currentMilestoneId?: string; // Which milestone user is on
  
  // Status
  status: SessionStatus;
  
  // Branching
  branch?: {
    fromSessionId: string;
    branchPoint: Timestamp;
    reason: string;
    returnTopic?: string; // Main topic to return to
  };
  parentSessionId?: string; // If this is a branch
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
  domain: string; // e.g., "programming", "algorithms", "mathematics"
  category?: string; // sub-category within domain
  
  // Learning tracking (per user)
  userId: string;
  confidence: number; // 0.0-1.0 (user's self-assessment)
  understanding: number; // 0.0-1.0 (system's assessment)
  masteryLevel: MasteryLevel;
  
  // Timestamps
  firstEncountered: Timestamp;
  lastReviewed: Timestamp;
  lastReflected?: Timestamp;
  
  // Learning context
  learnedFrom?: string; // pathId or sessionId
  sessionIds: string[]; // All sessions where this concept appeared
  
  // Metadata
  exampleContext?: string; // Example from when user learned it
  abstractPattern?: string; // Future: for abstraction scaffolding
  definitionHistory: Array<{
    definition: string;
    source: "chat" | "reflection" | "path" | "user";
    timestamp: Timestamp;
  }>;
  
  // Discovery
  isEmergent: boolean; // User-discovered concept (not from path)
  discoveredBy: "user" | "system" | "path";
}

// ===================================
// Concept Relation
// ===================================

export type RelationType =
  | "prerequisite"      // A must be learned before B
  | "builds_on"         // B extends/deepens A
  | "similar_to"        // A and B share concepts
  | "contrasts_with"    // A differs from B in important ways
  | "abstracts_to"      // A is a specific case of B (generalization)
  | "applies_to"        // A is used in the context of B
  | "example_of";       // A is an example of B

export interface ConceptRelation {
  relationId: string;
  userId: string;
  sourceConceptId: string;
  targetConceptId: string;
  relationType: RelationType;
  strength: number; // 0.0-1.0 (how strong the connection)
  
  // Discovery tracking
  discoveredAt: Timestamp;
  isEmergent: boolean; // Did user discover this connection themselves?
  discoveryInsight?: string; // What user said when connecting
  discoveredBy: "user" | "system" | "path"; // Who/what created this relation
  
  // Context
  sessionId?: string; // Session where relation was discovered
}

// ===================================
// Learning Path
// ===================================

export type PathStatus = "suggested" | "active" | "paused" | "completed" | "abandoned";
export type MilestoneStatus = "not_started" | "in_progress" | "completed" | "locked" | "available";
export type MasteryLevel = "exploring" | "learning" | "practicing" | "comfortable" | "expert";

export interface LearningPath {
  pathId: string;
  userId: string;
  title: string;
  description: string;
  goal: string;
  
  // Path structure
  milestones: PathMilestone[];
  estimatedMinutes: number;
  
  // Status & Progress
  status: PathStatus;
  progress: number; // 0.0-1.0 overall completion
  currentMilestoneIndex: number;
  
  // Generation context
  generatedFrom: {
    userGoal: string;
    originalGoal?: string;
    isOverview?: boolean;
    skippedCalibration?: boolean;
    knownConceptIds: string[];
    userLevel: "beginner" | "intermediate" | "advanced";
    learningStyle?: string;
    declaredKnownConcepts?: string[];
    declaredFamiliarConcepts?: string[];
    /** Snapshot of global knowledge profile used at creation time (E18-S6) */
    knowledgeProfileSnapshot?: Array<{ concept: string; confidence: number }>;
  };
  
  // Timestamps
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  lastActivityAt: Timestamp;
}

export interface PathMilestone {
  milestoneId: string;
  order: number; // 0-indexed position
  title: string;
  description: string;
  
  // Content
  conceptIds: string[]; // Concept IDs to learn in this milestone
  conceptNames: string[]; // Denormalized for display
  estimatedMinutes: number;
  
  // Learning objectives
  objectives: string[];
  /** Indices of objectives the learner has demonstrated mastery of (AI-assessed) */
  completedObjectives?: number[];
  
  // Status & Progress
  status: MilestoneStatus;
  progress: number; // 0.0-1.0
  completedAt?: Timestamp;
  
  // Dependencies
  prerequisiteMilestoneIds: string[]; // Milestones that must come first
}

// Helper type for path generation input
export interface PathGenerationInput {
  userId: string;
  goal: string;
  originalGoal?: string;
  isOverview?: boolean;
  skippedCalibration?: boolean;
  knownConcepts: ConceptNode[];
  userLevel: "beginner" | "intermediate" | "advanced";
  declaredKnownConcepts?: string[];
  declaredFamiliarConcepts?: string[];
  timeAvailableMinutes?: number;
  learningStyle?: string;
  preferredDepth?: "quick" | "thorough" | "deep";
}

// Helper type for path generation output (before saving)
export interface GeneratedPath {
  title: string;
  description: string;
  milestones: Array<{
    title: string;
    description: string;
    concepts: string[]; // concept names (will be converted to IDs)
    objectives: string[];
    estimatedMinutes: number;
    prerequisites: number[]; // indices of prerequisite milestones
  }>;
  estimatedMinutes: number;
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
// Objective Quiz System
// ===================================

export type QuizQuestionType = "multiple_choice" | "true_false" | "short_answer";

export interface QuizQuestion {
  /** 0-based index within the quiz */
  index: number;
  type: QuizQuestionType;
  question: string;
  /** MC: 4 options; TF: ["True","False"]; short_answer: undefined */
  options?: string[];
  /** MC: index of correct option; TF: 0=True,1=False; short_answer: undefined */
  correctAnswer?: number;
  /** Short-answer only: model answer for AI grading */
  modelAnswer?: string;
  /** User's submitted answer (MC/TF: option index; short_answer: text) */
  userAnswer?: number | string;
  /** Whether this question was answered correctly */
  isCorrect?: boolean;
  /** AI feedback for short-answer questions */
  aiFeedback?: string;
}

export interface ObjectiveQuiz {
  objectiveIndex: number;
  objectiveText: string;
  questions: QuizQuestion[];
  /** Current question being displayed (0-3) */
  currentQuestionIndex: number;
  /** Quiz state */
  status: "in_progress" | "grading_essay" | "completed";
  /** Number of correct answers (out of 4) */
  score: number;
  /** Whether the objective was mastered (score >= 3) */
  passed: boolean;
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

// ===================================
// Graph Visualization (Sprint 4)
// ===================================

export interface GraphNode {
  id: string;
  name: string;
  displayName: string;
  mastery: MasteryLevel;
  domain: string;
  size: number;
  color: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: RelationType;
  strength: number;
  color?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphFilters {
  domains: string[];
  masteryLevels: MasteryLevel[];
  searchQuery: string;
  conceptIds?: string[]; // Optional: constrain graph to specific concepts
}

// ===================================
// Reflection System (Sprint 4)
// ===================================

export interface ReflectionPrompt {
  promptId: string;
  sessionId: string;
  conceptIds: string[];
  promptText: string;
  hints: string[];
  minWords: number;
  maxWords: number;
  createdAt: Timestamp;
}

export interface ReflectionSubmission {
  reflectionId: string;
  userId: string;
  sessionId: string;
  promptId: string;
  content: string;
  wordCount: number;
  skipped: boolean;
  submittedAt: Timestamp;
}

export interface ReflectionAnalysis {
  reflectionId: string;
  overallScore: number;
  strengths: string[];
  suggestions: string[];
  misconceptions: Array<{
    claim: string;
    correction: string;
    severity: "minor" | "significant";
  }>;
  conceptUpdates: Array<{
    conceptId: string;
    conceptName: string;
    previousMastery: MasteryLevel;
    newMastery: MasteryLevel;
    confidenceDelta: number;
  }>;
  encouragement?: string;
}
