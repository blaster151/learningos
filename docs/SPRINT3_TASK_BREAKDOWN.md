# Sprint 3: Task Breakdown by Complexity & Delegation

**Created:** January 28, 2026  
**Status:** Implementation in Progress

---

## Overview

This document breaks down Sprint 3 (Concept Mapping) into specific implementation tasks, ordered by dependency and complexity. Tasks are assigned to either:
- **🔴 Opus 4.5** - Complex logic, AI prompt engineering, architectural decisions
- **🟢 Sonnet 4.5** - CRUD operations, UI components, straightforward integrations

---

## ✅ COMPLETED BY OPUS 4.5

### 1. Type System Extensions ✅
**File:** `src/types/index.ts`
- Extended `ConceptNode` with `masteryLevel`, `sessionIds`, `learnedFrom`, `discoveredBy`
- Enhanced `ConceptRelation` with lowercase relation types, `sessionId` context
- Added `LearningPath` with `PathMilestone`, `PathStatus`, `MilestoneStatus`
- Added helper types: `PathGenerationInput`, `GeneratedPath`
- Extended `LearningSession` with `pathId`, `currentMilestoneId`, enhanced branching

### 2. AI Path Generation Service ✅
**File:** `src/lib/ai/pathGeneration.ts`
- GPT-4 prompt for personalized path generation
- Validation logic for generated paths
- Helper functions for context building
- `generateLearningPath()`, `generateQuickPath()`, `regeneratePath()`

### 3. Enhanced Concept Extraction ✅
**File:** `src/lib/ai/conceptExtractionEnhanced.ts`
- Domain-aware concept extraction
- Relation detection between concepts
- Context-aware extraction with existing concepts
- `extractConceptsEnhanced()`, `extractConceptsFromConversation()`

### 4. Concept Graph Updater ✅
**File:** `src/lib/ai/conceptGraphUpdater.ts`
- Auto-update graph from chat messages
- Concept deduplication with similarity matching
- Mastery level calculation
- Relation creation logic
- `updateGraphFromMessage()`, `updateGraphFromSession()`

### 5. Progress Tracking Service ✅
**File:** `src/lib/learning/progressTracker.ts`
- Milestone completion detection
- Path progress calculation
- Mastery threshold logic
- Celebration message generation
- `progressTracker.updatePathProgress()`, `checkMilestoneCompletion()`, etc.

---

## 🟢 TASKS FOR SONNET 4.5

### Priority 1: Firebase Services (Foundation)

#### Task S1: Concepts Firebase Service
**File to create:** `src/lib/firebase/concepts.ts`
**Complexity:** Low
**Estimated time:** 30 min

```typescript
// Implement these functions using the patterns from existing firebase services:
export const conceptsService = {
  // Create a new concept for a user
  async createConcept(userId: string, concept: Omit<ConceptNode, 'conceptId'>): Promise<string>
  
  // Get a single concept by ID
  async getConcept(userId: string, conceptId: string): Promise<ConceptNode | null>
  
  // Get all concepts for a user with optional filters
  async getUserConcepts(userId: string, filters?: { 
    domain?: string; 
    masteryLevel?: MasteryLevel;
    limit?: number;
  }): Promise<ConceptNode[]>
  
  // Update concept fields
  async updateConcept(userId: string, conceptId: string, updates: Partial<ConceptNode>): Promise<void>
  
  // Delete a concept
  async deleteConcept(userId: string, conceptId: string): Promise<void>
  
  // Get concepts by name (for deduplication)
  async findConceptByName(userId: string, name: string): Promise<ConceptNode | null>
}
```

**Reference:** Look at `src/app/api/sessions/route.ts` for Firestore patterns with `getAdminDb()`

---

#### Task S2: Concept Relations Firebase Service
**File to create:** `src/lib/firebase/conceptRelations.ts`
**Complexity:** Low
**Estimated time:** 30 min

```typescript
export const relationsService = {
  // Create a new relation between concepts
  async createRelation(userId: string, relation: Omit<ConceptRelation, 'relationId'>): Promise<string>
  
  // Get relations for a concept (incoming, outgoing, or both)
  async getConceptRelations(
    userId: string, 
    conceptId: string,
    direction?: 'incoming' | 'outgoing' | 'both'
  ): Promise<ConceptRelation[]>
  
  // Get all relations for a user
  async getUserRelations(userId: string): Promise<ConceptRelation[]>
  
  // Update relation strength
  async updateRelationStrength(relationId: string, strength: number): Promise<void>
  
  // Delete a relation
  async deleteRelation(relationId: string): Promise<void>
  
  // Check if relation exists
  async relationExists(
    userId: string, 
    sourceId: string, 
    targetId: string
  ): Promise<boolean>
}
```

---

#### Task S3: Learning Paths Firebase Service
**File to create:** `src/lib/firebase/learningPaths.ts`
**Complexity:** Medium-Low
**Estimated time:** 45 min

```typescript
export const pathsService = {
  // Create a new learning path
  async createPath(userId: string, path: Omit<LearningPath, 'pathId'>): Promise<string>
  
  // Get a path by ID
  async getPath(userId: string, pathId: string): Promise<LearningPath | null>
  
  // Get all paths for a user
  async getUserPaths(userId: string, status?: PathStatus): Promise<LearningPath[]>
  
  // Get the current active path for a user
  async getActivePath(userId: string): Promise<LearningPath | null>
  
  // Accept a suggested path (change status to active)
  async acceptPath(userId: string, pathId: string): Promise<void>
  
  // Update path progress and milestones
  async updatePathProgress(
    userId: string, 
    pathId: string, 
    updates: {
      progress?: number;
      milestones?: PathMilestone[];
      status?: PathStatus;
      currentMilestoneIndex?: number;
    }
  ): Promise<void>
  
  // Complete a milestone
  async completeMilestone(
    userId: string, 
    pathId: string, 
    milestoneId: string
  ): Promise<void>
  
  // Abandon a path
  async abandonPath(userId: string, pathId: string): Promise<void>
}
```

---

### Priority 2: API Endpoints

#### Task S4: Path Generation API Endpoint
**File to create:** `src/app/api/paths/generate/route.ts`
**Complexity:** Medium
**Estimated time:** 45 min

```typescript
// POST /api/paths/generate
// Request body: { userId, goal, timeAvailableMinutes? }
// Response: { pathId, path: LearningPath }

// Steps:
// 1. Validate userId and goal from request
// 2. Get user's existing concepts using conceptsService
// 3. Determine user level based on concept count/mastery
// 4. Call generateLearningPath() from pathGeneration.ts
// 5. Convert generated concepts to concept IDs (create if needed)
// 6. Save path using pathsService
// 7. Return the created path

// Use: import { generateLearningPath } from '@/lib/ai/pathGeneration'
```

---

#### Task S5: Get/List Paths API Endpoint
**File to create:** `src/app/api/paths/route.ts`
**Complexity:** Low
**Estimated time:** 30 min

```typescript
// GET /api/paths?userId=X - List all paths for user
// GET /api/paths?userId=X&status=active - List active paths only

// Response: { paths: LearningPath[] }
```

---

#### Task S6: Path Details & Progress API
**File to create:** `src/app/api/paths/[pathId]/route.ts`
**Complexity:** Low
**Estimated time:** 30 min

```typescript
// GET /api/paths/[pathId]?userId=X - Get path details
// PATCH /api/paths/[pathId] - Update path (accept, abandon)
// Body for PATCH: { userId, action: 'accept' | 'abandon' }
```

---

#### Task S7: Concept Graph API Endpoint
**File to create:** `src/app/api/graph/route.ts`
**Complexity:** Medium
**Estimated time:** 45 min

```typescript
// GET /api/graph?userId=X - Get user's concept graph
// Response: {
//   nodes: ConceptNode[],
//   edges: ConceptRelation[],
//   stats: { totalConcepts, masteredConcepts, domains[] }
// }

// Optional query params: domain, minMastery
```

---

### Priority 3: UI Components

#### Task S8: PathCard Component
**File to create:** `src/components/learning/PathCard.tsx`
**Complexity:** Low
**Estimated time:** 30 min

```tsx
interface PathCardProps {
  path: LearningPath;
  onAccept: (pathId: string) => void;
  onDismiss: (pathId: string) => void;
  showProgress?: boolean;
}

// Display:
// - Path title and description
// - Number of milestones and estimated time
// - First 3 milestone titles as preview
// - Accept/Dismiss buttons (or progress bar if active)
// - Use Tailwind classes consistent with existing components
```

---

#### Task S9: MilestoneList Component
**File to create:** `src/components/learning/MilestoneList.tsx`
**Complexity:** Low
**Estimated time:** 30 min

```tsx
interface MilestoneListProps {
  milestones: PathMilestone[];
  currentMilestoneId?: string;
  onMilestoneClick?: (milestoneId: string) => void;
}

// Display:
// - Vertical list with connecting line
// - Color-coded by status (completed=green, in_progress=blue, not_started=gray)
// - Progress bar for in_progress milestones
// - Checkmark icon for completed
// - Concept count and estimated time per milestone
```

---

#### Task S10: ProgressRing Component
**File to create:** `src/components/learning/ProgressRing.tsx`
**Complexity:** Low
**Estimated time:** 20 min

```tsx
interface ProgressRingProps {
  progress: number; // 0-1
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  color?: string;
}

// SVG-based circular progress indicator
// Can reference existing implementations or use a simple approach
```

---

#### Task S11: SessionList Component
**File to create:** `src/components/chat/SessionList.tsx`
**Complexity:** Medium
**Estimated time:** 45 min

```tsx
interface SessionListProps {
  sessions: LearningSession[];
  onContinue: (sessionId: string) => void;
  onNewSession: () => void;
}

// Display:
// - List of recent sessions with topic and time
// - Concepts covered count
// - "Continue" button for each
// - Path indicator if following a path
// - "Start New Session" button at top
```

---

#### Task S12: Learning Path Index/Exports
**File to create:** `src/components/learning/index.ts`
**Complexity:** Trivial
**Estimated time:** 5 min

```typescript
export { PathCard } from './PathCard';
export { MilestoneList } from './MilestoneList';
export { ProgressRing } from './ProgressRing';
```

---

### Priority 4: Integration Tasks

#### Task S13: Update Chat Route to Call Graph Updater
**File to modify:** `src/app/api/chat/route.ts`
**Complexity:** Low
**Estimated time:** 20 min

```typescript
// After the existing concept extraction code, add:
import { updateGraphFromMessage } from '@/lib/ai/conceptGraphUpdater';

// After message is saved and streamed, call:
// updateGraphFromMessage(userId, sessionId, message, 'user', session.topic).catch(console.error);
// updateGraphFromMessage(userId, sessionId, fullResponse, 'assistant', session.topic).catch(console.error);

// This should be non-blocking (don't await, just catch errors)
```

---

#### Task S14: Update Chat Route to Call Progress Tracker
**File to modify:** `src/app/api/chat/route.ts`
**Complexity:** Low
**Estimated time:** 15 min

```typescript
import { progressTracker } from '@/lib/learning/progressTracker';

// After graph update, if session has a pathId:
// if (session.pathId) {
//   progressTracker.updateProgressFromSession(userId, sessionId).catch(console.error);
// }
```

---

#### Task S15: Session Branching Logic
**File to create:** `src/lib/sessions/branchSession.ts`
**Complexity:** Medium
**Estimated time:** 30 min

```typescript
export async function branchSession(
  userId: string,
  parentSessionId: string,
  branchTopic: string,
  reason: string
): Promise<string> {
  // 1. Get parent session
  // 2. Create new session with branch metadata
  // 3. Copy relevant context (conceptsCovered) from parent
  // 4. Add system message to parent noting the branch
  // 5. Return new session ID
}

export async function returnToParentSession(
  userId: string,
  branchSessionId: string
): Promise<string | null> {
  // Return the parent session ID if exists
}
```

---

#### Task S16: Session Resume Logic
**File to create:** `src/lib/sessions/resumeSession.ts`
**Complexity:** Medium
**Estimated time:** 30 min

```typescript
export async function resumeSession(
  userId: string,
  sessionId: string
): Promise<{
  session: LearningSession;
  recentMessages: Message[];
  contextSummary: string;
}> {
  // 1. Get session and validate ownership
  // 2. Update session status to 'active' if was abandoned
  // 3. Get last N messages for context
  // 4. Generate brief context summary (could use AI or simple approach)
  // 5. Update lastActivity
  // 6. Return session data
}
```

---

### Priority 5: Dashboard Integration

#### Task S17: Learning Paths Page
**File to create:** `src/app/dashboard/learn/page.tsx`
**Complexity:** Medium
**Estimated time:** 45 min

```tsx
// Page showing:
// - Current active path (if any) with progress
// - Suggested paths (if none active)
// - "Generate New Path" button with goal input
// - Completed paths history
```

---

#### Task S18: Recommended Path Component for Dashboard
**File to create:** `src/components/dashboard/RecommendedPath.tsx`
**Complexity:** Low
**Estimated time:** 30 min

```tsx
// Widget for dashboard showing:
// - Suggested path card (compact)
// - Or current path progress (if active)
// - Quick actions: "Continue Learning", "View All Paths"
```

---

## Implementation Order

### Phase 1: Foundation (Do First)
1. S1: Concepts Firebase Service
2. S2: Concept Relations Firebase Service
3. S3: Learning Paths Firebase Service

### Phase 2: APIs (After Foundation)
4. S4: Path Generation API
5. S5: Get/List Paths API
6. S6: Path Details API
7. S7: Concept Graph API

### Phase 3: Integration (After APIs)
8. S13: Chat → Graph Updater integration
9. S14: Chat → Progress Tracker integration
10. S15: Session Branching Logic
11. S16: Session Resume Logic

### Phase 4: UI Components (Can parallel with Phase 3)
12. S12: Learning component exports
13. S8: PathCard Component
14. S9: MilestoneList Component
15. S10: ProgressRing Component
16. S11: SessionList Component

### Phase 5: Pages (After Components)
17. S17: Learning Paths Page
18. S18: Recommended Path Dashboard Widget

---

## Testing Notes

Each Firebase service (S1-S3) should have unit tests covering:
- Create operations
- Read operations (single and list)
- Update operations
- Delete operations
- Error handling (not found, unauthorized)

API endpoints (S4-S7) should have:
- Integration tests with mock Firebase
- Request validation tests
- Error response tests

UI Components (S8-S11) should have:
- Render tests
- Interaction tests (clicks, callbacks)
- Empty state tests
- Loading state tests

---

## Files Created by Opus (Reference for Sonnet)

When implementing the Firebase services and APIs, reference these files:

1. **Types:** `src/types/index.ts` - All interfaces defined
2. **Path Generation:** `src/lib/ai/pathGeneration.ts` - Use `generateLearningPath()`
3. **Graph Updater:** `src/lib/ai/conceptGraphUpdater.ts` - Use `updateGraphFromMessage()`
4. **Progress Tracker:** `src/lib/learning/progressTracker.ts` - Use `progressTracker.*`
5. **Enhanced Extraction:** `src/lib/ai/conceptExtractionEnhanced.ts` - Already used by graph updater

---

## Handoff Notes

**For Sonnet executing these tasks:**

1. Always import types from `@/types`
2. Use `getAdminDb()` from `@/lib/firebase/admin` for server-side Firestore
3. Use `Timestamp.now()` for timestamps, not `new Date()`
4. Follow existing error handling patterns in `src/app/api/sessions/route.ts`
5. All API routes should validate `userId` from request
6. Use `NextRequest` and `NextResponse` for API routes
7. Components should use Tailwind CSS classes
8. Reference `src/components/chat/` for component patterns
