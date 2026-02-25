# LearningOS: API Contract Documentation

**Project:** LearningOS  
**Version:** 1.0  
**Date:** January 27, 2026  
**Author:** Blast  
**Purpose:** OpenAPI-style endpoint specifications with request/response schemas for MVP

---

## Base Configuration

### Base URL
```
Production: https://api.learningos.com/v1
Development: http://localhost:3000/api/v1
```

### Authentication
All endpoints except `/auth/*` require Bearer token authentication.

```http
Authorization: Bearer <firebase_id_token>
```

### Common Headers
```http
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>  # For tracing
```

### Rate Limiting
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706367600
```

### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string          // Machine-readable error code
    message: string       // Human-readable message
    details?: object      // Additional context
    requestId: string     // For support/debugging
  }
}
```

### Common Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `INVALID_REQUEST` | Malformed request body |
| 400 | `VALIDATION_ERROR` | Field validation failed |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Token valid but access denied |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Resource already exists |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Temporarily unavailable |

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Profile](#2-profile)
3. [Learning Paths](#3-learning-paths)
4. [Reflect Mode](#4-reflect-mode)
5. [Chat](#5-chat)
6. [Concept Graph](#6-concept-graph)
7. [Sessions](#7-sessions)
8. [Export](#8-export)

---

## 1. Authentication

### POST /auth/signup

Create a new user account with email/password.

**Request:**
```typescript
{
  email: string      // Valid email format
  password: string   // Min 8 characters
  name?: string      // Optional display name
}
```

**Response (201 Created):**
```typescript
{
  user: {
    id: string
    email: string
    name: string | null
    createdAt: string  // ISO 8601
  }
  token: string        // Firebase ID token
  refreshToken: string
}
```

**Errors:**
| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Invalid email format or short password |
| 409 | `EMAIL_EXISTS` | Email already registered |

---

### POST /auth/login

Authenticate existing user.

**Request:**
```typescript
{
  email: string
  password: string
}
```

**Response (200 OK):**
```typescript
{
  user: {
    id: string
    email: string
    name: string | null
    hasProfile: boolean  // Has completed onboarding?
    tier: "free" | "supporter" | "pro" | "patron"
  }
  token: string
  refreshToken: string
}
```

**Errors:**
| Status | Code | When |
|--------|------|------|
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 429 | `TOO_MANY_ATTEMPTS` | Account temporarily locked |

---

### POST /auth/refresh

Refresh expired ID token.

**Request:**
```typescript
{
  refreshToken: string
}
```

**Response (200 OK):**
```typescript
{
  token: string
  refreshToken: string
}
```

---

### POST /auth/logout

Invalidate current session.

**Request:** Empty body

**Response (204 No Content)**

---

### GET /auth/me

Get current authenticated user.

**Response (200 OK):**
```typescript
{
  id: string
  email: string
  name: string | null
  hasProfile: boolean
  tier: "free" | "supporter" | "pro" | "patron"
  createdAt: string
  lastActiveAt: string
}
```

---

## 2. Profile

### GET /profile

Get current user's learner profile.

**Response (200 OK):**
```typescript
{
  userId: string
  name: string
  domains: string[]
  confidence: Record<string, number>  // domain → 0.0-1.0
  metaphorBias: string[]
  tonePreference: "conversational" | "formal" | "playful" | "socratic"
  learningStyle: "dialogue" | "diagrams" | "code"
  knownUnknowns: string[]
  metaGoal: "curiosity" | "mastery" | "application" | "exam" | "teaching"
  
  // Phase 2 fields (may be null)
  selectedPersona: string | null
  unlockedPersonas: string[]
  language: string  // ISO code
  
  // Computed
  overallConfidence: number
  overallUnderstanding: number
  currentQuadrant: "mastery" | "overconfident" | "imposter" | "beginner"
  
  createdAt: string
  updatedAt: string
  version: number
}
```

**Errors:**
| Status | Code | When |
|--------|------|------|
| 404 | `PROFILE_NOT_FOUND` | User hasn't completed onboarding |

---

### POST /profile

Create profile during onboarding.

**Request:**
```typescript
{
  name: string
  domains: string[]
  metaphorBias: string[]
  tonePreference: "conversational" | "formal" | "playful" | "socratic"
  metaGoal: "curiosity" | "mastery" | "application" | "exam" | "teaching"
  
  // Optional (extracted from intake conversation)
  rawIntakeText?: string
}
```

**Response (201 Created):**
```typescript
{
  userId: string
  name: string
  domains: string[]
  // ... full profile object
}
```

**Errors:**
| Status | Code | When |
|--------|------|------|
| 409 | `PROFILE_EXISTS` | Profile already created |

---

### PATCH /profile

Update profile fields.

**Request:**
```typescript
{
  name?: string
  domains?: string[]
  tonePreference?: "conversational" | "formal" | "playful" | "socratic"
  metaGoal?: "curiosity" | "mastery" | "application" | "exam" | "teaching"
  selectedPersona?: string | null
  language?: string
}
```

**Response (200 OK):** Updated profile object

---

### POST /profile/analyze-intake

Analyze onboarding conversation to extract profile data.

**Request:**
```typescript
{
  conversation: {
    role: "user" | "assistant"
    content: string
  }[]
}
```

**Response (200 OK):**
```typescript
{
  extracted: {
    domains: string[]
    metaphorBias: string[]
    suggestedTonePreference: string
    knownUnknowns: string[]
    suggestedTopics: string[]
  }
  confidence: number  // How confident is extraction? 0.0-1.0
}
```

---

## 3. Learning Paths

### POST /paths/generate

Generate a new personalized learning path.

**Request:**
```typescript
{
  topic: string              // What to learn
  depth?: "quick" | "standard" | "deep"  // Default: standard
  preferCodeExamples?: boolean
}
```

**Response (200 OK):**
```typescript
{
  path: {
    id: string
    title: string
    learningGoal: string
    targetConcepts: string[]
    steps: PathStep[]
    reflectPrompt: string
    followUpOptions: string[]
    estimatedMinutes: number
    createdAt: string
  }
}

interface PathStep {
  id: string
  order: number
  content: string           // Markdown
  contentType: "text" | "code" | "diagram"
  codeLanguage?: string     // If contentType is "code"
  checkpointQuestion?: string
}
```

**Notes:**
- Uses streaming for generation (see Streaming section)
- Path is automatically saved as in-progress

**Errors:**
| Status | Code | When |
|--------|------|------|
| 400 | `INVALID_TOPIC` | Topic too vague or inappropriate |
| 429 | `GENERATION_LIMIT` | Hit daily generation limit |

---

### GET /paths/:pathId

Get a specific path.

**Response (200 OK):**
```typescript
{
  path: MicroPath
  progress: {
    currentStep: number
    completedSteps: string[]
    startedAt: string
    lastActiveAt: string
    checkpointResponses: Record<string, {
      response: string
      score: number
      feedback: string
    }>
  } | null
}
```

---

### GET /paths

List user's paths (history and in-progress).

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | all | `in_progress`, `completed`, `all` |
| limit | number | 20 | Max results |
| offset | number | 0 | Pagination offset |

**Response (200 OK):**
```typescript
{
  paths: {
    id: string
    title: string
    topic: string
    status: "in_progress" | "completed"
    progress: number  // 0.0-1.0
    createdAt: string
    completedAt: string | null
  }[]
  total: number
  hasMore: boolean
}
```

---

### POST /paths/:pathId/progress

Update progress on a path (step completion).

**Request:**
```typescript
{
  stepId: string
  action: "complete" | "skip"
  checkpointResponse?: string  // If step has checkpoint
  timeSpent: number            // Seconds on this step
}
```

**Response (200 OK):**
```typescript
{
  stepId: string
  status: "completed" | "skipped"
  checkpointAnalysis?: {
    score: number
    feedback: string
    conceptsCovered: string[]
  }
  pathProgress: number  // Overall path progress 0.0-1.0
  nextStep: PathStep | null
  isComplete: boolean   // Was this the last step?
}
```

---

### POST /paths/:pathId/struggle

Report struggling on current step.

**Request:**
```typescript
{
  stepId: string
  struggleType: "explain_differently" | "concrete_example" | "missed_earlier" | "too_advanced" | "other"
  details?: string  // Free-form explanation
}
```

**Response (200 OK):**
```typescript
{
  action: "regenerate_step" | "add_example" | "show_prerequisite" | "simplify" | "open_chat"
  content?: string           // New/additional content if applicable
  prerequisiteConcept?: string
  chatContext?: string       // Context to seed chat if action is open_chat
}
```

---

## 4. Reflect Mode

### GET /reflect/:pathId/prompt

Get reflection prompt for completed path.

**Response (200 OK):**
```typescript
{
  pathId: string
  pathTitle: string
  topic: string
  prompt: string
  suggestedLength: {
    min: number  // Words
    max: number
  }
  conceptsToAddress: string[]
}
```

---

### POST /reflect/:pathId

Submit reflection and get analysis.

**Request:**
```typescript
{
  reflectionText: string  // 20-2000 words
  timeSpent: number       // Seconds
}
```

**Response (200 OK):**
```typescript
{
  analysis: {
    overallScore: number    // 0.0-1.0
    
    dimensions: {
      breadth: number       // Coverage of concepts
      depth: number         // Quality of understanding
      connections: number   // Links between concepts
      synthesis: number     // Original thinking
    }
    
    conceptsCovered: {
      concept: string
      understood: boolean
      extractedDefinition?: string
    }[]
    
    conceptsMissed: string[]
    
    misconceptions: {
      concept: string
      whatTheySaid: string
      correction: string
      severity: "minor" | "major"
    }[]
    
    strengths: string[]
    suggestions: string[]
    
    suggestedDefinition: string  // For glossary
  }
  
  learnerStateUpdate: {
    conceptId: string
    previousQuadrant: string
    newQuadrant: string
    confidenceDelta: number
    understandingDelta: number
  }[]
  
  nextSuggestions: {
    goDeeper: string      // Topic to explore more
    related: string       // Related concept
    prerequisite?: string // If they missed fundamentals
  }
  
  graphUpdates: {
    nodesAdded: string[]
    nodesUpdated: string[]
    edgesAdded: { from: string, to: string, type: string }[]
  }
}
```

**Notes:**
- This endpoint triggers concept graph updates automatically
- Uses streaming for analysis (see Streaming section)

---

## 5. Chat

### POST /chat/message

Send a message in chat mode.

**Request:**
```typescript
{
  sessionId?: string   // Existing session, or null to create new
  message: string
  context?: {
    pathId?: string    // If coming from a path
    conceptId?: string // If asking about specific concept
  }
}
```

**Response (200 OK):**
```typescript
{
  sessionId: string
  response: {
    content: string       // Markdown
    hasCode: boolean
    concepts: string[]    // Concepts mentioned (for graph)
  }
  suggestions: string[]   // Follow-up question suggestions
  actions?: {
    type: "create_path" | "add_concept" | "open_reflect"
    label: string
    payload: object
  }[]
}
```

**Notes:**
- Uses streaming (see Streaming section)
- Context from profile is injected automatically

---

### GET /chat/sessions

List chat sessions.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 10 | Max results |
| offset | number | 0 | Pagination |

**Response (200 OK):**
```typescript
{
  sessions: {
    id: string
    title: string        // Generated from first message
    messageCount: number
    createdAt: string
    lastMessageAt: string
  }[]
}
```

---

### GET /chat/sessions/:sessionId

Get full chat session with messages.

**Response (200 OK):**
```typescript
{
  id: string
  title: string
  messages: {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: string
    metadata?: {
      pathGenerated?: string
      conceptsExtracted?: string[]
    }
  }[]
  createdAt: string
}
```

---

### POST /api/chat/unpack *(Implemented)*

Break a dense AI response into 2–3 expanded chunks.

**Request:**
```typescript
{
  content: string     // The AI response text to unpack
  userId: string      // For logging
}
```

**Response (200 OK):**
```typescript
{
  chunks: string[]    // 2–3 expanded explanation chunks
}
```

**Notes:**
- Uses PRIMARY_MODEL (GPT-4), max_tokens 1500, temperature 0.6
- Returns JSON with `chunks` array
- Each chunk expands on a section of the original response with simpler language

---

### POST /api/chat/assess-objectives *(Updated)*

Assess which milestone objectives have been sufficiently covered in conversation.

**Request:**
```typescript
{
  messages: { role: string; content: string }[]
  objectives: string[]
}
```

**Response (200 OK):**
```typescript
{
  readyToQuiz: string[]   // Objectives sufficiently covered, ready for quiz verification
}
```

**Notes:**
- Changed from auto-marking "mastered" to marking "ready to quiz"
- Uses FALLBACK_MODEL (GPT-3.5-turbo) for cost efficiency
- Prompt asks "has this objective been sufficiently covered" rather than "has learner mastered"

---

### POST /api/quiz/generate *(Implemented)*

Generate a 4-question quiz for a specific objective.

**Request:**
```typescript
{
  objective: string   // The objective text to quiz on
  context: string     // Recent conversation context
  userId: string      // For logging
}
```

**Response (200 OK):**
```typescript
{
  questions: [
    {
      type: "multiple_choice"
      question: string
      options: string[]    // 4 options
      correctIndex: number
    },
    {
      type: "true_false"
      question: string
      correctAnswer: boolean
    },
    {
      type: "multiple_choice"
      question: string
      options: string[]
      correctIndex: number
    },
    {
      type: "short_answer"
      question: string
      modelAnswer: string  // For AI grading comparison
    }
  ]
}
```

**Notes:**
- Uses PRIMARY_MODEL (GPT-4), max_tokens 1200, temperature 0.6
- Fixed 4-question format: MC → T/F → MC → Short Answer
- Questions are contextual to the conversation, not generic

---

### POST /api/quiz/grade-essay *(Implemented)*

AI-grade a short answer quiz response.

**Request:**
```typescript
{
  question: string
  modelAnswer: string   // Expected answer from quiz generation
  userAnswer: string    // Learner's response
  userId: string        // For logging
}
```

**Response (200 OK):**
```typescript
{
  correct: boolean      // true if score >= 0.6
  score: number         // 0.0–1.0
  feedback: string      // Explanation of grading
}
```

**Notes:**
- Uses PRIMARY_MODEL (GPT-4), temperature 0.3
- Rejects answers < 5 words (auto-fail)
- Score ≥ 0.6 = pass

---

## 6. Concept Graph

### GET /graph

Get user's full concept graph.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| domain | string | all | Filter by domain |
| includeUnstarted | boolean | false | Include suggested concepts |

**Response (200 OK):**
```typescript
{
  nodes: ConceptNode[]
  edges: ConceptEdge[]
  stats: {
    totalConcepts: number
    masteredConcepts: number
    inProgressConcepts: number
    domains: string[]
  }
}

interface ConceptNode {
  id: string
  name: string
  definition: string
  domain: string
  
  // State
  confidence: number       // 0.0-1.0
  understanding: number    // 0.0-1.0
  quadrant: "mastery" | "overconfident" | "imposter" | "beginner" | "not_started"
  
  // Metadata
  learnedFrom: string      // Path ID
  learnedAt: string | null
  lastReflectedAt: string | null
  
  // Architectural dependency fields
  abstractPattern?: string
  exampleContext?: string
  
  // Position (for rendering)
  x?: number
  y?: number
}

interface ConceptEdge {
  id: string
  from: string
  to: string
  relationType: "prerequisite" | "related" | "abstraction" | "example" | "applies_to"
  strength: number
  isEmergent: boolean
  discoveryInsight?: string
}
```

---

### GET /graph/concepts/:conceptId

Get detailed concept information.

**Response (200 OK):**
```typescript
{
  concept: ConceptNode & {
    definitionHistory: {
      text: string
      source: "reflection" | "path" | "chat"
      timestamp: string
      confidenceAtTime: number
    }[]
    metaphors: {
      text: string
      sourceContext: string
    }[]
    relatedConcepts: {
      id: string
      name: string
      relation: string
    }[]
    paths: {
      id: string
      title: string
      completedAt: string
    }[]
    reflections: {
      id: string
      score: number
      timestamp: string
    }[]
  }
}
```

---

### POST /graph/concepts

Manually add a concept (from chat or user action).

**Request:**
```typescript
{
  name: string
  definition: string
  domain: string
  relatedTo?: {
    conceptId: string
    relationType: string
  }[]
}
```

**Response (201 Created):** Full ConceptNode

---

### PATCH /graph/concepts/:conceptId

Update concept (e.g., user edits definition).

**Request:**
```typescript
{
  definition?: string
  domain?: string
}
```

**Response (200 OK):** Updated ConceptNode

---

### POST /graph/edges

Add a connection between concepts.

**Request:**
```typescript
{
  from: string  // conceptId
  to: string    // conceptId
  relationType: "prerequisite" | "related" | "abstraction" | "example" | "applies_to"
  isEmergent?: boolean
  discoveryInsight?: string
}
```

**Response (201 Created):** Created edge

---

## 7. Sessions

### GET /sessions

Get user's learning sessions.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 20 | Max results |
| offset | number | 0 | Pagination |
| fromDate | string | - | ISO date filter |
| toDate | string | - | ISO date filter |

**Response (200 OK):**
```typescript
{
  sessions: {
    id: string
    startedAt: string
    endedAt: string | null
    durationMinutes: number
    topicsCovered: string[]
    pathsCompleted: string[]
    reflectionsCompleted: number
    summary: string
  }[]
  total: number
}
```

---

### GET /sessions/stats

Get learning statistics.

**Response (200 OK):**
```typescript
{
  totalSessions: number
  totalMinutes: number
  pathsCompleted: number
  reflectionsCompleted: number
  conceptsLearned: number
  
  byDomain: {
    domain: string
    concepts: number
    averageConfidence: number
    averageUnderstanding: number
  }[]
  
  streak: {
    current: number      // Days
    longest: number
    lastActiveDate: string
  }
  
  recentActivity: {
    date: string
    type: "path" | "reflect" | "chat" | "concept"
    title: string
    conceptId?: string
  }[]
}
```

---

## 8. Export

### POST /export/my-book

Generate "My Book" export of learning journey.

**Request:**
```typescript
{
  format: "markdown" | "pdf" | "json" | "html"
  includeReflections: boolean
  includeGraph: boolean
  domains?: string[]  // Filter by domain, or all
}
```

**Response (202 Accepted):**
```typescript
{
  exportId: string
  status: "processing"
  estimatedSeconds: number
}
```

---

### GET /export/:exportId

Check export status / download.

**Response (200 OK) when processing:**
```typescript
{
  exportId: string
  status: "processing"
  progress: number  // 0-100
}
```

**Response (200 OK) when ready:**
```typescript
{
  exportId: string
  status: "ready"
  downloadUrl: string  // Signed URL, expires in 1 hour
  expiresAt: string
  fileSize: number     // Bytes
}
```

---

### GET /export/data

Export all user data (GDPR compliance).

**Response (200 OK):**
```typescript
{
  user: { ... }
  profile: { ... }
  paths: [ ... ]
  reflections: [ ... ]
  graph: { nodes: [...], edges: [...] }
  chatSessions: [ ... ]
  exportedAt: string
}
```

---

## Streaming Endpoints

For long-running AI operations, use Server-Sent Events (SSE).

### Streaming Format

```http
GET /paths/generate/stream?topic=monads
Accept: text/event-stream
```

**Event Types:**
```
event: start
data: {"pathId": "abc123"}

event: step
data: {"stepId": "step1", "content": "partial content..."}

event: step
data: {"stepId": "step1", "content": "more content..."}

event: step_complete
data: {"stepId": "step1"}

event: complete
data: {"pathId": "abc123", "totalSteps": 5}

event: error
data: {"code": "GENERATION_FAILED", "message": "..."}
```

### Streaming Endpoints

| Endpoint | Description |
|----------|-------------|
| GET /paths/generate/stream | Stream path generation |
| GET /reflect/:pathId/analyze/stream | Stream reflection analysis |
| GET /chat/message/stream | Stream chat response |

---

## Webhooks (Phase 2)

For integrations, support webhook notifications.

### Events

| Event | Payload |
|-------|---------|
| `path.completed` | Path and reflection summary |
| `concept.mastered` | Concept that reached mastery |
| `streak.milestone` | Streak achievement |

---

## API Versioning

- Version in URL: `/v1/`, `/v2/`
- Breaking changes require new version
- Deprecation: 6 month notice, header warning

```http
X-API-Deprecation: true
X-API-Sunset: 2027-01-01
```

---

## SDK Examples

### TypeScript SDK (Planned)

```typescript
import { LearningOS } from '@learningos/sdk'

const client = new LearningOS({ token: 'xxx' })

// Generate path
const path = await client.paths.generate({ topic: 'monads' })

// Stream chat
for await (const chunk of client.chat.streamMessage('What is a functor?')) {
  console.log(chunk.content)
}

// Get graph
const graph = await client.graph.get({ domain: 'functional-programming' })
```

---

## Rate Limits by Tier

| Tier | Requests/min | AI Generations/day | Chat Messages/day |
|------|--------------|--------------------|--------------------|
| Free | 30 | 5 | 20 |
| Supporter | 60 | 20 | 100 |
| Pro | 120 | 50 | Unlimited |
| Patron | 200 | Unlimited | Unlimited |

---

## 9. Prerequisite Intelligence (Epic 14)

> Added: February 25, 2026 — Spec for E14-S2/S3 stories, covering the prerequisite chain service and the path-mutation actions.
> Updated: February 25, 2026 — Aligned with Codex 5.x implementation.

### Design Decision: `getPrerequisiteChain`

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Location | `src/lib/learning/prerequisiteChain.ts` (server-side service) | Queries Firestore directly for fresh concept/relation data. Keeps graph-walk logic co-located with other learning services. |
| Exposed as standalone API? | No — called internally by chat route and gap monitor. | Not needed as a public endpoint; consumed only server-side. A thin API wrapper can be added later if client needs arise. |

### Service: `getPrerequisiteChain(userId, targetConceptId)`

Return the ordered prerequisite chain for a concept, annotated with mastery and readiness flags.

**Function signature** (`src/lib/learning/prerequisiteChain.ts`):
```typescript
export async function getPrerequisiteChain(
  userId: string,
  targetConceptId: string
): Promise<PrerequisiteChainResult>
```

**Return type:**
```typescript
export type PrerequisiteReadiness =
  | "likely_known"       // masteryScore ≥ 0.8
  | "needs_assessment"   // masteryScore < 0.3 (or null)
  | "reinforce";         // 0.3 ≤ masteryScore < 0.8

export interface PrerequisiteConcept {
  conceptId: string;
  conceptName: string;
  depth: number;              // Hops from target (1 = direct prereq)
  mastery: number | null;     // 0.0-1.0 numeric score, null if unknown
  readiness: PrerequisiteReadiness;
  source: "graph" | "inferred"; // "inferred" = AI-generated when no graph prereqs exist
}

export interface PrerequisiteChainResult {
  targetConceptId: string;
  /** Ordered list: deepest (most-foundational) first */
  prerequisites: PrerequisiteConcept[];
  /** True if a cycle was detected and broken during traversal */
  cycleDetected: boolean;
  /** True if no graph prerequisites existed and the AI inference fallback was used */
  usedInferredPrerequisites: boolean;
}
```

**Algorithm notes:**
- BFS from `targetConceptId`, following **incoming** `prerequisite` relations (sourceConceptId → targetConceptId).
- Maintain a `visiting` set for cycle detection; when revisiting a node, set `cycleDetected = true` and skip.
- Sort final chain by depth descending (most-foundational first), then alphabetically.
- Flag each node: ≥ 0.8 → `likely_known`, < 0.3 or null → `needs_assessment`, else `reinforce`.
- **AI fallback:** When no graph prerequisites exist, call LLM (`AI_CONFIG.FALLBACK_MODEL`) to infer 2–5 likely prerequisites. These are returned with `source: "inferred"` and synthetic concept IDs (`inferred:<name>:<index>`).

---

### PATCH /paths/:pathId — action: `insert_milestone`

Insert a new prerequisite milestone into an existing path before a specified milestone (E14-S3: Dynamic Prerequisite Detection).

**Authentication:** Bearer token required. User must own the path.

**Request:**
```typescript
{
  action: "insert_milestone";
  userId?: string;                   // Verified against auth token

  /** Insert before this milestone. Falls back to current milestone if omitted. */
  beforeMilestoneId?: string;

  /** Milestone fields */
  title: string;                     // Required
  description: string;               // Required
  conceptName: string;               // Required — display name of prerequisite concept
  conceptId?: string;                // If known; omit for inferred concepts
  objectives?: string[];             // Defaults to ["Build foundational understanding of {conceptName}"]
  estimatedMinutes?: number;         // Defaults to 30
  milestoneId?: string;              // Override auto-generated ID (for idempotency)

  /** Provenance — why this milestone was inserted (optional but recommended) */
  provenance?: {
    reason: "prerequisite_gap";      // Extensible enum
    detectedInMilestoneId?: string;  // Which milestone surfaced the gap
    detectedInSessionId?: string;    // Chat session where AI flagged it
    userChoice?: "accepted" | "self_assessed_known";
  };
}
```

**Validation rules:**
- `title`, `description`, and `conceptName` are required.
- `beforeMilestoneId`, if provided, must reference an existing milestone in the path.
- Path `status` must be `active` (cannot mutate completed/abandoned paths).
- A maximum of **5 prerequisite insertions** per path (guard against runaway insertion loops).

**Response (200 OK):**
```typescript
{
  path: LearningPath;  // Full updated path with re-indexed milestones
}
```

**Side effects:**
1. All milestone `order` fields are recalculated.
2. `currentMilestoneIndex` is shifted forward (+1) if insertion is at or before the current position.
3. Overall `progress` is recalculated (may decrease since new work was added).
4. `provenance` is stored on the milestone for audit trail (in `provenance` field on PathMilestone).

**Errors:**
| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Missing required fields |
| 400 | `MAX_PREREQ_INSERTIONS` | Path already has 5 inserted prerequisite milestones |
| 404 | `PATH_NOT_FOUND` | pathId doesn't exist |
| 409 | `PATH_NOT_ACTIVE` | Path is completed or abandoned |

---

### PATCH /paths/:pathId — action: `self_assess_prerequisite_known`

Record that the user already knows a prerequisite concept, boosting its confidence/understanding scores.

**Request:**
```typescript
{
  action: "self_assess_prerequisite_known";
  userId?: string;
  conceptId: string;                 // Required — the prerequisite concept
  confidence?: number;               // 0.0-1.0, defaults to 0.85
}
```

**Side effects:**
- Concept `confidence` set to `max(0, min(1, confidence))`.
- Concept `understanding` set to `max(existing, confidence)`.
- `lastReviewed` updated to now.

**Errors:**
| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Missing conceptId |
| 404 | `NOT_FOUND` | Concept doesn't exist |

---

### 9b. Adaptive Screening Conversation (E14-S1)

> Added: February 25, 2026 — API contract for the adaptive screening conversation that replaces scope-analysis → narrowing → pills pipeline.

#### Design Decision: Screening Architecture

| Decision | Choice | Rationale |
|----------|--------|----------|
| Multi-turn management | Client holds conversation history, sends full history each turn | Matches existing chat pattern. No server-side session state needed. |
| Output | `ScreeningResult` object fed to existing `generateLearningPath()` | Surgical replacement of the front half of the pipeline; path generation is untouched. |
| Model | `gpt-4` (AI_CONFIG.PRIMARY_MODEL) | Quality assessment of user knowledge requires strong reasoning. |
| Screening mandatory? | Yes — replaces pills entirely. Auto-skipped only when graph data is high-confidence. | Prevents users from landing in paths they can't handle. |

#### Pre-check: Auto-skip screening

Before entering the screening chat, the client calls:

```
POST /api/paths/screening/preflight
```

**Request:**
```typescript
{
  goal: string;        // The user's learning goal
}
```

**Response (200 OK):**
```typescript
{
  skipScreening: boolean;          // True if all prereqs are likely_known
  reason: string;                  // Human-readable (e.g., "Based on your history, you're ready for this.")
  prerequisiteChain?: PrerequisiteChainResult;  // From S2 walker, if available
  suggestedGoal?: string;          // Refined/narrowed goal if the system can infer it
}
```

**Logic:**
1. Call `getPrerequisiteChain(userId, targetConceptId)` for concepts related to the goal.
2. If ALL prerequisites return `likely_known` → `skipScreening: true`.
3. Otherwise → `skipScreening: false`, and the client enters the screening chat.

---

#### POST /api/paths/screening

Send a message in the screening conversation and receive the AI's next response.

**Authentication:** Bearer token required.

**Request:**
```typescript
{
  goal: string;                    // The original learning goal
  messages: Array<{                // Full conversation history
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  userAction?: "dont_know" | "generate_now";  // Special button actions
}
```

| `userAction` | Behavior |
|-------------|----------|
| `undefined` | Normal message — AI responds conversationally |
| `"dont_know"` | User clicked "I don't know enough to answer" — AI drops to broader probing |
| `"generate_now"` | User clicked "Generate my path" — AI wraps up and produces ScreeningResult immediately |

**Response (200 OK) — conversation continues:**
```typescript
{
  reply: string;                   // AI's next message
  done: false;
  messages: Array<{...}>;          // Updated conversation history (for client to store)
  progress: {                      // Optional progress indicator
    assessedCount: number;         // How many concepts the AI has assessed so far
    estimatedRemaining: number;    // How many more questions the AI expects
  };
}
```

**Response (200 OK) — screening complete:**
```typescript
{
  reply: string;                   // AI's final summary message
  done: true;
  messages: Array<{...}>;          // Full conversation to save as first chat session
  screeningResult: ScreeningResult;
}
```

#### ScreeningResult type

```typescript
export interface AssessedPrerequisite {
  conceptName: string;
  conceptId?: string;              // If it exists in the graph
  confidence: number;              // 0.0-1.0 — AI-assessed (higher signal than self-report)
  source: "conversation" | "graph"; // How the assessment was made
  readiness: PrerequisiteReadiness; // "likely_known" | "needs_assessment" | "reinforce"
}

export type GapTier = "none" | "small" | "medium" | "large";

export interface ScreeningResult {
  /** Possibly refined/narrowed goal from conversation */
  refinedGoal: string;
  /** Original goal before any narrowing */
  originalGoal: string;
  /** Whether the goal was narrowed during conversation */
  wasNarrowed: boolean;
  /** Assessed prerequisites with confidence scores */
  assessedPrerequisites: AssessedPrerequisite[];
  /** Gap tier determines the system's response */
  gapTier: GapTier;
  /** For medium/large gaps: suggested prerequisite path goal(s) */
  suggestedPrerequisitePaths?: Array<{
    goal: string;
    reason: string;
    estimatedMilestones: number;
  }>;
  /** Concepts the user demonstrated knowledge of (replaces declaredKnownConcepts) */
  knownConcepts: string[];
  /** Concepts the user showed partial familiarity with (replaces declaredFamiliarConcepts) */
  familiarConcepts: string[];
  /** The full conversation to save as the path's first chat session */
  conversationHistory: Array<{ role: string; content: string }>;
}
```

**Gap tier behavior:**

| Tier | Condition | System Response |
|------|-----------|----------------|
| `none` | All prerequisites assessed as known | Proceed directly to `generateLearningPath()` with `knownConcepts` / `familiarConcepts` |
| `small` | 1-3 concepts need learning | Proceed to `generateLearningPath()` with prerequisite milestones prepended to the path |
| `medium` | 4-8 concepts / one prerequisite area | Suggest creating **one** prerequisite path first. Original goal preserved as dependent path (E14-S6). |
| `large` | 9+ concepts / multiple foundational areas | Suggest a **chain** of prerequisite paths. Each linked via `dependsOnPathId` (E14-S6). |

**Integration with `PathGenerationInput`:**

The `ScreeningResult` maps to `PathGenerationInput` as follows:
```typescript
{
  goal: screeningResult.refinedGoal,
  originalGoal: screeningResult.originalGoal,
  // NEW field — replaces declaredKnownConcepts/declaredFamiliarConcepts
  assessedPrerequisites: screeningResult.assessedPrerequisites,
  // Legacy fields still populated for backward compat
  declaredKnownConcepts: screeningResult.knownConcepts,
  declaredFamiliarConcepts: screeningResult.familiarConcepts,
  skippedCalibration: false,  // Always false — screening is mandatory
}
```

**Errors:**
| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Missing goal or messages |
| 429 | `RATE_LIMITED` | More than 20 messages in a single screening conversation |

---

**Document Status:** Complete API Contract Documentation  
**Next:** Epic/Story Breakdown  
**Owner:** Blast  
**Last Updated:** February 25, 2026
