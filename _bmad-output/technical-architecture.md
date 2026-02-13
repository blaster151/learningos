# LearningOS Technical Architecture

**Project:** LearningOS  
**Version:** 1.1  
**Date:** January 27, 2026 (Updated)  
**Author:** Blast  
**Status:** Architecture with Phase 2+ Dependencies Integrated

---

## 🔴 Important: Architectural Dependencies

**This architecture includes data model extensions and system design patterns to support Phase 2+ features, even though those features won't be built in MVP.**

**Why:** Features like abstraction scaffolding, teacher personas, and emergent abstractions require specific data structures. Building them into the schema now prevents painful data migrations later.

**What's Extended:**
- **Concept Schema**: Added `domain`, `abstractPattern`, `definitionHistory` for scaffolding/glossary
- **ConceptRelation Schema**: Added `relationType`, `isEmergent`, `discoveryInsight` for pattern detection
- **UserProfile Schema**: Added `selectedPersona`, `language`, `metaGoal`, `achievements` for future features
- **Prompt System**: Designed as composable layers to support personas/multilingual without refactoring

**See:** `architectural-dependencies.md` for full analysis of which deferred features need groundwork now.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [High-Level Architecture](#high-level-architecture)
4. [Component Design](#component-design)
5. [Data Models](#data-models)
6. [API Design](#api-design)
7. [AI/LLM Integration](#aillm-integration)
8. [Security & Privacy](#security--privacy)
9. [Scalability & Performance](#scalability--performance)
10. [Infrastructure & Deployment](#infrastructure--deployment)
11. [Technology Stack](#technology-stack)
12. [Development Phases](#development-phases)

---

## System Overview

### Purpose

LearningOS is a conversational learning platform that creates personalized learning experiences by:
- Understanding individual learners through natural conversation
- Generating custom learning paths based on existing knowledge and preferences
- Maintaining context and memory across sessions
- Facilitating active learning through "Reflect Mode"
- Building visual concept graphs of learner understanding

### Key Technical Goals

- **Personalization at Scale:** Each user gets unique content tailored to their mental models
- **Stateful Conversations:** Maintain context across sessions without expensive full-context reloading
- **Cost-Effective AI:** Balance powerful LLM capabilities with sustainable economics
- **Responsive UX:** Real-time conversational feel with streaming responses
- **Privacy-First:** User learning data remains private and portable

### System Constraints

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| **LLM API Costs** | GPT-4 calls expensive at scale | Hybrid model strategy, caching, smart routing |
| **Context Window Limits** | Can't load full history every time | Memory summarization, context injection |
| **Latency** | User expects <3s responses | Streaming, parallel processing, pre-computation |
| **Stateless LLMs** | No native memory between calls | Application-level memory management |
| **Data Privacy** | Learning data is sensitive | Encryption, user control, data portability |

---

## Architecture Principles

### 1. **Progressive Enhancement**
Start with core loop working simply, add sophistication incrementally. MVP delivers value; enhancements improve it.

### 2. **Smart Context Management**
Only inject what's needed. Summarize history. Cache common patterns. Every token sent costs money and time.

### 3. **Modular AI Routing**
Different tasks use different models. Simple summarization doesn't need GPT-4. Route intelligently.

### 4. **State at the Edge**
Store learner state in database, inject dynamically into prompts. LLM remains stateless, application manages continuity.

### 5. **User-First Privacy**
Users own their data. Can export, delete, or move it. Never train on user data without explicit consent.

### 6. **Fail Gracefully**
If AI generation fails, provide meaningful fallback. Never leave user stranded mid-learning.

### 7. **Observable System**
Log everything relevant. Track costs, quality, performance. Optimize what you measure.

---

## High-Level Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃            React Application (SPA)                        ┃  │
│  ┃  • Conversation Interface                                 ┃  │
│  ┃  • Concept Graph Visualization (D3/Mermaid)               ┃  │
│  ┃  • Profile Management                                     ┃  │
│  ┃  • Reflect Mode UI                                        ┃  │
│  ┃  • Export Tools                                           ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃        Next.js API Routes / Express Server                ┃  │
│  ┃  • Authentication & Authorization                         ┃  │
│  ┃  • Rate Limiting                                          ┃  │
│  ┃  • Request Validation                                     ┃  │
│  ┃  • Response Streaming                                     ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Profile Engine  │  │  Path Generator  │  │ Reflect Engine │ │
│  │                 │  │                  │  │                │ │
│  │ • Parse intake  │  │ • Create paths   │  │ • Validate     │ │
│  │ • Extract prefs │  │ • Personalize    │  │ • Score        │ │
│  │ • Build profile │  │ • Sequence steps │  │ • Feedback     │ │
│  └────────┬────────┘  └────────┬─────────┘  └───────┬────────┘ │
│           │                    │                     │          │
│  ┌────────▼────────────────────▼─────────────────────▼────────┐ │
│  │            Context Manager & Memory Service                │ │
│  │  • Session management                                      │ │
│  │  • Memory summarization                                    │ │
│  │  • Context injection                                       │ │
│  │  • Cache management                                        │ │
│  └────────────────────────────┬───────────────────────────────┘ │
│                               │                                  │
│  ┌────────────────────────────▼───────────────────────────────┐ │
│  │              Concept Graph Builder                         │ │
│  │  • Update knowledge graph                                  │ │
│  │  • Detect connections                                      │ │
│  │  • Track abstractions                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                       AI/LLM LAYER                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              AI Service Router                              ││
│  │  • Model selection logic                                    ││
│  │  • Prompt template management                               ││
│  │  • Cost tracking                                            ││
│  │  • Error handling & fallbacks                               ││
│  └─────┬────────────────────┬───────────────────────┬──────────┘│
│        │                    │                       │            │
│  ┌─────▼──────┐  ┌─────────▼────────┐  ┌──────────▼─────────┐ │
│  │   GPT-4    │  │   GPT-3.5 Turbo  │  │  Mistral/Claude    │ │
│  │            │  │                  │  │                    │ │
│  │ • Paths    │  │ • Summaries      │  │ • Fallback         │ │
│  │ • Reflect  │  │ • Quick answers  │  │ • Cheap ops        │ │
│  └────────────┘  └──────────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │  Firebase Auth   │  │ Firestore/Cloud │  │  Redis Cache   │ │
│  │                  │  │                 │  │                │ │
│  │ • User identity  │  │ • User profiles │  │ • Session data │ │
│  │ • OAuth tokens   │  │ • Learning hist │  │ • Prompt cache │ │
│  │ • Permissions    │  │ • Concept graph │  │ • Rate limits  │ │
│  └──────────────────┘  └─────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Learning Session

```
1. USER sends message
   ↓
2. API GATEWAY
   • Authenticates user
   • Loads session context
   • Rate check
   ↓
3. CONTEXT MANAGER
   • Retrieves user profile
   • Loads relevant memory
   • Builds context payload
   ↓
4. APPLICATION SERVICE
   (Profile Engine / Path Generator / Reflect Engine)
   • Determines intent
   • Selects appropriate prompt template
   • Enriches with user context
   ↓
5. AI SERVICE ROUTER
   • Selects model (GPT-4 vs 3.5)
   • Executes LLM call
   • Streams response
   ↓
6. RESPONSE PROCESSING
   • Parse structured output
   • Update concept graph
   • Summarize for memory
   • Cache if reusable
   ↓
7. STREAM to CLIENT
   • Real-time display
   • Update UI state
   ↓
8. POST-PROCESSING
   • Store in database
   • Log for analytics
   • Track costs
```

---

## Component Design

### 1. Profile Engine

**Purpose:** Extract and maintain learner characteristics from conversation.

**Responsibilities:**
- Parse onboarding conversation into structured profile
- Extract metaphor preferences, tone, learning style
- Update profile based on interactions
- Score confidence levels in different domains

**Key Methods:**
```typescript
interface ProfileEngine {
  parseIntake(conversation: Message[]): LearnerProfile
  extractMetaphors(text: string): Metaphor[]
  updateProfile(userId: string, updates: Partial<LearnerProfile>): void
  getProfile(userId: string): LearnerProfile
}
```

**Data Outputs:**
```typescript
interface LearnerProfile {
  userId: string
  name?: string
  domains: Domain[]           // ["React", "Redux", "JavaScript"]
  confidence: ConfidenceMap   // { "React": 0.9, "Haskell": 0.1 }
  metaphorBias: string[]      // ["code-based", "visual"]
  tonePreference: Tone        // "conversational" | "formal" | "playful"
  learningStyle: Style        // "dialogue" | "diagrams" | "code"
  knownUnknowns: string[]     // ["monads", "type theory"]
  metaGoals: string[]         // ["understand FP", "master Haskell"]
  createdAt: Date
  updatedAt: Date
}
```

**AI Integration:**
- Uses GPT-4 for initial intake parsing
- Structured output with JSON schema validation
- Prompts stored as templates with variable injection

**Caching Strategy:**
- Profile cached in Redis (5min TTL)
- Updated incrementally, not regenerated
- Versioned for rollback if needed

---

### 2. Micro-Path Generator

**Purpose:** Create personalized learning sequences tailored to learner.

**Responsibilities:**
- Generate topic-specific learning paths
- Personalize content with user's metaphors
- Structure content into digestible steps
- Provide follow-up path options

**Key Methods:**
```typescript
interface PathGenerator {
  generatePath(topic: string, profile: LearnerProfile): MicroPath
  personalizePath(basePath: MicroPath, profile: LearnerProfile): MicroPath
  getNextPaths(currentPath: string, profile: LearnerProfile): string[]
}
```

**Data Structures:**
```typescript
interface MicroPath {
  id: string
  title: string
  learningGoal: string
  targetConcepts: string[]
  steps: PathStep[]
  reflectPrompt: string
  followUpOptions: string[]
  estimatedMinutes: number
}

interface PathStep {
  id: string
  content: string          // Markdown with personalized metaphors
  contentType: "text" | "code" | "diagram"
  checkpointQuestion?: string
}
```

**AI Integration:**
- Primary model: GPT-4 (high quality needed)
- Fallback: GPT-3.5 for simple topics
- Template-based generation with slots:
  - `{topic}`, `{userMetaphors}`, `{priorKnowledge}`

**Optimization:**
- Cache common topic paths (Redis)
- Personalization layer applies user-specific touches
- Pre-generate popular paths offline

**Example Prompt Template:**
```
You are creating a personalized learning micro-path.

LEARNER CONTEXT:
- Known concepts: {knownConcepts}
- Preferred metaphors: {metaphors}
- Learning style: {style}

TOPIC: {topic}

TASK:
Create a short learning path (5-7 minutes) that:
1. Connects {topic} to concepts they already know
2. Uses their preferred metaphors ({metaphors})
3. Builds understanding step by step
4. Ends with a reflect prompt

FORMAT: JSON matching MicroPath schema
```

---

### 3. Reflect Engine

**Purpose:** Facilitate "teaching back" moments and validate understanding.

**Responsibilities:**
- Generate reflect prompts based on content
- Analyze learner's explanation
- Identify gaps or misconceptions
- Provide constructive feedback
- Update concept graph with insights

**Key Methods:**
```typescript
interface ReflectEngine {
  generateReflectPrompt(pathId: string, profile: LearnerProfile): string
  analyzeResponse(prompt: string, response: string, topic: string): ReflectAnalysis
  provideFeedback(analysis: ReflectAnalysis): Feedback
}
```

**Data Structures:**
```typescript
interface ReflectAnalysis {
  understandingScore: number        // 0.0 - 1.0
  conceptsCovered: string[]
  conceptsMissed: string[]
  misconceptions: Misconception[]
  strengths: string[]
  suggestions: string[]
}

interface Misconception {
  concept: string
  learnerThought: string
  correction: string
  severity: "minor" | "major"
}
```

**AI Integration:**
- GPT-4 for analysis (needs nuance)
- Custom system prompt as "patient tutor"
- Scored on understanding, not word-matching

**Example Analysis Prompt:**
```
You are analyzing a learner's explanation.

ORIGINAL CONCEPT: {topic}
LEARNER'S EXPLANATION: {response}

TASK:
Evaluate their understanding:
1. What did they get right?
2. What did they miss?
3. Any misconceptions?
4. Score 0.0-1.0

Be encouraging. Focus on growth.

FORMAT: JSON matching ReflectAnalysis schema
```

---

### 4. Context Manager & Memory Service

**Purpose:** Maintain conversation continuity without exploding context windows.

**Responsibilities:**
- Summarize conversation history
- Inject relevant context into prompts
- Manage session state
- Cache frequently used data
- Compress memory for storage

**Key Methods:**
```typescript
interface ContextManager {
  buildContext(userId: string, sessionId: string): ContextPayload
  summarizeSession(messages: Message[]): SessionSummary
  injectContext(prompt: string, context: ContextPayload): string
  cacheContext(key: string, data: any, ttl: number): void
}
```

**Data Structures:**
```typescript
interface ContextPayload {
  profile: LearnerProfile
  recentTopics: string[]
  activeMetaphors: Metaphor[]
  conversationSummary: string
  conceptGraphSnapshot: GraphNode[]
  lastReflection?: ReflectAnalysis
}

interface SessionSummary {
  sessionId: string
  topicsCovered: string[]
  keyInsights: string[]
  newConnections: GraphEdge[]
  learnerQuotes: string[]      // For "you said this earlier"
  durationMinutes: number
}
```

**Memory Strategy:**

**Short-term (Redis):**
- Current session messages (30min TTL)
- Active context payload (5min TTL)
- Prompt cache (1hr TTL)

**Long-term (Firestore):**
- Session summaries (permanent)
- Concept graph (versioned)
- Learning history (permanent)

**Compression:**
```
Full conversation: 10,000 tokens
    ↓ Summarize
Session summary: 500 tokens
    ↓ Extract
Key insights: 200 tokens
    ↓ Inject
Next prompt context: 300 tokens
```

---

### 5. Concept Graph Builder

**Purpose:** Build and maintain visual representation of learner's knowledge.

**Responsibilities:**
- Track concepts learned
- Identify connections between concepts
- Detect emergent abstractions
- Generate graph visualizations
- Support graph queries ("what connects X and Y?")

**Key Methods:**
```typescript
interface ConceptGraphBuilder {
  addConcept(userId: string, concept: Concept): void
  addConnection(userId: string, edge: GraphEdge): void
  detectConnections(newConcept: Concept, graph: Graph): GraphEdge[]
  generateVisualization(userId: string, format: "mermaid" | "d3"): string
  queryPath(from: string, to: string): GraphNode[]
}
```

**Data Structures:**
```typescript
interface Concept {
  id: string
  name: string
  definition: string           // In learner's words
  learnedFrom: string          // Path ID
  confidence: number
  metaphors: Metaphor[]
  relatedConcepts: string[]
  timestamp: Date
}

interface GraphEdge {
  from: string
  to: string
  relationshipType: EdgeType
  strength: number
  discoveredAt: Date
}

type EdgeType = 
  | "prerequisite"           // Must know A before B
  | "analogy"                // A is like B
  | "abstraction"            // B generalizes A
  | "application"            // A uses B
  | "contrast"               // A differs from B
```

**Graph Storage:**
- Document DB (Firestore): Good enough for MVP
- Nodes and edges as subcollections
- Indexed by userId for fast retrieval
- Consider Neo4j if complex queries needed later

**Visualization:**
```typescript
// Generate Mermaid.js syntax for rendering
function toMermaid(graph: Graph): string {
  return `
    graph TD
      ${graph.nodes.map(n => `${n.id}[${n.name}]`).join('\n')}
      ${graph.edges.map(e => `${e.from} --> ${e.to}`).join('\n')}
  `
}
```

---

### 6. AI Service Router

**Purpose:** Intelligently route requests to appropriate AI models based on task complexity and cost.

**Responsibilities:**
- Select best model for each task type
- Handle API calls with retry logic
- Track usage and costs
- Provide fallbacks on failure
- Stream responses when possible

**Key Methods:**
```typescript
interface AIServiceRouter {
  selectModel(taskType: TaskType, complexity: number): ModelConfig
  executePrompt(config: ModelConfig, prompt: string): AsyncGenerator<string>
  trackUsage(modelId: string, tokens: number, cost: number): void
  getFallbackModel(primary: ModelConfig): ModelConfig
}
```

**Routing Logic:**
```typescript
type TaskType = 
  | "intake"           // GPT-4: Needs accuracy
  | "pathGeneration"   // GPT-4: High quality required
  | "reflection"       // GPT-4: Nuanced analysis
  | "summarization"    // GPT-3.5: Good enough
  | "quickAnswer"      // GPT-3.5: Fast & cheap
  | "cheatSheet"       // GPT-3.5: Templated

const ROUTING_TABLE: Record<TaskType, ModelConfig> = {
  intake: { model: "gpt-4", temp: 0.7, maxTokens: 2000 },
  pathGeneration: { model: "gpt-4", temp: 0.8, maxTokens: 3000 },
  reflection: { model: "gpt-4", temp: 0.6, maxTokens: 1500 },
  summarization: { model: "gpt-3.5-turbo", temp: 0.5, maxTokens: 800 },
  quickAnswer: { model: "gpt-3.5-turbo", temp: 0.7, maxTokens: 500 },
  cheatSheet: { model: "gpt-3.5-turbo", temp: 0.4, maxTokens: 1000 },
}
```

**Cost Tracking:**
```typescript
interface UsageLog {
  timestamp: Date
  userId: string
  taskType: TaskType
  model: string
  tokensPrompt: number
  tokensCompletion: number
  cost: number
  latencyMs: number
}
```

**Streaming Implementation:**
```typescript
async function* streamCompletion(prompt: string): AsyncGenerator<string> {
  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  })
  
  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content || ""
  }
}
```

---

## Data Models

### Database Schema (Firestore)

#### Users Collection
```typescript
/users/{userId}
{
  id: string
  email: string
  name: string
  createdAt: Timestamp
  lastActiveAt: Timestamp
  tier: "free" | "supporter" | "pro" | "patron"
  preferences: {
    theme: "light" | "dark"
    notifications: boolean
  }
}
```

#### Profiles Collection
```typescript
/profiles/{userId}
{
  userId: string
  domains: string[]
  confidence: { [domain: string]: number }
  metaphorBias: string[]
  tonePreference: string
  learningStyle: string
  knownUnknowns: string[]
  metaGoals: string[]
  
  // Architectural dependencies for Phase 2+ features
  selectedPersona?: "godel" | "escher" | "bach" | "ada" | "turing" | null
  unlockedPersonas: string[]  // Track achievement-based unlocks
  
  language: string  // ISO code (en, es, fr, ja, etc.) - default: 'en'
  bilingualMode?: boolean
  secondLanguage?: string
  
  metaGoal: "curiosity" | "mastery" | "application" | "exam" | "teaching"  // Default: curiosity
  
  achievements: UserAchievement[]
  gamificationEnabled: boolean  // User can opt out - default: true
  
  updatedAt: Timestamp
  version: number
}

interface UserAchievement {
  achievementId: string
  earnedAt: Timestamp
  seen: boolean  // For showing "new badge!" notifications
```

#### Sessions Collection
```typescript
/sessions/{sessionId}
{
  id: string
  userId: string
  startedAt: Timestamp
  endedAt: Timestamp | null
  topicsCovered: string[]
  pathsCompleted: string[]
  summary: string
  durationMinutes: number
}
```

#### Messages Subcollection
```typescript
/sessions/{sessionId}/messages/{messageId}
{
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Timestamp
  metadata: {
    pathId?: string
    reflectMode?: boolean
    tokensUsed?: number
  }
}
```

#### Concepts Collection
```typescript
/concepts/{userId}/nodes/{conceptId}
{
  id: string
  name: string
  definition: string  // Current definition
  
  // Architectural dependency: Dynamic Glossary (track evolution)
  definitionHistory: Definition[]
  
  // Architectural dependency: Abstraction Scaffolding
  domain: string  // What domain was this learned in? (e.g., "JavaScript", "Category Theory")
  abstractPattern?: string  // What pattern does this exemplify? (e.g., "monad", "composition")
  exampleContext: string  // The concrete example used to teach it
  
  learnedFrom: string  // Which path/session
  confidence: number
  understanding: number  // Structural understanding score (0-1)
  lastReflectionScore: number  // Most recent reflection performance
  
  metaphors: Metaphor[]
  timestamp: Timestamp
  lastRevisited: Timestamp
}

interface Definition {
  text: string
  source: "reflection" | "path" | "chat" | "user_edit"
  timestamp: Timestamp
  confidenceAtTime: number
  understandingAtTime: number
}

interface Metaphor {
  text: string
  sourceContext: string  // Where they used this metaphor
  effectiveness?: number  // Did it lead to high reflection scores?
}

/concepts/{userId}/edges/{edgeId}
{
  id: string
  from: string  // conceptId
  to: string    // conceptId
  
  // Architectural dependency: Abstraction Scaffolding & Emergent Abstractions
  relationType: "prerequisite" | "related" | "abstraction" | "example" | "applies_to"
  
  // Architectural dependency: Emergent Abstractions (user discoveries)
  isEmergent: boolean  // Did user discover this vs system taught it?
  discoveryInsight?: string  // User's "aha moment" explanation
  discoveredBy: "system" | "user"
  
  strength: number  // 0-1, how strong is this connection?
  discoveredAt: Timestamp
  lastReinforced?: Timestamp  // When was this connection revisited?
```

#### Paths Collection (Cache)
```typescript
/paths/{pathId}
{
  id: string
  topic: string
  baseContent: MicroPath
  popularity: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Redis Cache Schema

```typescript
// Session context (5min TTL)
key: `session:${sessionId}:context`
value: JSON.stringify(ContextPayload)

// Profile cache (5min TTL)
key: `profile:${userId}`
value: JSON.stringify(LearnerProfile)

// Prompt cache (1hr TTL)
key: `prompt:${hash(prompt)}`
value: JSON.stringify({ response, timestamp })

// Rate limiting (1min sliding window)
key: `ratelimit:${userId}:${minute}`
value: requestCount
```

---

## API Design

### REST Endpoints

#### Authentication
```typescript
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

#### Profile Management
```typescript
GET    /api/profile
PATCH  /api/profile
POST   /api/profile/intake    // Process onboarding conversation
```

#### Learning Sessions
```typescript
POST   /api/sessions                    // Start new session
GET    /api/sessions/:id                // Get session details
PATCH  /api/sessions/:id                // Update session
POST   /api/sessions/:id/messages       // Add message (triggers AI)
GET    /api/sessions/:id/messages       // Get conversation history
DELETE /api/sessions/:id                // End session
```

#### Micro-Paths
```typescript
POST   /api/paths/generate              // Generate new path
GET    /api/paths/:id                   // Get path details
GET    /api/paths/recommended           // Get recommended next paths
POST   /api/paths/:id/complete          // Mark path complete
```

#### Reflection
```typescript
POST   /api/reflect/prompt              // Get reflect prompt for topic
POST   /api/reflect/analyze             // Analyze learner's response
GET    /api/reflect/history             // Past reflections
```

#### Concept Graph
```typescript
GET    /api/graph                       // Get full concept graph
POST   /api/graph/concepts              // Add concept manually
GET    /api/graph/visualize             // Get visualization (Mermaid/D3)
GET    /api/graph/path?from=X&to=Y      // Find connection path
```

#### Exports
```typescript
GET    /api/export/cheat-sheet/:topic   // Generate cheat sheet
GET    /api/export/my-book               // Export full learning journey
GET    /api/export/data                  // Export all user data (GDPR)
```

### WebSocket Events (Real-time)

```typescript
// Client → Server
{
  type: "message.send",
  payload: { content: string, sessionId: string }
}

// Server → Client (streaming)
{
  type: "message.stream",
  payload: { chunk: string, complete: boolean }
}

// Server → Client (updates)
{
  type: "graph.updated",
  payload: { newConcepts: string[], newEdges: GraphEdge[] }
}

{
  type: "path.completed",
  payload: { pathId: string, nextOptions: string[] }
}
```

---

## AI/LLM Integration

### Prompt Template System

**Template Structure:**
```typescript
interface PromptTemplate {
  id: string
  name: string
  taskType: TaskType
  systemPrompt: string
  userPromptTemplate: string
  variables: string[]
  expectedOutputFormat: "text" | "json" | "markdown"
  jsonSchema?: object
  examples?: PromptExample[]
}
```

**Template Storage:**
```typescript
// Store as code (version controlled)
const INTAKE_TEMPLATE: PromptTemplate = {
  id: "intake-v1",
  name: "Profile Intake Parser",
  taskType: "intake",
  systemPrompt: `You are a thoughtful learning coach analyzing a new learner's background.`,
  userPromptTemplate: `
    LEARNER CONVERSATION:
    {conversation}
    
    TASK: Extract structured profile
    OUTPUT: JSON matching schema
  `,
  variables: ["conversation"],
  expectedOutputFormat: "json",
  jsonSchema: LearnerProfileSchema
}
```

### Prompt Injection Strategy

**Composable Prompt Architecture (Architectural Dependency):**

The prompt system is designed as **composable layers** to support future features (personas, multilingual, meta-goal adaptation) without refactoring:

```typescript
interface PromptLayer {
  priority: number     // Lower = earlier in prompt
  name: string
  content: string
  enabled: boolean     // Can be toggled per-feature
}

/**
 * Build prompts by composing layers in priority order.
 * This architecture allows adding new features (personas, language, tone)
 * as new layers without modifying existing code.
 */
function buildPrompt(
  template: PromptTemplate, 
  context: ContextPayload,
  profile: LearnerProfile
): string {
  
  const layers: PromptLayer[] = [
    // Layer 0: Base system prompt (always first)
    {
      priority: 0,
      name: "base_system",
      content: template.systemPrompt,
      enabled: true
    },
    
    // Layer 1: Language instruction (Architectural dependency: Multilingual)
    {
      priority: 1,
      name: "language",
      content: getLanguageModifier(profile.language),
      enabled: true  // Always inject, even if just "en"
    },
    
    // Layer 2: Tone modulation (MVP feature)
    {
      priority: 2,
      name: "tone",
      content: getToneModifier(profile.tonePreference),
      enabled: true
    },
    
    // Layer 3: Persona voice (Architectural dependency: Teacher Personas)
    {
      priority: 3,
      name: "persona",
      content: getPersonaModifier(profile.selectedPersona),
      enabled: !!profile.selectedPersona  // Only if persona selected
    },
    
    // Layer 4: Meta-goal framing (Architectural dependency: Goal Adaptation)
    {
      priority: 4,
      name: "meta_goal",
      content: getMetaGoalModifier(profile.metaGoal),
      enabled: true
    },
    
    // Layer 10: User context (variables injected)
    {
      priority: 10,
      name: "user_context",
      content: injectVariables(template.userPromptTemplate, context),
      enabled: true
    }
  ]
  
  // Filter enabled layers, sort by priority, join
  return layers
    .filter(layer => layer.enabled)
    .sort((a, b) => a.priority - b.priority)
    .map(layer => layer.content)
    .join('\n\n')
}

/**
 * Modifier functions for each layer
 */

function getLanguageModifier(language: string): string {
  if (language === 'en') return ''  // No modifier needed for default
  
  const languageNames: Record<string, string> = {
    es: 'Spanish',
    fr: 'French',
    ja: 'Japanese',
    de: 'German',
    zh: 'Chinese'
  }
  
  return `CRITICAL INSTRUCTION: Respond entirely in ${languageNames[language] || language}.`
}

function getToneModifier(tone: string): string {
  const toneInstructions: Record<string, string> = {
    conversational: "Use casual, friendly language. Contractions are fine. Speak like you're chatting with a friend.",
    formal: "Use precise, professional language. Avoid colloquialisms. Be clear and structured.",
    playful: "Use creative analogies and wordplay. Be engaging and fun. Don't be afraid to be a bit silly.",
    socratic: "Lead with questions. Guide discovery rather than explaining directly. Help them figure it out."
  }
  
  return `TONE: ${toneInstructions[tone] || toneInstructions.conversational}`
}

function getPersonaModifier(persona: string | null): string {
  if (!persona) return ''
  
  const personaVoices: Record<string, string> = {
    godel: `
      Adopt Gödel's voice:
      - Speak precisely and methodically
      - Build from first principles and axioms
      - Use logical structure ("If X, then Y")
      - Favor formal reasoning over metaphors
      - Patient but rigorous
    `,
    escher: `
      Adopt Escher's voice:
      - Think in patterns and visual structures
      - Use spatial metaphors
      - Embrace paradoxes and recursion
      - Generate diagrams when helpful
      - Playful but profound
    `,
    bach: `
      Adopt Bach's voice:
      - Use musical and rhythmic metaphors
      - See patterns as themes and variations
      - Build structures like compositions
      - Emphasize elegance and harmony
      - Feel the shape before defining it
    `
  }
  
  return personaVoices[persona] || ''
}

function getMetaGoalModifier(goal: string): string {
  const goalFraming: Record<string, string> = {
    curiosity: "Keep it exploratory and low-pressure. Encourage wandering and connections.",
    mastery: "Focus on deep understanding. Don't rush. Ensure solid foundations.",
    application: "Emphasize practical use cases. Include real-world examples. Show how to apply it.",
    exam: "Structure for retention. Include review prompts. Highlight key points to remember.",
    teaching: "Frame as 'how would you explain this?' Focus on clarity and teaching moments."
  }
  
  return goalFraming[goal] || ''
}

function injectVariables(template: string, context: ContextPayload): string {
  let prompt = template
  
  // Inject user context variables
  prompt = prompt.replace("{conversation}", context.conversationSummary || '')
  prompt = prompt.replace("{knownConcepts}", context.profile.domains.join(", "))
  prompt = prompt.replace("{metaphors}", context.activeMetaphors.map(m => m.text).join(", "))
  
  // Add relevant history if exists
  if (context.lastReflection) {
    prompt += `\n\nRECENT REFLECTION SCORE: ${context.lastReflection.understandingScore}`
  }
  
  return prompt
}
```

**Why This Architecture Matters:**

- ✅ **Extensible**: Adding teacher personas = just add `getPersonaModifier()`, no refactoring
- ✅ **Toggleable**: Features can be enabled/disabled per-user via profile flags
- ✅ **Testable**: Each layer can be tested independently
- ✅ **Maintainable**: Clear separation of concerns (tone ≠ persona ≠ language)
- ✅ **MVP-ready**: Unused layers (persona) cost nothing but are ready when needed
```

**Token Budget Management:**
```typescript
const TOKEN_BUDGETS = {
  systemPrompt: 500,
  userContext: 1000,
  conversationHistory: 2000,
  response: 2000,
  total: 8000  // Stay under model limit
}

function compressContext(context: ContextPayload, budget: number): string {
  if (estimateTokens(context) <= budget) return context
  
  // Progressive compression
  return {
    ...context,
    conversationSummary: summarize(context.conversationSummary, budget * 0.5),
    conceptGraph: topN(context.conceptGraph, 10)  // Most relevant only
  }
}
```

### Model Configuration

```typescript
const MODEL_CONFIGS = {
  "gpt-4": {
    maxTokens: 8192,
    costPer1kPrompt: 0.03,
    costPer1kCompletion: 0.06,
    latencyP50: 2000,  // ms
    useFor: ["intake", "pathGeneration", "reflection"]
  },
  "gpt-3.5-turbo": {
    maxTokens: 4096,
    costPer1kPrompt: 0.0015,
    costPer1kCompletion: 0.002,
    latencyP50: 800,
    useFor: ["summarization", "quickAnswer", "cheatSheet"]
  },
  "mistral-medium": {
    maxTokens: 8192,
    costPer1kPrompt: 0.0027,
    costPer1kCompletion: 0.0081,
    latencyP50: 1500,
    useFor: ["fallback", "summarization"]
  }
}
```

### Response Processing

```typescript
async function processAIResponse(
  response: string,
  expectedFormat: "text" | "json"
): Promise<ProcessedResponse> {
  
  if (expectedFormat === "json") {
    // Extract JSON from markdown code blocks if needed
    const jsonMatch = response.match(/```json\n([\s\S]+?)\n```/)
    const json = jsonMatch ? jsonMatch[1] : response
    
    try {
      return { success: true, data: JSON.parse(json) }
    } catch (error) {
      // LLM didn't follow format, try to salvage
      return { success: false, error: "Invalid JSON", fallback: response }
    }
  }
  
  return { success: true, data: response }
}
```

---

## Security & Privacy

### Authentication & Authorization

**Firebase Auth Integration:**
- Email/password auth
- OAuth providers (Google, GitHub)
- JWT tokens for API access
- Refresh token rotation

**Permission Model:**
```typescript
// User can only access own data
function checkPermission(userId: string, resourceUserId: string): boolean {
  return userId === resourceUserId
}

// Middleware
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return res.status(401).json({ error: "Unauthorized" })
  
  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token)
    req.userId = decoded.uid
    next()
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" })
  }
}
```

### Data Privacy

**Principles:**
1. User data stays isolated (no cross-user leakage)
2. No training on user data without consent
3. Data export available (GDPR compliance)
4. Right to deletion honored
5. Encrypted at rest and in transit

**Implementation:**
```typescript
// Data isolation rule in Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /sessions/{sessionId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    match /concepts/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

**Encryption:**
- HTTPS for all transport (TLS 1.3)
- Firebase encrypts data at rest
- Sensitive fields (if any) encrypted before storage
- API keys stored in environment variables, never code

**Data Retention:**
```typescript
// Auto-delete old sessions (optional)
async function cleanupOldSessions() {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)  // 90 days
  
  const oldSessions = await db.collection("sessions")
    .where("endedAt", "<", cutoff)
    .get()
  
  for (const doc of oldSessions.docs) {
    await doc.ref.delete()
  }
}
```

### Rate Limiting

**Strategy:**
```typescript
const RATE_LIMITS = {
  free: { requests: 20, window: "15min" },
  supporter: { requests: 100, window: "15min" },
  pro: { requests: 500, window: "15min" },
  patron: { requests: 1000, window: "15min" }
}

async function checkRateLimit(userId: string, tier: string): Promise<boolean> {
  const limit = RATE_LIMITS[tier]
  const key = `ratelimit:${userId}:${Math.floor(Date.now() / 60000)}`
  
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, 900)  // 15 minutes
  
  return count <= limit.requests
}
```

---

## Scalability & Performance

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (P95) | <500ms | Without AI calls |
| AI Response Start (P95) | <3s | First token |
| Full AI Response (P95) | <10s | Complete generation |
| Concept Graph Load | <200ms | 1000 nodes |
| Database Query | <100ms | P95 |

### Optimization Strategies

#### 1. Caching Layers

**Level 1: Redis (Hot Data)**
- Session context: 5min TTL
- User profiles: 5min TTL
- Frequent prompts: 1hr TTL

**Level 2: CDN (Static Assets)**
- React app bundle
- Visualization libraries
- Cached path templates

**Level 3: Application (In-Memory)**
- Prompt templates (loaded at startup)
- Model configs (rarely change)

#### 2. Database Optimization

**Firestore Indexes:**
```typescript
// Index on userId for fast user queries
collection: "sessions"
fields: ["userId", "startedAt desc"]

collection: "concepts/*/nodes"
fields: ["timestamp desc"]
```

**Query Optimization:**
```typescript
// BAD: Load all sessions then filter
const sessions = await db.collection("sessions").get()
const userSessions = sessions.filter(s => s.userId === userId)

// GOOD: Query with index
const sessions = await db.collection("sessions")
  .where("userId", "==", userId)
  .orderBy("startedAt", "desc")
  .limit(10)
  .get()
```

#### 3. AI Call Optimization

**Batching:**
```typescript
// Batch multiple operations into one call
async function batchGenerate(topics: string[]): Promise<MicroPath[]> {
  const prompt = `Generate paths for: ${topics.join(", ")}`
  const response = await callGPT4(prompt)
  return parseMultiplePaths(response)
}
```

**Prompt Caching:**
```typescript
async function getCachedPath(topic: string, userId: string): Promise<MicroPath | null> {
  const cacheKey = `path:${topic}:generic`
  const cached = await redis.get(cacheKey)
  
  if (cached) {
    const basePath = JSON.parse(cached)
    return personalizePath(basePath, await getProfile(userId))
  }
  
  return null
}
```

**Streaming Responses:**
```typescript
// Don't wait for full response, stream to user
async function* streamPath(topic: string, profile: LearnerProfile) {
  const prompt = buildPathPrompt(topic, profile)
  
  for await (const chunk of streamCompletion(prompt)) {
    yield chunk  // Send immediately to client
  }
}
```

#### 4. Frontend Optimization

**Code Splitting:**
```typescript
// Lazy load heavy components
const ConceptGraph = lazy(() => import("./components/ConceptGraph"))
const ExportTools = lazy(() => import("./components/ExportTools"))
```

**State Management:**
```typescript
// Use React Query for server state
const { data: profile } = useQuery(
  ["profile", userId],
  () => fetchProfile(userId),
  { staleTime: 5 * 60 * 1000 }  // Cache 5min
)
```

### Scaling Strategy

**Phase 1: Single Server (MVP)**
- Next.js on Vercel (serverless)
- Firebase for data & auth
- Redis Cloud (managed)
- OpenAI API

**Phase 2: Horizontal Scaling (1k+ users)**
- Multiple Vercel instances (auto-scale)
- Firestore (auto-scales)
- Redis cluster
- Add load balancer if needed

**Phase 3: Distributed (10k+ users)**
- Dedicated backend cluster
- Read replicas for Firestore
- CDN for all static content
- Multi-region deployment

**Cost Projections:**
```typescript
// Per-user monthly cost estimate
const COSTS = {
  aiCalls: 0.50,        // ~100 messages @ mixed models
  database: 0.05,       // Firestore storage + queries
  hosting: 0.02,        // Vercel serverless
  cache: 0.01,          // Redis
  total: 0.58
}

// Break-even analysis
const REVENUE = {
  supporter: 5,
  pro: 20,
  patron: 30
}

// Supporter tier profitable at scale
// Free tier subsidized by paid tiers
```

---

## Infrastructure & Deployment

### Tech Stack Summary

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | React + Vite + Tailwind | Modern, fast, great DX |
| **Backend** | Next.js API Routes | Unified codebase, serverless-ready |
| **Database** | Firebase Firestore | Quick setup, real-time, scales |
| **Cache** | Redis Cloud | Fast, managed, affordable |
| **Auth** | Firebase Auth | Drop-in solution, secure |
| **AI** | OpenAI (GPT-4/3.5) | Best-in-class, reliable |
| **Hosting** | Vercel | Zero-config Next.js, edge network |
| **Monitoring** | Sentry + Vercel Analytics | Error tracking, performance |

### Environment Configuration

```bash
# .env.local (development)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_ADMIN_SDK_JSON=...

OPENAI_API_KEY=...
OPENAI_ORG_ID=...

REDIS_URL=...
REDIS_TOKEN=...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
# .env.production (Vercel)
# Same variables, production values
# Set via Vercel dashboard
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### Monitoring & Observability

**Error Tracking (Sentry):**
```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})

// Capture AI errors
try {
  await generatePath(topic, profile)
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: "PathGenerator", topic },
    extra: { userId, profileSnapshot: profile }
  })
}
```

**Custom Metrics:**
```typescript
// Track key business metrics
async function trackMetric(name: string, value: number, tags: Record<string, string>) {
  await fetch("https://api.metrics.com/v1/metric", {
    method: "POST",
    body: JSON.stringify({ name, value, tags, timestamp: Date.now() })
  })
}

// Usage
await trackMetric("ai.generation.duration", durationMs, {
  model: "gpt-4",
  taskType: "pathGeneration"
})
```

**Dashboards:**
- Vercel Analytics: Page views, performance
- Firebase Console: Database usage, auth metrics
- Custom Dashboard: AI costs, usage by tier, conversion funnel

### AI Logging & Observability *(Implemented)*

**AI Logger (`src/lib/ai/aiLogger.ts`):**

All OpenAI API calls (13+ call sites) are instrumented through a centralized logging utility that records:

```typescript
interface AILogEntry {
  timestamp: string
  callSite: string          // e.g., "chat", "quiz-generate", "unpack", "assess-objectives"
  model: string             // "gpt-4" or "gpt-3.5-turbo"
  promptTokens: number
  completionTokens: number
  totalTokens: number
  durationMs: number
  userId: string
  sessionId?: string
  success: boolean
  error?: string
}
```

**Instrumented Call Sites:**
| Call Site | Model | Purpose |
|-----------|-------|---------|
| `chat` | GPT-4 | Main conversational responses |
| `quiz-generate` | GPT-4 | Generate 4-question objective quizzes |
| `quiz-grade-essay` | GPT-4 | AI-grade short answer questions |
| `unpack` | GPT-4 | Split dense responses into chunks |
| `assess-objectives` | GPT-3.5-turbo | Detect "ready to quiz" objectives |
| `extract-concepts` | GPT-3.5-turbo | Extract concepts from conversation |
| `simplify` | GPT-4 | Simplify AI responses |
| `generate-path` | GPT-4 | Generate learning paths |
| `generate-reflection` | GPT-4 | Generate reflection prompts |
| `grade-reflection` | GPT-4 | Grade reflection responses |
| `intake-parse` | GPT-3.5-turbo | Parse onboarding intake |
| `generate-cheatsheet` | GPT-4 | Generate cheat sheets |
| `generate-follow-ups` | GPT-3.5-turbo | Generate follow-up suggestions |

**Token Usage Admin Dashboard (`/dashboard/admin`):**
- Per-user token consumption breakdown
- Aggregate usage by model and call site
- Cost estimation and trend analysis
- Accessible to admin users only

---

## Development Phases

### Phase 0: Setup (Week 1)

**Goals:**
- Project scaffolding
- Development environment
- Core dependencies installed

**Tasks:**
- [ ] Create Next.js project with TypeScript
- [ ] Set up Tailwind CSS
- [ ] Initialize Firebase project (Auth, Firestore)
- [ ] Set up Redis Cloud instance
- [ ] Configure OpenAI API access
- [ ] Set up Git repo and CI/CD
- [ ] Create base folder structure

**Deliverables:**
- Running dev environment
- Basic auth flow (signup/login)
- Database connection verified
- "Hello World" API endpoint

---

### Phase 1: Core Loop (Weeks 2-5)

**Goals:**
- Implement basic learning loop
- Intake → Path → Reflect → Update

**Sprint 1: Profile Engine (Week 2)**
- [ ] Intake conversation UI
- [ ] Profile parsing (GPT-4 integration)
- [ ] Profile storage (Firestore)
- [ ] Profile display/edit UI

**Sprint 2: Path Generator (Week 3)**
- [ ] Micro-path generation prompt templates
- [ ] GPT-4 integration with streaming
- [ ] Path display UI with markdown rendering
- [ ] Cache layer for common paths

**Sprint 3: Reflect Engine (Week 4)**
- [ ] Reflect prompt generation
- [ ] Response analysis (GPT-4)
- [ ] Feedback UI
- [ ] Score visualization

**Sprint 4: Context & Memory (Week 5)**
- [ ] Session management
- [ ] Context building logic
- [ ] Memory summarization
- [ ] Context injection into prompts

**Deliverables:**
- Working end-to-end flow
- User can complete one full learning cycle
- Data persists across sessions

---

### Phase 2: Enhancement (Weeks 6-8)

**Goals:**
- Polish UX
- Add visualizations
- Improve personalization

**Sprint 5: Concept Graph (Week 6)**
- [ ] Graph data model
- [ ] Graph builder logic
- [ ] Mermaid.js visualization
- [ ] Graph UI component

**Sprint 6: Polish (Week 7)**
- [ ] Tone modulation
- [ ] Cheat sheet export
- [ ] Session history view
- [ ] Loading states & animations

**Sprint 7: Testing & Optimization (Week 8)**
- [ ] Unit tests for critical paths
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Cost tracking implementation

**Deliverables:**
- MVP feature-complete
- Concept graph working
- Export functionality
- Ready for alpha users

---

### Phase 3: Alpha Testing (Weeks 9-10)

**Goals:**
- Deploy to production
- Onboard 20-50 alpha users
- Gather feedback
- Iterate

**Tasks:**
- [ ] Deploy to Vercel production
- [ ] Set up monitoring (Sentry)
- [ ] Create user documentation
- [ ] Onboard alpha users
- [ ] Collect feedback (surveys, interviews)
- [ ] Bug fixes
- [ ] Quick iterations

**Deliverables:**
- Live production app
- Alpha user feedback report
- Prioritized backlog for beta

---

## Appendix

### Key Design Decisions

**Decision 1: Next.js vs Separate Backend**
- **Choice:** Next.js API Routes
- **Rationale:** Faster development, unified codebase, easier deployment
- **Trade-off:** Slightly less flexible than microservices, but good enough for MVP

**Decision 2: Firebase vs PostgreSQL**
- **Choice:** Firebase (Firestore + Auth)
- **Rationale:** Faster setup, real-time capabilities, managed service
- **Trade-off:** Vendor lock-in, but can migrate later if needed

**Decision 3: Streaming vs Batch Responses**
- **Choice:** Streaming for AI responses
- **Rationale:** Better UX, feels more conversational
- **Trade-off:** More complex implementation, but worth it

**Decision 4: BYOK vs Shared Key for MVP**
- **Choice:** Shared key (platform-managed)
- **Rationale:** Better onboarding UX, we control costs with rate limiting
- **Trade-off:** We pay for usage, but can convert users to paid tiers

**Decision 5: Graph DB vs Document DB**
- **Choice:** Document DB (Firestore) for MVP
- **Rationale:** Simpler, good enough for small graphs
- **Trade-off:** May need Neo4j later, but not for first 1k users

### Open Technical Questions

1. **How aggressive should caching be?**
   - More cache = lower cost, less personalization
   - Need usage data to optimize

2. **When to pre-generate paths?**
   - Could build library of common topics offline
   - Personalization layer applies user touches
   - Need to identify "common" topics first

3. **Real-time graph updates?**
   - WebSocket for live graph animation?
   - Or just refresh on page load?
   - Depends on user feedback

4. **Mobile app?**
   - React Native? Progressive Web App?
   - Post-MVP decision based on demand

### Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| AI costs exceed revenue | Medium | High | Rate limiting, model routing, cache aggressively | Backend |
| Firebase limits hit | Low | Medium | Monitor quotas, plan migration path | Infrastructure |
| LLM quality issues | Medium | High | Prompt engineering, user feedback loop | AI Team |
| Slow response times | Medium | Medium | Streaming, caching, performance monitoring | Full Stack |
| Security breach | Low | Critical | Security audit, pen testing, bug bounty | Security |

---

## Next Steps

### Immediate Actions (Week 1)

1. **Set up development environment**
   - Install dependencies
   - Configure Firebase project
   - Set up Redis instance
   - Get OpenAI API key

2. **Create technical spike**
   - Prototype intake conversation
   - Test GPT-4 integration
   - Verify streaming works

3. **Design database schema**
   - Firestore collections structure
   - Redis key patterns
   - Data migration strategy

4. **Create UI mockups**
   - Core screens (intake, path, reflect)
   - Navigation flow
   - Component library

### Week 2 Priorities

- [ ] Implement authentication flow
- [ ] Build Profile Engine foundation
- [ ] Create first prompt template
- [ ] Test end-to-end with dummy data

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Next Review:** After Phase 1 completion  
**Status:** Ready for Implementation
