# LearningOS Traceability Matrix

> **Purpose:** Bidirectional linking from vision → requirements → implementation
> **Created:** Session continuation
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
| Epic | EPIC-XX | EPIC-01 |
| Story | STORY-XXX | STORY-101 |
| Screen | SCR-XXX | SCR-ONB-01 |
| Component | CMP-XXX | CMP-GOAL-CARD |
| API Endpoint | API-XXX | API-PROFILE-01 |
| Data Model | DM-XXX | DM-USER-PROFILE |

---

## Epic → Story → Screen Mapping

### EPIC-01: User Onboarding & Profile Setup

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| STORY-101 | Welcome Screen Experience | SCR-ONB-01 | - |
| STORY-102 | Create Account Flow | SCR-ONB-02 | - |
| STORY-103 | Set Learning Goal | SCR-ONB-03 | - |
| STORY-104 | First Topic Selection | SCR-ONB-04 | - |
| STORY-105 | Select Initial Concepts | SCR-ONB-05 | - |
| STORY-106 | Start First Conversation | SCR-CHAT-01 | SCR-ONB-05 |

### EPIC-02: Core Conversation Experience

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| STORY-201 | Send Learning Message | SCR-CHAT-01 | - |
| STORY-202 | View Streaming Response | SCR-CHAT-01 | - |
| STORY-203 | Tag Concepts in Chat | SCR-CHAT-01 | SCR-CONCEPT-01 |
| STORY-204 | Quick Actions During Chat | SCR-CHAT-01 | - |
| STORY-205 | View Session Summary | SCR-CHAT-02 | - |
| STORY-206 | Continue Previous Session | SCR-SESS-01 | SCR-CHAT-01 |
| STORY-207 | Branch Conversation Topic | SCR-CHAT-01 | - |

### EPIC-03: Learning Path Management

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| STORY-301 | View Recommended Path | SCR-PATH-01 | - |
| STORY-302 | Accept Path Recommendation | SCR-PATH-01 | SCR-CHAT-01 |
| STORY-303 | View Path Progress | SCR-PATH-01 | - |
| STORY-304 | Navigate Path Milestones | SCR-PATH-01 | SCR-CONCEPT-02 |
| STORY-305 | Complete Path Checkpoint | SCR-PATH-01 | SCR-REFLECT-01 |
| STORY-306 | Generate Alternative Paths | SCR-PATH-01 | - |

### EPIC-04: Concept Graph & Knowledge Mapping

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| STORY-401 | View Concept Graph | SCR-GRAPH-01 | - |
| STORY-402 | Explore Concept Details | SCR-CONCEPT-02 | SCR-GRAPH-01 |
| STORY-403 | See Concept Connections | SCR-GRAPH-01 | - |
| STORY-404 | Filter Graph by Status | SCR-GRAPH-01 | - |
| STORY-405 | Search Concepts | SCR-GRAPH-01 | SCR-CONCEPT-01 |
| STORY-406 | View Learning Journey | SCR-GRAPH-01 | - |

### EPIC-05: Reflection & Understanding Assessment

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| STORY-501 | Triggered Reflection | SCR-REFLECT-01 | SCR-CHAT-01 |
| STORY-502 | Rate Understanding | SCR-REFLECT-01 | - |
| STORY-503 | Explain Back Prompt | SCR-REFLECT-01 | - |
| STORY-504 | View Reflection History | SCR-REFLECT-02 | - |
| STORY-505 | Track Confidence vs Understanding | SCR-PROFILE-02 | SCR-REFLECT-02 |

### EPIC-06: User Dashboard & Profile

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| STORY-601 | Returning User Dashboard | SCR-DASH-01 | - |
| STORY-602 | View Learning Stats | SCR-PROFILE-02 | - |
| STORY-603 | Edit Profile Settings | SCR-PROFILE-01 | - |
| STORY-604 | Change Learning Goal | SCR-PROFILE-01 | SCR-ONB-03 |
| STORY-605 | View Learning Insights | SCR-PROFILE-02 | - |

### EPIC-07: Session Management & History

| Story ID | Story Title | Primary Screen | Secondary Screens |
|----------|-------------|----------------|-------------------|
| STORY-701 | Browse Session History | SCR-SESS-01 | - |
| STORY-702 | Search Past Sessions | SCR-SESS-01 | - |
| STORY-703 | View Session Details | SCR-SESS-02 | - |
| STORY-704 | Export Session Content | SCR-SESS-02 | - |
| STORY-705 | Delete Session | SCR-SESS-01 | - |

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

### User Story: STORY-201 "Send Learning Message"

```
Vision Layer:
  └─ Product Brief: "AI-powered conversation for any topic"
       └─ Success Metric: "Time to first meaningful insight < 5 minutes"

Requirements Layer:
  └─ EPIC-02: Core Conversation Experience
       └─ STORY-201: Send Learning Message
            ├─ AC-1: Type message in input field
            ├─ AC-2: Submit via button or Enter key
            ├─ AC-3: See message appear in chat
            └─ AC-4: Receive AI response

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

### User Story: STORY-401 "View Concept Graph"

```
Vision Layer:
  └─ Product Brief: "Visual knowledge graph showing concept mastery"
       └─ Success Metric: "Users who view graph have 40% higher retention"

Requirements Layer:
  └─ EPIC-04: Concept Graph & Knowledge Mapping
       └─ STORY-401: View Concept Graph
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

### User Story: STORY-501 "Triggered Reflection"

```
Vision Layer:
  └─ Product Brief: "Active recall to strengthen retention"
       └─ Success Metric: "Reflection completion rate > 60%"

Requirements Layer:
  └─ EPIC-05: Reflection & Understanding Assessment
       └─ STORY-501: Triggered Reflection
            ├─ AC-1: Prompt appears after concept discussion
            ├─ AC-2: Can rate confidence level
            ├─ AC-3: Can explain understanding
            └─ AC-4: Get feedback on explanation

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
| EPIC-01: Onboarding | 6 | 5 | 4 | 2 | ✅ Complete |
| EPIC-02: Conversation | 7 | 2 | 4 | 3 | ✅ Complete |
| EPIC-03: Learning Path | 6 | 1 | 5 | 1 | ✅ Complete |
| EPIC-04: Concept Graph | 6 | 2 | 5 | 2 | ✅ Complete |
| EPIC-05: Reflection | 5 | 2 | 3 | 2 | ✅ Complete |
| EPIC-06: Dashboard | 5 | 2 | 2 | 1 | ✅ Complete |
| EPIC-07: Session Mgmt | 5 | 2 | 3 | 2 | ✅ Complete |

### API Coverage Check

| API Category | Endpoints | Stories Served | Screens Served |
|--------------|-----------|----------------|----------------|
| Auth | 4 | 3 | 2 |
| Profile | 3 | 5 | 3 |
| Sessions | 5 | 8 | 4 |
| Messages | 2 | 4 | 2 |
| Paths | 5 | 6 | 1 |
| Concepts | 5 | 7 | 3 |
| Reflect | 3 | 5 | 2 |
| Export | 3 | 2 | 1 |

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
| SCR-ONB-01 | 101 | WELCOME-HERO, VALUE-PROPS, CTA-PRIMARY | - |
| SCR-ONB-02 | 102 | AUTH-TABS, EMAIL-INPUT, GOOGLE-OAUTH | AUTH-01/02/03 |
| SCR-ONB-03 | 103 | GOAL-CARD, GOAL-GRID, CUSTOM-GOAL-INPUT | PROFILE-02 |
| SCR-ONB-04 | 104 | TOPIC-SEARCH, TOPIC-CARD, SELECTED-TOPICS | CONCEPT-01, PROFILE-02 |
| SCR-ONB-05 | 105, 106 | CONCEPT-CHIP, CONFIDENCE-SLIDER, START-BUTTON | SESSION-01 |
| SCR-CHAT-01 | 201-207 | MESSAGE-LIST, MESSAGE-INPUT, SEND-BUTTON, QUICK-ACTIONS | SESSION-02, MESSAGE-01 |
| SCR-CHAT-02 | 205 | SESSION-STATS, CONCEPTS-COVERED, REFLECTION-PROMPT | SESSION-02, REFLECT-02 |
| SCR-PATH-01 | 301-306 | PATH-VISUALIZATION, MILESTONE-NODE, PATH-PROGRESS | PATH-01/03/04, SESSION-01 |
| SCR-GRAPH-01 | 401-406 | GRAPH-CANVAS, GRAPH-NODE, FILTER-PANEL, SEARCH-OVERLAY | CONCEPT-01/03 |
| SCR-CONCEPT-02 | 402 | CONCEPT-HEADER, DEFINITION-CARD, RELATED-CONCEPTS | CONCEPT-02/03/04, SESSION-01 |
| SCR-REFLECT-01 | 501-503 | RATING-SELECTOR, EXPLAIN-PROMPT, FEEDBACK-DISPLAY | REFLECT-01 |
| SCR-REFLECT-02 | 504 | HISTORY-LIST, REFLECTION-CARD, TREND-CHART | REFLECT-02/03 |
| SCR-SESS-01 | 701-702, 705 | SESSION-LIST, SEARCH-BAR, FILTER-DROPDOWN | SESSION-03 |
| SCR-SESS-02 | 703-704 | MESSAGE-TIMELINE, EXPORT-BUTTON, DELETE-BUTTON | SESSION-02, EXPORT-01, SESSION-05 |
| SCR-DASH-01 | 601 | WELCOME-BACK, CONTINUE-CARD, PROGRESS-SUMMARY | PROFILE-01, SESSION-03, PATH-01, CONCEPT-03 |
| SCR-PROFILE-01 | 603-604 | PROFILE-FORM, GOAL-SELECTOR, PREFERENCES | PROFILE-01/02, AUTH-04 |
| SCR-PROFILE-02 | 602, 605 | STATS-HEADER, CONCEPT-PROGRESS, QUADRANT-DISPLAY | PROFILE-01, CONCEPT-03 |

### By API (Find: Screens, Stories, Data)

| API | Screens Using | Stories Served | Data Models |
|-----|---------------|----------------|-------------|
| API-AUTH-01 | SCR-ONB-02 | 102 | DM-USER-PROFILE |
| API-AUTH-02 | SCR-ONB-02 | 102 | DM-USER-PROFILE |
| API-AUTH-03 | SCR-ONB-02 | 102 | DM-USER-PROFILE |
| API-AUTH-04 | SCR-PROFILE-01 | 603 | DM-USER-PROFILE |
| API-PROFILE-01 | SCR-DASH-01, SCR-PROFILE-01/02 | 601-605 | DM-USER-PROFILE |
| API-PROFILE-02 | SCR-ONB-03/04, SCR-PROFILE-01 | 103, 104, 603, 604 | DM-USER-PROFILE |
| API-SESSION-01 | SCR-ONB-05, SCR-CHAT-02, SCR-PATH-01, SCR-CONCEPT-02, SCR-SESS-02 | 106, 205, 302, 402 | DM-LEARNING-SESSION |
| API-SESSION-02 | SCR-CHAT-01/02, SCR-SESS-02 | 201-206, 703 | DM-LEARNING-SESSION, DM-MESSAGE |
| API-SESSION-03 | SCR-SESS-01, SCR-DASH-01 | 601, 701, 702 | DM-LEARNING-SESSION |
| API-MESSAGE-01 | SCR-CHAT-01 | 201, 202 | DM-MESSAGE, DM-LEARNING-SESSION |
| API-PATH-01 | SCR-PATH-01, SCR-DASH-01 | 301, 303, 601 | DM-LEARNING-PATH |
| API-CONCEPT-01 | SCR-ONB-04, SCR-GRAPH-01 | 104, 405 | DM-CONCEPT-NODE |
| API-CONCEPT-02 | SCR-CHAT-01, SCR-CONCEPT-02 | 203, 402 | DM-CONCEPT-NODE, DM-CONCEPT-RELATION |
| API-CONCEPT-03 | SCR-GRAPH-01, SCR-DASH-01, SCR-PROFILE-02 | 401, 403, 601, 602 | DM-CONCEPT-NODE, DM-CONCEPT-RELATION |
| API-REFLECT-01 | SCR-REFLECT-01 | 501, 502, 503 | DM-REFLECTION-EVENT, DM-CONCEPT-NODE |
| API-REFLECT-02 | SCR-CHAT-02, SCR-REFLECT-02 | 205, 504 | DM-REFLECTION-EVENT |
| API-EXPORT-01 | SCR-SESS-02 | 704 | DM-LEARNING-SESSION, DM-MESSAGE |

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
STORY-101 → (none)
STORY-102 → API-AUTH-01/02/03
STORY-103 → API-PROFILE-02
STORY-104 → API-CONCEPT-01, API-PROFILE-02
STORY-105 → (none, client-side)
STORY-106 → API-SESSION-01
STORY-201 → API-MESSAGE-01
STORY-202 → API-MESSAGE-01 (streaming)
STORY-203 → API-CONCEPT-02
STORY-204 → (various by action)
STORY-205 → API-SESSION-02, API-REFLECT-02
STORY-206 → API-SESSION-03, API-SESSION-01
STORY-207 → API-MESSAGE-01 (with context switch)
STORY-301 → API-PATH-01
STORY-302 → API-PATH-05, API-SESSION-01
STORY-303 → API-PATH-01
STORY-304 → API-PATH-03
STORY-305 → API-PATH-05, API-REFLECT-01
STORY-306 → API-PATH-04
STORY-401 → API-CONCEPT-03
STORY-402 → API-CONCEPT-02
STORY-403 → API-CONCEPT-03
STORY-404 → API-CONCEPT-03 (with filters)
STORY-405 → API-CONCEPT-01
STORY-406 → API-CONCEPT-03 (with timeline)
STORY-501 → API-REFLECT-01
STORY-502 → API-REFLECT-01
STORY-503 → API-REFLECT-01
STORY-504 → API-REFLECT-02
STORY-505 → API-PROFILE-01, API-REFLECT-02
STORY-601 → API-PROFILE-01, API-SESSION-03
STORY-602 → API-PROFILE-01
STORY-603 → API-PROFILE-01, API-PROFILE-02
STORY-604 → API-PROFILE-02
STORY-605 → API-PROFILE-01
STORY-701 → API-SESSION-03
STORY-702 → API-SESSION-03
STORY-703 → API-SESSION-02
STORY-704 → API-EXPORT-01
STORY-705 → API-SESSION-05
```

### API → Implementation Priority (based on story count)

| Priority | API | Story Count | Screens | Notes |
|----------|-----|-------------|---------|-------|
| P0 | API-MESSAGE-01 | 4 | 1 | Core chat functionality |
| P0 | API-SESSION-01 | 5 | 5 | Session creation |
| P0 | API-SESSION-02 | 3 | 3 | Session retrieval |
| P0 | API-AUTH-01/02/03 | 1 (each) | 1 | Authentication |
| P1 | API-CONCEPT-03 | 5 | 4 | Graph data |
| P1 | API-PROFILE-01 | 5 | 4 | Profile data |
| P1 | API-PROFILE-02 | 4 | 4 | Profile updates |
| P1 | API-REFLECT-01 | 4 | 1 | Reflection submission |
| P1 | API-PATH-01 | 3 | 2 | Path retrieval |
| P2 | API-CONCEPT-02 | 2 | 2 | Concept detail |
| P2 | API-SESSION-03 | 4 | 3 | Session history |
| P2 | API-REFLECT-02 | 3 | 2 | Reflection history |
| P3 | API-PATH-02/04/05 | 1-2 each | 1 | Path management |
| P3 | API-CONCEPT-01/04/05 | 1-2 each | 2 | Concept search/update |
| P3 | API-EXPORT-* | 1 each | 1 | Export features |

---

*This traceability matrix enables bidirectional navigation: from any requirement down to implementation, or from any component back up to the business need it serves.*
