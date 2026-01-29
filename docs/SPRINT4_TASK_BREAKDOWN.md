# Sprint 4: Task Breakdown for Implementation

**Sprint:** 4 - Knowledge Visualization  
**Created:** January 29, 2026  
**Complexity Breakdown:** Tasks organized by implementation order and complexity

---

## Task Summary

| Category | Opus Tasks | Sonnet Tasks | Total |
|----------|------------|--------------|-------|
| Graph Visualization | 3 | 8 | 11 |
| Reflection System | 4 | 7 | 11 |
| **Total** | **7** | **15** | **22** |

---

## Complex Tasks for Opus 4.5

These tasks require architectural decisions, AI integration, or complex algorithms.

---

### O1: Graph Data Transformer with Layout Optimization
**File:** `src/lib/graph/transformGraphData.ts`  
**Complexity:** High  
**Estimated time:** 45 min

**Description:**
Transform raw concept/relation data into react-force-graph format with intelligent layout hints.

```typescript
interface TransformOptions {
  maxNodes?: number;
  clusterByDomain?: boolean;
  highlightPath?: string[]; // Concept IDs to highlight
}

export function transformGraphData(
  concepts: ConceptNode[],
  relations: ConceptRelation[],
  options?: TransformOptions
): GraphData {
  // 1. Filter and paginate if needed
  // 2. Calculate node sizes (log scale of exposure count)
  // 3. Map mastery to colors
  // 4. Transform relations to links with proper source/target
  // 5. Add cluster hints for force simulation
  // 6. Return nodes and links
}

// Also export helper functions
export function calculateNodeSize(exposureCount: number): number;
export function getMasteryColor(level: MasteryLevel): string;
export function getRelationColor(type: RelationType): string;
```

**Implementation Notes:**
- Use logarithmic scale for node sizes (prevents huge nodes)
- Consider adding virtual "domain" nodes for clustering
- Handle orphan nodes (no relations) gracefully

---

### O2: Reflection Trigger Logic
**File:** `src/lib/reflection/shouldTriggerReflection.ts`  
**Complexity:** High  
**Estimated time:** 30 min

**Description:**
Determine when to prompt user for reflection based on session state.

```typescript
interface ReflectionTriggerContext {
  session: LearningSession;
  recentReflections: Array<{ timestamp: Timestamp }>;
  userPreferences: { reflectionFrequency: 'often' | 'moderate' | 'rarely' };
}

interface TriggerResult {
  shouldTrigger: boolean;
  reason?: string;
  cooldownRemaining?: number; // seconds
}

export function shouldTriggerReflection(
  context: ReflectionTriggerContext
): TriggerResult {
  // Conditions:
  // 1. Session has 3+ concepts covered
  // 2. Session has 10+ messages
  // 3. Time since last reflection > 15 minutes
  // 4. User hasn't dismissed "not now" in last 5 minutes
  // 5. Respect user preference for frequency
}

export function getReflectionCooldown(lastReflection: Timestamp): number;
```

---

### O3: AI Reflection Prompt Generator
**File:** `src/lib/ai/reflectionPrompt.ts`  
**Complexity:** High  
**Estimated time:** 60 min

**Description:**
Generate personalized reflection prompts based on concepts covered in session.

```typescript
interface PromptGenerationInput {
  userId: string;
  sessionId: string;
  conceptsCovered: string[]; // Concept names
  sessionTopic: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface GeneratedPrompt {
  promptId: string;
  promptText: string;
  hints: string[];
  conceptsToAddress: string[];
  minWords: number;
  maxWords: number;
}

export async function generateReflectionPrompt(
  input: PromptGenerationInput
): Promise<{ success: boolean; prompt?: GeneratedPrompt; error?: string }> {
  // 1. Get concept definitions from DB
  // 2. Build context for GPT
  // 3. Generate personalized prompt
  // 4. Extract hints from response
  // 5. Return structured prompt
}
```

**GPT Prompt Template:**
```
You are helping a learner reflect on what they just learned.

Session topic: {topic}
Concepts covered: {concepts}
Learner level: {level}

Generate a reflection prompt that:
1. Asks them to explain key concepts in their own words
2. Connects concepts to each other
3. Is encouraging, not testing

Also provide 3 hints of what to include.

Return JSON: { promptText, hints: string[] }
```

---

### O4: AI Reflection Analyzer
**File:** `src/lib/ai/reflectionAnalyzer.ts`  
**Complexity:** High  
**Estimated time:** 90 min

**Description:**
Analyze user's reflection submission and provide detailed feedback.

```typescript
interface AnalysisInput {
  userId: string;
  reflectionContent: string;
  prompt: GeneratedPrompt;
  conceptDefinitions: Array<{
    conceptId: string;
    name: string;
    definition: string;
  }>;
}

interface AnalysisOutput {
  overallScore: number; // 0-100
  strengths: string[];
  suggestions: string[];
  misconceptions: Array<{
    claim: string;
    correction: string;
    severity: 'minor' | 'significant';
  }>;
  conceptAssessments: Array<{
    conceptId: string;
    mentioned: boolean;
    accuracyScore: number; // 0-100
    suggestedDefinition?: string;
  }>;
}

export async function analyzeReflection(
  input: AnalysisInput
): Promise<{ success: boolean; analysis?: AnalysisOutput; error?: string }> {
  // 1. Send reflection + concept definitions to GPT
  // 2. Ask for structured analysis
  // 3. Parse and validate response
  // 4. Calculate overall score from concept assessments
  // 5. Return structured analysis
}
```

**GPT Prompt Template:**
```
Analyze this learner's reflection against these concept definitions.

Reflection:
{reflection}

Concepts they should have covered:
{concepts with definitions}

Evaluate:
1. Which concepts did they mention?
2. How accurate was their explanation of each?
3. Are there any misconceptions?
4. What did they do well?
5. What could they improve?

Be encouraging but honest. Return JSON with:
- conceptAssessments: [{ conceptId, mentioned, accuracyScore, suggestedDefinition? }]
- strengths: string[]
- suggestions: string[]
- misconceptions: [{ claim, correction, severity }]
```

---

### O5: Mastery Update from Reflection
**File:** `src/lib/reflection/updateMasteryFromReflection.ts`  
**Complexity:** High  
**Estimated time:** 45 min

**Description:**
Update concept mastery levels based on reflection analysis.

```typescript
interface MasteryUpdateInput {
  userId: string;
  analysis: AnalysisOutput;
  currentConcepts: ConceptNode[];
}

interface MasteryUpdateResult {
  updates: Array<{
    conceptId: string;
    previousMastery: MasteryLevel;
    newMastery: MasteryLevel;
    previousConfidence: number;
    newConfidence: number;
    reason: string;
  }>;
  levelUps: string[]; // Concept IDs that leveled up
}

export async function updateMasteryFromReflection(
  input: MasteryUpdateInput
): Promise<MasteryUpdateResult> {
  // 1. For each concept assessment
  // 2. Calculate new confidence based on accuracy
  // 3. Check if mastery level should change
  // 4. Apply updates to Firebase
  // 5. Return summary of changes
}

// Mastery transition rules
const MASTERY_THRESHOLDS = {
  exploring: { minConfidence: 0, minUnderstanding: 0 },
  developing: { minConfidence: 30, minUnderstanding: 40 },
  applying: { minConfidence: 60, minUnderstanding: 70 },
  mastered: { minConfidence: 85, minUnderstanding: 90 },
};
```

---

### O6: Graph Concept Detail API
**File:** `src/app/api/graph/concepts/[conceptId]/route.ts`  
**Complexity:** Medium  
**Estimated time:** 30 min

**Description:**
API endpoint for fetching detailed concept information for the detail panel.

```typescript
// GET /api/graph/concepts/:conceptId
export async function GET(
  request: NextRequest,
  { params }: { params: { conceptId: string } }
) {
  // 1. Get concept by ID (verify ownership)
  // 2. Get related concepts via relations
  // 3. Get recent sessions where concept was discussed
  // 4. Return enriched concept data
}
```

---

### O7: Reflection API Endpoints
**File:** `src/app/api/reflect/prompt/route.ts` and `src/app/api/reflect/submit/route.ts`  
**Complexity:** Medium  
**Estimated time:** 45 min

**Description:**
API endpoints for reflection prompt generation and submission.

```typescript
// GET /api/reflect/prompt?sessionId=xxx
export async function GET(request: NextRequest) {
  // 1. Get session and covered concepts
  // 2. Generate personalized prompt
  // 3. Store prompt in DB
  // 4. Return prompt
}

// POST /api/reflect/submit
export async function POST(request: NextRequest) {
  // Body: { sessionId, promptId, content, skip? }
  // 1. If skip, record skip and return
  // 2. Get prompt and concept definitions
  // 3. Analyze reflection
  // 4. Update mastery levels
  // 5. Store reflection + analysis
  // 6. Return analysis results
}
```

---

## Simple Tasks for Sonnet 4.5

These tasks are well-defined CRUD operations, UI components, or straightforward implementations.

---

### Priority 1: Foundation (Do First)

#### S1: Graph Types
**File:** `src/types/index.ts` (extend)  
**Complexity:** Low  
**Estimated time:** 15 min

Add types for graph visualization and reflection:

```typescript
// Add to existing types file

// Graph Visualization
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
}

// Reflection
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
    severity: 'minor' | 'significant';
  }>;
  conceptUpdates: Array<{
    conceptId: string;
    conceptName: string;
    previousMastery: MasteryLevel;
    newMastery: MasteryLevel;
    confidenceDelta: number;
  }>;
}
```

---

#### S2: Reflections Firebase Service
**File:** `src/lib/firebase/reflections.ts`  
**Complexity:** Low  
**Estimated time:** 30 min

```typescript
export const reflectionsService = {
  async createPrompt(prompt: Omit<ReflectionPrompt, 'promptId'>): Promise<string>;
  async getPrompt(promptId: string): Promise<ReflectionPrompt | null>;
  async createSubmission(submission: Omit<ReflectionSubmission, 'reflectionId'>): Promise<string>;
  async getSubmission(reflectionId: string): Promise<ReflectionSubmission | null>;
  async saveAnalysis(reflectionId: string, analysis: ReflectionAnalysis): Promise<void>;
  async getAnalysis(reflectionId: string): Promise<ReflectionAnalysis | null>;
  async getUserReflections(userId: string, limit?: number): Promise<ReflectionSubmission[]>;
  async getSessionReflections(sessionId: string): Promise<ReflectionSubmission[]>;
};
```

---

### Priority 2: Graph Components

#### S3: ConceptGraph Component
**File:** `src/components/graph/ConceptGraph.tsx`  
**Complexity:** Medium  
**Estimated time:** 60 min

```tsx
"use client";

import { useRef, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { GraphData, GraphNode, GraphLink } from "@/types";

interface ConceptGraphProps {
  data: GraphData;
  selectedNodeId?: string;
  onNodeClick: (nodeId: string) => void;
  onBackgroundClick: () => void;
  width?: number;
  height?: number;
}

export default function ConceptGraph({
  data,
  selectedNodeId,
  onNodeClick,
  onBackgroundClick,
  width = 800,
  height = 600,
}: ConceptGraphProps) {
  const graphRef = useRef<any>();

  const handleNodeClick = useCallback((node: GraphNode) => {
    onNodeClick(node.id);
    // Center on node
    graphRef.current?.centerAt(node.x, node.y, 500);
  }, [onNodeClick]);

  const nodeCanvasObject = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D) => {
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, node.size, 0, 2 * Math.PI);
    ctx.fillStyle = node.id === selectedNodeId ? '#3B82F6' : node.color;
    ctx.fill();
    
    // Draw label
    ctx.font = '10px Sans-Serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#374151';
    ctx.fillText(node.displayName, node.x!, node.y! + node.size + 10);
  }, [selectedNodeId]);

  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={data}
      nodeCanvasObject={nodeCanvasObject}
      onNodeClick={handleNodeClick}
      onBackgroundClick={onBackgroundClick}
      linkColor={(link: GraphLink) => link.color || '#CBD5E1'}
      linkWidth={2}
      width={width}
      height={height}
      cooldownTicks={100}
    />
  );
}
```

---

#### S4: GraphControls Component
**File:** `src/components/graph/GraphControls.tsx`  
**Complexity:** Low  
**Estimated time:** 20 min

```tsx
interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onResetView: () => void;
}

// Buttons for +, -, fit, reset
// Keyboard hint text
```

---

#### S5: GraphFilters Component
**File:** `src/components/graph/GraphFilters.tsx`  
**Complexity:** Low  
**Estimated time:** 25 min

```tsx
interface GraphFiltersProps {
  filters: GraphFilters;
  availableDomains: string[];
  onChange: (filters: GraphFilters) => void;
}

// Domain dropdown
// Mastery level checkboxes
// Search input
```

---

#### S6: GraphLegend Component
**File:** `src/components/graph/GraphLegend.tsx`  
**Complexity:** Low  
**Estimated time:** 15 min

```tsx
// Color swatches for mastery levels
// Line styles for relation types
// Node size explanation
```

---

#### S7: ConceptDetailPanel Component
**File:** `src/components/graph/ConceptDetailPanel.tsx`  
**Complexity:** Medium  
**Estimated time:** 45 min

```tsx
interface ConceptDetailPanelProps {
  conceptId: string;
  onClose: () => void;
  onStartPath: (conceptId: string) => void;
}

// Slide-in panel from right
// Sections: Name, Definition, Mastery, History, Actions
// Loading state while fetching
// Close button + click outside to close
```

---

#### S8: Graph Page
**File:** `src/app/dashboard/graph/page.tsx`  
**Complexity:** Medium  
**Estimated time:** 45 min

```tsx
"use client";

// Full page layout
// Fetch graph data from /api/graph
// Manage selected node state
// Render ConceptGraph + filters + legend + detail panel
// Loading, error, empty states
```

---

#### S9: Graph Component Exports
**File:** `src/components/graph/index.ts`  
**Complexity:** Low  
**Estimated time:** 5 min

```typescript
export { default as ConceptGraph } from "./ConceptGraph";
export { default as GraphControls } from "./GraphControls";
export { default as GraphFilters } from "./GraphFilters";
export { default as GraphLegend } from "./GraphLegend";
export { default as ConceptDetailPanel } from "./ConceptDetailPanel";
```

---

### Priority 3: Reflection Components

#### S10: ReflectionModal Component
**File:** `src/components/reflection/ReflectionModal.tsx`  
**Complexity:** Medium  
**Estimated time:** 45 min

```tsx
interface ReflectionModalProps {
  isOpen: boolean;
  prompt: ReflectionPrompt;
  onSubmit: (content: string) => Promise<void>;
  onSkip: () => void;
  onClose: () => void;
}

// Modal overlay
// Prompt text display
// Hints (collapsible)
// Textarea with live word count
// Submit button (disabled < minWords)
// Skip button
// Loading state during submission
```

---

#### S11: ReflectionResults Component
**File:** `src/components/reflection/ReflectionResults.tsx`  
**Complexity:** Medium  
**Estimated time:** 50 min

```tsx
interface ReflectionResultsProps {
  analysis: ReflectionAnalysis;
  onSaveDefinition: (conceptId: string, definition: string) => void;
  onContinue: () => void;
}

// Score ring at top (reuse ProgressRing)
// Strengths list with ✓ icons
// Suggestions list with 💡 icons
// Misconceptions with ⚠️ and corrections
// "Save definition" buttons for suggestions
// Continue button
```

---

#### S12: LearnerStateUpdate Component
**File:** `src/components/reflection/LearnerStateUpdate.tsx`  
**Complexity:** Medium  
**Estimated time:** 40 min

```tsx
interface LearnerStateUpdateProps {
  updates: ReflectionAnalysis['conceptUpdates'];
  onComplete: () => void;
}

// Before → After visualization for each concept
// Animated mastery level transitions
// Celebration confetti for level-ups
// "Continue" button
```

---

#### S13: ReflectionTrigger Component
**File:** `src/components/reflection/ReflectionTrigger.tsx`  
**Complexity:** Low  
**Estimated time:** 25 min

```tsx
interface ReflectionTriggerProps {
  onReflect: () => void;
  onDismiss: () => void;
}

// Non-intrusive banner or toast
// "Ready to reflect on what you learned?"
// "Reflect Now" and "Not Now" buttons
// Appears in chat interface when triggered
```

---

#### S14: Reflection Component Exports
**File:** `src/components/reflection/index.ts`  
**Complexity:** Low  
**Estimated time:** 5 min

```typescript
export { default as ReflectionModal } from "./ReflectionModal";
export { default as ReflectionResults } from "./ReflectionResults";
export { default as LearnerStateUpdate } from "./LearnerStateUpdate";
export { default as ReflectionTrigger } from "./ReflectionTrigger";
```

---

### Priority 4: Integration

#### S15: Chat Integration - Reflection Trigger
**File:** `src/app/api/chat/route.ts` (modify)  
**Complexity:** Low  
**Estimated time:** 20 min

After message exchange, check if reflection should be triggered:

```typescript
// Add after existing graph update logic

// Check if reflection should be triggered
const reflectionCheck = shouldTriggerReflection({
  session: sessionData,
  recentReflections: await reflectionsService.getSessionReflections(sessionId),
  userPreferences: { reflectionFrequency: 'moderate' },
});

// Include trigger flag in response metadata
// Client will show ReflectionTrigger component if true
```

---

### Priority 5: Tests

#### S16: Graph Component Tests
**File:** `src/test/components/graph/ConceptGraph.test.tsx`  
**Complexity:** Low  
**Estimated time:** 30 min

```typescript
describe('ConceptGraph', () => {
  it('should render nodes and links');
  it('should call onNodeClick when node clicked');
  it('should highlight selected node');
  it('should handle empty data');
});
```

---

#### S17: Reflection Component Tests
**File:** `src/test/components/reflection/ReflectionModal.test.tsx`  
**Complexity:** Low  
**Estimated time:** 30 min

```typescript
describe('ReflectionModal', () => {
  it('should display prompt and hints');
  it('should show word count');
  it('should enable submit at minWords');
  it('should call onSkip when skip clicked');
  it('should show loading during submission');
});
```

---

## Implementation Order

### Phase 1: Foundation
1. **S1:** Graph Types (types)
2. **S2:** Reflections Firebase Service (service)
3. **O1:** Graph Data Transformer (complex - Opus)

### Phase 2: Graph Visualization
4. **S3:** ConceptGraph Component (UI)
5. **S4:** GraphControls Component (UI)
6. **S5:** GraphFilters Component (UI)
7. **S6:** GraphLegend Component (UI)
8. **S7:** ConceptDetailPanel Component (UI)
9. **O6:** Graph Concept Detail API (API - Opus)
10. **S8:** Graph Page (page)
11. **S9:** Graph Component Exports (exports)

### Phase 3: Reflection System
12. **O2:** Reflection Trigger Logic (complex - Opus)
13. **O3:** AI Reflection Prompt Generator (AI - Opus)
14. **O4:** AI Reflection Analyzer (AI - Opus)
15. **O5:** Mastery Update from Reflection (complex - Opus)
16. **O7:** Reflection API Endpoints (API - Opus)

### Phase 4: Reflection UI
17. **S10:** ReflectionModal Component (UI)
18. **S11:** ReflectionResults Component (UI)
19. **S12:** LearnerStateUpdate Component (UI)
20. **S13:** ReflectionTrigger Component (UI)
21. **S14:** Reflection Component Exports (exports)

### Phase 5: Integration & Testing
22. **S15:** Chat Integration - Reflection Trigger (integration)
23. **S16:** Graph Component Tests (tests)
24. **S17:** Reflection Component Tests (tests)

---

## Dependencies Diagram

```
S1 (Types) ──┬──► S2 (Firebase Service)
             │
             ├──► O1 (Transformer) ──► S3 (ConceptGraph)
             │                              │
             │                              ▼
             │    S4, S5, S6 ──────────► S8 (Graph Page)
             │                              │
             │    O6 (Detail API) ◄─────► S7 (DetailPanel)
             │
             └──► O2 (Trigger Logic)
                  O3 (Prompt Gen)  ──┬──► O7 (APIs)
                  O4 (Analyzer)      │        │
                  O5 (Mastery)  ─────┘        ▼
                                        S10, S11, S12, S13 (UI)
                                              │
                                              ▼
                                        S15 (Chat Integration)
```

---

## Notes for Implementation

### Package to Install
```bash
npm install react-force-graph-2d
```

### Environment Variables Needed
None new - uses existing OpenAI and Firebase config.

### Database Collections to Create
- `reflections` - Stores reflection prompts and submissions
- `reflection_analyses` - Stores AI analysis results

### Testing Considerations
- Mock react-force-graph-2d in tests (canvas-based)
- Create fixture data for graph with 10-20 nodes
- Test reflection analysis with varied quality inputs

---

*End of Sprint 4 Task Breakdown*
