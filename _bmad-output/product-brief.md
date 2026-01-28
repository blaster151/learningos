# LearningOS Product Brief

**Date:** January 25, 2026  
**Project:** LearningOS  
**Author:** Blast  
**Status:** Initial Product Definition

---

## Executive Summary

**LearningOS is a radically personal learning companion that builds unique learning paths through conversation, curiosity, and context.** Instead of pre-written courses, it listens to who you are—what you know, how you think, what metaphors resonate—and constructs your learning journey in real-time. It reflects understanding in your own words, helps you teach yourself, and grows a concept map uniquely yours.

**Core Value Proposition:** A learning system that learns *you* as you learn, transforming from generic educational content to a personalized teaching partner that adapts to your mental models, metaphors, and pace.

---

## Problem Statement

### Current Pain Points

1. **One-Size-Fits-All Education**
   - Traditional courses deliver identical content to everyone
   - Ignores individual learning styles, existing knowledge, and mental models
   - Forces learners to adapt to content, not content to learners

2. **Context-Free Learning**
   - Generic examples that don't connect to learner's experience
   - No memory of what works for individual learners
   - Each session starts from zero—no continuity

3. **Passive Consumption**
   - Learners watch/read without active engagement
   - No validation of actual understanding
   - Missing the crucial "teach it back" step that solidifies learning

4. **Disconnected Concepts**
   - Topics taught in isolation
   - Learners don't see patterns across domains
   - Miss opportunities to scaffold understanding through familiar analogies

### Who This Affects

**Primary Users:**
- Self-directed learners exploring technical topics (type theory, functional programming, advanced CS concepts)
- Frontend/backend developers expanding into adjacent domains
- Career changers learning complex new fields
- Curious minds who learn best through conversation and metaphor

**User Profile: "Grace"**
- React developer, mid-senior level
- Wants to understand deeper patterns (monads, type theory, category theory)
- Already has foundation but needs bridges from known→unknown
- Prefers conversational, metaphor-driven learning
- Feels "behind" when peers reference advanced concepts

---

## Solution Overview

### What We're Building

**LearningOS** = Conversational Learning Engine + Personal Knowledge Graph + Adaptive Teaching System

**Core Mechanics:**

1. **Personalized Intake**
   - Discovers learner's existing knowledge, metaphor preferences, tone style
   - Builds initial profile through conversation, not forms
   - Identifies "known unknowns" and meta-learning goals

2. **Dynamic Micro-Paths**
   - Generates modular learning sequences tailored to individual
   - Uses learner's own metaphors and examples
   - Adjusts complexity and pacing based on feedback

3. **Reflect Mode** 🔁
   - Prompts learner to "teach it back"
   - Exposes fuzzy understanding
   - Validates conceptual models in real-time
   - "Now you teach me."

4. **Abstraction Scaffolding**
   - Surfaces repeatable patterns across topics
   - Uses learner's previous examples to explain new concepts
   - Example: "Redux reducers and `fold` are both monoids"

5. **Personal Concept Graph**
   - Visual map of learner's knowledge
   - Shows connections they've made
   - Grows organically with their understanding

6. **Adaptive Memory System**
   - Remembers metaphors that work for each learner
   - Stores learning history across sessions
   - Injects relevant context into future interactions

---

## Key Features

### MVP (Phase 1) Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Learner Profile Builder** | Conversational onboarding that extracts knowledge, tone preference, metaphor style | P0 |
| **Micro-Path Generator** | Creates personalized learning sequences for single topic | P0 |
| **Reflect Mode** | "Teach it back" checkpoints with feedback | P0 |
| **Basic Concept Graph** | Simple visualization of learned concepts and connections | P0 |
| **Tone Modulation** | Adjusts communication style (playful, formal, Socratic) | P1 |
| **Cheat Sheet Generator** | Exports summaries in learner's own words | P1 |

### Post-MVP Features

| Feature | Description | Phase |
|---------|-------------|-------|
| **Multi-Domain Paths** | Learning sequences spanning multiple fields | Phase 2 |
| **Mentor Personas** | Choose guide voice (Gödel, Escher, Bach, Ada, Turing) | Phase 2 |
| **Emergent Abstraction Tracker** | System detects patterns learner discovers | Phase 2 |
| **"My Book" Export** | Full learning journey as searchable wiki | Phase 2 |
| **Community Insights** | Anonymized pattern sharing across learners | Phase 3 |
| **Spaced Repetition** | Intelligent review scheduling | Phase 3 |
| **Visual Simulations** | Domain-specific interactive tools | Phase 3 |

---

## User Experience Flow

### Core Learning Loop

```
1. INTAKE
   ↓
   Learner shares: background, goals, how they think
   ↓
   System builds: profile, metaphor map, initial path

2. PATH DELIVERY
   ↓
   Micro-path presented with personalized metaphors
   ↓
   Conversational explanation using learner's examples

3. REFLECTION
   ↓
   "Now you teach me" prompt
   ↓
   Learner explains in their own words

4. FEEDBACK & ADJUSTMENT
   ↓
   System validates understanding
   ↓
   Offers corrections or next paths
   ↓
   Updates concept graph

5. EVOLUTION
   ↓
   Memory persists across sessions
   ↓
   Future paths use established metaphors
   ↓
   Concept graph grows
```

### Example: Grace's Journey

**Goal:** "I want to understand what types really are"

**Intake Detects:**
- React developer, senior level
- Fluent in: `useReducer`, Redux, Promise chains
- Metaphor style: code-based, practical analogies
- Tone: conversational, confident but curious

**First Micro-Path:**
> "From useReducer to Monoids: How State Updates Compose"

**Content Highlights:**
- React reducer as binary operation
- Initial state = identity
- Associativity of action chaining
- "Your reducer is already a monoid"

**Reflect Mode Prompt:**
> "Explain how your app's state management satisfies the monoid laws. Teach me like I'm your junior dev."

**Grace's Response:**
> "My reducer combines state and action, and if I apply dispatch in order, it doesn't matter how I group them... oh."

✅ **Lightbulb Moment**

**Next Path Options:**
- "Fold vs Reduce: Aggregating Patterns"
- "Side Effects and Sequencing: Promises as Monads?"
- "Why Types Are Guarantees, Not Just Constraints"

---

## Success Metrics

### MVP Success Criteria

**We know MVP is successful when:**

1. ✅ 80%+ of learners complete at least 3 micro-paths in first session
2. ✅ Learners can articulate concept in Reflect Mode with 70%+ accuracy
3. ✅ 60%+ return for second session within 7 days
4. ✅ Average session length: 20-30 minutes (engagement sweet spot)
5. ✅ Learners report "aha moments" in qualitative feedback
6. ✅ System generates paths that feel personal (measured via survey)

### Key Performance Indicators

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Completion Rate** | >75% finish micro-paths they start | Per-session tracking |
| **Reflect Mode Quality** | >70% demonstrate understanding | AI-scored responses |
| **Retention** | >60% return within 1 week | User analytics |
| **Session Length** | 20-30 min average | Time tracking |
| **Personalization Score** | >4/5 "felt personalized" | Post-session survey |
| **Concept Connection Rate** | >3 new connections per session | Graph analytics |

---

## Technical Architecture

### High-Level Components

```
┌─────────────────────────────────────────┐
│         Frontend (React + Tailwind)      │
├─────────────────────────────────────────┤
│  • Conversation UI                       │
│  • Concept Graph Visualization           │
│  • Profile Management                    │
│  • Reflect Mode Interface                │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Backend Services                 │
├─────────────────────────────────────────┤
│  • Profile Engine                        │
│  • Micro-Path Generator                  │
│  • Reflect Engine                        │
│  • Concept Graph Builder                 │
│  • Memory/Context Manager                │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         AI Layer (LLM Integration)       │
├─────────────────────────────────────────┤
│  • GPT-4 for core learning paths         │
│  • GPT-3.5/Mistral for summarization     │
│  • Prompt templates & routing            │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Data Layer (Firebase/DB)         │
├─────────────────────────────────────────┤
│  • User profiles & preferences           │
│  • Learning history & graphs             │
│  • Session memory & context              │
└─────────────────────────────────────────┘
```

### Tech Stack (MVP)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React + Vite + Tailwind | Fast, modern, component-based |
| **Backend** | Next.js API Routes (optional) or Node/Express | Flexible, can add SSR later |
| **Database** | Firebase | Quick setup, real-time, auth included |
| **AI** | OpenAI GPT-4 + GPT-3.5 | Best-in-class language understanding |
| **Visualizations** | Mermaid.js / D3.js | Concept graph rendering |
| **Type Safety** | TypeScript | Formalized shared language |

### AI Cost Management Strategy

**Hybrid Approach:**

| Task | Model | Cost |
|------|-------|------|
| Personalized lesson generation | GPT-4 | High |
| Summarization & cheat sheets | GPT-3.5 / Mistral | Low |
| Concept graph updates | Local logic + embeddings | Minimal |
| Quick clarifications | GPT-3.5 | Low |

**Cost Control:**
- Cache generated micro-paths for common topics
- Store learner metaphors for reuse
- Smart prompt compression
- Rate limiting per tier

---

## Business Model

### Monetization Strategy

#### Pricing Tiers

| Tier | Price | Access | Target User |
|------|-------|--------|-------------|
| **Free** | $0 | • Limited GPT-4 sessions/week<br>• 1-2 active micro-paths<br>• Basic Reflect Mode<br>• No deep memory | Curious explorers, trying it out |
| **Supporter** | $5/mo | • 3-5x chat volume<br>• Expanded micro-paths<br>• Priority caching<br>• Custom tone settings | Casual learners going deeper |
| **Pro** | $15-20/mo | • Full access to all flows<br>• Persistent profiles & memory<br>• Summary exports<br>• "My Book" feature | Serious learners on a journey |
| **Patron** | $30+/mo | • Everything in Pro<br>• Support community access<br>• Influence roadmap<br>• Gift access to others | Supporters & advocates |

### Revenue Projections (Illustrative)

**Year 1 Conservative Targets:**
- 1,000 free users
- 100 Supporter ($5) = $500/mo
- 50 Pro ($20) = $1,000/mo
- 10 Patron ($30) = $300/mo
- **Total: $1,800/mo = $21,600/year**

### Alternative: BYOK (Bring Your Own Key)

**For MVP/Beta:**
- User provides OpenAI API key
- Zero platform cost
- Higher friction but dev-friendly
- Good for alpha testing

---

## Risk Assessment & Mitigation

### Major Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **High API Costs** | High | Medium | Hybrid model strategy, caching, rate limits |
| **User Doesn't See Difference from ChatGPT** | High | Medium | Emphasize personalization, memory, Reflect Mode; strong onboarding |
| **Overuse/Abuse** | Medium | Medium | Friendly rate limiting, token caps per tier |
| **Loss of Context Between Sessions** | Medium | Low | Local memory storage, context injection, session summaries |
| **Content Quality Variance** | Medium | Medium | Prompt engineering, quality scoring, user feedback loop |
| **Complex Onboarding** | Medium | High | Conversational intake, progressive profiling, skip options |

### Technical Risks

| Risk | Mitigation |
|------|------------|
| LLM hallucinations | Validate outputs, allow user corrections, show confidence |
| Latency in responses | Stream responses, show thinking states, cache common paths |
| Memory/context limitations | Smart summarization, context window management |
| Personalization not working | A/B test prompt strategies, collect feedback early |

---

## Go-to-Market Strategy

### Phase 1: Alpha (Month 1-2)

**Target:** 20-50 early adopters
- Hand-pick curious developers from network
- BYOK model (users provide API keys)
- Heavy qualitative feedback
- Focus: Validate core loop works

### Phase 2: Beta (Month 3-4)

**Target:** 200-500 beta users
- Freemium launch (shared key, rate-limited)
- Dev community outreach (Reddit, HN, Twitter)
- Blog content: "How Reflect Mode works," "Building a personal learning OS"
- Focus: Prove personalization value

### Phase 3: Public Launch (Month 5-6)

**Target:** 1,000+ users, first paid tiers
- Full pricing tiers active
- Content marketing (technical deep-dives)
- Case studies from beta users
- Focus: Revenue validation

### Content Marketing Themes

**Blog/DevLog Topics:**
1. "Why your brain needs a learning OS, not another course"
2. "From Redux to Monoids: A developer's journey"
3. "Building Reflect Mode: Teaching back as a learning unlock"
4. "How we make AI remember your metaphors"
5. "The concept graph: Watching your understanding grow"

### Community Building

- **Discord/Forum:** Beta testers share journeys
- **Open roadmap:** Users vote on features
- **Learner stories:** Showcase transformative moments
- **No paywalls on knowledge:** Core philosophy

---

## Competitive Landscape

### Direct Competitors

| Product | Strengths | Weaknesses | Our Advantage |
|---------|-----------|------------|---------------|
| **ChatGPT** | General purpose, powerful | No memory, no personalization, no structure | Persistent memory, learning-specific, Reflect Mode |
| **Khan Academy** | Structured, video-based | One-size-fits-all, passive | Conversational, adaptive, active recall |
| **Brilliant.org** | Interactive, visual | Pre-built paths, limited personalization | Generated paths, metaphor-driven |
| **Anki** | Spaced repetition | Manual card creation, no teaching | Automated, context-aware, conversational |

### Unique Value Propositions

1. **Learns Your Language:** Remembers your metaphors and builds on them
2. **Active Learning:** Reflect Mode forces teaching back
3. **Personal Graph:** Visual representation of *your* understanding
4. **Conversational:** Feels like a tutor, not a textbook
5. **Scale-Adaptive:** Adjusts to tiny questions or major explorations

---

## Development Roadmap

### MVP Sprint Plan (8-10 weeks)

#### Sprint 1-2: Foundation (Weeks 1-4)
- [ ] Project setup (React, Vite, Tailwind, Firebase)
- [ ] Basic UI shell and navigation
- [ ] OpenAI integration layer
- [ ] User authentication (Firebase Auth)
- [ ] Profile data model

#### Sprint 3-4: Core Loop (Weeks 5-8)
- [ ] Conversational intake flow
- [ ] Learner profile builder
- [ ] Micro-path generator (single topic)
- [ ] Reflect Mode interface
- [ ] Feedback collection
- [ ] Basic concept graph storage

#### Sprint 5: Polish & Testing (Weeks 9-10)
- [ ] Concept graph visualization
- [ ] Cheat sheet export
- [ ] Tone modulation
- [ ] Error handling & edge cases
- [ ] Alpha user testing
- [ ] Documentation

### Post-MVP Roadmap

**Q2 2026:**
- Multi-domain paths
- Mentor personas (Gödel, Escher, Bach)
- Enhanced memory system
- Beta launch

**Q3 2026:**
- "My Book" export feature
- Community insights
- Advanced visualizations
- Public launch

**Q4 2026:**
- Spaced repetition
- Mobile app
- API for integrations
- Enterprise features

---

## Open Questions & Decisions Needed

### Technical Decisions

1. **BYOK vs Shared Key for MVP?**
   - BYOK = lower cost, higher friction
   - Shared = better UX, requires cost management
   - **Recommendation:** Start BYOK for alpha, shared for beta

2. **Next.js vs Separate Backend?**
   - Next.js = simpler architecture, one codebase
   - Separate = more flexibility, easier to scale
   - **Recommendation:** Next.js for speed

3. **Concept Graph Storage Format?**
   - Graph database (Neo4j) vs Document DB (Firebase)
   - **Recommendation:** Start with Firebase (simpler), migrate if needed

### Product Decisions

1. **How much memory is too much?**
   - Store everything vs summarized context?
   - **Need:** User research on privacy comfort

2. **Default tone: formal or casual?**
   - Could alienate some users either way
   - **Recommendation:** Ask during intake, show examples

3. **Pricing: Free tier limits?**
   - How restricted without hurting experience?
   - **Need:** Cost modeling based on usage patterns

4. **Mentor personas: MVP or Phase 2?**
   - High value but requires extra prompt engineering
   - **Recommendation:** Phase 2, tease in MVP

---

## Success Definition

### What "Success" Looks Like

**3 Months:**
- ✅ 50 active alpha users
- ✅ 70%+ complete full learning session
- ✅ Qualitative feedback: "This is different"
- ✅ Core loop proven with metrics

**6 Months:**
- ✅ 500+ beta users
- ✅ 60%+ week-1 retention
- ✅ First paid subscribers ($1k+ MRR)
- ✅ Concept proven, scaling starts

**12 Months:**
- ✅ 5,000+ users
- ✅ $10k+ MRR
- ✅ Clear product-market fit signal
- ✅ Expanding feature set based on learnings

### Definition of "Done" for MVP

**We're ready to launch MVP when:**

1. ✅ User can complete intake → micro-path → reflect cycle
2. ✅ System remembers metaphors across sessions
3. ✅ Concept graph generates and updates correctly
4. ✅ Cheat sheets export in learner's language
5. ✅ 5 internal testers complete 3+ sessions each
6. ✅ No critical bugs in core flow
7. ✅ Basic analytics tracking in place

---

## Appendix

### Glossary of Terms

- **Micro-Path:** Short, focused learning sequence tailored to individual
- **Macro-Target:** Larger conceptual goal (e.g., "understand type theory")
- **Reflect Mode:** Teaching-back checkpoint to validate understanding
- **Abstraction Scaffolding:** Surfacing patterns across different topics
- **Concept Graph:** Visual map of learner's knowledge and connections
- **Learner Voice:** Unique tone, metaphor style, communication preference
- **Emergent Abstraction:** Patterns learner discovers, tracked by system

### Key Personas

**Grace** (Primary)
- Frontend developer, React expert
- Wants to level up conceptual understanding
- Learns through code metaphors
- Confident but curious

**Future Personas:**
- Career changer (non-technical → technical)
- Student (supplementing formal education)
- Hobbyist (pure curiosity-driven)

### Reference Documents

- [LearningOS Initial Brainstorming.md](../LearningOS Initial Brainstorming.md)

---

## Next Steps

### Immediate Actions

1. **Validate Problem:** 5-10 user interviews with target persona
2. **Technical Spike:** Prototype micro-path generator with OpenAI
3. **Create Wireframes:** Core screens (intake, path, reflect, graph)
4. **Cost Modeling:** Estimate API costs per user session
5. **Set Up Dev Environment:** Repo, project structure, CI/CD

### Week 1 Priorities

- [ ] User interviews with 3-5 developers
- [ ] Technical prototype: basic intake → path generation
- [ ] Sketch core UI flows
- [ ] Calculate cost per session
- [ ] Create project repository

### Open for Discussion

- Pricing strategy validation
- MVP feature prioritization
- Marketing approach
- Technical architecture decisions

---

**Document Metadata**
- Version: 1.0
- Last Updated: January 25, 2026
- Owner: Blast
- Status: Draft for Review
- Next Review: After user interviews
