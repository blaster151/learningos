# LearningOS Sprint Planning

> **Purpose:** Development roadmap with story sequencing, dependencies, and milestones
> **Created:** Session continuation
> **Cross-references:** epics-and-stories.md, traceability-matrix.md, technical-architecture.md

---

## Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Pre-Sprint 0: Project Setup](#pre-sprint-0-project-setup)
3. [Sprint 1: Foundation](#sprint-1-foundation)
4. [Sprint 2: Core Chat Experience](#sprint-2-core-chat-experience)
5. [Sprint 3: Learning Intelligence](#sprint-3-learning-intelligence)
6. [Sprint 4: Knowledge Visualization](#sprint-4-knowledge-visualization)
7. [Sprint 5: Polish & Launch Prep](#sprint-5-polish--launch-prep)
8. [Dependency Graph](#dependency-graph)
9. [Risk Mitigation](#risk-mitigation)
10. [Definition of Done](#definition-of-done)

---

## Sprint Overview

### Timeline

| Phase | Duration | Focus | Key Milestone |
|-------|----------|-------|---------------|
| Pre-Sprint 0 | 3 days | Project setup | Dev environment ready |
| Sprint 1 | 2 weeks | Foundation | User can sign up and onboard |
| Sprint 2 | 2 weeks | Core Chat | User can have AI conversations |
| Sprint 3 | 2 weeks | Learning Intelligence | Concepts tracked, paths generated |
| Sprint 4 | 2 weeks | Knowledge Visualization | Graph view, reflection working |
| Sprint 5 | 1 week | Polish | Production-ready MVP |

**Total: 9 weeks + 3 days**

### Story Point Capacity

Assuming a solo developer or small team (1-2 devs):
- Sprint capacity: ~20-25 story points
- Buffer: 20% for unknowns and technical debt
- Effective capacity: ~16-20 story points per sprint

### Sprint Themes

```
Sprint 1: "Can I sign up and tell you what I want to learn?"
Sprint 2: "Can I have a conversation that feels helpful?"
Sprint 3: "Does the system actually understand what I'm learning?"
Sprint 4: "Can I see my progress and reflect on it?"
Sprint 5: "Is this ready for real users?"
```

---

## Pre-Sprint 0: Project Setup

### Duration: 3 Days

### Day 1: Repository & Tooling

**Tasks:**
- [ ] Initialize Git repository
- [ ] Create Next.js project with TypeScript
- [ ] Set up Vite + React for frontend
- [ ] Configure Tailwind CSS
- [ ] Set up ESLint + Prettier
- [ ] Create folder structure per architecture doc
- [ ] Configure VS Code workspace settings

**Commands:**
```bash
npx create-next-app@latest learningos --typescript --tailwind --eslint
npm install @radix-ui/react-* framer-motion zustand
npm install -D @types/node vitest @testing-library/react
```

**Folder Structure:**
```
/src
  /app                 # Next.js App Router
    /api               # API routes
    /(routes)          # Page routes
  /components          # React components
    /ui                # Base UI components
    /features          # Feature-specific components
  /lib                 # Utilities, hooks, services
    /ai                # AI service layer
    /firebase          # Firebase config & helpers
    /hooks             # Custom React hooks
    /utils             # Utility functions
  /types               # TypeScript definitions
  /styles              # Global styles
```

### Day 2: External Services

**Tasks:**
- [ ] Create Firebase project
- [ ] Enable Firebase Authentication (Email + Google)
- [ ] Set up Firestore database
- [ ] Configure Firestore security rules (initial)
- [ ] Create OpenAI API account & key
- [ ] Set up Redis Cloud instance
- [ ] Create Vercel project
- [ ] Configure environment variables

**Environment Variables:**
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_SDK_KEY=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL_PRIMARY=gpt-4
OPENAI_MODEL_FALLBACK=gpt-3.5-turbo

# Redis
REDIS_URL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Day 3: CI/CD & Testing Foundation

**Tasks:**
- [ ] Set up GitHub Actions for CI
- [ ] Configure Vercel deployment (preview + production)
- [ ] Create test utilities and mocks
- [ ] Set up component testing with Vitest
- [ ] Create seed data scripts
- [ ] Document local development setup in README

**Definition of Done for Pre-Sprint 0:**
- [ ] `npm run dev` starts application
- [ ] Firebase connected (can write test document)
- [ ] OpenAI can make test API call
- [ ] Deploy preview works on Vercel
- [ ] Tests run with `npm test`

---

## Sprint 1: Foundation

### Duration: 2 Weeks (10 working days)

### Sprint Goal
> User can create an account, complete onboarding, and the system has their profile ready.

### Stories Included

| Story ID | Title | Points | Priority |
|----------|-------|--------|----------|
| STORY-101 | Welcome Screen Experience | 2 | P0 |
| STORY-102 | Create Account Flow | 5 | P0 |
| STORY-103 | Set Learning Goal | 3 | P0 |
| STORY-104 | First Topic Selection | 3 | P0 |
| STORY-105 | Select Initial Concepts | 3 | P0 |
| STORY-601 | Returning User Dashboard | 3 | P1 |

**Total: 19 points**

### Week 1 Breakdown

**Days 1-2: Authentication**
- Implement Firebase Auth integration
- Create login/signup UI components
- Implement API-AUTH-01, API-AUTH-02, API-AUTH-03
- Set up auth context and protected routes

**Days 3-4: Onboarding Screens**
- Create SCR-ONB-01 (Welcome)
- Create SCR-ONB-02 (Auth forms)
- Create SCR-ONB-03 (Goal selection)
- Implement goal selection logic

**Day 5: Buffer/Review**
- Code review and refactoring
- Fix issues from week 1
- Write tests for authentication

### Week 2 Breakdown

**Days 6-7: Topic & Concept Selection**
- Create SCR-ONB-04 (Topic selection)
- Create SCR-ONB-05 (Initial concepts)
- Implement API-CONCEPT-01 (search)
- Seed initial concept data

**Days 8-9: Profile & Dashboard**
- Implement API-PROFILE-01, API-PROFILE-02
- Create SCR-DASH-01 (Dashboard shell)
- Create profile data model in Firestore
- Implement returning user detection

**Day 10: Integration & Testing**
- End-to-end onboarding flow testing
- Fix integration issues
- Demo preparation

### Sprint 1 Dependencies

```
STORY-101 → STORY-102 (Welcome leads to Auth)
STORY-102 → STORY-103 (Auth enables Goal)
STORY-103 → STORY-104 (Goal enables Topic)
STORY-104 → STORY-105 (Topic enables Concepts)
STORY-102 → STORY-601 (Auth enables Dashboard)
```

### Sprint 1 Deliverables

- [ ] User can sign up with email or Google
- [ ] User can log in and be recognized
- [ ] User can select a learning goal
- [ ] User can choose topics and initial concepts
- [ ] Returning user sees dashboard (shell)
- [ ] All data persisted to Firestore

### Sprint 1 Definition of Done

- [ ] All stories completed and tested
- [ ] No critical bugs
- [ ] Code reviewed
- [ ] Deployed to preview environment
- [ ] Can demo complete onboarding flow

---

## Sprint 2: Core Chat Experience

### Duration: 2 Weeks

### Sprint Goal
> User can have a meaningful AI-powered learning conversation.

### Stories Included

| Story ID | Title | Points | Priority |
|----------|-------|--------|----------|
| STORY-106 | Start First Conversation | 3 | P0 |
| STORY-201 | Send Learning Message | 3 | P0 |
| STORY-202 | View Streaming Response | 5 | P0 |
| STORY-203 | Tag Concepts in Chat | 5 | P1 |
| STORY-204 | Quick Actions During Chat | 3 | P1 |
| STORY-205 | View Session Summary | 3 | P1 |

**Total: 22 points**

### Week 1 Breakdown

**Days 1-2: Session Infrastructure**
- Implement API-SESSION-01 (create session)
- Implement API-SESSION-02 (get session)
- Create session data model
- Build chat message storage

**Days 3-4: Chat UI**
- Create SCR-CHAT-01 components
- Implement CMP-MESSAGE-LIST
- Implement CMP-MESSAGE-INPUT
- Build message rendering (user/AI)

**Day 5: Basic AI Integration**
- Implement API-MESSAGE-01 (basic)
- Connect to OpenAI API
- Get simple request/response working

### Week 2 Breakdown

**Days 6-7: Streaming & Polish**
- Implement SSE streaming for AI responses
- Build CMP-STREAMING-INDICATOR
- Handle streaming errors gracefully
- Optimize typing experience

**Days 8-9: Concept Tagging**
- Implement concept extraction from AI responses
- Build CMP-CONCEPT-TAG component
- Implement API-CONCEPT-02 for concept details
- Create concept linking in messages

**Day 10: Session Summary & Quick Actions**
- Create SCR-CHAT-02 (Session Summary)
- Implement quick action buttons
- Build session stats calculation
- Integration testing

### Sprint 2 Dependencies

```
Sprint 1 Complete → STORY-106 (needs auth + profile)
STORY-106 → STORY-201 (session needed for messages)
STORY-201 → STORY-202 (message sending enables responses)
STORY-202 → STORY-203 (AI response enables concept tagging)
STORY-201 → STORY-204 (messages enable quick actions)
STORY-201 → STORY-205 (conversation enables summary)
```

### Sprint 2 Deliverables

- [ ] User can start a new learning session
- [ ] Messages stream in with typing effect
- [ ] Concepts are automatically tagged in AI responses
- [ ] Quick actions available during chat
- [ ] Session summary shows at conversation end
- [ ] All messages persisted

### Sprint 2 Technical Notes

**AI Prompt Structure (Initial):**
```typescript
const systemPrompt = `You are a patient, adaptive learning assistant.
The user wants to learn about: {topic}
Their goal is: {goal}
Their current understanding level is: {level}

Guidelines:
- Explain concepts clearly with examples
- Ask questions to check understanding
- Adapt to their pace
- When introducing a concept, wrap it in [concept:name]
`;
```

**Streaming Implementation:**
```typescript
// API route with SSE
export async function POST(req: Request) {
  const stream = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL_PRIMARY,
    messages: [...],
    stream: true,
  });
  
  return new Response(stream.toReadableStream());
}
```

---

## Sprint 3: Learning Intelligence

### Duration: 2 Weeks

### Sprint Goal
> System tracks concepts, generates learning paths, and starts measuring understanding.

### Stories Included

| Story ID | Title | Points | Priority |
|----------|-------|--------|----------|
| STORY-301 | View Recommended Path | 5 | P0 |
| STORY-302 | Accept Path Recommendation | 2 | P0 |
| STORY-303 | View Path Progress | 3 | P0 |
| STORY-206 | Continue Previous Session | 3 | P1 |
| STORY-207 | Branch Conversation Topic | 3 | P1 |
| STORY-304 | Navigate Path Milestones | 3 | P1 |

**Total: 19 points**

### Week 1 Breakdown

**Days 1-2: Concept Graph Infrastructure**
- Implement user concept storage
- Build concept relationship model
- Create concept update logic
- Implement API-CONCEPT-03 (get graph data)

**Days 3-4: Path Generation**
- Design path generation prompts
- Implement API-PATH-02 (generate path)
- Build milestone data model
- Create path storage in Firestore

**Day 5: Path UI**
- Create SCR-PATH-01 components
- Build CMP-PATH-VISUALIZATION
- Implement path acceptance flow

### Week 2 Breakdown

**Days 6-7: Path Progress**
- Implement API-PATH-05 (update progress)
- Build progress tracking logic
- Create milestone completion detection
- Update path UI with progress

**Days 8-9: Session Continuity**
- Implement API-SESSION-03 (list sessions)
- Build session continuation logic
- Create conversation branching
- Implement context carry-over

**Day 10: Integration**
- Connect chat to path progress
- Test path recommendation accuracy
- Performance optimization
- Integration testing

### Sprint 3 Dependencies

```
Sprint 2 Complete → STORY-206 (needs sessions)
Sprint 2 Complete → STORY-207 (needs chat)
STORY-203 → STORY-301 (concept tags enable path)
STORY-301 → STORY-302 (path view enables acceptance)
STORY-302 → STORY-303 (acceptance enables tracking)
STORY-303 → STORY-304 (progress enables navigation)
```

### Sprint 3 Deliverables

- [ ] Concept graph updates from conversations
- [ ] Learning paths generated based on goals
- [ ] Path progress tracked across sessions
- [ ] User can continue previous sessions
- [ ] User can branch to new topics
- [ ] Milestone completion tracked

### Sprint 3 Technical Notes

**Path Generation Prompt:**
```typescript
const pathPrompt = `Generate a learning path for a user who:
- Wants to learn: {goal}
- Currently knows: {knownConcepts}
- Has understanding level: {levels}

Create a path with:
- 3-5 milestones
- Each milestone has 2-4 concepts
- Prerequisites clearly defined
- Estimated time per milestone

Return as JSON: { milestones: [...] }`;
```

---

## Sprint 4: Knowledge Visualization

### Duration: 2 Weeks

### Sprint Goal
> User can visualize their knowledge graph and engage in meaningful reflection.

### Stories Included

| Story ID | Title | Points | Priority |
|----------|-------|--------|----------|
| STORY-401 | View Concept Graph | 5 | P0 |
| STORY-402 | Explore Concept Details | 3 | P0 |
| STORY-403 | See Concept Connections | 3 | P1 |
| STORY-501 | Triggered Reflection | 5 | P0 |
| STORY-502 | Rate Understanding | 2 | P0 |
| STORY-503 | Explain Back Prompt | 3 | P1 |

**Total: 21 points**

### Week 1 Breakdown

**Days 1-2: Graph Visualization**
- Choose visualization library (recommend: react-force-graph or D3)
- Create SCR-GRAPH-01 canvas
- Implement basic node rendering
- Add zoom/pan controls

**Days 3-4: Graph Interactivity**
- Implement node click → detail view
- Build CMP-NODE-DETAIL component
- Add edge rendering with labels
- Implement filter panel

**Day 5: Graph Polish**
- Color coding by mastery level
- Add graph legend
- Performance optimization (virtualization)
- Mobile responsiveness

### Week 2 Breakdown

**Days 6-7: Reflection System**
- Design reflection trigger logic
- Create SCR-REFLECT-01 modal
- Implement API-REFLECT-01
- Build confidence rating UI

**Days 8-9: Explain Back Feature**
- Implement explanation capture
- Build AI feedback on explanations
- Store reflection events
- Update concept understanding scores

**Day 10: Integration**
- Connect reflection to chat flow
- Test reflection triggers
- Ensure graph updates from reflections
- Demo preparation

### Sprint 4 Dependencies

```
Sprint 3 Complete → STORY-401 (needs concept data)
STORY-401 → STORY-402 (graph enables detail)
STORY-401 → STORY-403 (graph enables connections)
Sprint 2 Complete → STORY-501 (needs chat context)
STORY-501 → STORY-502 (reflection enables rating)
STORY-502 → STORY-503 (rating leads to explanation)
```

### Sprint 4 Deliverables

- [ ] Interactive concept graph visualization
- [ ] Click-to-explore concept details
- [ ] Relationship lines between concepts
- [ ] Reflection prompts trigger appropriately
- [ ] Confidence self-rating working
- [ ] Explain-back with AI feedback

### Sprint 4 Technical Notes

**Graph Visualization Options:**

| Library | Pros | Cons |
|---------|------|------|
| react-force-graph | Easy setup, 3D option | Limited customization |
| D3.js | Full control | Steep learning curve |
| vis-network | Feature-rich | Heavier bundle |
| Cytoscape.js | Scientific quality | Complex API |

**Recommendation:** Start with `react-force-graph-2d` for MVP, consider D3 for v2 if more customization needed.

**Reflection Trigger Logic:**
```typescript
function shouldTriggerReflection(session: Session): boolean {
  const conceptCount = session.concepts.length;
  const messageCount = session.messages.length;
  const timeSinceLastReflect = Date.now() - session.lastReflection;
  
  return (
    conceptCount >= 3 &&
    messageCount >= 10 &&
    timeSinceLastReflect > 15 * 60 * 1000 // 15 minutes
  );
}
```

---

## Sprint 5: Polish & Launch Prep

### Duration: 1 Week

### Sprint Goal
> Application is production-ready with polished UX and error handling.

### Stories Included

| Story ID | Title | Points | Priority |
|----------|-------|--------|----------|
| STORY-603 | Edit Profile Settings | 3 | P1 |
| STORY-701 | Browse Session History | 3 | P1 |
| STORY-602 | View Learning Stats | 3 | P2 |
| TECH-01 | Error handling & logging | 3 | P0 |
| TECH-02 | Loading states & skeletons | 2 | P0 |
| TECH-03 | Mobile responsiveness | 3 | P0 |

**Total: 17 points**

### Day-by-Day Breakdown

**Day 1: Error Handling**
- Implement global error boundary
- Add API error handling
- Create error toast system
- Set up error logging (consider Sentry)

**Day 2: Loading States**
- Create skeleton components
- Add loading states to all async operations
- Implement optimistic updates where appropriate
- Add empty states

**Day 3: Profile & History**
- Create SCR-PROFILE-01 (settings)
- Create SCR-SESS-01 (history)
- Implement profile update API
- Build session list with search

**Day 4: Mobile & Stats**
- Mobile responsive passes
- Create SCR-PROFILE-02 (stats)
- Build basic analytics display
- Touch interaction optimization

**Day 5: Final Polish**
- Bug fixes from testing
- Performance audit
- Accessibility audit (basic)
- Final demo preparation

### Sprint 5 Deliverables

- [ ] Graceful error handling throughout
- [ ] Loading states on all async operations
- [ ] Mobile-responsive layouts
- [ ] Profile settings editable
- [ ] Session history browsable
- [ ] Basic learning stats visible
- [ ] Production deployment ready

### Launch Checklist

**Before Go-Live:**
- [ ] All environment variables set in production
- [ ] Firebase security rules reviewed
- [ ] Rate limiting configured
- [ ] Error tracking enabled
- [ ] Analytics tracking (basic)
- [ ] Terms of service / privacy policy
- [ ] Domain configured (if custom)

---

## Dependency Graph

### Visual Representation

```
Pre-Sprint 0
     │
     ▼
Sprint 1: Foundation
┌────────────────────────────────────────────┐
│  STORY-101 → STORY-102 → STORY-103        │
│                    │           │           │
│                    ▼           ▼           │
│              STORY-601   STORY-104        │
│                              │            │
│                              ▼            │
│                         STORY-105        │
└────────────────────────────────────────────┘
                    │
                    ▼
Sprint 2: Core Chat
┌────────────────────────────────────────────┐
│  STORY-106 → STORY-201 → STORY-202        │
│                    │           │           │
│                    ▼           ▼           │
│              STORY-204   STORY-203        │
│                    │                       │
│                    ▼                       │
│              STORY-205                    │
└────────────────────────────────────────────┘
                    │
                    ▼
Sprint 3: Learning Intelligence
┌────────────────────────────────────────────┐
│  STORY-206         STORY-203              │
│       │                 │                  │
│       ▼                 ▼                  │
│  STORY-207   STORY-301 → STORY-302        │
│                              │             │
│                              ▼             │
│                         STORY-303         │
│                              │             │
│                              ▼             │
│                         STORY-304         │
└────────────────────────────────────────────┘
                    │
                    ▼
Sprint 4: Knowledge Visualization
┌────────────────────────────────────────────┐
│  STORY-401 → STORY-402                    │
│       │                                    │
│       ▼                                    │
│  STORY-403                                │
│                                            │
│  STORY-501 → STORY-502 → STORY-503        │
└────────────────────────────────────────────┘
                    │
                    ▼
Sprint 5: Polish
┌────────────────────────────────────────────┐
│  STORY-603   STORY-701   STORY-602        │
│  TECH-01     TECH-02     TECH-03          │
└────────────────────────────────────────────┘
```

### Critical Path

The critical path (longest dependency chain) is:

```
STORY-101 → STORY-102 → STORY-103 → STORY-104 → STORY-105 → 
STORY-106 → STORY-201 → STORY-202 → STORY-203 → 
STORY-301 → STORY-302 → STORY-303 → 
STORY-401 → STORY-501
```

**Risk:** Any delay in the critical path delays the entire project.

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OpenAI API latency | High | Medium | Implement streaming, show typing indicator, cache common responses |
| Firestore query limits | Medium | Low | Design efficient query patterns, use denormalization |
| Graph rendering performance | Medium | Medium | Implement virtualization, limit visible nodes |
| Authentication issues | High | Low | Use Firebase's battle-tested auth, test thoroughly |

### Schedule Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI prompt engineering takes longer | High | High | Start with simple prompts, iterate |
| Scope creep | High | Medium | Strict story acceptance criteria |
| Integration issues | Medium | Medium | Early integration testing |
| Underestimated complexity | High | Medium | 20% buffer in each sprint |

### Contingency Plans

**If Sprint 2 runs over:**
- Cut STORY-204 (Quick Actions) to Sprint 3
- Simplify concept tagging (basic only)

**If Sprint 3 runs over:**
- Simplify path generation (fixed templates)
- Cut STORY-207 (Branching) to post-MVP

**If Sprint 4 runs over:**
- Simplify graph (list view fallback)
- Cut STORY-503 (Explain Back) to post-MVP

---

## Definition of Done

### Story Level

A story is DONE when:
- [ ] All acceptance criteria met
- [ ] Code passes linting
- [ ] Unit tests written and passing
- [ ] No console errors
- [ ] Responsive on desktop and mobile
- [ ] Error states handled
- [ ] Loading states present
- [ ] Code reviewed (if team > 1)

### Sprint Level

A sprint is DONE when:
- [ ] All committed stories are DONE
- [ ] Demo conducted successfully
- [ ] No critical bugs
- [ ] Deployed to preview environment
- [ ] Documentation updated

### MVP Level

The MVP is DONE when:
- [ ] All 5 sprints complete
- [ ] End-to-end user journey works
- [ ] No blocking bugs
- [ ] Performance acceptable (< 3s load)
- [ ] Deployed to production
- [ ] Basic monitoring in place
- [ ] Launch checklist complete

---

## Appendix: Sprint Backlog Template

### Sprint [N] Planning

**Sprint Goal:** [One sentence describing the user outcome]

**Capacity:** [X] story points

**Committed Stories:**

| ID | Title | Points | Assignee | Status |
|----|-------|--------|----------|--------|
| STORY-XXX | | | | Not Started |

**Daily Standup Notes:**

| Day | Progress | Blockers | Notes |
|-----|----------|----------|-------|
| 1 | | | |
| 2 | | | |
| ... | | | |

**Sprint Review:**
- [ ] Demo completed
- [ ] Feedback captured
- [ ] Velocity calculated: [X] points delivered

**Sprint Retrospective:**
- What went well:
- What could improve:
- Action items:

---

*This sprint plan provides a structured approach to building LearningOS MVP. Adjust timing and capacity based on team size and velocity data as it becomes available.*
