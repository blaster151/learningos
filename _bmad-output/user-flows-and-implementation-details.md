# LearningOS: User Flows & Implementation Details

**Project:** LearningOS  
**Version:** 1.0  
**Date:** January 25, 2026  
**Author:** Blast  
**Purpose:** Define EXACTLY how users interact with the system and how each interaction is implemented

---

## Document Purpose

This document bridges the gap between "what we're building" (Product Brief) and "how it's structured" (Technical Architecture) by specifying:

1. **Step-by-step user flows** - What the user experiences, screen by screen
2. **Behind-the-scenes mechanics** - What happens in the system at each step
3. **Edge case handling** - What happens when things go wrong
4. **Implementation specifics** - The "hows" that make it real

**Key Principle:** Every user action should have a clear system response. Every system component should serve a visible user need.

---

## Table of Contents

1. [Core User Flows](#core-user-flows)
2. [Implementation Deep-Dives](#implementation-deep-dives)
3. [Edge Cases & Error Handling](#edge-cases--error-handling)
4. [Open Questions & Decisions](#open-questions--decisions)

---

## Core User Flows

### Flow 1: First-Time User Onboarding

**User Goal:** Get started and have first learning experience

**Duration:** 8-12 minutes

#### Step-by-Step Experience

```
┌─────────────────────────────────────────────────────────────────┐
│ SCREEN 1: Landing / Sign Up                                     │
└─────────────────────────────────────────────────────────────────┘

USER SEES:
  • Headline: "A learning companion that learns you"
  • Subtext: "No courses. No lectures. Just conversation and curiosity."
  • Button: "Start Learning" (primary CTA)
  • Option: "Sign in" (secondary)

USER ACTION: Clicks "Start Learning"

SYSTEM:
  → Checks auth state
  → If not authenticated:
      → Shows signup modal (email/password or Google OAuth)
      → Creates Firebase Auth account
      → Generates userId
      → Creates empty profile document in Firestore
  → Redirects to /onboarding


┌─────────────────────────────────────────────────────────────────┐
│ SCREEN 2: Conversational Intake (Part 1)                        │
└─────────────────────────────────────────────────────────────────┘

USER SEES:
  • Chat-style interface
  • System message (animated in):
      "Hi! I'm here to learn how you learn. 
       What brings you here today? What are you curious about?"
  • Text input field (focused, ready to type)
  • Subtle hint: "Be as specific or vague as you like"

USER ACTION: Types response
  Example: "I build React apps but want to understand type theory"

USER: Presses Enter

SYSTEM (Behind the scenes):
  1. Store message in session/messages collection
  2. Build initial context (first message, no prior profile)
  3. Call LLM with INTAKE_CLARIFYING_PROMPT
     
     Prompt structure:
     ---
     SYSTEM: You are a warm, curious learning coach. Your goal is to 
     understand what this person knows, how they think, and what they 
     want to learn. Ask 1-2 follow-up questions that help you understand:
     - Their existing knowledge/experience
     - How they prefer to learn (code examples? diagrams? analogies?)
     - What success looks like to them
     
     Keep it conversational. Don't interrogate. Show genuine curiosity.
     
     USER MESSAGE: {user_message}
     
     RESPOND: With 1-2 warm questions that dig a little deeper.
     ---

  4. Stream response token by token to UI
  5. Store assistant response in session/messages

SYSTEM SHOWS:
  • Typing indicator (while generating)
  • Response streams in, word by word:
      "Nice! Type theory is a deep rabbit hole—in a good way. 
       
       Quick question: when you say 'understand type theory,' what 
       would that look like? Like, if someone asked you to explain 
       what a type *really is*, what would you want to say?
       
       Also—do you learn better through code examples, visual diagrams, 
       or real-world analogies?"

USER ACTION: Responds again
  "I want to be able to explain it to my team without hand-waving. 
   I'm a code-first person usually."

SYSTEM:
  → Repeat conversational loop
  → After 2-3 exchanges, assistant says:
      "Got it. I think I have a sense of where you're at. Let me 
       build a learning path just for you. One sec..."
  
  → Calls PROFILE_PARSER prompt with full conversation:
     ---
     SYSTEM: Extract structured profile from this conversation.
     
     CONVERSATION:
     {all_messages_json}
     
     OUTPUT FORMAT: JSON
     {
       "domains": ["React", "JavaScript", "Redux"],
       "confidence": { "React": 0.9, "type theory": 0.2 },
       "metaphor_bias": ["code-based"],
       "tone_preference": "conversational",
       "learning_style": "code examples",
       "known_unknowns": ["type theory", "monads"],
       "meta_goals": ["explain type theory clearly"]
     }
     ---

  → Parses JSON response
  → Validates schema
  → Stores in /profiles/{userId}
  → Transitions to first path generation


┌─────────────────────────────────────────────────────────────────┐
│ SCREEN 3: First Micro-Path Generated                            │
└─────────────────────────────────────────────────────────────────┘

SYSTEM (Behind the scenes):
  1. Takes profile + user's stated goal
  2. Calls PATH_GENERATOR prompt:
     ---
     SYSTEM: You are creating a personalized learning micro-path.
     
     LEARNER PROFILE:
     - Known concepts: {domains}
     - Preferred style: {learning_style}
     - Metaphors that work: {metaphor_bias}
     
     TOPIC: Type theory fundamentals
     
     TASK: Create a 5-7 minute learning experience that:
     1. Connects type theory to React/JavaScript (their known domain)
     2. Uses code examples primarily
     3. Ends with a "teach it back" prompt
     
     OUTPUT: JSON with structure:
     {
       "title": "...",
       "steps": [
         { "content": "...", "type": "text" },
         { "content": "...", "type": "code" }
       ],
       "reflect_prompt": "..."
     }
     ---

  3. Receives generated path
  4. Stores in session as currentPath
  5. Renders in UI

USER SEES:
  • Smooth transition animation
  • Path title appears: "Types as Contracts: What React Props Already Taught You"
  • Subtitle: "5 minutes • Connects to: React, JavaScript"
  • Button: "Let's go" (primary)
  • Button: "Pick something else" (secondary, subtle)

USER ACTION: Clicks "Let's go"

SYSTEM:
  → Transitions to path content view


┌─────────────────────────────────────────────────────────────────┐
│ SCREEN 4: Learning Path Content                                 │
└─────────────────────────────────────────────────────────────────┘

USER SEES:
  • Progress indicator: "Step 1 of 4"
  • Content panel (main area):
      ---
      ## Types as Contracts
      
      You already use types every day in React. When you define 
      props like this:
      
      ```tsx
      interface ButtonProps {
        label: string;
        onClick: () => void;
      }
      ```
      
      You're making a *promise*. "If you give me a string and a 
      function, I'll render a button." That's a type.
      
      A type is just a contract. It says: "Here's what I expect. 
      Here's what you'll get back."
      ---
  
  • Button: "Next" (bottom right)
  • Progress: "1 of 4"

USER ACTION: Clicks "Next"

SYSTEM:
  → Tracks progress (step 1 → step 2)
  → Renders next step content
  → Repeat for all steps

After Step 4:
  → Transitions to Reflect Mode


┌─────────────────────────────────────────────────────────────────┐
│ SCREEN 5: Reflect Mode                                          │
└─────────────────────────────────────────────────────────────────┘

SYSTEM:
  • Changes visual tone (slightly different background, warm color)
  • Shows icon/animation suggesting "your turn"

USER SEES:
  • Header: "Now you teach me"
  • Reflect prompt (from generated path):
      "Imagine your teammate asks: 'What's a type, really? Not just 
       the syntax—what does it *do*?'
       
       Explain it in your own words, using an example from your code 
       if you want."
  
  • Large text area (focused, inviting)
  • Hint: "No wrong answers. Just think out loud."
  • Button: "I'm done" (primary)
  • Link: "Skip for now" (subtle, discouraged but allowed)

USER ACTION: Types explanation
  "A type is like... a contract or a promise. Like when I define 
   ButtonProps, I'm saying 'if you pass these things, I guarantee 
   this component works.' It's a way to make expectations explicit."

USER: Clicks "I'm done"

SYSTEM (Behind the scenes):
  1. Store reflection text in session
  2. Call REFLECT_ANALYZER prompt:
     ---
     SYSTEM: You are analyzing a learner's explanation for understanding.
     
     ORIGINAL TOPIC: Types as Contracts
     KEY CONCEPTS WE COVERED:
     - Types are promises/contracts
     - They specify inputs and outputs
     - They make expectations explicit
     
     LEARNER'S EXPLANATION:
     {reflection_text}
     
     TASK: Analyze their understanding:
     1. Score 0.0-1.0 (how well did they grasp it?)
     2. What did they get right?
     3. What did they miss or misunderstand?
     4. Encouraging feedback (1-2 sentences)
     
     OUTPUT: JSON
     {
       "score": 0.85,
       "strengths": ["understood contract metaphor", "connected to props"],
       "gaps": ["didn't mention runtime vs compile-time"],
       "feedback": "You nailed the core idea—types as contracts..."
     }
     ---

  3. Parse analysis
  4. Update concept graph:
     - Add node: "types as contracts"
     - Add edge: "React props" → "types" (analogy)
     - Set confidence: 0.85
  5. Store in /sessions/{sessionId}/reflections
  6. Render feedback

USER SEES:
  • Transition to feedback screen
  • Animated check mark or sparkle
  • Feedback message:
      "You nailed the core idea—types as contracts. That's exactly 
       the foundation. The ButtonProps example is perfect.
       
       One thing to explore next: the difference between types that 
       check at build-time vs runtime. But you're already thinking 
       like a type theorist!"
  
  • Score visualization (maybe subtle, not gamified)
  • Button: "What's next?" (primary)
  • Link: "See my concept map" (secondary)

USER ACTION: Clicks "What's next?"


┌─────────────────────────────────────────────────────────────────┐
│ SCREEN 6: Next Path Options                                     │
└─────────────────────────────────────────────────────────────────┘

SYSTEM (Behind the scenes):
  → Generates 3 follow-up path suggestions based on:
     - What they just learned
     - Gaps identified in reflection
     - Their profile preferences
  
  → Could be pre-generated or AI-generated:
     ---
     SYSTEM: Suggest 3 next learning paths.
     
     PROFILE: {profile}
     JUST COMPLETED: Types as Contracts
     REFLECTION SCORE: 0.85
     GAPS IDENTIFIED: runtime vs compile-time
     
     SUGGEST: 3 titles with 1-sentence descriptions
     ---

USER SEES:
  • Header: "Where to next?"
  • 3 cards (hover effects):
  
      ┌─────────────────────────────────────────┐
      │ ⚡ Runtime vs Compile-Time Types        │
      │ When do types actually run?             │
      │ 6 minutes                               │
      └─────────────────────────────────────────┘
      
      ┌─────────────────────────────────────────┐
      │ 🔗 Generics: Types with Placeholders    │
      │ How Array<T> works in TypeScript        │
      │ 7 minutes                               │
      └─────────────────────────────────────────┘
      
      ┌─────────────────────────────────────────┐
      │ 🧩 Type Inference: Smart Contracts      │
      │ When TypeScript reads your mind         │
      │ 5 minutes                               │
      └─────────────────────────────────────────┘
  
  • Link: "Or ask me anything" (chat mode)
  • Link: "Take a break" (ends session gracefully)

USER ACTION: Picks one → Repeat path flow

OR

USER ACTION: "Take a break"
  → SYSTEM stores session summary
  → Shows: "See you soon! Your progress is saved."
  → Returns to dashboard (if they have one) or logout
```

---

### Flow 2: Returning User (Session 2+)

**User Goal:** Continue learning from where they left off

**Context:** User returns 2 days later

```
┌─────────────────────────────────────────────────────────────────┐
│ SCREEN: Dashboard / Home                                        │
└─────────────────────────────────────────────────────────────────┘

SYSTEM (On page load):
  1. Authenticates user (Firebase token)
  2. Loads profile from Firestore
  3. Queries recent sessions (last 3)
  4. Loads concept graph snapshot (last 20 nodes)
  5. Builds "continue learning" suggestions

USER SEES:
  • Welcome back: "Hey [name]! Ready to keep going?"
  
  • "Pick up where you left off" section:
      ┌─────────────────────────────────────────┐
      │ 🔄 Continue: Runtime vs Compile-Time    │
      │ You were exploring this 2 days ago      │
      │ 6 min remaining                         │
      └─────────────────────────────────────────┘
  
  • "Recent concepts" mini-graph (visual teaser):
      [Simple node diagram showing last few concepts learned]
      Link: "Explore your map"
  
  • "Start something new" section:
      Input: "What do you want to learn?"
      Or: Browse suggested paths
  
  • Navigation:
      - My Progress
      - Concept Map
      - Cheat Sheets
      - Settings

USER ACTION: Clicks "Continue: Runtime vs Compile-Time"

SYSTEM:
  → Loads that path from history
  → Resumes at step where they left off
  → OR regenerates with refreshed context if old


USER ACTION (Alternative): Types in search
  "I want to understand monads"

SYSTEM:
  → Treats like mini-intake
  → Generates new path with existing profile context
  → Starts path immediately (shorter onboarding)
```

---

### Flow 3: Chat Mode (Curiosity-Driven)

**User Goal:** Ask questions freely without structured path

```
┌─────────────────────────────────────────────────────────────────┐
│ SCREEN: Chat Interface                                          │
└─────────────────────────────────────────────────────────────────┘

USER SEES:
  • Chat history (if any)
  • Input: "Ask me anything..."
  • Suggested starters (if empty):
      - "What's the difference between X and Y?"
      - "Can you explain Z using [my metaphor]?"
      - "How does A connect to B?"

USER ACTION: Types question
  "How do monads relate to Promise.then()?"

SYSTEM (Behind the scenes):
  1. Check if this should be a micro-path or quick answer
     
     Decision logic:
     - If question is deep/conceptual → suggest path
     - If question is factual/quick → answer directly
     
     We could use a CLASSIFIER prompt:
     ---
     SYSTEM: Classify this question.
     
     QUESTION: {question}
     PROFILE: {profile}
     
     IS THIS:
     A) A quick factual question (answer in 1-2 paragraphs)
     B) A deep conceptual question (needs a full learning path)
     
     OUTPUT: { "type": "A" | "B", "reasoning": "..." }
     ---

  2. If type A (quick):
     → Call GPT with profile context
     → Stream answer
     → Update conversation history
     → Optionally: "Want to dive deeper? [Start a path]"
  
  3. If type B (deep):
     → System suggests:
        "That's a great question! Want me to build you a 
         personalized path on this? It'll take about 8 minutes 
         and help you really *get* it."
        
        [Yes, build a path] [No, just explain briefly]

USER SEES:
  • If quick answer: Response streams in, conversational
  • If deep: Suggestion to start path
  • Always: Context maintained (remembers earlier in conversation)
  • Graph icon hint: "Added to your map" (if new concept discovered)

EDGE CASE: User asks vague question
  "Tell me about types"

SYSTEM:
  → Detects vagueness
  → Responds with clarifying question (like onboarding):
      "I'd love to! What angle? Like:
       - How types work in TypeScript?
       - The mathematical theory behind types?
       - Why types matter in practice?"
  
  → User picks → generates specific content
```

---

### Flow 4: Concept Map Exploration

**User Goal:** Visualize their knowledge and find connections

```
┌─────────────────────────────────────────────────────────────────┐
│ SCREEN: Concept Map                                             │
└─────────────────────────────────────────────────────────────────┘

SYSTEM (On load):
  1. Query /concepts/{userId}/nodes (all concepts)
  2. Query /concepts/{userId}/edges (all connections)
  3. Build graph data structure
  4. Generate Mermaid or D3 visualization

USER SEES:
  • Interactive graph (zoomable, pannable)
  • Nodes = concepts (sized by confidence? colored by domain?)
  • Edges = relationships (labeled: "analogy", "prerequisite", etc.)
  
  Example nodes visible:
    [React Props] ─analogy→ [Types as Contracts]
    [Types as Contracts] ─abstraction→ [Contracts in General]
    [JavaScript] ─prerequisite→ [React Props]
  
  • Hover over node:
      Shows tooltip:
      - Concept name
      - Confidence: 85%
      - Learned: 2 days ago
      - Click to review
  
  • Search: "Find concept..."
  • Filter: Show only [domain] or [date range]
  • Button: "Find a path" (between two concepts)

USER ACTION: Clicks node "Types as Contracts"

SYSTEM:
  → Opens side panel with:
     - Definition (in user's own words from reflection)
     - Related concepts
     - Learning path it came from
     - Button: "Review this" (re-explains)
     - Button: "Build on this" (generate next path)

USER ACTION: Clicks "Find a path"
  → UI prompts: "From: [Types] To: [Monads]"

SYSTEM:
  → Queries graph for path between nodes
  → If exists: Shows connection visually
  → If not: Suggests:
      "I haven't connected these yet. Want to explore how 
       they relate? I'll build you a path."

USER ACTION: Accepts
  → Generates bridging micro-path
  → Starts path flow
```

---

## Implementation Deep-Dives

### Deep-Dive 1: Context Injection Mechanics

**Problem:** How do we inject user context into prompts without overwhelming the token limit?

**Solution: Layered Context Strategy**

#### Context Priority Levels

```typescript
interface ContextPayload {
  // P0 - Always include (150-300 tokens)
  essential: {
    userId: string
    learningStyle: string          // "code examples"
    tonePreference: string          // "conversational"
    currentTopic: string            // "type theory"
  }
  
  // P1 - Include if space (200-400 tokens)
  enrichment: {
    knownDomains: string[]          // ["React", "JavaScript"]
    metaphorExamples: string[]      // ["Props are like function args"]
    recentConcepts: string[]        // Last 5 learned
  }
  
  // P2 - Include if space (300-500 tokens)
  history: {
    conversationSummary: string     // Compressed last session
    lastReflection: string          // Their last "teach back"
    gaps: string[]                  // Identified misunderstandings
  }
  
  // P3 - Include only if plenty of space
  deep: {
    fullConceptGraph: Graph         // Entire knowledge map
    allMetaphors: Metaphor[]
    learningHistory: Session[]
  }
}
```

#### Context Builder Algorithm

```typescript
function buildContextForPrompt(
  userId: string,
  taskType: TaskType,
  tokenBudget: number
): string {
  
  const profile = await getProfile(userId)
  const graph = await getConceptGraph(userId)
  const recentSession = await getLastSession(userId)
  
  // Start with essential
  let context = `
LEARNER PROFILE:
- Learning style: ${profile.learningStyle}
- Preferred tone: ${profile.tonePreference}
- Current exploration: ${getCurrentTopic(userId)}
`
  
  let tokensUsed = estimateTokens(context)
  let remaining = tokenBudget - tokensUsed
  
  // Add P1 if space
  if (remaining > 250) {
    context += `
- Known concepts: ${profile.domains.slice(0, 5).join(", ")}
- Metaphors that work: ${profile.metaphorBias.join(", ")}
`
    tokensUsed = estimateTokens(context)
    remaining = tokenBudget - tokensUsed
  }
  
  // Add P2 if space
  if (remaining > 350 && recentSession) {
    const summary = await summarizeSession(recentSession)
    context += `
RECENT CONTEXT:
${summary}
`
    tokensUsed = estimateTokens(context)
    remaining = tokenBudget - tokensUsed
  }
  
  // P3 only if generous space (rare)
  if (remaining > 1000) {
    const graphSummary = summarizeGraph(graph, limit: 20)
    context += `
KNOWLEDGE MAP:
${graphSummary}
`
  }
  
  return context
}
```

#### Prompt Template with Context

```typescript
const PATH_GENERATOR_TEMPLATE = `
SYSTEM ROLE:
You are creating a personalized micro-learning experience.

{context}  // ← Injected here

TASK:
Create a 5-7 minute learning path on: {topic}

REQUIREMENTS:
1. Connect to their known concepts: {knownConcepts}
2. Use their preferred style: {learningStyle}
3. Apply metaphors they respond to: {metaphorExamples}
4. End with a reflection prompt

OUTPUT: JSON matching schema...
`
```

**Key Implementation Details:**

1. **Context is built per-request**, not stored statically
2. **Token estimation** uses tiktoken library (OpenAI's tokenizer)
3. **Compression** happens at query time (e.g., "last 5 concepts" not "all concepts")
4. **Different task types get different budgets:**
   - Intake: 500 tokens context
   - Path generation: 1000 tokens
   - Reflection analysis: 600 tokens
   - Quick answer: 300 tokens

---

### Deep-Dive 2: Personalization Execution

**Problem:** How do we actually make content feel personalized, not just templated?

**Solution: Multi-Layer Personalization**

#### Layer 1: Instruction-Based (Model-Level)

In the system prompt, we explicitly instruct the LLM:

```
SYSTEM: When explaining concepts:
- Use code examples from {domains} whenever possible
- Frame abstractions using {metaphorBias} style
- Match their tone: {tonePreference}
- Reference things they already know: {knownConcepts}

Example of good personalization:
  User knows React, prefers code, likes casual tone.
  
  BAD: "A monad is a monoid in the category of endofunctors."
  
  GOOD: "Remember how Promise.then() chains? Each step gets 
         the result from the previous one? That's monadic. 
         It's like chaining functions where the plumbing is 
         hidden."
```

#### Layer 2: Template Slots (Content-Level)

When generating paths, include slots for personalization:

```typescript
interface PathStep {
  content: string
  personalizationSlots: {
    ANALOGY: string          // Will be filled with user's metaphor
    KNOWN_EXAMPLE: string    // Will reference their domain
    TONE_WORD: string        // Casual vs formal variants
  }
}

// Example template
const stepTemplate = `
## {title}

You've seen this pattern before in {KNOWN_EXAMPLE}. 

Think of {concept} like {ANALOGY}—{explanation}.

{TONE_WORD}, right?
`

// Filled version for React developer
const filled = `
## Types as Guarantees

You've seen this pattern before in React PropTypes.

Think of types like function signatures—they promise what 
goes in and what comes out.

Makes sense, right?
`
```

#### Layer 3: Post-Processing (Refinement)

After generation, we can refine:

```typescript
async function personalizeGeneratedContent(
  content: string,
  profile: LearnerProfile
): Promise<string> {
  
  // Replace generic examples with user-specific ones
  content = content.replace(
    /for example in (\w+)/gi,
    `for example in ${profile.domains[0]}`
  )
  
  // Inject their past metaphors
  if (profile.favoriteMetaphors?.length) {
    const metaphor = profile.favoriteMetaphors[0]
    content = `Remember when we compared {topic} to ${metaphor}? 
                Let's build on that...\n\n${content}`
  }
  
  return content
}
```

#### Layer 4: Validation (Quality Check)

After personalization, validate it worked:

```typescript
function validatePersonalization(
  content: string,
  profile: LearnerProfile
): PersonalizationScore {
  
  const checks = {
    mentionedKnownConcept: profile.domains.some(d => 
      content.toLowerCase().includes(d.toLowerCase())
    ),
    
    matchesTone: profile.tonePreference === "casual" 
      ? /\b(like|kinda|pretty|basically)\b/.test(content)
      : /\b(therefore|thus|hence|consequently)\b/.test(content),
    
    usedMetaphor: profile.metaphorBias.some(m => 
      content.includes(m) || containsSimilarAnalogy(content, m)
    )
  }
  
  const score = Object.values(checks).filter(Boolean).length / 3
  
  return {
    score,
    checks,
    suggestions: score < 0.6 ? ["Regenerate with stronger prompts"] : []
  }
}
```

**Implementation Decision:**

We'll use **Layers 1 + 2 primarily**, with Layer 3 as fallback.

Layer 4 (validation) runs async and logs to analytics—helps us improve prompts over time.

---

### Deep-Dive 3: Reflect Mode Analysis

**Problem:** How do we score understanding without being too rigid or too lenient?

**Solution: Multi-Dimensional Analysis**

#### Analysis Dimensions

```typescript
interface ReflectionAnalysis {
  // Quantitative
  overallScore: number              // 0.0 - 1.0
  
  // Qualitative
  conceptsCovered: string[]         // What they mentioned
  conceptsMissed: string[]          // What we taught but they didn't mention
  misconceptions: Misconception[]   // Where they went wrong
  strengths: string[]               // What they nailed
  
  // Behavioral
  effortLevel: "minimal" | "moderate" | "deep"
  confidence: "uncertain" | "tentative" | "confident"
  
  // Actionable
  feedbackMessage: string           // What we tell them
  suggestedNextSteps: string[]      // Where to go from here
}
```

#### Scoring Rubric (for LLM)

```typescript
const REFLECT_ANALYSIS_PROMPT = `
SYSTEM: You are analyzing a learner's explanation for understanding.

TOPIC: {topic}
KEY CONCEPTS WE COVERED:
{key_concepts}

LEARNER'S EXPLANATION:
{reflection_text}

ANALYSIS RUBRIC:

1. COVERAGE (40% of score)
   - Did they mention the main concept?
   - Did they touch on 2+ key points?
   - Did they give an example?

2. ACCURACY (40% of score)
   - Is their explanation correct?
   - Any misconceptions?
   - Do they understand WHY, not just WHAT?

3. DEPTH (20% of score)
   - Did they just restate, or synthesize?
   - Did they connect to prior knowledge?
   - Did they add their own insight?

SCORING GUIDE:
- 0.9-1.0: Excellent. Could teach this to someone else.
- 0.7-0.8: Solid understanding. Minor gaps.
- 0.5-0.6: Partial understanding. Needs reinforcement.
- 0.3-0.4: Misunderstanding or minimal effort.
- 0.0-0.2: Way off base or empty response.

IMPORTANT:
- Be encouraging even for low scores
- Identify what they DID get right first
- Suggest specific next steps

OUTPUT: JSON with structure:
{
  "overallScore": 0.75,
  "conceptsCovered": ["types as contracts", "input/output"],
  "conceptsMissed": ["compile-time vs runtime"],
  "misconceptions": [
    {
      "concept": "...",
      "theirThought": "...",
      "correction": "..."
    }
  ],
  "strengths": ["used concrete example", "connected to React"],
  "feedbackMessage": "You nailed the contract metaphor...",
  "suggestedNextSteps": ["explore type checking timing"]
}
`
```

#### Edge Cases in Reflection

**Case 1: "I don't know" response**

```typescript
if (reflection.trim().toLowerCase().match(/don't know|not sure|idk/)) {
  return {
    overallScore: 0.0,
    feedbackMessage: "No worries! Let's try this differently. " +
      "What's ONE thing from that explanation that made sense?",
    suggestedAction: "prompt_simpler_question"
  }
}
```

**Case 2: Copy-pasted our explanation**

```typescript
const similarity = computeSimilarity(reflection, originalContent)

if (similarity > 0.85) {
  return {
    overallScore: 0.3,  // Low score for parroting
    feedbackMessage: "I can see you're tracking with me, but try " +
      "explaining it in YOUR words—like you're telling a friend. " +
      "What would you say?",
    suggestedAction: "re_prompt_for_original_thought"
  }
}
```

**Case 3: Tangential response**

```typescript
const relevance = await checkRelevance(reflection, topic)

if (relevance < 0.4) {
  return {
    overallScore: 0.2,
    feedbackMessage: "Interesting thoughts! But let's focus back " +
      "on {topic}. How would YOU define it?",
    suggestedAction: "redirect_to_topic"
  }
}
```

**Case 4: Deep, insightful response (exceeds expectations)**

```typescript
if (analysis.overallScore > 0.9 && analysis.depth === "exceptional") {
  return {
    ...analysis,
    feedbackMessage: "Wow. You just explained that better than I did. " +
      "You're thinking like an expert already.",
    suggestedAction: "unlock_advanced_path",
    badge: "🌟 Deep Thinker"
  }
}
```

---

### Deep-Dive 4: Graph Update Logic

**Problem:** When and how do we update the concept graph?

**Solution: Event-Driven Updates**

#### Update Triggers

```typescript
enum GraphUpdateTrigger {
  PATH_COMPLETED = "path_completed",
  REFLECTION_ANALYZED = "reflection_analyzed",
  CHAT_INSIGHT = "chat_insight",
  USER_MANUAL = "user_manual",
  SYSTEM_INFERENCE = "system_inference"
}
```

#### Update Pipeline

```
EVENT OCCURS
  ↓
[Trigger Handler]
  ↓
Extract concepts from event
  ↓
Check if concepts already in graph
  ↓
  ├─ NEW CONCEPT
  │    → Add node
  │    → Set confidence (from reflection score)
  │    → Link to source (path/chat)
  │
  └─ EXISTING CONCEPT
       → Update confidence (weighted average)
       → Add new metaphor if found
       → Update timestamp
  ↓
Detect connections
  ↓
  ├─ Explicit (we defined it)
  │    → "React props" prerequisite→ "JSX"
  │
  └─ Inferred (LLM detects)
       → Analyze reflection for analogies
       → "They compared X to Y" → add analogy edge
  ↓
Store in /concepts/{userId}/
  ↓
Emit event: graph.updated
  ↓
[Optional] Trigger visualization refresh
```

#### Implementation

```typescript
async function updateGraphFromReflection(
  userId: string,
  reflection: ReflectionAnalysis,
  pathContext: MicroPath
) {
  
  // Extract new concepts learned
  const newConcepts = reflection.conceptsCovered.filter(
    concept => !await conceptExists(userId, concept)
  )
  
  // Add nodes
  for (const conceptName of newConcepts) {
    await addConceptNode(userId, {
      name: conceptName,
      definition: extractDefinition(reflection, conceptName),
      confidence: reflection.overallScore,
      learnedFrom: pathContext.id,
      timestamp: new Date()
    })
  }
  
  // Update existing nodes
  const existingConcepts = reflection.conceptsCovered.filter(
    concept => await conceptExists(userId, concept)
  )
  
  for (const conceptName of existingConcepts) {
    await updateConceptConfidence(
      userId,
      conceptName,
      reflection.overallScore,
      strategy: "weighted_average"  // Don't replace, blend
    )
  }
  
  // Detect connections
  const connections = await detectConnections(
    userId,
    reflection.text,
    pathContext
  )
  
  for (const edge of connections) {
    await addEdge(userId, edge)
  }
  
  // Emit update event
  emitGraphUpdate(userId, {
    newNodes: newConcepts.length,
    updatedNodes: existingConcepts.length,
    newEdges: connections.length
  })
}
```

#### Connection Detection

```typescript
async function detectConnections(
  userId: string,
  reflectionText: string,
  pathContext: MicroPath
): Promise<GraphEdge[]> {
  
  const edges: GraphEdge[] = []
  
  // Explicit connections from path design
  // (e.g., this path intentionally connected React to Types)
  if (pathContext.metadata?.connectsConcepts) {
    edges.push({
      from: pathContext.metadata.connectsConcepts[0],
      to: pathContext.metadata.connectsConcepts[1],
      type: "taught_connection",
      strength: 1.0
    })
  }
  
  // Inferred from reflection (learner made analogy)
  const analogies = extractAnalogies(reflectionText)
  for (const { from, to } of analogies) {
    edges.push({
      from,
      to,
      type: "learner_analogy",
      strength: 0.7  // Learner-created, less authoritative
    })
  }
  
  // Ask LLM to detect implicit connections
  const inferredConnections = await callLLM({
    prompt: `
      REFLECTION: ${reflectionText}
      TOPIC: ${pathContext.topic}
      
      What connections did they make? Output format:
      { "from": "concept A", "to": "concept B", "type": "analogy|prerequisite|contrast" }
    `
  })
  
  edges.push(...inferredConnections)
  
  return edges
}
```

**Key Decisions:**

1. **Updates happen async** - Don't block user experience
2. **Confidence scores blend, don't replace** - Prevents single bad reflection from nuking progress
3. **Both explicit and inferred edges** - System tracks what we taught AND what they discovered
4. **Graph updates trigger events** - Other systems can react (e.g., show notification)

---

## Edge Cases & Error Handling

### Category 1: AI Generation Failures

#### Problem 1: LLM returns malformed JSON

**Scenario:** We ask for structured output, get prose instead.

**Detection:**
```typescript
try {
  const parsed = JSON.parse(response)
  return { success: true, data: parsed }
} catch (error) {
  // Failed to parse
}
```

**Handling:**
```typescript
// Strategy A: Try to extract JSON from markdown
const jsonMatch = response.match(/```json\n([\s\S]+?)\n```/)
if (jsonMatch) {
  return JSON.parse(jsonMatch[1])
}

// Strategy B: Retry with stronger prompt
return await retryWithPrompt({
  original: prompt,
  additional: "CRITICAL: Output MUST be valid JSON. Nothing else."
})

// Strategy C: Fall back to manual parsing
return manualExtraction(response, expectedSchema)

// Strategy D: Give up gracefully
return {
  success: false,
  error: "Could not parse response",
  userMessage: "Hmm, something went weird on my end. Let's try again?",
  fallback: defaultPath
}
```

#### Problem 2: LLM ignores personalization instructions

**Scenario:** Response is generic despite user context in prompt.

**Detection:**
```typescript
const personalizationScore = validatePersonalization(content, profile)
if (personalizationScore < 0.5) {
  // Not personalized enough
}
```

**Handling:**
```typescript
// Option 1: Retry with more explicit prompt
const retryPrompt = `
CRITICAL: This learner is NOT a beginner. They know ${profile.domains.join(", ")}.
DO NOT explain ${profile.domains[0]} basics.
DO use ${profile.domains[0]} as your PRIMARY example domain.
`

// Option 2: Post-process to inject personalization
content = await addPersonalizationLayer(content, profile)

// Option 3: Accept but flag for improvement
logQualityIssue({
  type: "low_personalization",
  score: personalizationScore,
  prompt: prompt,
  response: content
})

return content  // Use it anyway, log for later analysis
```

#### Problem 3: Content is too advanced or too basic

**Scenario:** Mismatch between user level and generated difficulty.

**Detection:**
```typescript
// User signals confusion
if (userMessage.match(/too hard|don't understand|lost me/)) {
  return { action: "simplify" }
}

// User signals boredom
if (userMessage.match(/too easy|already know|boring/)) {
  return { action: "increase_difficulty" }
}
```

**Handling:**
```typescript
async function adjustDifficulty(
  pathId: string,
  direction: "up" | "down",
  profile: LearnerProfile
) {
  
  if (direction === "down") {
    // Regenerate with simpler framing
    return await generatePath(topic, {
      ...profile,
      complexity: "beginner",
      additionalPrompt: "Assume they're seeing this for the first time. " +
        "Use simple language. More analogies."
    })
  } else {
    // Skip basics, go deeper
    return await generatePath(topic, {
      ...profile,
      complexity: "advanced",
      additionalPrompt: "Skip the basics. They get the fundamentals. " +
        "Show the nuances and edge cases."
    })
  }
}
```

---

### Category 2: User Input Issues

#### Problem 4: User gives minimal responses

**Scenario:** During intake or reflection, user types "idk" or one-word answers.

**Handling:**

```typescript
// During intake
if (response.split(" ").length < 3) {
  return {
    type: "clarifying_question",
    message: "I'd love to know a bit more! For example: what have you " +
      "tried learning before? Any particular project or goal in mind?"
  }
}

// During reflection
if (reflectionText.split(" ").length < 10) {
  return {
    type: "gentle_prompt",
    message: "Take your time! Try explaining it like you're telling a " +
      "friend over coffee. What's the main idea in your own words?"
  }
}

// After 2 minimal responses
if (minimalResponseCount >= 2) {
  return {
    type: "offer_skip",
    message: "No worries if you're not in the mood to type a lot! Want to " +
      "try a different format, or take a break?"
  }
}
```

#### Problem 5: User goes off-topic

**Scenario:** During learning, user asks completely unrelated question.

**Example:** Learning about types, user asks "How do I deploy to AWS?"

**Handling:**
```typescript
const relevance = await checkTopicRelevance(userMessage, currentTopic)

if (relevance < 0.3) {
  return {
    type: "redirect",
    message: "That's a great question! But let's bookmark it for now. " +
      "We're exploring {currentTopic}. Want to finish this first, " +
      "or switch gears?",
    options: [
      { label: "Keep going with {currentTopic}", action: "continue" },
      { label: "Switch to AWS deployment", action: "new_path" }
    ]
  }
}
```

#### Problem 6: User disputes feedback

**Scenario:** After reflection, user says "I think that's wrong" or disagrees with analysis.

**Handling:**
```typescript
// Detect disagreement
if (userMessage.match(/disagree|wrong|that's not right|actually/i)) {
  
  return {
    type: "open_discussion",
    message: "I hear you! Tell me more—what part do you see differently? " +
      "I'm here to learn too.",
    
    followUp: async (userExplanation) => {
      // Re-analyze with their pushback
      const reanalysis = await analyzeWithContext({
        originalReflection: reflectionText,
        feedback: analysis.feedbackMessage,
        userDisagreement: userExplanation
      })
      
      // Potentially adjust score
      if (reanalysis.userWasRight) {
        await updateReflectionScore(reflectionId, reanalysis.newScore)
        return "You know what? You're right. I misjudged that. " +
          `Updating your score to ${reanalysis.newScore}. Nice catch!`
      } else {
        return "I see where you're coming from. Let me clarify what I meant..."
      }
    }
  }
}
```

---

### Category 3: System Failures

#### Problem 7: Database write fails

**Scenario:** Firestore timeout or quota exceeded.

**Handling:**
```typescript
try {
  await db.collection("profiles").doc(userId).set(profile)
} catch (error) {
  
  // Log error
  Sentry.captureException(error, {
    tags: { operation: "profile_write", userId }
  })
  
  // Retry with exponential backoff
  return await retryWithBackoff(async () => {
    await db.collection("profiles").doc(userId).set(profile)
  }, maxRetries: 3)
  
  // If still fails, cache locally
  await Redis.set(`profile:${userId}:backup`, JSON.stringify(profile), "EX", 3600)
  
  // Tell user (if critical) or silent fail (if not)
  if (isCritical) {
    return {
      userMessage: "Having trouble saving right now. Your progress is " +
        "safe, but let's pause for a sec.",
      action: "retry_later"
    }
  }
}
```

#### Problem 8: OpenAI API rate limit hit

**Scenario:** Too many requests, 429 error.

**Handling:**
```typescript
try {
  const response = await openai.chat.completions.create(params)
} catch (error) {
  
  if (error.status === 429) {
    // Hit rate limit
    
    // Strategy A: Fallback to cached response if available
    const cached = await Redis.get(`prompt:${hash(prompt)}`)
    if (cached) return JSON.parse(cached)
    
    // Strategy B: Wait and retry (exponential backoff)
    await sleep(2000)
    return await openai.chat.completions.create(params)
    
    // Strategy C: Fallback to cheaper model
    return await openai.chat.completions.create({
      ...params,
      model: "gpt-3.5-turbo"  // Fallback
    })
    
    // Strategy D: Tell user
    return {
      success: false,
      userMessage: "Lots of people learning right now! Give me 10 seconds...",
      action: "retry_with_delay"
    }
  }
}
```

#### Problem 9: WebSocket disconnection during streaming

**Scenario:** User's connection drops while AI is streaming response.

**Handling:**
```typescript
// Server-side: buffer partial response
wsServer.on("disconnect", (socket) => {
  const sessionId = socket.sessionId
  const partialResponse = socket.responseBuffer
  
  // Save to Redis with TTL
  await Redis.set(
    `partial:${sessionId}`,
    JSON.stringify(partialResponse),
    "EX", 300  // 5 min expiry
  )
})

// Client-side: reconnect and resume
socket.on("reconnect", async () => {
  const partial = await fetch(`/api/sessions/${sessionId}/partial`)
  
  if (partial) {
    // Show what we have so far
    displayPartialMessage(partial.content)
    
    // Resume streaming from where we left off
    socket.emit("resume_stream", { sessionId, fromToken: partial.lastToken })
  }
})
```

---

### Category 4: UX Edge Cases

#### Problem 10: User navigates away mid-path

**Scenario:** User closes tab or clicks back button during learning.

**Handling:**
```typescript
// Save progress on every step
window.addEventListener("beforeunload", (event) => {
  const state = {
    pathId: currentPath.id,
    currentStep: currentStep,
    timestamp: Date.now()
  }
  
  // Sync save (limited time in beforeunload)
  navigator.sendBeacon(
    "/api/sessions/save-progress",
    JSON.stringify(state)
  )
})

// On return, offer to resume
if (incompleteSession) {
  showModal({
    title: "Welcome back!",
    message: `You were in the middle of "${incompleteSession.pathTitle}". Pick up where you left off?`,
    actions: [
      { label: "Resume", action: () => loadPath(incompleteSession.pathId, incompleteSession.currentStep) },
      { label: "Start fresh", action: () => goToDashboard() }
    ]
  })
}
```

#### Problem 11: Multiple browser tabs/devices

**Scenario:** User has LearningOS open on laptop and phone simultaneously.

**Handling:**
```typescript
// Use Firestore real-time listeners
const sessionRef = db.collection("sessions").doc(sessionId)

sessionRef.onSnapshot((snapshot) => {
  const session = snapshot.data()
  
  // If another device updated progress, sync
  if (session.lastModified > localState.lastModified) {
    showNotification({
      message: "Your progress was updated from another device. Refreshing...",
      duration: 3000
    })
    
    syncLocalState(session)
  }
})

// Warn if trying to do different things simultaneously
if (session.activeDevices.length > 1) {
  showWarning({
    message: "You have LearningOS open on another device. Progress will sync, " +
      "but it might feel weird if you're doing different things!"
  })
}
```

---

## Open Questions & Decisions

### Critical Decisions Needed Before MVP

#### Decision 1: How much AI variability do we tolerate?

**Question:** If GPT-4 generates slightly different paths for the same topic, is that a bug or feature?

**Options:**
- A) **High consistency**: Cache paths aggressively, every user sees same base content
- B) **Medium variability**: Generate fresh but with strict templates
- C) **High variability**: Regenerate every time, embrace chaos

**Implications:**
- A = Lower cost, less personalized, predictable quality
- B = Balanced, probably MVP choice
- C = Most personalized, expensive, quality variance

**Recommendation:** **Start with B**, measure user feedback, adjust.

---

#### Decision 2: When do we show the concept graph?

**Question:** Is the graph:
- Always visible (sidebar)?
- Hidden until user clicks "My Map"?
- Only shown after N concepts learned?

**Options:**
- A) Always visible: Constant feedback, but cluttered UI
- B) On-demand: Cleaner, but users might not discover it
- C) Progressive reveal: "You've learned 3 concepts! Check out your map" (first time only)

**Recommendation:** **Option C** - Progressive reveal with prominent navigation link.

---

#### Decision 3: Do we allow editing reflections?

**Question:** User submits reflection, then realizes they want to add more. Can they edit?

**Options:**
- A) No editing: First answer is final
- B) Edit within 5 minutes: Short window
- C) Always editable: Can revise anytime

**Implications:**
- A = Simpler, encourages thoughtful first response
- B = Balances finality with "oops" fixes
- C = Complex to track, but user-friendly

**Recommendation:** **Option B** - 5-minute edit window, then locked.

---

#### Decision 4: Tone formality gradient

**Question:** User picks "conversational" tone. How casual?

**Gradient examples:**

| Level | Example |
|-------|---------|
| **Formal** | "Therefore, one might conclude..." |
| **Professional** | "So here's what this means..." |
| **Conversational** | "Here's the thing..." |
| **Casual** | "OK so basically..." |
| **Playful** | "Plot twist: types are actually..." |

**Question:** Do we let users pick from this gradient, or just "casual vs formal"?

**Recommendation:** **Start binary** (formal vs conversational), add gradient later if requested.

---

#### Decision 5: Rate limiting for free tier

**Question:** Free tier gets 20 messages per 15 minutes. What happens at limit?

**Options:**
- A) Hard block: "You've hit your limit. Upgrade or wait."
- B) Soft warning: "You're at 18/20 messages. Slow down or upgrade?"
- C) Graceful degradation: "Switching to slower model. Upgrade for full speed."

**Recommendation:** **Option B** - Soft warning at 80%, hard block with kind message at 100%.

---

### Open Implementation Questions

#### Question 1: Session timeout duration

**How long can a session stay active before we auto-save and close?**

- 30 minutes of inactivity?
- 2 hours absolute max?
- Never timeout, always resume?

**Implications:** Affects database connection pooling, memory, user experience.

**Need:** User research on typical session patterns.

---

#### Question 2: Cheat sheet format

**User requests "export cheat sheet" - what do they get?**

- Markdown file?
- PDF?
- Copy to clipboard?
- All of the above?

**MVP:** Markdown + copy to clipboard. PDF later.

---

#### Question 3: Metaphor storage format

**How do we store "user compared X to Y" for reuse?**

```typescript
interface Metaphor {
  source: string        // "types"
  target: string        // "contracts"
  relation: string      // "are like"
  context?: string      // Optional: where they said this
  confidence: number    // How strongly it worked for them
}
```

**Question:** Is this enough, or do we need more structure?

---

#### Question 4: Multi-path navigation

**User is in middle of Path A, gets curious about Path B. What happens?**

- A) Force finish Path A first
- B) Allow switching, auto-save Path A progress
- C) Allow opening Path B in "new tab" (separate session)

**Recommendation:** **Option B** - Save and switch freely. This is curiosity-driven learning.

---

#### Question 5: Concept confidence decay

**If user learned "types" 6 months ago and never revisited, should confidence decrease?**

- Yes, with decay function (confidence \* 0.9^months)?
- No, knowledge doesn't decay?
- Prompt user to review if stale?

**Recommendation:** **Start without decay**, add later if research shows value.

---

### Questions for User Research

Before we finalize these decisions, we should ask real users:

1. **How much guidance do you want during reflection?**
   - Prompt with hints?
   - Completely open-ended?
   - Multiple-choice initially, then open?

2. **What does "personalized" feel like to you?**
   - Show examples of various personalization levels
   - Which feels right? Which feels forced?

3. **How do you want to be reminded of prior learning?**
   - "Remember when you learned X?"
   - Visual graph highlighting?
   - Auto-generated "previously..." sections?

4. **If content feels too easy/hard, what do you want?**
   - Auto-adjust difficulty?
   - Let you request harder/easier?
   - Show difficulty level upfront?

5. **How often do you want to see your progress?**
   - After every path?
   - Weekly summary?
   - Only when you ask?

---

## Summary: Are We Ready to Build?

### ✅ What We Have Clear

1. **User flows** - Now fully documented with step-by-step interactions
2. **Data flow** - We know what happens at each step
3. **Core mechanics** - Context injection, personalization, reflection analysis
4. **Edge cases** - Failure modes and recovery strategies
5. **Technical architecture** - Components, APIs, data models

### ⚠️ What Still Needs Validation

1. **AI prompt effectiveness** - Won't know until we test
2. **Personalization quality** - Need real users to evaluate
3. **Optimal rate limits** - Need usage data
4. **Feature prioritization** - Some decisions can wait

### ✅ Ready to Build? YES

**We have enough to start Phase 0 and Phase 1:**

- Set up project structure
- Implement authentication
- Build Profile Engine with intake flow
- Create first path generator
- Test with internal users

**We'll learn the rest by shipping and iterating.**

---

## Next Immediate Steps

1. ✅ **Create project repo** (Next.js + TypeScript)
2. ✅ **Set up Firebase** (Auth + Firestore + security rules)
3. ✅ **Build intake UI** (chat interface)
4. ✅ **Implement first prompt** (INTAKE_CLARIFYING)
5. ✅ **Test end-to-end** with dummy data
6. → Then iterate based on real interactions

---

**Document Status:** Ready for Implementation  
**Next Review:** After first internal testing  
**Owner:** Blast  
**Last Updated:** January 25, 2026
