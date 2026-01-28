# Architectural Dependencies: How Future Features Affect MVP Design

**Project:** LearningOS  
**Date:** January 27, 2026  
**Purpose:** Identify which deferred features require architectural groundwork in MVP

---

## The Problem

You can't build abstraction scaffolding in MVP. But if you design the MVP *without considering* how scaffolding will work, you might:
- Store data in a way that makes scaffolding impossible later
- Create APIs that can't support pattern detection
- Build a concept graph that lacks the structure scaffolding needs

**This document identifies: Which deferred features need MVP architecture to support them, even if we don't build the feature yet.**

---

## Analysis Framework

For each deferred feature, ask:
1. **Does it need specific data structures?** → Design schema now, populate later
2. **Does it need specific APIs?** → Create extensible endpoints now
3. **Does it change core flows?** → Leave hooks/extension points
4. **Can it be truly bolted on later?** → Safe to ignore in MVP

---

## Feature-by-Feature Analysis

### 1. Abstraction Scaffolding 🔴 HIGH IMPACT

**What It Is:**
System detects "you learned X in domain A, and Y in domain B is the same pattern" and surfaces connections.

**Architectural Dependencies:**

#### **Data Model Impact:**
```typescript
// CURRENT MVP Design (from architecture doc):
interface Concept {
  id: string
  name: string
  definition: string
  relatedConcepts: string[]  // ← Too simple
}

// NEEDED for scaffolding:
interface Concept {
  id: string
  name: string
  definition: string
  domain: string              // ← NEW: What domain was this learned in?
  abstractPattern?: string    // ← NEW: What pattern does this exemplify?
  exampleContext: string      // ← NEW: The concrete example used
  relatedConcepts: ConceptRelation[]  // ← Changed from string[]
}

interface ConceptRelation {
  targetConceptId: string
  relationType: "prerequisite" | "related" | "abstraction" | "example"  // ← NEW types
  strength: number
  discoveredBy: "system" | "user"
}
```

**Why This Matters:**
- If MVP stores concepts without `domain` field, we can't later ask "show me all monads across different domains"
- If relations are just string arrays, we can't distinguish "prerequisite" from "abstraction"
- Retrofitting this means migrating all user data

**MVP Action Required:**
✅ Add fields to schema NOW (even if unused)
✅ Design concept graph to support multiple relation types
✅ Store domain context with every concept
❌ Don't build the scaffolding detection algorithm yet

---

### 2. Teacher Personas (Gödel/Escher/Bach) 🟡 MEDIUM IMPACT

**What It Is:**
User picks a teaching "voice" that colors all content.

**Architectural Dependencies:**

#### **Profile Schema:**
```typescript
// CURRENT:
interface UserProfile {
  name: string
  tonePreference: string
  // ...
}

// NEEDED:
interface UserProfile {
  name: string
  tonePreference: string
  selectedPersona?: "godel" | "escher" | "bach" | "ada" | "turing"  // ← NEW
  unlockedPersonas: string[]  // ← NEW: Track which are available
  // ...
}
```

#### **Prompt System:**
```typescript
// CURRENT: Monolithic prompt generation
function generatePrompt(context) {
  return `${BASE_PROMPT}\n${context}`
}

// NEEDED: Composable prompt system
function generatePrompt(context, profile) {
  const layers = [
    BASE_PROMPT,
    getToneModifier(profile.tonePreference),
    getPersonaModifier(profile.selectedPersona),  // ← NEW: Plugin architecture
    context
  ]
  return layers.join('\n')
}
```

**Why This Matters:**
- If prompts are hardcoded strings, adding personas means rewriting everything
- If profile schema doesn't have persona field, we can't A/B test or roll out gradually

**MVP Action Required:**
✅ Make prompt system composable (layer-based, not monolithic)
✅ Add persona field to profile (default: null)
✅ Design prompt generation to accept optional persona modifier
❌ Don't create the 3 personas yet

---

### 3. "My Book" Export 🟢 LOW IMPACT

**What It Is:**
Generate PDF/markdown of learning journey.

**Architectural Dependencies:**

**Good News:** This is truly bolt-on. As long as MVP stores:
- User's reflections
- Concept definitions
- Learning timeline
- Graph structure

...then export can be built later with zero schema changes.

**MVP Action Required:**
✅ Ensure all reflection text is stored (don't just store scores)
✅ Store timestamps on everything
❌ No export logic needed in MVP

---

### 4. Dynamic Glossary 🟡 MEDIUM IMPACT

**What It Is:**
Track evolution of user's understanding over time. Show "what this used to mean" vs "what it means now."

**Architectural Dependencies:**

#### **Data Model:**
```typescript
// CURRENT (implied):
interface Concept {
  definition: string  // ← Only current definition
}

// NEEDED:
interface Concept {
  currentDefinition: string
  definitionHistory: Definition[]  // ← NEW: Track changes over time
}

interface Definition {
  text: string
  extractedFrom: "reflection" | "path" | "chat"
  timestamp: Date
  confidenceAtTime: number
}
```

**Why This Matters:**
- If we only store current definition, we can't show evolution
- Reflections might contain definitions, but we need to extract and tag them

**MVP Action Required:**
✅ Store definition history array (even if only 1 entry in MVP)
✅ Tag where each definition came from
✅ Keep all reflection text (don't overwrite)
❌ Don't build the glossary UI yet

---

### 5. Emergent Abstractions (Community Insights) 🔴 HIGH IMPACT

**What It Is:**
User discovers novel connection. System recognizes it, celebrates it, optionally shares with community.

**Architectural Dependencies:**

#### **Data Model:**
```typescript
// NEW structures needed:
interface EmergentAbstraction {
  id: string
  userId: string
  connectionType: "novel" | "discovered" | "community"
  fromConcept: string
  toConcept: string
  insight: string  // User's explanation
  discoveredAt: Date
  quality: number  // LLM-rated or community-rated
  sharedToCommunity: boolean
}

interface ConceptRelation {
  // ... existing fields ...
  isEmergent: boolean  // ← NEW: Mark user-discovered connections
  discoveryInsight?: string
}
```

**Why This Matters:**
- If concept graph doesn't distinguish "taught" vs "discovered" connections, we can't celebrate discoveries
- If we don't store the insight text, we lose the "aha moment"
- Community features need anonymization strategy from day 1

**MVP Action Required:**
✅ Add `isEmergent` flag to concept relations
✅ Store user's insight text when they make novel connections
✅ Design graph to support "user-added" vs "system-added" edges
❌ Don't build community sharing yet
❌ Don't build discovery detection algorithm yet

---

### 6. Interactive Code Playgrounds 🟢 LOW IMPACT

**What It Is:**
Embed runnable code editors, tests, koans.

**Architectural Dependencies:**

**Good News:** Content is content. As long as path steps can have different `contentType`, this is bolt-on.

```typescript
// CURRENT (MVP):
interface PathStep {
  content: string
  contentType: "text" | "code"
}

// PHASE 2:
interface PathStep {
  content: string
  contentType: "text" | "code" | "interactive_code"  // ← Just add type
  interactiveConfig?: {
    language: string
    starterCode: string
    tests: Test[]
  }
}
```

**MVP Action Required:**
✅ Make contentType extensible (not hardcoded if/else)
❌ No playground logic needed

---

### 7. Multilingual Support 🟡 MEDIUM IMPACT

**What It Is:**
Full translations, bilingual side-by-side mode.

**Architectural Dependencies:**

#### **Profile Schema:**
```typescript
interface UserProfile {
  language: string  // ← NEW: ISO code (en, es, fr, ja)
  bilingualMode?: boolean
  secondLanguage?: string
}
```

#### **Prompt System:**
```typescript
// All prompts need language parameter
function generatePath(topic, profile) {
  const prompt = `
IMPORTANT: Respond entirely in ${getLanguageName(profile.language)}.

${pathPrompt}
`
}
```

**Why This Matters:**
- If prompts hardcode "Explain this concept:", we can't translate
- If profile doesn't have language field, we assume English forever

**MVP Action Required:**
✅ Add language field to profile (default: 'en')
✅ Inject language instruction into all prompts
✅ Use i18n for UI strings (even if only English exists)
❌ Don't translate content yet

---

### 8. Diagram Generation 🟡 MEDIUM IMPACT

**What It Is:**
Auto-generate Mermaid diagrams for concepts.

**Architectural Dependencies:**

#### **Content Types:**
```typescript
interface PathStep {
  content: string
  contentType: "text" | "code" | "diagram"  // ← NEW type
  diagramCode?: string  // Mermaid syntax
}
```

#### **UI Rendering:**
```typescript
// Need renderer that handles multiple types
function renderPathStep(step) {
  switch(step.contentType) {
    case "text": return <Markdown>{step.content}</Markdown>
    case "code": return <CodeBlock>{step.content}</CodeBlock>
    case "diagram": return <MermaidRenderer>{step.diagramCode}</MermaidRenderer>  // ← NEW
  }
}
```

**Why This Matters:**
- If UI only handles text/code, adding diagrams means refactoring render logic
- If content model doesn't support diagram type, we'd need schema migration

**MVP Action Required:**
✅ Design content rendering to be type-extensible
✅ Add diagram contentType to schema (unused in MVP)
❌ Don't generate diagrams yet

---

### 9. Meta-Goal Adaptation 🟢 LOW IMPACT

**What It Is:**
Adjust content based on user's goal (curiosity vs mastery vs job prep).

**Architectural Dependencies:**

```typescript
interface UserProfile {
  metaGoal: "curiosity" | "mastery" | "application" | "exam" | "teaching"  // ← NEW
}

// Prompt generation just needs to read this
function generatePrompt(context, profile) {
  const goalModifier = getGoalModifier(profile.metaGoal)
  // ...
}
```

**MVP Action Required:**
✅ Add metaGoal to profile
✅ Capture during intake
❌ Don't adjust content based on goal yet (just store it)

---

### 10. Gamification / Achievements 🟢 LOW IMPACT

**What It Is:**
Badges, milestones, celebrations.

**Architectural Dependencies:**

```typescript
interface UserAchievement {
  achievementId: string
  earnedAt: Date
}

interface UserProfile {
  achievements: UserAchievement[]  // ← NEW
  gamificationEnabled: boolean  // ← Let users opt out
}
```

**MVP Action Required:**
✅ Add achievements array to profile
❌ Don't build achievement system yet

---

## Summary: What MVP Must Support

### 🔴 CRITICAL - Build Groundwork Now

| Feature | MVP Architectural Need | Why Critical |
|---------|----------------------|--------------|
| **Abstraction Scaffolding** | • Add `domain`, `abstractPattern`, `exampleContext` to Concept<br>• Design ConceptRelation with `relationType`<br>• Store multi-type edges in graph | Without domain context, can't detect cross-domain patterns later. Retrofitting = data migration hell. |
| **Emergent Abstractions** | • Add `isEmergent` flag to relations<br>• Store user insight text<br>• Distinguish system vs user edges | Can't celebrate discoveries if we don't track them. Core to "you discovered something!" magic. |

### 🟡 IMPORTANT - Design for Extensibility

| Feature | MVP Architectural Need | Why Important |
|---------|----------------------|---------------|
| **Teacher Personas** | • Composable prompt system (layers, not monoliths)<br>• Add `selectedPersona` to profile | Hardcoded prompts = rewrite everything for personas. Layered = just add modifier. |
| **Dynamic Glossary** | • Store definition history array<br>• Tag definition source<br>• Keep all reflection text | Current-only storage = can't show evolution. Small schema change prevents this. |
| **Multilingual** | • Add `language` to profile<br>• Inject language into prompts<br>• Use i18n library for UI | Hardcoded English strings = massive refactor later. i18n from day 1 = trivial to add languages. |
| **Diagrams** | • Extensible content types<br>• Pluggable renderer | If UI assumes "text or code", adding diagram = component refactor. |

### 🟢 SAFE TO DEFER - Truly Bolt-On

| Feature | Why Safe |
|---------|----------|
| **"My Book" Export** | Just reads existing data. No schema changes needed. |
| **Code Playgrounds** | Content type system supports it. |
| **Gamification** | Separate system, doesn't affect core data. |
| **Meta-Goal Adaptation** | Store field, use later. Doesn't change architecture. |

---

## Recommended MVP Data Model Changes

### Update Concept Schema:
```typescript
interface Concept {
  id: string
  name: string
  definition: string
  definitionHistory: Definition[]  // ← ADD for glossary
  domain: string                    // ← ADD for scaffolding
  abstractPattern?: string          // ← ADD for scaffolding
  exampleContext: string            // ← ADD for scaffolding
  relatedConcepts: ConceptRelation[] // ← CHANGE from string[]
  learnedAt: Date
  lastRevisited: Date
}

interface Definition {
  text: string
  source: "reflection" | "path" | "chat" | "user_edit"
  timestamp: Date
  confidenceAtTime: number
}

interface ConceptRelation {
  targetConceptId: string
  relationType: "prerequisite" | "related" | "abstraction" | "example"  // ← ADD
  isEmergent: boolean               // ← ADD for user discoveries
  discoveryInsight?: string         // ← ADD to capture "aha"
  strength: number
  discoveredBy: "system" | "user"
}
```

### Update UserProfile Schema:
```typescript
interface UserProfile {
  // ... existing fields ...
  
  // For personas (Phase 2)
  selectedPersona?: "godel" | "escher" | "bach" | null
  unlockedPersonas: string[]
  
  // For multilingual (Phase 2)
  language: string  // ISO code
  bilingualMode?: boolean
  secondLanguage?: string
  
  // For meta-goal adaptation (Phase 2)
  metaGoal: "curiosity" | "mastery" | "application" | "exam" | "teaching"
  
  // For gamification (Phase 2)
  achievements: UserAchievement[]
  gamificationEnabled: boolean
}
```

### Update Prompt Generation Architecture:
```typescript
// CURRENT (monolithic):
function generatePrompt(context) {
  return `${BASE_PROMPT}\n${context}`
}

// NEW (composable):
interface PromptLayer {
  priority: number
  content: string
}

function generatePrompt(
  context: string, 
  profile: UserProfile
): string {
  const layers: PromptLayer[] = [
    { priority: 0, content: BASE_SYSTEM_PROMPT },
    { priority: 1, content: getLanguageModifier(profile.language) },
    { priority: 2, content: getToneModifier(profile.tonePreference) },
    { priority: 3, content: getPersonaModifier(profile.selectedPersona) },  // Phase 2
    { priority: 4, content: getGoalModifier(profile.metaGoal) },  // Phase 2
    { priority: 10, content: context }
  ]
  
  return layers
    .sort((a, b) => a.priority - b.priority)
    .map(l => l.content)
    .join('\n\n')
}
```

---

## Implementation Strategy

### Week 1-2 (MVP Foundation):
1. Update Firestore schemas with new fields
2. Implement composable prompt system
3. Add language/persona/metaGoal to profile (capture but don't use)
4. Store domain context with every concept
5. Design ConceptRelation with multiple types

### Week 3-8 (MVP Features):
Build core features using extended schemas (even though some fields unused)

### Phase 2 (Post-MVP):
Now features like scaffolding and personas "just work" because groundwork exists

---

**Key Insight:**

> "Data models are load-bearing walls. UI components are drywall. You can change drywall anytime. Changing load-bearing walls requires gutting the house."

**Build the right data structures now. Build the features later.**

---

**Document Status:** Complete Architectural Dependency Analysis  
**Next Action:** Update technical-architecture.md with schema changes  
**Owner:** Blast  
**Last Updated:** January 27, 2026
