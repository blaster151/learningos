# Sprint 3: Concept Mapping - Detailed Implementation Plan

**Project:** LearningOS (BMAD v6 Project)  
**Sprint:** Sprint 3 - Concept Mapping & Learning Intelligence  
**Duration:** 2 Weeks (10 working days)  
**Created:** January 28, 2026  
**Status:** 🔵 READY TO START

---

## Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Sprint Goals & Success Criteria](#sprint-goals--success-criteria)
3. [Dependencies & Prerequisites](#dependencies--prerequisites)
4. [Data Model Extensions](#data-model-extensions)
5. [Week 1: Foundation (Days 1-5)](#week-1-foundation-days-1-5)
6. [Week 2: Intelligence (Days 6-10)](#week-2-intelligence-days-6-10)
7. [Testing Requirements](#testing-requirements)
8. [Risk Mitigation](#risk-mitigation)
9. [Definition of Done](#definition-of-done)

---

## Sprint Overview

### What We're Building

Sprint 3 transforms LearningOS from a simple chat interface into an intelligent learning system that:
- **Tracks concept relationships** as users learn
- **Generates personalized learning paths** based on user goals and current knowledge
- **Measures understanding** through concept mastery tracking
- **Maintains session continuity** allowing users to resume previous conversations
- **Enables topic branching** so users can explore related areas without losing context

### Sprint Theme
> **"Does the system actually understand what I'm learning?"**

### Stories Included

| Story ID | Title | Points | Priority | Days |
|----------|-------|--------|----------|------|
| STORY-301 | View Recommended Path | 5 | P0 | 3-4 |
| STORY-302 | Accept Path Recommendation | 2 | P0 | 4 |
| STORY-303 | View Path Progress | 3 | P0 | 6-7 |
| STORY-206 | Continue Previous Session | 3 | P1 | 8 |
| STORY-207 | Branch Conversation Topic | 3 | P1 | 9 |
| STORY-304 | Navigate Path Milestones | 3 | P1 | 7 |

**Total: 19 points**

---

## Sprint Goals & Success Criteria

### Primary Goals

1. ✅ **Concept Graph Updates Automatically**
   - Concepts extracted from chat are stored with relationships
   - Graph updates in real-time as user learns
   - Concept mastery levels tracked per user

2. ✅ **Learning Paths Generated & Tracked**
   - AI generates custom learning paths based on user goals
   - Paths include milestones with estimated time
   - Progress tracked across sessions

3. ✅ **Session Continuity Works**
   - Users can resume previous sessions
   - Context carries forward correctly
   - Users can branch to new topics without losing main thread

### Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Concept extraction accuracy | >90% | Manual review of 20 conversations |
| Path generation time | <5s | Average API response time |
| Progress tracking accuracy | 100% | Automated tests |
| Session resume success rate | 100% | No context loss on resume |

### User Experience Goals

- User feels the system "remembers" what they've learned
- Suggested paths feel personalized and relevant
- Progress visualization motivates continued learning
- Session continuity feels seamless

---

## Dependencies & Prerequisites

### What Must Be Complete First

✅ **Sprint 2 Complete:**
- Chat interface working
- Concept extraction functional (from messages)
- Session management in place
- Basic Firestore data layer working

### External Dependencies

- ✅ OpenAI API (GPT-4) for path generation
- ✅ Firebase Firestore for concept graph storage
- ✅ User authentication functional

### Technical Assumptions

- Firestore will handle concept graph queries adequately for MVP (<1000 concepts/user)
- GPT-4 can generate quality learning paths from profile context
- Concept relationships can be modeled as document references initially

---

## Data Model Extensions

### 1. Concept Node (Extended)

**File:** `src/types/index.ts`

```typescript
export interface ConceptNode {
  conceptId: string;
  name: string;
  definition: string;
  domain: string; // e.g., "programming", "algorithms"
  
  // User-specific tracking
  userId: string;
  confidence: number; // 0.0-1.0 (how confident user feels)
  understanding: number; // 0.0-1.0 (system's assessment)
  masteryLevel: "exploring" | "learning" | "practicing" | "comfortable" | "expert";
  
  // Timestamps
  firstEncountered: Timestamp;
  lastReviewed: Timestamp;
  lastReflected?: Timestamp;
  
  // Learning context
  learnedFrom: string; // pathId or sessionId
  exampleContext?: string;
  
  // Architectural dependencies (Phase 2+)
  abstractPattern?: string; // For abstraction scaffolding
  definitionHistory?: Array<{
    definition: string;
    source: "chat" | "reflection" | "path";
    timestamp: Timestamp;
  }>;
}
```

### 2. Concept Relation (New)

**File:** `src/types/index.ts`

```typescript
export type RelationType =
  | "prerequisite"      // A must be learned before B
  | "builds_on"        // B extends A
  | "related"          // A and B are connected
  | "contrasts_with"   // A differs from B
  | "abstracts_to"     // A is specific case of B
  | "applies_to";      // A is used in B

export interface ConceptRelation {
  relationId: string;
  userId: string;
  sourceConceptId: string;
  targetConceptId: string;
  relationType: RelationType;
  strength: number; // 0.0-1.0 (how strong the connection)
  
  // Discovery tracking
  discoveredAt: Timestamp;
  isEmergent: boolean; // Did user discover this connection?
  discoveryInsight?: string; // What user said when connecting
  discoveredBy: "user" | "system" | "path";
}
```

### 3. Learning Path (New)

**File:** `src/types/index.ts`

```typescript
export interface LearningPath {
  pathId: string;
  userId: string;
  title: string;
  description: string;
  
  // Path structure
  milestones: PathMilestone[];
  estimatedMinutes: number;
  
  // Status
  status: "suggested" | "active" | "completed" | "abandoned";
  progress: number; // 0.0-1.0
  
  // Context
  generatedFrom: {
    goal: string;
    knownConcepts: string[]; // Concept IDs
    userLevel: string;
  };
  
  // Timestamps
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  lastActivityAt: Timestamp;
}

export interface PathMilestone {
  milestoneId: string;
  order: number;
  title: string;
  description: string;
  
  // Content
  concepts: string[]; // Concept IDs to learn
  estimatedMinutes: number;
  
  // Status
  status: "not_started" | "in_progress" | "completed";
  progress: number; // 0.0-1.0
  completedAt?: Timestamp;
  
  // Prerequisites
  prerequisites: string[]; // Milestone IDs that must come first
}
```

### 4. Session Extensions

**File:** `src/types/index.ts`

```typescript
export interface LearningSession {
  // ... existing fields ...
  
  // New fields for Sprint 3
  pathId?: string; // If session is working through a path
  currentMilestoneId?: string; // Which milestone user is on
  
  branch?: {
    fromSessionId: string;
    branchPoint: Timestamp;
    reason: string; // User's stated reason
    returnPath?: string; // How to get back
  };
  
  conceptsLearned: string[]; // Concepts with increased understanding
  conceptsReviewed: string[]; // Concepts revisited
}
```

### Firestore Collection Structure

```
users/{userId}/
  ├── profile (document)
  ├── concepts (collection)
  │   └── {conceptId} (document: ConceptNode)
  ├── concept_relations (collection)
  │   └── {relationId} (document: ConceptRelation)
  ├── learning_paths (collection)
  │   └── {pathId} (document: LearningPath)
  ├── sessions (collection)
  │   └── {sessionId} (document: LearningSession)
  │       └── messages (subcollection)
  └── progress_events (collection)
      └── {eventId} (document: progress snapshots)
```

---

## Week 1: Foundation (Days 1-5)

### Day 1: Concept Graph Data Layer

**Goal:** Set up database infrastructure for concept graph

#### Tasks

**1.1: Update Type Definitions** (1 hour)
- [ ] Add `ConceptRelation` interface to `src/types/index.ts`
- [ ] Add `LearningPath` and `PathMilestone` interfaces
- [ ] Update `LearningSession` with new fields
- [ ] Update `ConceptNode` with extended fields

**Files to modify:**
- `src/types/index.ts`

**1.2: Create Concept Service** (2 hours)
- [ ] Create `src/lib/firebase/concepts.ts`
- [ ] Implement `createConcept(userId: string, concept: Omit<ConceptNode, 'conceptId'>)`
- [ ] Implement `getConcept(userId: string, conceptId: string)`
- [ ] Implement `getUserConcepts(userId: string, options?: { domain?: string })`
- [ ] Implement `updateConceptMastery(userId: string, conceptId: string, updates: Partial<ConceptNode>)`
- [ ] Add proper indexes for queries

**Files to create:**
```typescript
// src/lib/firebase/concepts.ts
import { db } from './config';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import type { ConceptNode } from '@/types';

export const conceptsService = {
  async createConcept(userId: string, concept: Omit<ConceptNode, 'conceptId'>): Promise<string> {
    // Implementation
  },
  
  async getConcept(userId: string, conceptId: string): Promise<ConceptNode | null> {
    // Implementation
  },
  
  async getUserConcepts(userId: string, filters?: { domain?: string }): Promise<ConceptNode[]> {
    // Implementation
  },
  
  async updateConceptMastery(
    userId: string, 
    conceptId: string, 
    updates: Partial<ConceptNode>
  ): Promise<void> {
    // Implementation
  }
};
```

**1.3: Create Concept Relations Service** (2 hours)
- [ ] Create `src/lib/firebase/conceptRelations.ts`
- [ ] Implement `createRelation(userId: string, relation: Omit<ConceptRelation, 'relationId'>)`
- [ ] Implement `getConceptRelations(userId: string, conceptId: string)`
- [ ] Implement `detectPotentialRelations(userId: string, conceptId: string): Promise<string[]>`

**Files to create:**
```typescript
// src/lib/firebase/conceptRelations.ts
import type { ConceptRelation } from '@/types';

export const relationsService = {
  async createRelation(
    userId: string, 
    relation: Omit<ConceptRelation, 'relationId'>
  ): Promise<string> {
    // Implementation
  },
  
  async getConceptRelations(
    userId: string, 
    conceptId: string,
    direction?: 'incoming' | 'outgoing' | 'both'
  ): Promise<ConceptRelation[]> {
    // Implementation
  },
  
  async detectPotentialRelations(
    userId: string, 
    newConceptId: string
  ): Promise<ConceptRelation[]> {
    // Simple heuristic: look for concepts in same domain
    // Or concepts recently discussed in same session
  }
};
```

**1.4: Testing** (1 hour)
- [ ] Unit tests for `conceptsService`
- [ ] Unit tests for `relationsService`
- [ ] Test Firestore security rules

**Test file:** `src/test/lib/firebase/concepts.test.ts`

---

### Day 2: Concept Graph Updates from Chat

**Goal:** Automatically update concept graph when users chat

#### Tasks

**2.1: Enhanced Concept Extraction** (2 hours)
- [ ] Update `src/lib/ai/conceptExtraction.ts` to return more metadata
- [ ] Extract concept domain alongside name
- [ ] Identify potential relationships between extracted concepts
- [ ] Return confidence scores

**File to modify:**
```typescript
// src/lib/ai/conceptExtraction.ts

export interface ExtractedConcept {
  name: string;
  domain: string;
  definition: string;
  contextInMessage: string;
  confidence: number;
  potentialRelations?: {
    relatedTo: string; // concept name
    relationType: RelationType;
  }[];
}

export async function extractConceptsFromMessage(
  message: string,
  existingConcepts: string[], // for relation detection
  sessionContext?: {
    topic: string;
    recentConcepts: string[];
  }
): Promise<ExtractedConcept[]> {
  // Enhanced GPT-4 prompt
  // Returns structured JSON with domain and relations
}
```

**2.2: Concept Graph Update Logic** (2 hours)
- [ ] Create `src/lib/ai/conceptGraphUpdater.ts`
- [ ] Implement logic to merge extracted concepts with existing graph
- [ ] Handle concept deduplication (same concept, different wording)
- [ ] Auto-create relations based on extraction hints

**File to create:**
```typescript
// src/lib/ai/conceptGraphUpdater.ts

export async function updateGraphFromMessage(
  userId: string,
  sessionId: string,
  message: string,
  messageRole: 'user' | 'assistant'
): Promise<{
  newConcepts: string[];
  updatedConcepts: string[];
  newRelations: string[];
}> {
  // 1. Get existing user concepts
  // 2. Extract concepts from message
  // 3. Deduplicate against existing
  // 4. Create new concepts in Firestore
  // 5. Create relations
  // 6. Update concept mastery if mentioned again
  // 7. Return summary
}
```

**2.3: Integrate with Chat API** (1 hour)
- [ ] Update `src/app/api/chat/route.ts` to call `updateGraphFromMessage`
- [ ] Ensure graph updates happen asynchronously (don't block response)
- [ ] Add error handling for graph update failures

**File to modify:**
```typescript
// src/app/api/chat/route.ts

export async function POST(req: Request) {
  // ... existing streaming logic ...
  
  // After message stored, update graph asynchronously
  updateGraphFromMessage(userId, sessionId, userMessage, 'user').catch(err => {
    console.error('Graph update failed:', err);
    // Don't fail the chat if graph update fails
  });
  
  // ... AI response generation ...
  
  // Update graph from AI response too
  updateGraphFromMessage(userId, sessionId, aiResponse, 'assistant').catch(err => {
    console.error('Graph update failed:', err);
  });
}
```

**2.4: Testing** (1 hour)
- [ ] Test concept extraction with various message types
- [ ] Test graph update logic with mock data
- [ ] Integration test: send message → verify graph updated

---

### Day 3-4: Learning Path Generation

**Goal:** AI generates personalized learning paths

#### Tasks

**3.1: Path Service** (2 hours)
- [ ] Create `src/lib/firebase/learningPaths.ts`
- [ ] Implement CRUD operations for paths
- [ ] Implement path progress tracking

**File to create:**
```typescript
// src/lib/firebase/learningPaths.ts

export const pathsService = {
  async createPath(userId: string, path: Omit<LearningPath, 'pathId'>): Promise<string> {},
  
  async getPath(userId: string, pathId: string): Promise<LearningPath | null> {},
  
  async getUserPaths(
    userId: string, 
    status?: LearningPath['status']
  ): Promise<LearningPath[]> {},
  
  async updatePathProgress(
    userId: string, 
    pathId: string, 
    milestoneId: string, 
    progress: number
  ): Promise<void> {},
  
  async completeMilestone(
    userId: string, 
    pathId: string, 
    milestoneId: string
  ): Promise<void> {},
  
  async acceptPath(userId: string, pathId: string): Promise<void> {}
};
```

**3.2: Path Generation AI Service** (4 hours)
- [ ] Create `src/lib/ai/pathGeneration.ts`
- [ ] Design GPT-4 prompt for path generation
- [ ] Implement path generation from user profile + goal
- [ ] Include concept prerequisites in path logic

**File to create:**
```typescript
// src/lib/ai/pathGeneration.ts

export interface PathGenerationInput {
  goal: string; // What user wants to learn
  knownConcepts: ConceptNode[]; // What they already know
  userLevel: string; // beginner, intermediate, advanced
  timeAvailable?: number; // minutes per week
  learningStyle?: string; // from profile
}

export async function generateLearningPath(
  userId: string,
  input: PathGenerationInput
): Promise<LearningPath> {
  // 1. Build context from user's concept graph
  // 2. Call GPT-4 with structured prompt
  // 3. Parse JSON response into LearningPath
  // 4. Validate path structure
  // 5. Return path (NOT saved to DB yet)
}

// GPT-4 Prompt Template
const PATH_GENERATION_PROMPT = `
You are an expert learning path designer. Create a personalized learning path.

USER PROFILE:
- Goal: {goal}
- Current knowledge: {knownConcepts}
- Level: {userLevel}
- Learning style: {learningStyle}

REQUIREMENTS:
1. Create 3-5 milestones that build on each other
2. Each milestone should have 2-4 concepts
3. Ensure prerequisites are clear
4. Estimate realistic time per milestone
5. Adapt to user's existing knowledge (don't re-teach what they know)

OUTPUT FORMAT: JSON matching LearningPath schema

{
  "title": "...",
  "description": "...",
  "milestones": [
    {
      "title": "...",
      "description": "...",
      "concepts": ["concept1", "concept2"],
      "estimatedMinutes": 45,
      "prerequisites": []
    }
  ],
  "estimatedMinutes": 180
}
`;
```

**3.3: Path Generation API Endpoint** (2 hours)
- [ ] Create `src/app/api/paths/generate/route.ts`
- [ ] Implement POST handler
- [ ] Call path generation service
- [ ] Save generated path to Firestore
- [ ] Return path to client

**File to create:**
```typescript
// src/app/api/paths/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateLearningPath } from '@/lib/ai/pathGeneration';
import { pathsService } from '@/lib/firebase/learningPaths';
import { conceptsService } from '@/lib/firebase/concepts';

export async function POST(req: NextRequest) {
  try {
    const { userId, goal, timeAvailable } = await req.json();
    
    // Get user's current concepts
    const knownConcepts = await conceptsService.getUserConcepts(userId);
    
    // Determine user level (simple heuristic for now)
    const userLevel = knownConcepts.length < 5 ? 'beginner' : 
                     knownConcepts.length < 20 ? 'intermediate' : 'advanced';
    
    // Generate path
    const path = await generateLearningPath(userId, {
      goal,
      knownConcepts,
      userLevel,
      timeAvailable
    });
    
    // Save to Firestore
    const pathId = await pathsService.createPath(userId, path);
    
    return NextResponse.json({ 
      pathId, 
      path: { ...path, pathId }
    });
    
  } catch (error) {
    console.error('Path generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate learning path' },
      { status: 500 }
    );
  }
}
```

**3.4: Testing** (2 hours)
- [ ] Test path generation with various user profiles
- [ ] Verify path structure meets requirements
- [ ] Test API endpoint E2E
- [ ] Load test: can we generate paths quickly enough?

---

### Day 5: Path UI Components

**Goal:** Users can view and accept learning paths

#### Tasks

**5.1: Path Visualization Component** (3 hours)
- [ ] Create `src/components/learning/PathCard.tsx`
- [ ] Create `src/components/learning/MilestoneList.tsx`
- [ ] Create `src/components/learning/PathModal.tsx`
- [ ] Design clean, motivating UI for paths

**File to create:**
```typescript
// src/components/learning/PathCard.tsx

interface PathCardProps {
  path: LearningPath;
  onAccept: (pathId: string) => void;
  onDismiss: (pathId: string) => void;
}

export function PathCard({ path, onAccept, onDismiss }: PathCardProps) {
  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h3 className="text-xl font-semibold">{path.title}</h3>
      <p className="text-gray-600 mt-2">{path.description}</p>
      
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
        <span>📚 {path.milestones.length} milestones</span>
        <span>⏱️ ~{path.estimatedMinutes} minutes</span>
      </div>
      
      <div className="mt-4">
        <h4 className="font-medium text-sm mb-2">What you'll learn:</h4>
        <ul className="space-y-1">
          {path.milestones.slice(0, 3).map((m, i) => (
            <li key={i} className="text-sm text-gray-600">
              {i + 1}. {m.title}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mt-6 flex gap-3">
        <button 
          onClick={() => onAccept(path.pathId)}
          className="btn-primary flex-1"
        >
          Start This Path
        </button>
        <button 
          onClick={() => onDismiss(path.pathId)}
          className="btn-secondary"
        >
          Not Now
        </button>
      </div>
    </div>
  );
}
```

```typescript
// src/components/learning/MilestoneList.tsx

interface MilestoneListProps {
  milestones: PathMilestone[];
  currentMilestoneId?: string;
}

export function MilestoneList({ milestones, currentMilestoneId }: MilestoneListProps) {
  return (
    <div className="space-y-3">
      {milestones.map((milestone, index) => (
        <div 
          key={milestone.milestoneId}
          className={cn(
            "border-l-4 pl-4 py-2",
            milestone.status === 'completed' && "border-green-500",
            milestone.milestoneId === currentMilestoneId && "border-blue-500",
            milestone.status === 'not_started' && "border-gray-300"
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium">
                {index + 1}. {milestone.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {milestone.description}
              </p>
              <div className="text-xs text-gray-500 mt-2">
                {milestone.concepts.length} concepts · {milestone.estimatedMinutes}min
              </div>
            </div>
            <div>
              {milestone.status === 'completed' && (
                <span className="text-green-600">✓</span>
              )}
              {milestone.status === 'in_progress' && (
                <span className="text-blue-600">→</span>
              )}
            </div>
          </div>
          
          {milestone.status === 'in_progress' && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${milestone.progress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**5.2: Path Recommendation Page** (2 hours)
- [ ] Create `src/app/dashboard/learn/recommended/page.tsx`
- [ ] Show suggested paths based on user goal
- [ ] Implement path acceptance flow
- [ ] Handle "generate new path" action

**5.3: Integration** (1 hour)
- [ ] Add "View Learning Path" link in dashboard
- [ ] Trigger path generation after onboarding
- [ ] Test full flow: onboard → generate path → view → accept

---

## Week 2: Intelligence (Days 6-10)

### Day 6-7: Path Progress Tracking

**Goal:** Track user progress through learning paths

#### Tasks

**6.1: Progress Detection Logic** (3 hours)
- [ ] Create `src/lib/learning/progressTracker.ts`
- [ ] Implement milestone completion detection
- [ ] Auto-update path progress based on concept mastery
- [ ] Trigger milestone completion events

**File to create:**
```typescript
// src/lib/learning/progressTracker.ts

export const progressTracker = {
  /**
   * Check if a milestone should be marked complete based on concept mastery
   */
  async checkMilestoneCompletion(
    userId: string,
    pathId: string,
    milestoneId: string
  ): Promise<boolean> {
    const path = await pathsService.getPath(userId, pathId);
    const milestone = path.milestones.find(m => m.milestoneId === milestoneId);
    
    // Get mastery for all concepts in milestone
    const concepts = await Promise.all(
      milestone.concepts.map(id => conceptsService.getConcept(userId, id))
    );
    
    // Milestone complete if all concepts at "comfortable" or higher
    const allMastered = concepts.every(c => 
      c.masteryLevel === 'comfortable' || c.masteryLevel === 'expert'
    );
    
    if (allMastered && milestone.status !== 'completed') {
      await pathsService.completeMilestone(userId, pathId, milestoneId);
      return true;
    }
    
    return false;
  },
  
  /**
   * Update path progress after a chat session
   */
  async updateProgressFromSession(
    userId: string,
    sessionId: string
  ): Promise<void> {
    const session = await sessionsService.getSession(sessionId);
    
    if (!session.pathId) return; // Not following a path
    
    // Check if current milestone is complete
    await this.checkMilestoneCompletion(
      userId, 
      session.pathId, 
      session.currentMilestoneId
    );
    
    // Update overall path progress
    await this.calculatePathProgress(userId, session.pathId);
  },
  
  async calculatePathProgress(
    userId: string,
    pathId: string
  ): Promise<number> {
    const path = await pathsService.getPath(userId, pathId);
    
    const completedCount = path.milestones.filter(
      m => m.status === 'completed'
    ).length;
    
    const progress = completedCount / path.milestones.length;
    
    await pathsService.updatePathProgress(userId, pathId, progress);
    
    return progress;
  }
};
```

**6.2: Progress API Endpoint** (1 hour)
- [ ] Create `src/app/api/paths/[pathId]/progress/route.ts`
- [ ] Implement GET (get progress) and PATCH (update progress)

**6.3: Progress Visualization** (2 hours)
- [ ] Update `MilestoneList` to show progress bars
- [ ] Create `src/components/learning/ProgressRing.tsx` for overall progress
- [ ] Add celebration animation when milestone completes

**6.4: Integration with Chat** (2 hours)
- [ ] Update chat to call progress tracker after messages
- [ ] Show milestone completion toast in chat UI
- [ ] Update session document with progress

**File to modify:**
```typescript
// src/app/api/chat/route.ts

// After message exchange
if (session.pathId) {
  await progressTracker.updateProgressFromSession(userId, sessionId);
  
  // Check if path just completed
  const path = await pathsService.getPath(userId, session.pathId);
  if (path.progress === 1.0 && path.status !== 'completed') {
    await pathsService.updatePath(userId, path.pathId, {
      status: 'completed',
      completedAt: serverTimestamp()
    });
    
    // TODO: Trigger celebration + suggest next path
  }
}
```

---

### Day 8: Session Continuity

**Goal:** Users can resume previous sessions seamlessly

#### Tasks

**8.1: Session List API** (1 hour)
- [ ] Create `src/app/api/sessions/route.ts` with GET handler
- [ ] Return list of user's sessions with metadata
- [ ] Sort by `lastActivity` descending

**File to create:**
```typescript
// src/app/api/sessions/route.ts

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  
  const sessions = await sessionsService.getUserSessions(userId, {
    limit: 20,
    orderBy: 'lastActivity',
    status: ['active', 'completed']
  });
  
  // Enrich with concept names (not just IDs)
  const enriched = await Promise.all(
    sessions.map(async (session) => ({
      ...session,
      conceptNames: await getConceptNames(userId, session.conceptsCovered)
    }))
  );
  
  return NextResponse.json({ sessions: enriched });
}
```

**8.2: Session Resume Logic** (2 hours)
- [ ] Create `src/lib/sessions/resumeSession.ts`
- [ ] Load session context (recent messages, concepts)
- [ ] Inject context into next message prompt
- [ ] Update session's `lastActivity`

**File to create:**
```typescript
// src/lib/sessions/resumeSession.ts

export async function resumeSession(
  userId: string,
  sessionId: string
): Promise<{
  session: LearningSession;
  recentMessages: Message[];
  contextSummary: string;
}> {
  const session = await sessionsService.getSession(sessionId);
  
  // Update status if was abandoned
  if (session.status === 'abandoned') {
    await sessionsService.updateSession(sessionId, {
      status: 'active',
      lastActivity: serverTimestamp()
    });
  }
  
  // Get last 10 messages for context
  const recentMessages = await messagesService.getSessionMessages(
    sessionId, 
    { limit: 10, orderBy: 'timestamp', direction: 'desc' }
  );
  
  // Generate summary of what was discussed
  const contextSummary = await generateSessionSummary(recentMessages);
  
  return {
    session,
    recentMessages: recentMessages.reverse(), // chronological order
    contextSummary
  };
}
```

**8.3: Session List UI** (2 hours)
- [ ] Create `src/components/chat/SessionList.tsx`
- [ ] Show recent sessions with topic and time
- [ ] Add "Continue" button
- [ ] Show current path if following one

**File to create:**
```typescript
// src/components/chat/SessionList.tsx

export function SessionList() {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  
  useEffect(() => {
    fetchSessions().then(setSessions);
  }, []);
  
  const handleContinue = async (sessionId: string) => {
    await resumeSession(sessionId);
    router.push(`/dashboard/chat?session=${sessionId}`);
  };
  
  return (
    <div className="space-y-3">
      {sessions.map(session => (
        <div key={session.sessionId} className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">{session.topic}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {session.conceptsCovered.length} concepts covered
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(session.lastActivity)} ago
              </p>
            </div>
            <button 
              onClick={() => handleContinue(session.sessionId)}
              className="btn-secondary"
            >
              Continue
            </button>
          </div>
          
          {session.pathId && (
            <div className="mt-3 text-sm text-blue-600">
              📚 Following a learning path
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**8.4: Integration** (1 hour)
- [ ] Add "Recent Sessions" section to dashboard
- [ ] Update chat page to handle `?session=X` query param
- [ ] Test resume flow end-to-end

---

### Day 9: Topic Branching

**Goal:** Users can explore related topics without losing main thread

#### Tasks

**9.1: Branch Session Logic** (2 hours)
- [ ] Create `src/lib/sessions/branchSession.ts`
- [ ] Implement session branching (create child session)
- [ ] Store parent session reference
- [ ] Preserve key context from parent

**File to create:**
```typescript
// src/lib/sessions/branchSession.ts

export async function branchSession(
  userId: string,
  parentSessionId: string,
  branchTopic: string,
  reason: string
): Promise<string> {
  const parentSession = await sessionsService.getSession(parentSessionId);
  
  // Create new session as branch
  const newSessionId = await sessionsService.createSession({
    userId,
    topic: branchTopic,
    initialConcepts: parentSession.conceptsCovered, // carry forward
    branch: {
      fromSessionId: parentSessionId,
      branchPoint: serverTimestamp(),
      reason,
      returnPath: parentSession.topic // how to get back
    },
    status: 'active'
  });
  
  // Add branching message to parent session
  await messagesService.createMessage({
    sessionId: parentSessionId,
    role: 'system',
    content: `🔀 Branched to explore: ${branchTopic}`,
    timestamp: serverTimestamp()
  });
  
  return newSessionId;
}
```

**9.2: Branch UI Components** (2 hours)
- [ ] Add "Explore Related Topic" button in chat
- [ ] Create branch modal to specify topic
- [ ] Show branch indicator in chat header
- [ ] Add "Return to Main" button when in branch

**File to create:**
```typescript
// src/components/chat/BranchButton.tsx

export function BranchButton({ currentSessionId }: { currentSessionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [branchTopic, setBranchTopic] = useState('');
  
  const handleBranch = async () => {
    const newSessionId = await branchSession(
      userId,
      currentSessionId,
      branchTopic,
      'User wanted to explore related topic'
    );
    
    router.push(`/dashboard/chat?session=${newSessionId}`);
  };
  
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-secondary">
        🔀 Explore Related Topic
      </button>
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h3>Branch to New Topic</h3>
        <p className="text-sm text-gray-600 mt-2">
          Your current conversation will be saved. You can return to it anytime.
        </p>
        <input 
          type="text"
          placeholder="What do you want to explore?"
          value={branchTopic}
          onChange={(e) => setBranchTopic(e.target.value)}
          className="input mt-4"
        />
        <button onClick={handleBranch} className="btn-primary mt-4">
          Start Branch
        </button>
      </Modal>
    </>
  );
}
```

**9.3: Branch Navigation** (1 hour)
- [ ] Show breadcrumb trail when in branched session
- [ ] Implement "Return to [Parent Topic]" functionality
- [ ] Update session status appropriately

**9.4: Testing** (1 hour)
- [ ] Test branch creation
- [ ] Test context preservation
- [ ] Test navigation between parent and branch
- [ ] Test edge cases (branch from branch)

---

### Day 10: Integration, Testing & Polish

**Goal:** Everything works together smoothly

#### Tasks

**10.1: End-to-End Testing** (3 hours)
- [ ] Test full flow: Onboard → Generate Path → Chat → Concept Graph Updates → Progress Tracks
- [ ] Test session resume flow
- [ ] Test branching flow
- [ ] Test milestone completion

**Test scenarios:**
```typescript
// E2E Test: Complete Learning Flow
describe('Sprint 3: Complete Learning Flow', () => {
  it('should track concepts and progress through path', async () => {
    // 1. User completes onboarding
    const user = await createTestUser();
    await completeOnboarding(user, { goal: 'Learn Python basics' });
    
    // 2. Path is generated
    const path = await generatePath(user.id);
    expect(path.milestones).toHaveLength(3);
    
    // 3. User accepts path
    await acceptPath(user.id, path.id);
    
    // 4. User starts chatting
    const session = await startSession(user.id, { pathId: path.id });
    
    // 5. Concepts are extracted and graph updates
    await sendMessage(session.id, 'What is a variable?');
    const concepts = await getUserConcepts(user.id);
    expect(concepts).toContainEqual(expect.objectContaining({
      name: 'variable'
    }));
    
    // 6. Progress tracks after learning milestone concepts
    await sendMessage(session.id, 'I understand variables and data types now');
    const updatedPath = await getPath(user.id, path.id);
    expect(updatedPath.milestones[0].status).toBe('completed');
  });
});
```

**10.2: Performance Optimization** (2 hours)
- [ ] Add indexes to Firestore collections
- [ ] Optimize concept graph queries
- [ ] Cache frequently accessed data
- [ ] Measure and optimize path generation time

**Firestore Indexes needed:**
```typescript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "concepts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "domain", "order": "ASCENDING" },
        { "fieldPath": "lastReviewed", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "learning_paths",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "lastActivity", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**10.3: Error Handling & Edge Cases** (1 hour)
- [ ] Handle path generation failures gracefully
- [ ] Handle concept extraction errors (don't break chat)
- [ ] Handle resume of deleted/invalid sessions
- [ ] Add user-friendly error messages

**10.4: Documentation** (1 hour)
- [ ] Document new API endpoints in `docs/API.md`
- [ ] Update README with Sprint 3 features
- [ ] Add inline code comments
- [ ] Create Sprint 3 summary document

**10.5: Sprint Review Prep** (1 hour)
- [ ] Create demo script
- [ ] Prepare screenshots/videos
- [ ] List known issues
- [ ] Document technical debt

---

## Testing Requirements

### Unit Tests

**Coverage Target:** 80%+ for new code

#### Services to Test
- [ ] `src/lib/firebase/concepts.ts` - All CRUD operations
- [ ] `src/lib/firebase/conceptRelations.ts` - Relation creation and queries
- [ ] `src/lib/firebase/learningPaths.ts` - Path management
- [ ] `src/lib/ai/pathGeneration.ts` - Mock OpenAI, test prompt building
- [ ] `src/lib/ai/conceptGraphUpdater.ts` - Graph update logic
- [ ] `src/lib/learning/progressTracker.ts` - Progress calculations

#### Components to Test
- [ ] `PathCard.tsx` - Renders correctly, handles actions
- [ ] `MilestoneList.tsx` - Shows progress correctly
- [ ] `SessionList.tsx` - Lists sessions, handles resume
- [ ] `BranchButton.tsx` - Branch modal works

### Integration Tests

- [ ] **Concept Graph Update Flow**
  - Send message → Verify concepts extracted → Verify stored in Firestore
  
- [ ] **Path Generation Flow**
  - Request path → Verify AI called → Verify path structure valid → Verify saved
  
- [ ] **Progress Tracking Flow**
  - Learn concepts → Verify mastery updated → Verify milestone marked complete

### E2E Tests (Playwright)

```typescript
// e2e/learning-path.spec.ts

test('user can complete a learning path', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Navigate to learning paths
  await page.click('text=Learning Paths');
  
  // Accept recommended path
  await page.click('text=Start This Path');
  
  // Start chat
  await page.click('text=Begin Learning');
  
  // Have conversation about first concept
  await page.fill('textarea', 'Tell me about variables');
  await page.click('button:has-text("Send")');
  
  // Wait for response
  await page.waitForSelector('.message.assistant');
  
  // Verify concept appears in graph (need to navigate)
  await page.click('text=My Concepts');
  await expect(page.locator('text=variable')).toBeVisible();
});
```

### Manual Testing Checklist

- [ ] Path generation feels fast (<5 seconds)
- [ ] Generated paths are relevant to user goal
- [ ] Progress tracking feels accurate
- [ ] Session resume loads correct context
- [ ] Branching preserves parent context
- [ ] UI is responsive on mobile
- [ ] Error messages are helpful
- [ ] Milestone completion feels rewarding

---

## Risk Mitigation

### Risk 1: Path Generation Too Slow
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Cache common path templates
- Pre-generate paths for common goals during onboarding
- Show loading state with "generating your personalized path..." message
- Set 30-second timeout, fallback to template path

### Risk 2: Concept Extraction Inaccurate
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Iterate on GPT-4 prompts with real data
- Allow users to manually add/remove concepts
- Track extraction accuracy metrics
- Consider fine-tuning if needed (post-MVP)

### Risk 3: Firestore Query Performance
**Likelihood:** Low  
**Impact:** High  
**Mitigation:**
- Add indexes proactively
- Limit graph queries to last N concepts
- Cache concept graph in Redis for active users
- Plan migration to graph DB if needed (Neo4j)

### Risk 4: Progress Tracking Edge Cases
**Likelihood:** Medium  
**Impact:** Low  
**Mitigation:**
- Write comprehensive unit tests for progress logic
- Add admin tools to manually fix user progress
- Log all progress updates for debugging
- Allow users to manually mark milestones

### Risk 5: Context Window Limits
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Summarize old messages instead of loading all
- Only inject relevant concepts into prompts
- Use GPT-3.5-turbo for path generation if GPT-4 too expensive
- Implement smart context pruning

---

## Definition of Done

### Sprint Complete When:

✅ **Feature Completeness**
- [ ] All 6 stories implemented and tested
- [ ] Concept graph updates automatically from chat
- [ ] Learning paths can be generated and accepted
- [ ] Progress tracks across sessions
- [ ] Session resume works
- [ ] Topic branching works

✅ **Technical Quality**
- [ ] All unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] No critical bugs
- [ ] Code reviewed
- [ ] Performance benchmarks met:
  - Path generation: <5s
  - Concept extraction: <2s
  - Graph query: <500ms

✅ **User Experience**
- [ ] Can demo complete flow without errors
- [ ] UI is polished and responsive
- [ ] Error messages are helpful
- [ ] Loading states feel smooth

✅ **Documentation**
- [ ] API endpoints documented
- [ ] Code has inline comments
- [ ] Sprint 3 summary created
- [ ] Known issues documented

✅ **Deployment**
- [ ] Deployed to staging
- [ ] Smoke tests pass in staging
- [ ] Firestore indexes created
- [ ] Environment variables set

### Demo Script

**Show the following flow:**
1. User logs in after onboarding
2. Dashboard shows "Recommended Learning Path" card
3. Click to view path → Shows 3 milestones with concepts
4. Accept path → Navigates to chat
5. Chat about first concept → Concept appears in real-time tag
6. Continue chatting through milestone concepts
7. Milestone completes → Celebration animation
8. Navigate to "My Concepts" → See concept graph with connections
9. Resume previous session → Context is preserved
10. Branch to explore related topic → New session created

---

## Post-Sprint 3: What's Next?

### Sprint 4: Knowledge Visualization
- Visual concept graph with interactive nodes
- Reflection mode triggers
- Explain-back feature

### Technical Debt to Address
- [ ] Optimize Firestore queries (add more indexes)
- [ ] Improve concept extraction prompt (iterate based on real data)
- [ ] Add caching layer for concept graphs
- [ ] Better error tracking and logging

### Known Limitations (Acceptable for MVP)
- Concept deduplication is simple (exact name match)
- Path generation doesn't consider time constraints perfectly
- Progress tracking is binary (complete/incomplete)
- No concept graph visualization yet (Sprint 4)
- No relation strength calculation yet

---

## Appendix: Key Files Reference

### New Files Created

```
src/
├── lib/
│   ├── firebase/
│   │   ├── concepts.ts                    // Concept CRUD
│   │   ├── conceptRelations.ts            // Relation management
│   │   └── learningPaths.ts               // Path CRUD
│   ├── ai/
│   │   ├── pathGeneration.ts              // AI path generation
│   │   └── conceptGraphUpdater.ts         // Auto-update graph from chat
│   ├── learning/
│   │   └── progressTracker.ts             // Progress calculation
│   └── sessions/
│       ├── resumeSession.ts               // Session resume logic
│       └── branchSession.ts               // Session branching
├── components/
│   ├── learning/
│   │   ├── PathCard.tsx                   // Path display
│   │   ├── MilestoneList.tsx              // Milestone list
│   │   ├── PathModal.tsx                  // Path details modal
│   │   └── ProgressRing.tsx               // Progress visualization
│   └── chat/
│       ├── SessionList.tsx                // Recent sessions
│       └── BranchButton.tsx               // Branch trigger
└── app/
    └── api/
        ├── paths/
        │   ├── generate/route.ts          // POST /api/paths/generate
        │   └── [pathId]/
        │       └── progress/route.ts      // PATCH /api/paths/:id/progress
        └── sessions/
            └── route.ts                   // GET /api/sessions
```

### Modified Files

```
src/
├── types/index.ts                         // Add new interfaces
├── app/api/chat/route.ts                  // Integrate graph updates
└── components/chat/ChatInterface.tsx      // Add branch button
```

---

**Questions or clarifications needed?** Please contact the team before starting implementation. Good luck with Sprint 3! 🚀
