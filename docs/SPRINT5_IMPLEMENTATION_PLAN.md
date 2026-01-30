# Sprint 5: Polish & Launch Prep - Implementation Plan

**Duration:** 1 Week  
**Sprint Goal:** Application is production-ready with polished UX and error handling.  
**Start Date:** TBD  
**Created:** January 29, 2026

---

## Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Pre-Sprint Status](#pre-sprint-status)
3. [TECH-01: Error Handling & Logging](#tech-01-error-handling--logging)
4. [TECH-02: Loading States & Skeletons](#tech-02-loading-states--skeletons)
5. [TECH-03: Mobile Responsiveness](#tech-03-mobile-responsiveness)
6. [STORY-603: Edit Profile Settings](#story-603-edit-profile-settings)
7. [STORY-701: Browse Session History](#story-701-browse-session-history)
8. [STORY-602: View Learning Stats](#story-602-view-learning-stats)
9. [Testing Strategy](#testing-strategy)
10. [Definition of Done](#definition-of-done)

---

## Sprint Overview

### Stories Included

| Story ID | Title | Points | Priority | Status |
|----------|-------|--------|----------|--------|
| TECH-01 | Error handling & logging | 3 | P0 | 60% done |
| TECH-02 | Loading states & skeletons | 2 | P0 | 0% done |
| TECH-03 | Mobile responsiveness | 3 | P0 | Untested |
| STORY-603 | Edit Profile Settings | 3 | P1 | Shell exists |
| STORY-701 | Browse Session History | 3 | P1 | API exists |
| STORY-602 | View Learning Stats | 3 | P2 | Services exist |

**Total Points:** 17

### Dependencies from Sprint 4

Sprint 5 builds on Sprint 4's complete feature set:
- ✅ Graph visualization with controls
- ✅ Reflection modal with submit/skip
- ✅ Concept detail panel
- ✅ Session branching
- ✅ All unit tests passing (281/281)

---

## Pre-Sprint Status

### Already Implemented (Reuse)

| Component | Location | Notes |
|-----------|----------|-------|
| ErrorBoundary | `src/components/error/ErrorBoundary.tsx` | Full implementation with reset |
| Toast System | `src/components/error/Toast.tsx` | Provider + hook + 4 variants |
| Session List API | `GET /api/sessions?userId=` | Returns last 20 sessions |
| User Profile API | `src/lib/api/userProfile.ts` | Client functions for read |
| Graph Stats | `graphDataService.getGraphStats()` | Concepts, mastery distribution |
| Reflection Stats | `reflectionsService.getReflectionStats()` | Total, average, level-ups |
| Settings Page | `/dashboard/settings` | Display-only, Edit button disabled |

### Needs Implementation

| Feature | Scope | Priority |
|---------|-------|----------|
| Skeleton components | New UI primitives | P0 |
| Profile PATCH endpoint | API route | P1 |
| Session history UI | New page | P1 |
| Stats dashboard UI | New page | P2 |
| Mobile responsive fixes | CSS/Layout | P0 |
| API error standardization | Utility + refactor | P0 |
| Logging abstraction | Utility | P0 |

---

## TECH-02: Loading States & Skeletons

### Overview

**Priority:** P0  
**Estimated Time:** 4-6 hours  
**LLM Suitability:** Mostly Sonnet-friendly (simple patterns)

Loading states and skeletons provide immediate visual feedback during async operations, significantly improving perceived performance and user confidence.

### Current State Analysis

**Existing Loading Patterns:**
- Chat: Uses `isLoading` state with disabled input
- Graph: Shows nothing while loading (jarring)
- Reflection: Has `submitting` state but no visual indicator
- Dashboard: No loading states for data fetches

**Missing:**
- No skeleton components exist
- No consistent loading pattern
- No empty states for lists
- No error states for failed fetches

---

### Task Breakdown

#### S5-T01: Base Skeleton Components
**Files:** `src/components/ui/Skeleton.tsx`  
**Complexity:** 🟢 Simple  
**LLM:** Sonnet ✓  
**Time:** 30 min

```typescript
// src/components/ui/Skeleton.tsx
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton with pulse animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
    />
  );
}

/**
 * Text skeleton with multiple lines
 */
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            // Last line is shorter for natural text appearance
            i === lines - 1 && "w-3/4"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Circular skeleton for avatars
 */
interface SkeletonAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SkeletonAvatar({ size = "md", className }: SkeletonAvatarProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return (
    <Skeleton className={cn("rounded-full", sizes[size], className)} />
  );
}
```

**Acceptance Criteria:**
- [ ] `Skeleton` component with pulse animation
- [ ] `SkeletonText` with configurable line count
- [ ] `SkeletonAvatar` with size variants
- [ ] Dark mode support
- [ ] Exported from `src/components/ui/index.ts`

---

#### S5-T02: SkeletonCard Component
**Files:** `src/components/ui/SkeletonCard.tsx`  
**Complexity:** 🟢 Simple  
**LLM:** Sonnet ✓  
**Time:** 20 min

```typescript
// src/components/ui/SkeletonCard.tsx
import { Card, CardContent, CardHeader } from "./Card";
import { Skeleton, SkeletonText, SkeletonAvatar } from "./Skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  /** Show avatar placeholder */
  showAvatar?: boolean;
  /** Number of text lines in body */
  lines?: number;
  /** Show action buttons placeholder */
  showActions?: boolean;
  className?: string;
}

export function SkeletonCard({
  showAvatar = false,
  lines = 3,
  showActions = false,
  className,
}: SkeletonCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center gap-4">
        {showAvatar && <SkeletonAvatar />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" /> {/* Title */}
          <Skeleton className="h-3 w-1/2" /> {/* Subtitle */}
        </div>
      </CardHeader>
      <CardContent>
        <SkeletonText lines={lines} />
        {showActions && (
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Acceptance Criteria:**
- [ ] Matches `Card` component structure
- [ ] Configurable avatar, lines, actions
- [ ] Visually consistent with real cards

---

#### S5-T03: SkeletonList Component
**Files:** `src/components/ui/SkeletonList.tsx`  
**Complexity:** 🟢 Simple  
**LLM:** Sonnet ✓  
**Time:** 15 min

```typescript
// src/components/ui/SkeletonList.tsx
import { SkeletonCard } from "./SkeletonCard";
import { cn } from "@/lib/utils";

interface SkeletonListProps {
  /** Number of skeleton items */
  count?: number;
  /** Card variant for each item */
  variant?: "default" | "compact" | "with-avatar";
  className?: string;
}

export function SkeletonList({
  count = 3,
  variant = "default",
  className,
}: SkeletonListProps) {
  const variantProps = {
    default: { lines: 2, showActions: false, showAvatar: false },
    compact: { lines: 1, showActions: false, showAvatar: false },
    "with-avatar": { lines: 2, showActions: true, showAvatar: true },
  };

  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} {...variantProps[variant]} />
      ))}
    </div>
  );
}
```

---

#### S5-T04: SkeletonGraph Component
**Files:** `src/components/graph/SkeletonGraph.tsx`  
**Complexity:** 🟡 Medium  
**LLM:** Sonnet ✓  
**Time:** 30 min

```typescript
// src/components/graph/SkeletonGraph.tsx
"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface SkeletonGraphProps {
  className?: string;
}

/**
 * Skeleton placeholder for the graph visualization.
 * Shows animated circles connected by lines to suggest the graph structure.
 */
export function SkeletonGraph({ className }: SkeletonGraphProps) {
  // Predefined positions for a natural-looking skeleton graph
  const nodes = [
    { x: 50, y: 40, size: 48 },
    { x: 25, y: 65, size: 36 },
    { x: 75, y: 60, size: 40 },
    { x: 40, y: 80, size: 32 },
    { x: 65, y: 85, size: 28 },
    { x: 15, y: 35, size: 24 },
    { x: 85, y: 30, size: 28 },
  ];

  const edges = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 1, to: 3 },
    { from: 2, to: 4 },
    { from: 0, to: 5 },
    { from: 0, to: 6 },
    { from: 2, to: 6 },
  ];

  return (
    <div
      className={cn(
        "relative w-full h-full min-h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Animated background pulse */}
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" />

      {/* SVG for edges */}
      <svg className="absolute inset-0 w-full h-full opacity-30">
        {edges.map((edge, i) => (
          <line
            key={i}
            x1={`${nodes[edge.from].x}%`}
            y1={`${nodes[edge.from].y}%`}
            x2={`${nodes[edge.to].x}%`}
            y2={`${nodes[edge.to].y}%`}
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-300 dark:text-gray-600"
          />
        ))}
      </svg>

      {/* Skeleton nodes */}
      {nodes.map((node, i) => (
        <div
          key={i}
          className="absolute animate-pulse"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="rounded-full bg-gray-300 dark:bg-gray-600"
            style={{
              width: node.size,
              height: node.size,
            }}
          />
        </div>
      ))}

      {/* Loading text */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-500 dark:text-gray-400">
        Loading knowledge graph...
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows graph-like structure with nodes and edges
- [ ] Smooth pulse animation
- [ ] Dark mode support
- [ ] "Loading knowledge graph..." text

---

#### S5-T05: Empty State Component
**Files:** `src/components/ui/EmptyState.tsx`  
**Complexity:** 🟢 Simple  
**LLM:** Sonnet ✓  
**Time:** 20 min

```typescript
// src/components/ui/EmptyState.tsx
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Icon to display */
  icon?: ReactNode;
  /** Main heading */
  title: string;
  /** Descriptive text */
  description?: string;
  /** Primary action */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mb-6">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

**Usage Examples:**
```tsx
// No sessions
<EmptyState
  icon={<ChatBubbleIcon />}
  title="No sessions yet"
  description="Start a learning conversation to see your session history here."
  action={{ label: "Start Learning", onClick: () => router.push("/dashboard/chat") }}
/>

// No concepts
<EmptyState
  icon={<BookIcon />}
  title="No concepts discovered"
  description="Chat with the AI to start building your knowledge graph."
/>

// No search results
<EmptyState
  icon={<SearchIcon />}
  title="No results found"
  description="Try adjusting your search terms or filters."
  action={{ label: "Clear Filters", onClick: clearFilters }}
/>
```

---

#### S5-T06: Integrate Skeleton into Graph View
**Files:** `src/app/dashboard/learn/page.tsx`  
**Complexity:** 🟡 Medium  
**LLM:** Sonnet ✓  
**Time:** 30 min

**Current Behavior:**
- Graph shows blank/empty while loading
- No indication that data is being fetched

**Target Behavior:**
```tsx
// src/app/dashboard/learn/page.tsx (relevant section)
import { SkeletonGraph } from "@/components/graph/SkeletonGraph";
import { EmptyState } from "@/components/ui/EmptyState";

export default function LearnPage() {
  const { data, isLoading, error } = useGraph(userId);

  if (isLoading) {
    return (
      <DashboardShell>
        <SkeletonGraph />
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <EmptyState
          icon={<AlertCircleIcon />}
          title="Failed to load knowledge graph"
          description={error.message}
          action={{ label: "Try Again", onClick: () => refetch() }}
        />
      </DashboardShell>
    );
  }

  if (!data?.nodes?.length) {
    return (
      <DashboardShell>
        <EmptyState
          icon={<NetworkIcon />}
          title="Your knowledge graph is empty"
          description="Start learning and your concepts will appear here as a visual map."
          action={{ label: "Start Chatting", onClick: () => router.push("/dashboard/chat") }}
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <ConceptGraph data={data} ... />
    </DashboardShell>
  );
}
```

**Acceptance Criteria:**
- [ ] SkeletonGraph shown while `isLoading` is true
- [ ] EmptyState shown when graph has no nodes
- [ ] Error state shown with retry action

---

#### S5-T07: Integrate Skeleton into Chat
**Files:** `src/components/chat/ChatInterface.tsx`  
**Complexity:** 🟡 Medium  
**LLM:** Sonnet ✓  
**Time:** 25 min

**Current Behavior:**
- Messages appear with no loading indicator
- History fetch has no visual feedback

**Target Behavior:**
```tsx
// Add message skeleton for history loading
function MessageSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <SkeletonAvatar size="sm" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

// In ChatInterface render
{isLoadingHistory ? (
  <div className="space-y-2">
    <MessageSkeleton />
    <MessageSkeleton />
    <MessageSkeleton />
  </div>
) : messages.length === 0 ? (
  <EmptyState
    title="Start the conversation"
    description="Ask a question or share what you'd like to learn about."
  />
) : (
  <MessageList messages={messages} />
)}
```

---

#### S5-T08: Loading State for Reflection Submit
**Files:** `src/components/reflection/ReflectionModal.tsx`  
**Complexity:** 🟢 Simple  
**LLM:** Sonnet ✓  
**Time:** 15 min

**Current Behavior:**
- Has `submitting` state but button doesn't visually change

**Target Behavior:**
```tsx
// Update Submit button in ReflectionModal
<Button
  onClick={handleSubmit}
  disabled={submitting || wordCount < minWords}
  className="min-w-[100px]"
>
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

Also add a small Spinner component:

```typescript
// src/components/ui/Spinner.tsx
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
```

---

#### S5-T09: Session History Skeleton
**Files:** `src/app/dashboard/learn/history/page.tsx` (to be created)  
**Complexity:** 🟢 Simple  
**LLM:** Sonnet ✓  
**Time:** 10 min

```tsx
// Loading state for session history page
function SessionHistoryLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md" /> {/* Search bar */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16" /> {/* Filter chip */}
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
      <SkeletonList count={5} variant="with-avatar" />
    </div>
  );
}
```

---

#### S5-T10: Stats Dashboard Skeleton
**Files:** `src/app/dashboard/settings/stats/page.tsx` (to be created)  
**Complexity:** 🟢 Simple  
**LLM:** Sonnet ✓  
**Time:** 10 min

```tsx
// Loading state for stats dashboard
function StatsLoading() {
  return (
    <div className="space-y-6">
      {/* Stat cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Chart placeholder */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Export Updates

**File:** `src/components/ui/index.ts`

Add exports for new components:
```typescript
// Existing exports...
export { Button } from './Button';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export { Input } from './Input';

// New skeleton exports
export { Skeleton, SkeletonText, SkeletonAvatar } from './Skeleton';
export { SkeletonCard } from './SkeletonCard';
export { SkeletonList } from './SkeletonList';
export { EmptyState } from './EmptyState';
export { Spinner } from './Spinner';
```

---

### TECH-02 Testing Strategy

#### Unit Tests

**File:** `src/test/components/ui/Skeleton.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import { Skeleton, SkeletonText, SkeletonAvatar } from "@/components/ui/Skeleton";

describe("Skeleton", () => {
  it("renders with pulse animation class", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("applies custom className", () => {
    const { container } = render(<Skeleton className="h-10 w-20" />);
    expect(container.firstChild).toHaveClass("h-10", "w-20");
  });
});

describe("SkeletonText", () => {
  it("renders correct number of lines", () => {
    const { container } = render(<SkeletonText lines={5} />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(5);
  });

  it("makes last line shorter", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const lines = container.querySelectorAll(".animate-pulse");
    expect(lines[2]).toHaveClass("w-3/4");
  });
});

describe("SkeletonAvatar", () => {
  it("renders different sizes", () => {
    const { rerender, container } = render(<SkeletonAvatar size="sm" />);
    expect(container.firstChild).toHaveClass("w-8", "h-8");

    rerender(<SkeletonAvatar size="lg" />);
    expect(container.firstChild).toHaveClass("w-16", "h-16");
  });

  it("is circular", () => {
    const { container } = render(<SkeletonAvatar />);
    expect(container.firstChild).toHaveClass("rounded-full");
  });
});
```

**File:** `src/test/components/ui/EmptyState.test.tsx`

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "@/components/ui/EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        title="No items"
        description="Nothing to show here"
      />
    );

    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Nothing to show here")).toBeInTheDocument();
  });

  it("renders action button and handles click", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Empty"
        action={{ label: "Add Item", onClick }}
      />
    );

    const button = screen.getByRole("button", { name: "Add Item" });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it("renders icon when provided", () => {
    render(
      <EmptyState
        title="Empty"
        icon={<svg data-testid="test-icon" />}
      />
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });
});
```

---

### TECH-02 Implementation Order

| Order | Task ID | Description | Time | Dependency |
|-------|---------|-------------|------|------------|
| 1 | S5-T01 | Base Skeleton components | 30m | None |
| 2 | S5-T05 | EmptyState component | 20m | None |
| 3 | S5-T08 | Spinner component | 10m | None |
| 4 | S5-T02 | SkeletonCard | 20m | S5-T01 |
| 5 | S5-T03 | SkeletonList | 15m | S5-T02 |
| 6 | S5-T04 | SkeletonGraph | 30m | S5-T01 |
| 7 | S5-T06 | Graph view integration | 30m | S5-T04, S5-T05 |
| 8 | S5-T07 | Chat integration | 25m | S5-T01, S5-T05 |
| 9 | S5-T08 | Reflection submit state | 15m | Spinner |
| 10 | S5-T09 | Session history skeleton | 10m | S5-T03 |
| 11 | S5-T10 | Stats skeleton | 10m | S5-T02 |

**Total Estimated Time:** ~3.5 hours

---

### TECH-02 Deliverables Checklist

- [ ] `Skeleton`, `SkeletonText`, `SkeletonAvatar` components
- [ ] `SkeletonCard` component
- [ ] `SkeletonList` component
- [ ] `SkeletonGraph` component
- [ ] `EmptyState` component
- [ ] `Spinner` component
- [ ] Graph view shows skeleton while loading
- [ ] Graph view shows empty state when no concepts
- [ ] Chat shows skeleton for message history
- [ ] Chat shows empty state for new conversation
- [ ] Reflection submit shows loading spinner
- [ ] All new components have unit tests
- [ ] All components exported from `ui/index.ts`
- [ ] Dark mode works correctly

---

## TECH-01: Error Handling & Logging

*[Section to be expanded - see sprint-planning.md for overview]*

---

## TECH-03: Mobile Responsiveness

*[Section to be expanded]*

---

## STORY-603: Edit Profile Settings

*[Section to be expanded]*

---

## STORY-701: Browse Session History

*[Section to be expanded]*

---

## STORY-602: View Learning Stats

*[Section to be expanded]*

---

## Testing Strategy

### Unit Test Coverage Targets

| Area | Target | Notes |
|------|--------|-------|
| Skeleton components | 100% | Simple, should all be covered |
| EmptyState | 100% | Simple, should all be covered |
| New API routes | 90% | Profile PATCH, Stats endpoint |
| Integration points | 80% | Loading states in views |

### E2E Tests to Add

1. **Profile editing flow** - Edit name → Save → Verify persisted
2. **Session history navigation** - View history → Filter → Resume session
3. **Mobile viewport tests** - Navigation, chat input, graph controls

---

## Definition of Done

### TECH-02 Complete When:

- [ ] All skeleton components implemented and exported
- [ ] Empty states for all list views
- [ ] Loading states for all async operations
- [ ] Unit tests for new components (>90% coverage)
- [ ] Dark mode verified for all new components
- [ ] No layout shift when transitioning from skeleton to content

### Sprint 5 Complete When:

- [ ] All P0 tasks complete (TECH-01, TECH-02, TECH-03)
- [ ] All P1 tasks complete (STORY-603, STORY-701)
- [ ] P2 tasks complete or documented as post-MVP (STORY-602)
- [ ] All tests passing
- [ ] Mobile responsive verified on iPhone SE, Pixel 5 viewports
- [ ] No critical/high severity bugs
- [ ] Documentation updated
