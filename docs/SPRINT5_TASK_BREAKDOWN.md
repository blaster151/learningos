# Sprint 5: Task Breakdown for Implementation

**Sprint:** 5 - Polish & Launch Prep  
**Created:** January 29, 2026  
**Complexity Breakdown:** Tasks organized by LLM suitability and implementation order

---

## Task Summary

| Category | Opus Tasks | Sonnet Tasks | Total |
|----------|------------|--------------|-------|
| TECH-01: Error Handling | 1 | 5 | 6 |
| TECH-02: Loading States | 0 | 10 | 10 |
| TECH-03: Mobile | 0 | 6 | 6 |
| STORY-603: Profile | 1 | 3 | 4 |
| STORY-701: History | 1 | 3 | 4 |
| STORY-602: Stats | 1 | 2 | 3 |
| **Total** | **4** | **29** | **33** |

---

## Sonnet-Friendly Tasks (Simple Patterns)

These tasks follow established patterns, are isolated, and don't require architectural decisions.

---

### S5-S01: Base Skeleton Components
**File:** `src/components/ui/Skeleton.tsx`  
**Complexity:** Simple  
**Estimated time:** 30 min  
**Dependencies:** None

**Description:**
Create foundational skeleton components with Tailwind pulse animation.

**Requirements:**
- `Skeleton` - Base div with `animate-pulse` and gray background
- `SkeletonText` - Multiple lines, last line 3/4 width
- `SkeletonAvatar` - Circular, sizes: sm (32px), md (40px), lg (64px)
- Dark mode: `bg-gray-200 dark:bg-gray-700`

**Acceptance:**
- [ ] Components render with pulse animation
- [ ] Custom className merges correctly
- [ ] Dark mode colors work

---

### S5-S02: SkeletonCard Component
**File:** `src/components/ui/SkeletonCard.tsx`  
**Complexity:** Simple  
**Estimated time:** 20 min  
**Dependencies:** S5-S01, existing Card component

**Description:**
Card-shaped skeleton matching the existing Card component structure.

**Props:**
```typescript
interface SkeletonCardProps {
  showAvatar?: boolean;
  lines?: number;      // default: 3
  showActions?: boolean;
  className?: string;
}
```

---

### S5-S03: SkeletonList Component
**File:** `src/components/ui/SkeletonList.tsx`  
**Complexity:** Simple  
**Estimated time:** 15 min  
**Dependencies:** S5-S02

**Description:**
Renders multiple SkeletonCards in a vertical list.

**Props:**
```typescript
interface SkeletonListProps {
  count?: number;      // default: 3
  variant?: "default" | "compact" | "with-avatar";
  className?: string;
}
```

---

### S5-S04: Spinner Component
**File:** `src/components/ui/Spinner.tsx`  
**Complexity:** Simple  
**Estimated time:** 10 min  
**Dependencies:** None

**Description:**
SVG spinner with `animate-spin` for button loading states.

**Implementation:**
```tsx
export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
```

---

### S5-S05: EmptyState Component
**File:** `src/components/ui/EmptyState.tsx`  
**Complexity:** Simple  
**Estimated time:** 20 min  
**Dependencies:** Button component

**Description:**
Reusable empty state with icon, title, description, and optional actions.

**Props:**
```typescript
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
}
```

---

### S5-S06: SkeletonGraph Component
**File:** `src/components/graph/SkeletonGraph.tsx`  
**Complexity:** Simple  
**Estimated time:** 30 min  
**Dependencies:** S5-S01

**Description:**
Graph-shaped skeleton showing nodes and edges with pulse animation.

**Requirements:**
- 7 positioned circles (nodes) at various positions
- SVG lines connecting nodes
- "Loading knowledge graph..." text at bottom
- Subtle gradient background with pulse

---

### S5-S07: API Error Response Helper
**File:** `src/lib/api/error.ts`  
**Complexity:** Simple  
**Estimated time:** 15 min  
**Dependencies:** None

**Description:**
Standardize API error responses across all routes.

**Implementation:**
```typescript
import { NextResponse } from "next/server";

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export function createErrorResponse(
  status: number,
  code: string,
  message: string
): NextResponse {
  return NextResponse.json(
    { error: { code, message, status } },
    { status }
  );
}

// Common errors
export const Errors = {
  UNAUTHORIZED: (msg = "Unauthorized") => createErrorResponse(401, "UNAUTHORIZED", msg),
  NOT_FOUND: (resource = "Resource") => createErrorResponse(404, "NOT_FOUND", `${resource} not found`),
  BAD_REQUEST: (msg: string) => createErrorResponse(400, "BAD_REQUEST", msg),
  INTERNAL: (msg = "Internal server error") => createErrorResponse(500, "INTERNAL_ERROR", msg),
};
```

---

### S5-S08: Logging Abstraction
**File:** `src/lib/utils/logging.ts`  
**Complexity:** Simple  
**Estimated time:** 20 min  
**Dependencies:** None

**Description:**
Create logging utility that can be extended for production monitoring.

**Implementation:**
```typescript
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, ...context };

  if (process.env.NODE_ENV === "development") {
    console[level](JSON.stringify(logEntry, null, 2));
  } else {
    // Production: could send to Sentry, LogRocket, etc.
    console[level](JSON.stringify(logEntry));
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => log("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => log("error", msg, ctx),
};
```

---

### S5-S09: Wire Toasts to Auth Failures
**File:** `src/lib/auth/AuthContext.tsx`  
**Complexity:** Simple  
**Estimated time:** 20 min  
**Dependencies:** Existing Toast system

**Description:**
Add toast notifications for auth errors (login, signup, signout failures).

**Changes:**
```typescript
// In signIn function
try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error) {
  toast.error(getAuthErrorMessage(error));
  throw error;
}

// Helper function
function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential": return "Invalid email or password";
      case "auth/user-not-found": return "No account found with this email";
      case "auth/too-many-requests": return "Too many attempts. Please try again later.";
      default: return "Authentication failed. Please try again.";
    }
  }
  return "An unexpected error occurred";
}
```

---

### S5-S10: Integrate Skeleton into Graph View
**File:** `src/app/dashboard/learn/page.tsx`  
**Complexity:** Medium  
**Estimated time:** 30 min  
**Dependencies:** S5-S05, S5-S06

**Description:**
Add loading skeleton and empty state to the knowledge graph page.

**Changes:**
- Import SkeletonGraph and EmptyState
- Show SkeletonGraph when `isLoading`
- Show EmptyState when no nodes (with "Start Chatting" action)
- Show error EmptyState on fetch failure

---

### S5-S11: Integrate Skeleton into Chat
**File:** `src/components/chat/ChatInterface.tsx`  
**Complexity:** Medium  
**Estimated time:** 25 min  
**Dependencies:** S5-S01, S5-S05

**Description:**
Add loading state for chat history and empty state for new conversations.

**Changes:**
- Create inline `MessageSkeleton` component
- Show 3x MessageSkeleton when loading history
- Show EmptyState "Start the conversation" when no messages

---

### S5-S12: Reflection Submit Loading State
**File:** `src/components/reflection/ReflectionModal.tsx`  
**Complexity:** Simple  
**Estimated time:** 15 min  
**Dependencies:** S5-S04

**Description:**
Update submit button to show spinner and "Analyzing..." text during submission.

**Changes:**
```tsx
<Button disabled={submitting || wordCount < minWords}>
  {submitting ? (
    <>
      <Spinner className="w-4 h-4 mr-2" />
      Analyzing...
    </>
  ) : (
    "Submit Reflection"
  )}
</Button>
```

---

### S5-S13: Mobile Navigation Collapse
**File:** `src/components/dashboard/DashboardShell.tsx`  
**Complexity:** Medium  
**Estimated time:** 40 min  
**Dependencies:** None

**Description:**
Make sidebar collapse to hamburger menu on mobile viewports.

**Changes:**
- Add `isMobileMenuOpen` state
- Hide sidebar by default on `md:` breakpoint
- Add hamburger button in header (mobile only)
- Slide-in overlay menu on mobile

---

### S5-S14: Mobile Graph Controls
**File:** `src/components/graph/GraphControls.tsx`  
**Complexity:** Simple  
**Estimated time:** 20 min  
**Dependencies:** None

**Description:**
Stack controls vertically on mobile, ensure touch targets are 44px+.

**Changes:**
- Add `flex-col md:flex-row` to control wrapper
- Increase button padding on touch: `p-3 md:p-2`
- Use `min-w-[44px] min-h-[44px]` for touch compliance

---

### S5-S15: Mobile Chat Input
**File:** `src/components/chat/ChatInterface.tsx`  
**Complexity:** Simple  
**Estimated time:** 15 min  
**Dependencies:** None

**Description:**
Ensure chat input stays fixed at bottom and is usable on mobile.

**Changes:**
- Add `fixed bottom-0 left-0 right-0 md:relative` to input container
- Add safe-area padding: `pb-safe` or manual padding
- Ensure message list has bottom padding to not overlap input

---

### S5-S16: Mobile Reflection Modal
**File:** `src/components/reflection/ReflectionModal.tsx`  
**Complexity:** Simple  
**Estimated time:** 15 min  
**Dependencies:** None

**Description:**
Make reflection modal full-screen on mobile.

**Changes:**
- Modal container: `w-full h-full md:w-[600px] md:h-auto md:max-h-[80vh]`
- Add `rounded-none md:rounded-lg`
- Adjust padding: `p-4 md:p-6`

---

### S5-S17: Profile Edit Form
**File:** `src/app/dashboard/settings/page.tsx`  
**Complexity:** Medium  
**Estimated time:** 45 min  
**Dependencies:** S5-S18 (PATCH endpoint)

**Description:**
Enable the "Edit Profile" button and add editable form fields.

**Fields to add:**
- Display name (text input)
- Learning goal (textarea)
- Preferred pace (select: slow/moderate/fast)

**State management:**
- `isEditing` boolean
- `formData` object
- `isSaving` for submit loading state

---

### S5-S18: SessionCard Component
**File:** `src/components/dashboard/SessionCard.tsx`  
**Complexity:** Simple  
**Estimated time:** 25 min  
**Dependencies:** None

**Description:**
Card component for displaying a session in the history list.

**Props:**
```typescript
interface SessionCardProps {
  session: {
    sessionId: string;
    topic: string;
    goal?: string;
    startedAt: string;
    lastActivity: string;
    messageCount: number;
    conceptsCovered: string[];
    status: "active" | "completed" | "abandoned";
  };
  onResume?: () => void;
  onViewSummary?: () => void;
}
```

**Display:**
- Topic as title
- Relative time ("2 hours ago")
- Message count badge
- Concept tags (first 3)
- Resume / View Summary buttons

---

### S5-S19: Session History Page Shell
**File:** `src/app/dashboard/learn/history/page.tsx`  
**Complexity:** Medium  
**Estimated time:** 40 min  
**Dependencies:** S5-S03, S5-S05, S5-S18

**Description:**
Create the session history page with list of past sessions.

**Features:**
- Fetch sessions via `GET /api/sessions?userId=`
- Filter tabs: All | Active | Completed
- SkeletonList while loading
- EmptyState when no sessions
- SessionCard for each session

---

### S5-S20: StatCard Component
**File:** `src/components/dashboard/StatCard.tsx`  
**Complexity:** Simple  
**Estimated time:** 20 min  
**Dependencies:** Card component

**Description:**
Simple card for displaying a single stat with label and value.

**Props:**
```typescript
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { direction: "up" | "down"; value: string };
  className?: string;
}
```

---

### S5-S21: Stats Dashboard Page Shell
**File:** `src/app/dashboard/settings/stats/page.tsx`  
**Complexity:** Medium  
**Estimated time:** 35 min  
**Dependencies:** S5-S20, existing stats services

**Description:**
Create stats dashboard showing learning metrics.

**Layout:**
- Row of StatCards (concepts, sessions, streak)
- Mastery distribution (simple bar or list)
- Recent activity

---

### S5-S22: Export UI Components
**File:** `src/components/ui/index.ts`  
**Complexity:** Simple  
**Estimated time:** 5 min  
**Dependencies:** All S5-S01 through S5-S05

**Description:**
Add exports for all new UI components.

```typescript
export { Skeleton, SkeletonText, SkeletonAvatar } from './Skeleton';
export { SkeletonCard } from './SkeletonCard';
export { SkeletonList } from './SkeletonList';
export { EmptyState } from './EmptyState';
export { Spinner } from './Spinner';
```

---

## Opus-Recommended Tasks

These tasks require more complex integration, architectural decisions, or AI involvement.

---

### S5-O01: Stats Aggregation API
**File:** `src/app/api/stats/learning/route.ts`  
**Complexity:** High  
**Estimated time:** 45 min  
**Dependencies:** Existing stats services

**Description:**
Aggregate multiple stat sources into a single API response.

**Sources to combine:**
- `graphDataService.getGraphStats()` → concepts, mastery distribution
- `reflectionsService.getReflectionStats()` → reflections, scores
- User document → totalSessions, streak

**Response shape:**
```typescript
interface LearningStatsResponse {
  concepts: {
    total: number;
    byMastery: Record<MasteryLevel, number>;
    byDomain: Record<string, number>;
  };
  reflections: {
    total: number;
    averageScore: number;
    levelUps: number;
  };
  activity: {
    totalSessions: number;
    totalMessages: number;
    streak: number;
    lastActive: string;
  };
}
```

**Considerations:**
- Error handling if one service fails
- Caching strategy (data doesn't change frequently)
- Graceful degradation (return partial data)

---

### S5-O02: Profile PATCH Endpoint
**File:** `src/app/api/users/route.ts`  
**Complexity:** Medium  
**Estimated time:** 35 min  
**Dependencies:** None

**Description:**
Add PATCH handler for updating user profile fields.

**Allowed updates:**
```typescript
interface ProfileUpdate {
  displayName?: string;
  learningGoal?: string;
  preferredPace?: "slow" | "moderate" | "fast";
  selectedTopics?: string[];
}
```

**Validation:**
- displayName: 1-50 chars, no special chars
- learningGoal: max 500 chars
- preferredPace: must be valid enum
- selectedTopics: array of strings, max 10

**Security:**
- Verify userId matches authenticated user
- Sanitize input
- Update `updatedAt` timestamp

---

### S5-O03: Session Search with Debounce
**File:** `src/app/dashboard/learn/history/page.tsx`  
**Complexity:** Medium  
**Estimated time:** 30 min  
**Dependencies:** S5-S19

**Description:**
Add search functionality to session history with URL state sync.

**Features:**
- Search input with 300ms debounce
- Filter by topic text
- Sync search term to URL params
- Clear button

**Implementation notes:**
- Use `useSearchParams` and `useRouter`
- Debounce with `useDebouncedCallback` or custom hook
- Server-side filtering preferred, but can do client-side for MVP

---

### S5-O04: Integration Test Suite
**Files:** `src/test/integration/sprint5.test.tsx`  
**Complexity:** Medium  
**Estimated time:** 60 min  
**Dependencies:** All Sprint 5 features

**Description:**
Integration tests for Sprint 5 features.

**Test scenarios:**
1. Graph loading → skeleton → content transition
2. Empty state → action button navigation
3. Profile edit → save → verify persistence
4. Session history → filter → resume navigation
5. Mobile viewport → hamburger menu → navigation

---

## Implementation Order

### Phase 1: Foundation (Day 1 morning)
| Order | Task | Time | Can Parallelize |
|-------|------|------|-----------------|
| 1 | S5-S01 (Skeleton) | 30m | Yes |
| 2 | S5-S04 (Spinner) | 10m | Yes |
| 3 | S5-S05 (EmptyState) | 20m | Yes |
| 4 | S5-S07 (API Error) | 15m | Yes |
| 5 | S5-S08 (Logging) | 20m | Yes |

### Phase 2: Composed Components (Day 1 afternoon)
| Order | Task | Time | Depends On |
|-------|------|------|------------|
| 6 | S5-S02 (SkeletonCard) | 20m | S5-S01 |
| 7 | S5-S03 (SkeletonList) | 15m | S5-S02 |
| 8 | S5-S06 (SkeletonGraph) | 30m | S5-S01 |
| 9 | S5-S22 (Exports) | 5m | All above |

### Phase 3: Integration (Day 2)
| Order | Task | Time | Depends On |
|-------|------|------|------------|
| 10 | S5-S10 (Graph integration) | 30m | S5-S05, S5-S06 |
| 11 | S5-S11 (Chat integration) | 25m | S5-S01, S5-S05 |
| 12 | S5-S12 (Reflection submit) | 15m | S5-S04 |
| 13 | S5-S09 (Auth toasts) | 20m | Toast system |

### Phase 4: Mobile (Day 3 morning)
| Order | Task | Time | Depends On |
|-------|------|------|------------|
| 14 | S5-S13 (Nav collapse) | 40m | None |
| 15 | S5-S14 (Graph controls) | 20m | None |
| 16 | S5-S15 (Chat input) | 15m | None |
| 17 | S5-S16 (Reflection modal) | 15m | None |

### Phase 5: Features (Day 3-4)
| Order | Task | Time | Depends On |
|-------|------|------|------------|
| 18 | S5-O02 (Profile PATCH) | 35m | None |
| 19 | S5-S17 (Profile form) | 45m | S5-O02 |
| 20 | S5-S18 (SessionCard) | 25m | None |
| 21 | S5-S19 (History page) | 40m | S5-S18, S5-S03 |
| 22 | S5-S20 (StatCard) | 20m | None |
| 23 | S5-O01 (Stats API) | 45m | None |
| 24 | S5-S21 (Stats page) | 35m | S5-O01, S5-S20 |

### Phase 6: Polish (Day 5)
| Order | Task | Time | Depends On |
|-------|------|------|------------|
| 25 | S5-O03 (Session search) | 30m | S5-S19 |
| 26 | S5-O04 (Integration tests) | 60m | All |

---

## Batch Suggestions for Sonnet

These tasks can be given to Sonnet in batches:

**Batch 1: UI Primitives**
- S5-S01, S5-S04, S5-S05 (parallel)
- Then S5-S02, S5-S03, S5-S06

**Batch 2: Error/Logging Utilities**
- S5-S07, S5-S08 (parallel)

**Batch 3: Mobile Fixes**
- S5-S14, S5-S15, S5-S16 (parallel, small changes)

**Batch 4: Feature Components**
- S5-S18, S5-S20 (parallel, simple cards)

---

## Summary

| Priority | Tasks | Total Time |
|----------|-------|------------|
| P0 (TECH) | 16 tasks | ~6 hours |
| P1 (Stories) | 8 tasks | ~4 hours |
| P2 (Stats) | 3 tasks | ~1.5 hours |
| Testing | 1 task | ~1 hour |
| **Total** | **28 tasks** | **~12.5 hours** |

With parallel execution and batching, realistic completion: **2-3 days** of focused implementation.
