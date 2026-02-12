# LearningOS Traceability Matrix

> **Purpose:** Bidirectional linking from vision → requirements → implementation
> **Created:** Session continuation
> **Updated:** February 11, 2026 — Story IDs unified to E-S format (see epics-and-stories.md)
> **Cross-references:** product-brief.md, technical-architecture.md, ux-specifications.md, api-contracts.md, epics-and-stories.md

---

## Table of Contents

1. [Overview](#overview)
2. [Epic → Story → Screen Mapping](#epic--story--screen-mapping)
3. [Screen → Component → API Mapping](#screen--component--api-mapping)
4. [API → Data Model Mapping](#api--data-model-mapping)
5. [End-to-End Traceability](#end-to-end-traceability)
6. [Gap Analysis Validation](#gap-analysis-validation)
7. [Cross-Reference Index](#cross-reference-index)

---

## Overview

### Traceability Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                         VISION LAYER                            │
│  Product Brief → Success Metrics → User Outcomes                │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      REQUIREMENTS LAYER                         │
│  Epics → User Stories → Acceptance Criteria                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                          UX LAYER                               │
│  Screens → Components → User Interactions → State Flows         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                          API LAYER                              │
│  Endpoints → Request/Response → Validation → Error Handling     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                         DATA LAYER                              │
│  Firestore Collections → Documents → Relationships              │
└─────────────────────────────────────────────────────────────────┘
```

### Traceability Identifiers

| Layer | ID Format | Example |
|-------|-----------|---------|
| Epic | E{N} | E1 |
| Story | E{N}-S{N} | E1-S1 |
| Screen | SCR-XXX | SCR-ONB-01 |
| Component | CMP-XXX | CMP-GOAL-CARD |
| API Endpoint | API-XXX | API-PROFILE-01 |
| Data Model | DM-XXX | DM-USER-PROFILE |

---

## Epic → Story → Screen Mapping

### E1: Authentication & Account + E2: Onboarding & Profile

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| E1-S1 | User Sign Up with Email | SCR-ONB-02 | - |
| E1-S2 | User Sign Up with OAuth (Google) | SCR-ONB-02 | - |
| E1-S4 | User Login | SCR-ONB-02 | - |
| E2-S1 | Welcome Screen | SCR-ONB-01 | - |
| E2-S2 | Conversational Intake | SCR-ONB-03 | - |
| E2-S3 | Learning Preferences | SCR-ONB-03 | - |
| E2-S4 | First Topic Selection | SCR-ONB-04 | - |
| E2-S5 | Profile API Integration | SCR-ONB-05 | SCR-CHAT-01 |

### E5: Chat Mode

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| E5-S1 | Chat Interface | SCR-CHAT-01 | - |
| E5-S2 | Send & Receive Messages | SCR-CHAT-01 | - |
| E5-S3 | Context-Aware Suggestions | SCR-CHAT-01 | SCR-CONCEPT-01 |
| E5-S4 | Chat Session Management | SCR-CHAT-01 | SCR-SESS-01 |
| E5-S5 | Chat from Context | SCR-CHAT-01 | SCR-CHAT-02 |

### E3: Learning Paths

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| E3-S1 | Path Generation | SCR-PATH-01 | - |
| E3-S2 | Path Content Display | SCR-PATH-01 | SCR-CHAT-01 |
| E3-S3 | Path Navigation | SCR-PATH-01 | - |
| E3-S4 | Step Checkpoints | SCR-PATH-01 | SCR-CONCEPT-02 |
| E3-S5 | Progress Persistence | SCR-PATH-01 | SCR-REFLECT-01 |
| E3-S6 | Struggle Button & Help | SCR-PATH-01 | - |
| E3-S7 | Path Completion | SCR-PATH-01 | SCR-REFLECT-01 |
| E3-S8 | Path History | SCR-PATH-01 | - |
| E3-S9 | Path Suggestions | SCR-PATH-01 | - |
| E3-S10 | Cheat Sheet Summarizer | SCR-PATH-01 | SCR-GRAPH-01 |

### E6: Concept Graph & Knowledge Mapping

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| E6-S1 | Graph Visualization | SCR-GRAPH-01 | - |
| E6-S2 | Graph Pan/Zoom | SCR-GRAPH-01 | - |
| E6-S3 | Concept Detail Panel | SCR-CONCEPT-02 | SCR-GRAPH-01 |
| E6-S4 | Graph Filtering | SCR-GRAPH-01 | - |
| E6-S5 | Graph Auto-Update | SCR-GRAPH-01 | - |
| E6-S6 | Manual Concept Addition | SCR-GRAPH-01 | - |

### E4: Reflect Mode

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| E4-S1 | Reflection Prompt Display | SCR-REFLECT-01 | - |
| E4-S2 | Reflection Submission | SCR-REFLECT-01 | - |
| E4-S3 | Reflection Analysis Display | SCR-REFLECT-01 | - |
| E4-S4 | Learner State Update | SCR-REFLECT-02 | SCR-PROFILE-02 |
| E4-S5 | Skip Reflection | SCR-REFLECT-01 | - |

### E7: Dashboard & Navigation

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| E7-S1 | Dashboard Home | SCR-DASH-01 | - |
| E7-S2 | Quadrant Display | SCR-PROFILE-02 | SCR-DASH-01 |
| E7-S3 | Header Navigation | - | All screens |
| E7-S4 | Mobile Navigation | - | All screens |
| E7-S5 | Toast Notifications | - | All screens |

### E8: Settings & Data Export

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| E8-S1 | Settings Page | SCR-PROFILE-01 | - |
| E8-S2 | Account Deletion | SCR-PROFILE-01 | - |
| E8-S3 | Data Export (GDPR) | SCR-PROFILE-01 | - |

---

## Screen → Component → API Mapping

### SCR-ONB-01: Welcome Screen

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-WELCOME-HERO | None | On mount |
| CMP-VALUE-PROPS | None | On mount |
| CMP-CTA-PRIMARY | None | On click → navigate |

### SCR-ONB-02: Authentication

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-AUTH-TABS | None | Tab switch |
| CMP-EMAIL-INPUT | None | On change |
| CMP-PASSWORD-INPUT | None | On change |
| CMP-GOOGLE-OAUTH | API-AUTH-02 | On click |
| CMP-SUBMIT-BUTTON | API-AUTH-01 / API-AUTH-03 | On submit |

### SCR-ONB-03: Goal Selection

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-GOAL-CARD | None | On select |
| CMP-GOAL-GRID | None | On mount |
| CMP-CUSTOM-GOAL-INPUT | None | On type |
| CMP-CONTINUE-BUTTON | API-PROFILE-02 | On submit |

### SCR-ONB-04: Topic Selection

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-TOPIC-SEARCH | API-CONCEPT-01 | On type (debounced) |
| CMP-TOPIC-SUGGESTION | None | On mount |
| CMP-TOPIC-CARD | None | On select |
| CMP-SELECTED-TOPICS | None | On selection change |
| CMP-CONTINUE-BUTTON | API-PROFILE-02 | On submit |

### SCR-ONB-05: Initial Concepts

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-CONCEPT-INTRO | None | On mount |
| CMP-CONCEPT-CHIP | None | On select |
| CMP-CONFIDENCE-SLIDER | None | On slide |
| CMP-START-BUTTON | API-SESSION-01 | On submit |

### SCR-CHAT-01: Main Chat Interface

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-CHAT-HEADER | API-SESSION-02 | On mount |
| CMP-MESSAGE-LIST | None | On mount, on new message |
| CMP-USER-MESSAGE | None | Render |
| CMP-AI-MESSAGE | None | Render |
| CMP-CONCEPT-TAG | API-CONCEPT-02 | On click |
| CMP-STREAMING-INDICATOR | None | During stream |
| CMP-MESSAGE-INPUT | None | On type |
| CMP-SEND-BUTTON | API-MESSAGE-01 | On submit |
| CMP-QUICK-ACTIONS | Various | On click |
| CMP-SUGGESTED-PROMPTS | None | On mount |

### SCR-CHAT-02: Session Summary

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-SUMMARY-HEADER | None | On mount |
| CMP-SESSION-STATS | API-SESSION-02 | On mount |
| CMP-CONCEPTS-COVERED | API-CONCEPT-01 | On mount |
| CMP-CONCEPT-PROGRESS | None | Render |
| CMP-REFLECTION-PROMPT | API-REFLECT-02 | On mount |
| CMP-CONTINUE-BUTTON | API-SESSION-01 | On click |

### SCR-PATH-01: Learning Path View

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-PATH-HEADER | None | On mount |
| CMP-PATH-VISUALIZATION | API-PATH-01 | On mount |
| CMP-MILESTONE-NODE | None | Render |
| CMP-MILESTONE-DETAIL | API-PATH-03 | On select |
| CMP-PATH-PROGRESS | None | Render |
| CMP-START-MILESTONE | API-SESSION-01 | On click |
| CMP-REGENERATE-PATH | API-PATH-04 | On click |

### SCR-GRAPH-01: Concept Graph

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-GRAPH-CANVAS | API-CONCEPT-03 | On mount |
| CMP-GRAPH-NODE | None | Render |
| CMP-GRAPH-EDGE | None | Render |
| CMP-GRAPH-CONTROLS | None | On interaction |
| CMP-FILTER-PANEL | None | On filter change |
| CMP-SEARCH-OVERLAY | API-CONCEPT-01 | On search |
| CMP-NODE-DETAIL | API-CONCEPT-02 | On node click |
| CMP-LEGEND | None | On mount |

### SCR-CONCEPT-02: Concept Detail

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-CONCEPT-HEADER | API-CONCEPT-02 | On mount |
| CMP-DEFINITION-CARD | None | Render |
| CMP-CONFIDENCE-RING | None | Render |
| CMP-UNDERSTANDING-BAR | None | Render |
| CMP-RELATED-CONCEPTS | API-CONCEPT-03 | On mount |
| CMP-CONVERSATION-HISTORY | API-CONCEPT-04 | On mount |
| CMP-PRACTICE-BUTTON | API-SESSION-01 | On click |

### SCR-REFLECT-01: Reflection Modal

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-REFLECT-HEADER | None | On mount |
| CMP-CONCEPT-CARD | None | Render |
| CMP-CONFIDENCE-QUESTION | None | Render |
| CMP-RATING-SELECTOR | None | On select |
| CMP-EXPLAIN-PROMPT | API-REFLECT-01 | On submit |
| CMP-FEEDBACK-DISPLAY | API-REFLECT-01 | On response |
| CMP-SUBMIT-BUTTON | API-REFLECT-01 | On submit |

### SCR-REFLECT-02: Reflection History

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-HISTORY-LIST | API-REFLECT-02 | On mount |
| CMP-REFLECTION-CARD | None | Render |
| CMP-FILTER-TABS | None | On tab change |
| CMP-TREND-CHART | None | Render |
| CMP-DETAIL-VIEW | API-REFLECT-03 | On card click |

### SCR-SESS-01: Session History

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-HISTORY-HEADER | None | On mount |
| CMP-SESSION-LIST | API-SESSION-03 | On mount |
| CMP-SESSION-CARD | None | Render |
| CMP-SEARCH-BAR | API-SESSION-03 | On search |
| CMP-FILTER-DROPDOWN | None | On filter |
| CMP-LOAD-MORE | API-SESSION-03 | On click |

### SCR-SESS-02: Session Detail

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-DETAIL-HEADER | API-SESSION-02 | On mount |
| CMP-MESSAGE-TIMELINE | None | Render |
| CMP-EXPORT-BUTTON | API-EXPORT-01 | On click |
| CMP-DELETE-BUTTON | API-SESSION-05 | On click |
| CMP-RESUME-BUTTON | API-SESSION-01 | On click |

### SCR-DASH-01: Dashboard

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-WELCOME-BACK | API-PROFILE-01 | On mount |
| CMP-CONTINUE-CARD | API-SESSION-03 | On mount |
| CMP-PROGRESS-SUMMARY | API-PROFILE-01 | On mount |
| CMP-RECENT-CONCEPTS | API-CONCEPT-03 | On mount |
| CMP-PATH-PREVIEW | API-PATH-01 | On mount |
| CMP-QUICK-START | API-SESSION-01 | On click |

### SCR-PROFILE-01: Settings

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-PROFILE-FORM | API-PROFILE-01 | On mount |
| CMP-AVATAR-UPLOAD | API-PROFILE-02 | On upload |
| CMP-GOAL-SELECTOR | API-PROFILE-02 | On change |
| CMP-PREFERENCES | API-PROFILE-02 | On change |
| CMP-SAVE-BUTTON | API-PROFILE-02 | On submit |
| CMP-SIGNOUT-BUTTON | API-AUTH-04 | On click |
| CMP-DELETE-ACCOUNT | API-PROFILE-03 | On confirm |

### SCR-PROFILE-02: Learning Stats

| Component | API Calls | Trigger |
|-----------|-----------|---------|
| CMP-STATS-HEADER | API-PROFILE-01 | On mount |
| CMP-STREAK-DISPLAY | None | Render |
| CMP-TIME-CHART | None | Render |
| CMP-CONCEPT-PROGRESS | API-CONCEPT-03 | On mount |
| CMP-QUADRANT-DISPLAY | None | Render |
| CMP-ACHIEVEMENT-LIST | None | Render |

---

## API → Data Model Mapping

### Authentication APIs

| API ID | Endpoint | Reads | Writes |
|--------|----------|-------|--------|
| API-AUTH-01 | POST /api/auth/signup | - | DM-USER-PROFILE |
| API-AUTH-02 | POST /api/auth/oauth/google | - | DM-USER-PROFILE |
| API-AUTH-03 | POST /api/auth/login | DM-USER-PROFILE | DM-USER-PROFILE (lastLoginAt) |
| API-AUTH-04 | POST /api/auth/logout | DM-USER-PROFILE | - |

### Profile APIs

| API ID | Endpoint | Reads | Writes |
|--------|----------|-------|--------|
| API-PROFILE-01 | GET /api/profile | DM-USER-PROFILE, DM-LEARNING-SESSION, DM-CONCEPT-NODE | - |
| API-PROFILE-02 | PATCH /api/profile | DM-USER-PROFILE | DM-USER-PROFILE |
| API-PROFILE-03 | DELETE /api/profile | DM-USER-PROFILE, DM-LEARNING-SESSION, DM-CONCEPT-NODE | All user data |

### Session APIs

| API ID | Endpoint | Reads | Writes |
|--------|----------|-------|--------|
| API-SESSION-01 | POST /api/sessions | DM-USER-PROFILE | DM-LEARNING-SESSION |
| API-SESSION-02 | GET /api/sessions/:id | DM-LEARNING-SESSION, DM-MESSAGE | - |
| API-SESSION-03 | GET /api/sessions | DM-LEARNING-SESSION | - |
| API-SESSION-04 | PATCH /api/sessions/:id | DM-LEARNING-SESSION | DM-LEARNING-SESSION |
| API-SESSION-05 | DELETE /api/sessions/:id | DM-LEARNING-SESSION | DM-LEARNING-SESSION, DM-MESSAGE |

### Message APIs

| API ID | Endpoint | Reads | Writes |
|--------|----------|-------|--------|
| API-MESSAGE-01 | POST /api/sessions/:id/messages | DM-LEARNING-SESSION, DM-USER-PROFILE, DM-CONCEPT-NODE | DM-MESSAGE, DM-LEARNING-SESSION |
| API-MESSAGE-02 | GET /api/sessions/:id/messages | DM-MESSAGE | - |

### Path APIs

| API ID | Endpoint | Reads | Writes |
|--------|----------|-------|--------|
| API-PATH-01 | GET /api/paths/:userId | DM-LEARNING-PATH | - |
| API-PATH-02 | POST /api/paths/generate | DM-USER-PROFILE, DM-CONCEPT-NODE | DM-LEARNING-PATH |
| API-PATH-03 | GET /api/paths/:pathId/milestones/:id | DM-LEARNING-PATH | - |
| API-PATH-04 | POST /api/paths/:pathId/regenerate | DM-USER-PROFILE, DM-CONCEPT-NODE, DM-LEARNING-PATH | DM-LEARNING-PATH |
| API-PATH-05 | PATCH /api/paths/:pathId/progress | DM-LEARNING-PATH | DM-LEARNING-PATH |

### Concept APIs

| API ID | Endpoint | Reads | Writes |
|--------|----------|-------|--------|
| API-CONCEPT-01 | GET /api/concepts/search | DM-CONCEPT-NODE | - |
| API-CONCEPT-02 | GET /api/concepts/:id | DM-CONCEPT-NODE, DM-CONCEPT-RELATION | - |
| API-CONCEPT-03 | GET /api/concepts/graph/:userId | DM-CONCEPT-NODE, DM-CONCEPT-RELATION | - |
| API-CONCEPT-04 | GET /api/concepts/:id/conversations | DM-MESSAGE, DM-LEARNING-SESSION | - |
| API-CONCEPT-05 | PATCH /api/concepts/:id | DM-CONCEPT-NODE | DM-CONCEPT-NODE |

### Reflection APIs

| API ID | Endpoint | Reads | Writes |
|--------|----------|-------|--------|
| API-REFLECT-01 | POST /api/reflect | DM-CONCEPT-NODE, DM-USER-PROFILE | DM-REFLECTION-EVENT, DM-CONCEPT-NODE |
| API-REFLECT-02 | GET /api/reflect/history/:userId | DM-REFLECTION-EVENT | - |
| API-REFLECT-03 | GET /api/reflect/:id | DM-REFLECTION-EVENT | - |

### Export APIs

| API ID | Endpoint | Reads | Writes |
|--------|----------|-------|--------|
| API-EXPORT-01 | GET /api/export/session/:id | DM-LEARNING-SESSION, DM-MESSAGE | - |
| API-EXPORT-02 | GET /api/export/graph/:userId | DM-CONCEPT-NODE, DM-CONCEPT-RELATION | - |
| API-EXPORT-03 | GET /api/export/all/:userId | All user data | - |

---

## End-to-End Traceability

### User Story: E5-S2 "Send & Receive Messages"

```
Vision Layer:
  └─ Product Brief: "AI-powered conversation for any topic"
       └─ Success Metric: "Time to first meaningful insight < 5 minutes"

Requirements Layer:
  └─ E5: Chat Mode
       └─ E5-S2: Send & Receive Messages
            ├─ AC-1: Type message and press Enter or click Send
            ├─ AC-2: Message appears in chat
            ├─ AC-3: AI response streams in word by word
            └─ AC-4: Code blocks are syntax highlighted

UX Layer:
  └─ SCR-CHAT-01: Main Chat Interface
       ├─ CMP-MESSAGE-INPUT (captures text)
       ├─ CMP-SEND-BUTTON (triggers submit)
       ├─ CMP-MESSAGE-LIST (displays messages)
       ├─ CMP-USER-MESSAGE (renders user text)
       └─ CMP-AI-MESSAGE (renders AI response)

API Layer:
  └─ API-MESSAGE-01: POST /api/sessions/:id/messages
       ├─ Request: { content, conceptIds? }
       ├─ Response: Stream<AIResponse>
       └─ WebSocket: WS-MESSAGE-STREAM

Data Layer:
  └─ DM-MESSAGE (stored in Firestore)
       ├─ Collection: users/{userId}/sessions/{sessionId}/messages
       ├─ Fields: content, role, timestamp, conceptIds, metadata
       └─ Updates: session.lastActivity, session.messageCount
```

### User Story: E6-S1 "Graph Visualization"

```
Vision Layer:
  └─ Product Brief: "Visual knowledge graph showing concept mastery"
       └─ Success Metric: "Users who view graph have 40% higher retention"

Requirements Layer:
  └─ E6: Concept Graph
       └─ E6-S1: Graph Visualization
            ├─ AC-1: See visual network of learned concepts
            ├─ AC-2: Concepts colored by mastery level
            ├─ AC-3: Lines show relationships
            └─ AC-4: Click to see concept details

UX Layer:
  └─ SCR-GRAPH-01: Concept Graph
       ├─ CMP-GRAPH-CANVAS (renders D3/Canvas graph)
       ├─ CMP-GRAPH-NODE (individual concept)
       ├─ CMP-GRAPH-EDGE (relationship line)
       ├─ CMP-GRAPH-CONTROLS (zoom/pan)
       └─ CMP-LEGEND (color meanings)

API Layer:
  └─ API-CONCEPT-03: GET /api/concepts/graph/:userId
       ├─ Request: { userId, filters? }
       └─ Response: { nodes[], edges[], stats }

Data Layer:
  ├─ DM-CONCEPT-NODE
  │    ├─ Collection: concepts (global), users/{userId}/userConcepts
  │    └─ Fields: name, definition, domain, confidence, understanding
  └─ DM-CONCEPT-RELATION
       ├─ Collection: users/{userId}/conceptRelations
       └─ Fields: sourceId, targetId, relationType, strength
```

### User Story: E4-S1 "Reflection Prompt Display"

```
Vision Layer:
  └─ Product Brief: "Active recall to strengthen retention"
       └─ Success Metric: "Reflection completion rate > 60%"

Requirements Layer:
  └─ E4: Reflect Mode
       └─ E4-S1: Reflection Prompt Display
            ├─ AC-1: Prompt appears after completing a path
            ├─ AC-2: Asks learner to explain in own words
            ├─ AC-3: Shows hints for concepts to cover
            └─ AC-4: Word count guidance visible

UX Layer:
  └─ SCR-REFLECT-01: Reflection Modal
       ├─ CMP-REFLECT-HEADER (context display)
       ├─ CMP-CONCEPT-CARD (what to reflect on)
       ├─ CMP-CONFIDENCE-QUESTION (self-rate)
       ├─ CMP-RATING-SELECTOR (1-5 scale)
       ├─ CMP-EXPLAIN-PROMPT (explain back)
       └─ CMP-FEEDBACK-DISPLAY (AI feedback)

API Layer:
  └─ API-REFLECT-01: POST /api/reflect
       ├─ Request: { conceptId, confidenceRating, explanation?, sessionContext }
       ├─ Response: { feedback, assessedUnderstanding, gap? }
       └─ Triggers: Concept score update, quadrant recalculation

Data Layer:
  ├─ DM-REFLECTION-EVENT
  │    ├─ Collection: users/{userId}/reflections
  │    └─ Fields: conceptId, confidence, explanation, feedback, assessedUnderstanding
  └─ DM-CONCEPT-NODE (updated)
       └─ Updates: confidence, understanding, lastReflected
```

---

## Gap Analysis Validation

### Requirements Coverage Check

| Epic | Stories | Screens | APIs | Data Models | Status |
|------|---------|---------|------|-------------|--------|
| E1: Authentication | 6 | 1 | 4 | 1 | ✅ Complete |
| E2: Onboarding | 7 | 4 | 2 | 1 | ✅ Complete |
| E3: Learning Paths | 10 | 1 | 5 | 1 | ✅ Complete |
| E4: Reflect Mode | 5 | 2 | 3 | 2 | ✅ Complete |
| E5: Chat Mode | 5 | 2 | 4 | 3 | ✅ Complete |
| E6: Concept Graph | 6 | 2 | 5 | 2 | ✅ Complete |
| E7: Dashboard & Nav | 5 | 2 | 2 | 1 | ✅ Complete |
| E8: Settings & Export | 4 | 1 | 3 | 1 | ✅ Complete |

### API Coverage Check

| API Category | Endpoints | Stories Served | Screens Served |
|--------------|-----------|----------------|----------------|
| Auth | 4 | E1-S1/S2/S4 | 1 |
| Profile | 3 | E2-S3/S5/S7, E7-S1/S2, E8-S1 | 3 |
| Sessions | 5 | E5-S1/S2/S4, E7-S1 | 4 |
| Messages | 2 | E5-S2/S3 | 2 |
| Paths | 5 | E3-S1/S2/S3/S5/S7 | 1 |
| Concepts | 5 | E6-S1/S3/S4/S5, E2-S4 | 3 |
| Reflect | 3 | E4-S1/S2/S3/S4 | 2 |
| Export | 3 | E8-S3 | 1 |

### Data Model Coverage Check

| Data Model | APIs Using | Create | Read | Update | Delete |
|------------|------------|--------|------|--------|--------|
| DM-USER-PROFILE | 10 | AUTH-01/02 | PROFILE-01 | AUTH-03, PROFILE-02 | PROFILE-03 |
| DM-LEARNING-SESSION | 8 | SESSION-01 | SESSION-02/03 | SESSION-04, MSG-01 | SESSION-05 |
| DM-MESSAGE | 4 | MESSAGE-01 | MESSAGE-02, CONCEPT-04 | - | SESSION-05 |
| DM-CONCEPT-NODE | 9 | (seeded) | CONCEPT-01/02/03 | CONCEPT-05, REFLECT-01 | - |
| DM-CONCEPT-RELATION | 3 | (auto) | CONCEPT-02/03 | (auto) | - |
| DM-LEARNING-PATH | 6 | PATH-02 | PATH-01/03 | PATH-04/05 | - |
| DM-REFLECTION-EVENT | 3 | REFLECT-01 | REFLECT-02/03 | - | - |

---

## Cross-Reference Index

### By Screen (Find: Stories, Components, APIs)

| Screen | Stories | Key Components | APIs |
|--------|---------|----------------|------|
| SCR-ONB-01 | E2-S1 | WELCOME-HERO, VALUE-PROPS, CTA-PRIMARY | - |
| SCR-ONB-02 | E1-S1, E1-S2, E1-S4 | AUTH-TABS, EMAIL-INPUT, GOOGLE-OAUTH | AUTH-01/02/03 |
| SCR-ONB-03 | E2-S2, E2-S3 | GOAL-CARD, GOAL-GRID, CUSTOM-GOAL-INPUT | PROFILE-02 |
| SCR-ONB-04 | E2-S4 | TOPIC-SEARCH, TOPIC-CARD, SELECTED-TOPICS | CONCEPT-01, PROFILE-02 |
| SCR-ONB-05 | E2-S5 | CONCEPT-CHIP, CONFIDENCE-SLIDER, START-BUTTON | SESSION-01 |
| SCR-CHAT-01 | E5-S1/S2/S3/S4/S5 | MESSAGE-LIST, MESSAGE-INPUT, SEND-BUTTON, QUICK-ACTIONS | SESSION-02, MESSAGE-01 |
| SCR-CHAT-02 | E5-S5 | SESSION-STATS, CONCEPTS-COVERED, REFLECTION-PROMPT | SESSION-02, REFLECT-02 |
| SCR-PATH-01 | E3-S1/S2/S3/S4/S5/S6/S7 | PATH-VISUALIZATION, MILESTONE-NODE, PATH-PROGRESS | PATH-01/03/04, SESSION-01 |
| SCR-GRAPH-01 | E6-S1/S2/S4/S5/S6 | GRAPH-CANVAS, GRAPH-NODE, FILTER-PANEL, SEARCH-OVERLAY | CONCEPT-01/03 |
| SCR-CONCEPT-02 | E6-S3 | CONCEPT-HEADER, DEFINITION-CARD, RELATED-CONCEPTS | CONCEPT-02/03/04, SESSION-01 |
| SCR-REFLECT-01 | E4-S1/S2/S3/S5 | RATING-SELECTOR, EXPLAIN-PROMPT, FEEDBACK-DISPLAY | REFLECT-01 |
| SCR-REFLECT-02 | E4-S4 | HISTORY-LIST, REFLECTION-CARD, TREND-CHART | REFLECT-02/03 |
| SCR-SESS-01 | E5-S4 | SESSION-LIST, SEARCH-BAR, FILTER-DROPDOWN | SESSION-03 |
| SCR-SESS-02 | E5-S4 | MESSAGE-TIMELINE, EXPORT-BUTTON, DELETE-BUTTON | SESSION-02, EXPORT-01, SESSION-05 |
| SCR-DASH-01 | E7-S1 | WELCOME-BACK, CONTINUE-CARD, PROGRESS-SUMMARY | PROFILE-01, SESSION-03, PATH-01, CONCEPT-03 |
| SCR-PROFILE-01 | E8-S1/S2, E2-S7 | PROFILE-FORM, GOAL-SELECTOR, PREFERENCES | PROFILE-01/02, AUTH-04 |
| SCR-PROFILE-02 | E7-S2 | STATS-HEADER, CONCEPT-PROGRESS, QUADRANT-DISPLAY | PROFILE-01, CONCEPT-03 |

### By API (Find: Screens, Stories, Data)

| API | Screens Using | Stories Served | Data Models |
|-----|---------------|----------------|-------------|
| API-AUTH-01 | SCR-ONB-02 | E1-S1 | DM-USER-PROFILE |
| API-AUTH-02 | SCR-ONB-02 | E1-S2 | DM-USER-PROFILE |
| API-AUTH-03 | SCR-ONB-02 | E1-S4 | DM-USER-PROFILE |
| API-AUTH-04 | SCR-PROFILE-01 | E8-S1 | DM-USER-PROFILE |
| API-PROFILE-01 | SCR-DASH-01, SCR-PROFILE-01/02 | E7-S1, E7-S2, E2-S7, E8-S1 | DM-USER-PROFILE |
| API-PROFILE-02 | SCR-ONB-03/04, SCR-PROFILE-01 | E2-S2, E2-S3, E2-S4, E2-S7 | DM-USER-PROFILE |
| API-SESSION-01 | SCR-ONB-05, SCR-CHAT-02, SCR-PATH-01, SCR-CONCEPT-02, SCR-SESS-02 | E2-S5, E5-S1, E3-S2 | DM-LEARNING-SESSION |
| API-SESSION-02 | SCR-CHAT-01/02, SCR-SESS-02 | E5-S1/S2/S4 | DM-LEARNING-SESSION, DM-MESSAGE |
| API-SESSION-03 | SCR-SESS-01, SCR-DASH-01 | E7-S1, E5-S4 | DM-LEARNING-SESSION |
| API-MESSAGE-01 | SCR-CHAT-01 | E5-S2 | DM-MESSAGE, DM-LEARNING-SESSION |
| API-PATH-01 | SCR-PATH-01, SCR-DASH-01 | E3-S1, E3-S3, E7-S1 | DM-LEARNING-PATH |
| API-CONCEPT-01 | SCR-ONB-04, SCR-GRAPH-01 | E2-S4, E6-S4 | DM-CONCEPT-NODE |
| API-CONCEPT-02 | SCR-CHAT-01, SCR-CONCEPT-02 | E5-S3, E6-S3 | DM-CONCEPT-NODE, DM-CONCEPT-RELATION |
| API-CONCEPT-03 | SCR-GRAPH-01, SCR-DASH-01, SCR-PROFILE-02 | E6-S1, E6-S5, E7-S1, E7-S2 | DM-CONCEPT-NODE, DM-CONCEPT-RELATION |
| API-REFLECT-01 | SCR-REFLECT-01 | E4-S1, E4-S2, E4-S3 | DM-REFLECTION-EVENT, DM-CONCEPT-NODE |
| API-REFLECT-02 | SCR-CHAT-02, SCR-REFLECT-02 | E4-S4, E5-S5 | DM-REFLECTION-EVENT |
| API-EXPORT-01 | SCR-SESS-02 | E8-S3 | DM-LEARNING-SESSION, DM-MESSAGE |

### By Data Model (Find: APIs, Screens affected)

| Data Model | CRUD APIs | Screens Affected |
|------------|-----------|------------------|
| DM-USER-PROFILE | AUTH-01/02/03/04, PROFILE-01/02/03 | SCR-ONB-02/03/04, SCR-PROFILE-01/02, SCR-DASH-01 |
| DM-LEARNING-SESSION | SESSION-01/02/03/04/05, MESSAGE-01 | SCR-CHAT-01/02, SCR-SESS-01/02, SCR-DASH-01 |
| DM-MESSAGE | MESSAGE-01/02, EXPORT-01 | SCR-CHAT-01/02, SCR-SESS-02 |
| DM-CONCEPT-NODE | CONCEPT-01/02/03/04/05, REFLECT-01 | SCR-ONB-04/05, SCR-CHAT-01, SCR-GRAPH-01, SCR-CONCEPT-02 |
| DM-CONCEPT-RELATION | CONCEPT-02/03 | SCR-GRAPH-01, SCR-CONCEPT-02 |
| DM-LEARNING-PATH | PATH-01/02/03/04/05 | SCR-PATH-01, SCR-DASH-01 |
| DM-REFLECTION-EVENT | REFLECT-01/02/03 | SCR-REFLECT-01/02, SCR-CHAT-02 |

---

## Appendix: Quick Lookup Tables

### Story → Required APIs

```
E1-S1  → API-AUTH-01
E1-S2  → API-AUTH-02
E1-S4  → API-AUTH-03
E2-S1  → (none)
E2-S2  → API-PROFILE-02
E2-S3  → API-PROFILE-02
E2-S4  → API-CONCEPT-01, API-PROFILE-02
E2-S5  → (none, client-side)
E3-S1  → API-PATH-02
E3-S2  → API-PATH-01, API-SESSION-01
E3-S3  → API-PATH-01
E3-S4  → API-PATH-03
E3-S5  → API-PATH-05
E3-S6  → API-PATH-04
E3-S7  → API-PATH-05, API-REFLECT-01
E3-S8  → API-PATH-01
E3-S9  → API-PATH-01
E3-S10 → API-PATH-01 (cheat sheet generation, internal)
E4-S1  → API-REFLECT-01
E4-S2  → API-REFLECT-01
E4-S3  → API-REFLECT-01
E4-S4  → API-PROFILE-01, API-REFLECT-02
E4-S5  → API-REFLECT-01 (with skip flag)
E5-S1  → API-SESSION-01, API-SESSION-02
E5-S2  → API-MESSAGE-01 (streaming)
E5-S3  → API-CONCEPT-02
E5-S4  → API-SESSION-03, API-SESSION-01
E5-S5  → API-MESSAGE-01 (with context)
E6-S1  → API-CONCEPT-03
E6-S2  → (client-side)
E6-S3  → API-CONCEPT-02
E6-S4  → API-CONCEPT-03 (with filters)
E6-S5  → API-CONCEPT-03
E6-S6  → API-CONCEPT-05
E7-S1  → API-PROFILE-01, API-SESSION-03
E7-S2  → API-PROFILE-01
E7-S3  → (client-side routing)
E7-S4  → (client-side)
E7-S5  → (client-side)
E8-S1  → API-PROFILE-01, API-PROFILE-02
E8-S2  → API-PROFILE-03
E8-S3  → API-EXPORT-03
```

### API → Implementation Priority (based on story count)

| Priority | API | Story Count | Screens | Notes |
|----------|-----|-------------|---------|-------|
| P0 | API-MESSAGE-01 | 2 | 1 | Core chat functionality |
| P0 | API-SESSION-01 | 4 | 5 | Session creation |
| P0 | API-SESSION-02 | 3 | 3 | Session retrieval |
| P0 | API-AUTH-01/02/03 | 1 (each) | 1 | Authentication |
| P1 | API-CONCEPT-03 | 4 | 4 | Graph data |
| P1 | API-PROFILE-01 | 4 | 4 | Profile data |
| P1 | API-PROFILE-02 | 4 | 4 | Profile updates |
| P1 | API-REFLECT-01 | 3 | 1 | Reflection submission |
| P1 | API-PATH-01 | 4 | 2 | Path retrieval |
| P2 | API-CONCEPT-02 | 2 | 2 | Concept detail |
| P2 | API-SESSION-03 | 3 | 3 | Session history |
| P2 | API-REFLECT-02 | 2 | 2 | Reflection history |
| P3 | API-PATH-02/04/05 | 1-2 each | 1 | Path management |
| P3 | API-CONCEPT-01/04/05 | 1-2 each | 2 | Concept search/update |
| P3 | API-EXPORT-* | 1 each | 1 | Export features |

---

*This traceability matrix enables bidirectional navigation: from any requirement down to implementation, or from any component back up to the business need it serves.*
