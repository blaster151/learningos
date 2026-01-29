# Sprint 4: Knowledge Visualization - Implementation Plan

**Duration:** 2 Weeks  
**Sprint Goal:** User can visualize their knowledge graph and engage in meaningful reflection.  
**Start Date:** TBD  
**Created:** January 29, 2026

---

## Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [User Stories](#user-stories)
3. [Technical Architecture](#technical-architecture)
4. [Week 1: Graph Visualization](#week-1-graph-visualization)
5. [Week 2: Reflection System](#week-2-reflection-system)
6. [API Contracts](#api-contracts)
7. [Component Specifications](#component-specifications)
8. [Testing Strategy](#testing-strategy)
9. [Definition of Done](#definition-of-done)

---

## Sprint Overview

### Stories Included

| Story ID | Title | Points | Priority | Epic |
|----------|-------|--------|----------|------|
| E6-S1 | Graph Visualization | 8 | P0 | Concept Graph |
| E6-S2 | Graph Interaction (Pan/Zoom) | 5 | P1 | Concept Graph |
| E6-S3 | Concept Detail Panel | 5 | P0 | Concept Graph |
| E6-S4 | Graph Filtering | 3 | P2 | Concept Graph |
| E4-S1 | Reflection Prompt Display | 3 | P0 | Reflect Mode |
| E4-S2 | Reflection Submission | 3 | P0 | Reflect Mode |
| E4-S3 | Reflection Analysis Display | 8 | P0 | Reflect Mode |
| E4-S4 | Learner State Update | 5 | P1 | Reflect Mode |

**Total Points:** 40

### Dependencies from Sprint 3

Sprint 4 builds on Sprint 3's concept mapping foundation:
- ✅ `ConceptNode` type with mastery levels
- ✅ `ConceptRelation` type for graph edges
- ✅ `/api/graph` endpoint returning nodes and edges
- ✅ `conceptsService` for CRUD operations
- ✅ `relationsService` for relationship management
- ✅ Progress tracking system

---

## Technical Architecture

### Graph Visualization Stack

**Recommended Library:** `@react-force-graph/2d` (react-force-graph-2d)

| Consideration | Decision | Rationale |
|--------------|----------|-----------|
| Library | react-force-graph-2d | Easy React integration, performant, good defaults |
| Rendering | Canvas (2D) | Better performance than SVG for many nodes |
| Layout | Force-directed | Natural clustering of related concepts |
| State | React + Zustand | Graph state needs to be accessed by multiple components |

**Alternative for v2:** D3.js if more customization needed.

### New Data Models

```typescript
// Reflection types
interface ReflectionPrompt {
  promptId: string;
  conceptIds: string[];
  promptText: string;
  hints: string[];
  minWords: number;
  maxWords: number;
}

interface ReflectionSubmission {
  reflectionId: string;
  userId: string;
  conceptIds: string[];
  content: string;
  wordCount: number;
  submittedAt: Timestamp;
}

interface ReflectionAnalysis {
  reflectionId: string;
  overallScore: number; // 0-100
  strengths: string[];
  suggestions: string[];
  misconceptions: Array<{
    claim: string;
    correction: string;
  }>;
  conceptUpdates: Array<{
    conceptId: string;
    previousMastery: MasteryLevel;
    newMastery: MasteryLevel;
    confidenceDelta: number;
  }>;
}

// Graph visualization types
interface GraphNode {
  id: string;
  name: string;
  displayName: string;
  mastery: MasteryLevel;
  domain: string;
  size: number; // Based on exposure count
  color: string; // Based on mastery
}

interface GraphLink {
  source: string;
  target: string;
  type: RelationType;
  strength: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
```

### Color Scheme for Mastery Levels

```typescript
const MASTERY_COLORS: Record<MasteryLevel, string> = {
  'exploring': '#94A3B8',    // Slate - just started
  'developing': '#60A5FA',   // Blue - building understanding
  'applying': '#34D399',     // Green - can use it
  'mastered': '#FBBF24',     // Gold - fully understood
};
```

---

## Week 1: Graph Visualization

### Day 1-2: Graph Foundation (E6-S1)

**Objective:** Render interactive concept graph with nodes and edges

#### Tasks

1. **Install dependencies**
   ```bash
   npm install react-force-graph-2d
   ```

2. **Create graph data transformer**
   - File: `src/lib/graph/transformGraphData.ts`
   - Convert API response to react-force-graph format
   - Calculate node sizes from exposure count
   - Map mastery levels to colors

3. **Create ConceptGraph component**
   - File: `src/components/graph/ConceptGraph.tsx`
   - Render ForceGraph2D with nodes and links
   - Node rendering with mastery color coding
   - Edge rendering with relationship type labels

4. **Create graph page**
   - File: `src/app/dashboard/graph/page.tsx`
   - Fetch graph data from `/api/graph`
   - Loading and empty states
   - Error handling

5. **Add navigation to graph**
   - Update dashboard navigation
   - Add "Knowledge Graph" menu item

### Day 3-4: Graph Interactivity (E6-S2, E6-S3)

**Objective:** Pan/zoom and concept detail panel

#### Tasks

1. **Implement pan/zoom controls**
   - File: `src/components/graph/GraphControls.tsx`
   - Zoom in/out buttons
   - Fit-to-screen button
   - Reset view button
   - Keyboard shortcuts (+ / - / 0)

2. **Create ConceptDetailPanel component**
   - File: `src/components/graph/ConceptDetailPanel.tsx`
   - Slide-in panel on node click
   - Show concept name, definition, mastery
   - Display confidence/understanding scores
   - Show first encountered date
   - "Start Learning Path" action button
   - "View Related Sessions" link

3. **Implement node selection state**
   - Highlight selected node
   - Dim unrelated nodes
   - Show connected nodes prominently

4. **Create concept detail API**
   - File: `src/app/api/graph/concepts/[conceptId]/route.ts`
   - GET: Return full concept details + related sessions

### Day 5: Graph Polish (E6-S4)

**Objective:** Filtering, legend, and responsive design

#### Tasks

1. **Create GraphFilters component**
   - File: `src/components/graph/GraphFilters.tsx`
   - Domain filter dropdown
   - Mastery level filter (checkbox group)
   - Search by concept name

2. **Create GraphLegend component**
   - File: `src/components/graph/GraphLegend.tsx`
   - Color key for mastery levels
   - Edge type legend
   - Node size explanation

3. **Responsive adjustments**
   - Mobile: Full-screen graph, bottom sheet for details
   - Tablet: Side panel, touch-friendly controls
   - Desktop: Side panel, mouse controls

4. **Performance optimization**
   - Limit initial render to 100 nodes
   - Add "Load more" for large graphs
   - Debounce filter changes

---

## Week 2: Reflection System

### Day 6-7: Reflection Foundation (E4-S1, E4-S2)

**Objective:** Display reflection prompts and capture submissions

#### Tasks

1. **Create reflection trigger logic**
   - File: `src/lib/reflection/shouldTriggerReflection.ts`
   - Check concept count in session (≥3)
   - Check message count (≥10)
   - Check time since last reflection (>15 min)

2. **Create reflection prompt generator**
   - File: `src/lib/ai/reflectionPrompt.ts`
   - Generate personalized prompt based on concepts
   - Include hints for what to cover
   - Set word count guidance (50-200)

3. **Create ReflectionModal component**
   - File: `src/components/reflection/ReflectionModal.tsx`
   - Display prompt with hints
   - Textarea with word count
   - Submit button (enabled at 20+ words)
   - Skip option

4. **Create reflection API endpoints**
   - File: `src/app/api/reflect/prompt/route.ts`
     - GET: Generate reflection prompt for session
   - File: `src/app/api/reflect/submit/route.ts`
     - POST: Submit reflection for analysis

5. **Integrate reflection trigger into chat**
   - Check trigger conditions after each message
   - Show non-intrusive "Ready to reflect?" prompt
   - Allow dismissal with "Not now"

### Day 8-9: Reflection Analysis (E4-S3, E4-S4)

**Objective:** AI analysis and mastery updates

#### Tasks

1. **Create reflection analyzer**
   - File: `src/lib/ai/reflectionAnalyzer.ts`
   - Analyze reflection against concept definitions
   - Identify strengths (correctly explained)
   - Identify gaps (missing concepts)
   - Detect misconceptions
   - Calculate overall score

2. **Create ReflectionResults component**
   - File: `src/components/reflection/ReflectionResults.tsx`
   - Overall score with visual (progress ring)
   - Strengths list with checkmarks
   - Suggestions list with lightbulb icons
   - Misconceptions with gentle corrections
   - "Save suggested definition" buttons

3. **Create LearnerStateUpdate component**
   - File: `src/components/reflection/LearnerStateUpdate.tsx`
   - Before/after mastery visualization
   - Animated transitions
   - Celebration for level-ups

4. **Update concept mastery from reflection**
   - File: `src/lib/reflection/updateMasteryFromReflection.ts`
   - Map analysis score to mastery changes
   - Update concept confidence scores
   - Record reflection event in concept history

5. **Create reflection history storage**
   - Firebase collection: `reflections`
   - Store prompt, submission, analysis, concept updates

### Day 10: Integration & Polish

**Objective:** Connect all pieces and prepare for demo

#### Tasks

1. **End-to-end flow testing**
   - Chat → Reflection trigger → Submit → Analysis → Graph update
   - Verify mastery levels update correctly
   - Test skip functionality

2. **Graph auto-update after reflection**
   - Invalidate graph cache after reflection
   - Animate new/updated nodes
   - Show toast notification of changes

3. **Add reflection history to dashboard**
   - Recent reflections list
   - Link to view full analysis
   - Reflection streak tracking

4. **Mobile responsiveness pass**
   - Reflection modal as bottom sheet on mobile
   - Touch-friendly graph controls
   - Results display in scrollable view

5. **Demo preparation**
   - Seed data for impressive graph
   - Prepare reflection scenarios
   - Document known limitations

---

## API Contracts

### GET /api/graph/concepts/:conceptId

**Purpose:** Get detailed concept information for detail panel

**Response:**
```typescript
{
  concept: {
    conceptId: string;
    name: string;
    displayName: string;
    definition: string;
    domain: string;
    masteryLevel: MasteryLevel;
    confidence: number;
    understanding: number;
    firstEncountered: Timestamp;
    lastReviewed: Timestamp;
    exposureCount: number;
    sessionIds: string[];
  };
  relatedConcepts: Array<{
    conceptId: string;
    name: string;
    relationType: RelationType;
  }>;
  recentSessions: Array<{
    sessionId: string;
    topic: string;
    date: Timestamp;
  }>;
}
```

### GET /api/reflect/prompt

**Purpose:** Generate reflection prompt for current session

**Query Params:**
- `sessionId`: string (required)

**Response:**
```typescript
{
  prompt: {
    promptId: string;
    conceptIds: string[];
    promptText: string;
    hints: string[];
    minWords: number;
    maxWords: number;
  };
}
```

### POST /api/reflect/submit

**Purpose:** Submit reflection and get analysis

**Request:**
```typescript
{
  sessionId: string;
  promptId: string;
  content: string;
  skip?: boolean;
}
```

**Response:**
```typescript
{
  reflectionId: string;
  skipped: boolean;
  analysis?: {
    overallScore: number;
    strengths: string[];
    suggestions: string[];
    misconceptions: Array<{
      claim: string;
      correction: string;
    }>;
    conceptUpdates: Array<{
      conceptId: string;
      conceptName: string;
      previousMastery: MasteryLevel;
      newMastery: MasteryLevel;
      confidenceDelta: number;
    }>;
  };
}
```

---

## Component Specifications

### ConceptGraph

```typescript
interface ConceptGraphProps {
  data: GraphData;
  selectedNodeId?: string;
  onNodeClick: (nodeId: string) => void;
  onBackgroundClick: () => void;
  filters: GraphFilters;
}
```

**Behavior:**
- Force-directed layout with physics simulation
- Nodes sized by exposure count (min 10, max 40)
- Nodes colored by mastery level
- Edges colored by relationship type
- Labels appear on hover
- Click node → select and show details
- Click background → deselect

### ConceptDetailPanel

```typescript
interface ConceptDetailPanelProps {
  conceptId: string;
  onClose: () => void;
  onStartPath: (conceptId: string) => void;
}
```

**Layout:**
- Width: 400px (desktop), full screen (mobile)
- Sections: Header, Definition, Metrics, History, Actions
- Transitions: Slide in from right

### ReflectionModal

```typescript
interface ReflectionModalProps {
  sessionId: string;
  prompt: ReflectionPrompt;
  onSubmit: (content: string) => Promise<void>;
  onSkip: () => void;
  onClose: () => void;
}
```

**Behavior:**
- Word count updates as user types
- Submit enabled at minWords
- Warning at maxWords
- Loading state during submission
- Cannot close during submission

### ReflectionResults

```typescript
interface ReflectionResultsProps {
  analysis: ReflectionAnalysis;
  onSaveDefinition: (conceptId: string, definition: string) => void;
  onContinue: () => void;
}
```

**Layout:**
- Score ring at top (animated fill)
- Collapsible sections for strengths/suggestions
- Misconceptions in distinct warning style
- Continue button at bottom

---

## Testing Strategy

### Unit Tests

| Component/Function | Test Cases |
|--------------------|------------|
| `transformGraphData` | Empty data, single node, multiple nodes, edges |
| `shouldTriggerReflection` | All conditions, partial conditions, edge cases |
| `reflectionAnalyzer` | Good reflection, poor reflection, misconceptions |
| `updateMasteryFromReflection` | Score ranges, level transitions |

### Component Tests

| Component | Test Cases |
|-----------|------------|
| `ConceptGraph` | Renders nodes, handles click, filters work |
| `ConceptDetailPanel` | Shows data, actions work, closes properly |
| `ReflectionModal` | Word count, submit enabled, skip works |
| `ReflectionResults` | Score display, sections render, save works |

### Integration Tests

| Flow | Test Cases |
|------|------------|
| Graph exploration | Load → Click node → See details → Start path |
| Reflection flow | Trigger → Submit → See results → Graph updates |
| Skip reflection | Trigger → Skip → No analysis → Record skipped |

### E2E Tests

```typescript
// e2e/graph.spec.ts
test('user can explore concept graph', async ({ page }) => {
  await page.goto('/dashboard/graph');
  await expect(page.locator('canvas')).toBeVisible();
  // Click a node
  await page.click('[data-testid="graph-node-react"]');
  await expect(page.locator('[data-testid="concept-panel"]')).toBeVisible();
});

// e2e/reflection.spec.ts
test('user can complete reflection', async ({ page }) => {
  // Setup: Have a session with 3+ concepts, 10+ messages
  await page.goto('/dashboard/chat/test-session');
  await expect(page.locator('[data-testid="reflection-prompt"]')).toBeVisible();
  await page.fill('[data-testid="reflection-input"]', 'My understanding of React...');
  await page.click('[data-testid="submit-reflection"]');
  await expect(page.locator('[data-testid="reflection-results"]')).toBeVisible();
});
```

---

## Definition of Done

### Story: Graph Visualization (E6-S1)
- [ ] Graph renders with nodes representing user's concepts
- [ ] Node colors indicate mastery levels
- [ ] Edges show relationships between concepts
- [ ] Empty state shows encouraging message
- [ ] Loading state while fetching data
- [ ] Error state with retry option

### Story: Graph Interaction (E6-S2)
- [ ] Can pan graph by dragging
- [ ] Can zoom with scroll/pinch
- [ ] Fit-to-screen button works
- [ ] Zoom controls (+/-) work
- [ ] Touch gestures work on mobile

### Story: Concept Detail Panel (E6-S3)
- [ ] Panel opens on node click
- [ ] Shows concept name and definition
- [ ] Shows mastery metrics
- [ ] Shows learning history
- [ ] "Start path" generates learning path
- [ ] Panel closes on X or background click

### Story: Graph Filtering (E6-S4)
- [ ] Can filter by domain
- [ ] Can filter by mastery level
- [ ] "All" shows everything
- [ ] Empty filter state handled

### Story: Reflection Prompt (E4-S1)
- [ ] Prompt appears after meeting trigger conditions
- [ ] Prompt is personalized to session concepts
- [ ] Hints guide what to cover
- [ ] Word count guidance visible

### Story: Reflection Submission (E4-S2)
- [ ] Submit enabled at 20+ words
- [ ] Word count updates live
- [ ] Loading state during analysis
- [ ] Can skip reflection

### Story: Reflection Analysis (E4-S3)
- [ ] Overall score displayed
- [ ] Strengths list shown
- [ ] Suggestions for improvement shown
- [ ] Misconceptions gently corrected
- [ ] Can save suggested definitions

### Story: Learner State Update (E4-S4)
- [ ] Before/after mastery shown
- [ ] Changes animate
- [ ] Level-up celebrated
- [ ] Dashboard stats updated

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Graph performance with many nodes | Limit to 100 nodes, add pagination |
| AI reflection analysis quality | Provide clear rubric, allow user feedback |
| Reflection triggers too often | Add 15-minute cooldown, "Don't ask again today" |
| Mobile graph usability | Extensive touch testing, bottom sheet for details |

---

## Sprint 4 Success Metrics

1. **User can view knowledge graph** with ≥5 concepts rendered
2. **Graph interactions** are smooth (≥30 FPS)
3. **Reflection triggers** appropriately in ≥80% of qualifying sessions
4. **Reflection analysis** provides actionable feedback
5. **Mastery updates** reflect in graph within 5 seconds

---

*End of Sprint 4 Implementation Plan*
