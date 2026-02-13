# LearningOS: Learning Mechanics - Detailed Implementation

**Project:** LearningOS  
**Version:** 1.0  
**Date:** January 25, 2026  
**Author:** Blast  
**Purpose:** Bridge vision statements to concrete, implementable mechanisms

---

## Document Purpose

The brainstorming document contains powerful ideas like:
- "78% confidence but 31% structural understanding"
- "Allow for 'I don't get it' moments"
- "Abstraction scaffolding"

**This document answers: HOW do we actually implement these?**

---

## Part 1: Confidence vs. Structural Understanding

### The Vision Statement

> *"The user may have a 78% confidence level but only 31% structural understanding. System should model both."*

### What This Actually Means

**Confidence** = How sure the learner *feels*  
**Structural Understanding** = How well they *actually* understand

**Example:**
- User: "Yeah, I totally get Redux reducers!" (high confidence)
- Reality: Can't explain *why* they're pure functions (low structural understanding)

This is the **Dunning-Kruger spectrum** - we need to detect and bridge this gap.

---

### How We Measure Confidence

#### Signal 1: Self-Reported (Explicit)

**During Intake:**
```
Bot: "On a scale of 'never heard of it' to 'could teach it', 
     where are you with React?"

User: "Pretty solid - I use it daily" → confidence: 0.8
```

**After Learning:**
```
Bot: "How confident do you feel explaining types now?"
[Slider: Not confident ←→ Very confident]
```

**Implementation:**
```typescript
interface ConfidenceSignal {
  source: "self_report" | "behavioral" | "performance"
  value: number        // 0.0 - 1.0
  timestamp: Date
  context: string      // What they were confident about
}

// Store multiple signals, not just one number
interface ConceptConfidence {
  concept: string
  signals: ConfidenceSignal[]
  aggregated: number   // Weighted average
}
```

#### Signal 2: Behavioral (Implicit)

**Language analysis:**
```typescript
const CONFIDENCE_MARKERS = {
  high: [
    /I (totally|definitely|completely) (get|understand)/i,
    /makes sense/i,
    /I've done this/i,
    /yeah,? (I know|familiar)/i
  ],
  
  medium: [
    /I think I (get|understand)/i,
    /sort of makes sense/i,
    /I've heard of/i
  ],
  
  low: [
    /not sure/i,
    /confusing/i,
    /lost/i,
    /don't (get|understand)/i,
    /what('s| is) a/i  // Asking basic definition
  ]
}

function detectConfidenceFromText(text: string): number {
  let score = 0.5  // Start neutral
  
  if (CONFIDENCE_MARKERS.high.some(re => re.test(text))) {
    score += 0.3
  }
  if (CONFIDENCE_MARKERS.low.some(re => re.test(text))) {
    score -= 0.3
  }
  
  return Math.max(0, Math.min(1, score))
}
```

**Hesitation patterns:**
```typescript
function detectHesitation(text: string): boolean {
  const hesitationMarkers = [
    /^um+,?/i,
    /^uh+,?/i,
    /\.\.\./,
    /I guess/i,
    /maybe\?/,
    /not really sure/i
  ]
  
  return hesitationMarkers.some(marker => marker.test(text))
}

// If user hesitates, lower confidence signal
if (detectHesitation(userResponse)) {
  confidence *= 0.8
}
```

**Response speed:**
```typescript
// Fast responses to reflection prompts = confident
// Slow responses = uncertain

interface ResponseTiming {
  promptShown: Date
  responseSubmitted: Date
  durationSeconds: number
}

function inferConfidenceFromSpeed(timing: ResponseTiming): number {
  // Quick (< 30s) = confident (but check quality)
  // Medium (30-90s) = thoughtful
  // Slow (> 90s) = struggling or very careful
  
  if (timing.durationSeconds < 30) return 0.7
  if (timing.durationSeconds < 90) return 0.6
  return 0.4
}
```

#### Signal 3: Performance-Based

**Reflection quality:**
```typescript
// We already score reflections 0.0-1.0
// That's a confidence signal too

interface ReflectionAnalysis {
  score: number  // 0.0 - 1.0
  // This feeds into confidence
}

// High reflection score → increase confidence
// Low score → decrease confidence
```

**Attempt count:**
```typescript
// If user requests "explain again" or "simpler", confidence is low

let explainAgainCount = 0

if (userMessage.match(/explain again|one more time|simpler|confused/i)) {
  explainAgainCount++
  confidence *= (0.9 ** explainAgainCount)
}
```

---

### How We Measure Structural Understanding

**This is MUCH harder** - confidence is about feeling, understanding is about knowledge architecture.

#### Method 1: Reflection Analysis Depth

```typescript
interface StructuralUnderstanding {
  score: number              // 0.0 - 1.0
  dimensions: {
    breadth: number          // How many aspects they covered
    depth: number            // How deep they went
    connections: number      // Links to other concepts
    synthesis: number        // Original insights
  }
}

async function analyzeStructuralUnderstanding(
  reflection: string,
  topic: string,
  expectedConcepts: string[]
): Promise<StructuralUnderstanding> {
  
  const analysis = await callLLM({
    prompt: `
SYSTEM: Analyze structural understanding depth.

TOPIC: ${topic}
KEY CONCEPTS: ${expectedConcepts.join(", ")}

LEARNER EXPLANATION:
${reflection}

ANALYSIS DIMENSIONS:

1. BREADTH (0-1): Did they cover multiple aspects?
   - 0.0: Only surface-level
   - 0.5: Covered main points
   - 1.0: Comprehensive coverage

2. DEPTH (0-1): How deep did they go?
   - 0.0: Just definitions
   - 0.5: Explained "how"
   - 1.0: Explained "why" and edge cases

3. CONNECTIONS (0-1): Did they link to other concepts?
   - 0.0: Isolated explanation
   - 0.5: Mentioned related ideas
   - 1.0: Built conceptual bridges

4. SYNTHESIS (0-1): Did they add original insight?
   - 0.0: Parroted our explanation
   - 0.5: Rephrased in own words
   - 1.0: Created new analogy or connection

OUTPUT: JSON
{
  "breadth": 0.7,
  "depth": 0.4,
  "connections": 0.6,
  "synthesis": 0.5,
  "overallScore": 0.55,
  "evidence": {
    "breadth": "Mentioned types, contracts, and examples",
    "depth": "Stopped at 'what' without exploring 'why'",
    "connections": "Linked to React props",
    "synthesis": "Mostly restated our framing"
  }
}
`
  })
  
  return analysis
}
```

#### Method 2: Knowledge Graph Structure

```typescript
// Structural understanding = how well their concept graph is connected

interface GraphStructure {
  nodeCount: number
  edgeCount: number
  avgDegree: number          // Connections per node
  clusteringCoeff: number    // How interconnected
  isolatedNodes: number      // Disconnected concepts
}

function calculateStructuralUnderstanding(
  graph: ConceptGraph
): number {
  const structure = analyzeGraphStructure(graph)
  
  // Well-connected graph = better structural understanding
  const connectedness = structure.avgDegree / structure.nodeCount
  const clustering = structure.clusteringCoeff
  
  // Isolated nodes lower the score
  const isolation_penalty = structure.isolatedNodes / structure.nodeCount
  
  return (connectedness * 0.5 + clustering * 0.5) * (1 - isolation_penalty)
}
```

#### Method 3: Transfer Test

**Test if they can apply concept to new domain:**

```typescript
// After learning "types as contracts", ask:
// "How would you explain this to a backend developer who uses Python?"

interface TransferTest {
  prompt: string
  expectedTransfer: string[]     // Concepts they should bridge
  response: string
  score: number
}

async function testConceptTransfer(
  concept: string,
  learnedContext: string,
  newContext: string
): Promise<TransferTest> {
  
  const prompt = `You learned about ${concept} in the context of ${learnedContext}. 
                  How would you explain it to someone who works with ${newContext}?`
  
  // If they can successfully reframe the concept in new context,
  // they have structural understanding (not just memorized examples)
  
  const response = await getUserResponse(prompt)
  
  const analysis = await analyzeLLM({
    systemPrompt: "Did they successfully transfer the concept?",
    concepts: [concept],
    originalContext: learnedContext,
    newContext: newContext,
    response: response
  })
  
  return {
    prompt,
    expectedTransfer: analysis.expectedConcepts,
    response,
    score: analysis.transferSuccess  // 0.0 - 1.0
  }
}
```

---

### Combining Confidence + Understanding

#### The Four Quadrants

```typescript
interface LearnerState {
  confidence: number         // 0.0 - 1.0
  understanding: number      // 0.0 - 1.0
  quadrant: Quadrant
}

enum Quadrant {
  // High confidence, high understanding
  MASTERY = "mastery",                  // "I get it and I know I get it"
  
  // High confidence, low understanding  
  OVERCONFIDENT = "overconfident",      // "I think I get it but I don't"
  
  // Low confidence, high understanding
  IMPOSTER = "imposter",                // "I actually get it but don't feel confident"
  
  // Low confidence, low understanding
  BEGINNER = "beginner"                 // "I don't get it and I know it"
}

function classifyLearnerState(
  confidence: number,
  understanding: number
): Quadrant {
  const highConf = confidence > 0.7
  const highUnder = understanding > 0.7
  
  if (highConf && highUnder) return Quadrant.MASTERY
  if (highConf && !highUnder) return Quadrant.OVERCONFIDENT
  if (!highConf && highUnder) return Quadrant.IMPOSTER
  return Quadrant.BEGINNER
}
```

#### Adaptive Responses per Quadrant

```typescript
async function respondToQuadrant(state: LearnerState): Promise<Response> {
  
  switch (state.quadrant) {
    
    case Quadrant.MASTERY:
      // They're ready to move on or go deeper
      return {
        message: "You've got this. Ready to level up?",
        nextAction: "offer_advanced_path",
        tone: "celebratory"
      }
    
    case Quadrant.OVERCONFIDENT:
      // DANGEROUS - they think they know but don't
      // Need to gently reveal gaps without crushing confidence
      return {
        message: "Let's test that understanding with a quick challenge...",
        nextAction: "transfer_test",  // Will expose gaps
        tone: "curious_not_corrective",
        
        // After test reveals gaps:
        followUp: "Interesting! Let's refine your mental model a bit..."
      }
    
    case Quadrant.IMPOSTER:
      // They understand but don't feel confident
      // Boost confidence through validation
      return {
        message: "You know what? You explained that really well. " +
                 "Your understanding is solid. Trust yourself!",
        nextAction: "confidence_building_exercise",
        tone: "validating"
      }
    
    case Quadrant.BEGINNER:
      // They need help and know it
      // Slow down, simplify, scaffold
      return {
        message: "No worries—let's take this step by step.",
        nextAction: "simplify_and_scaffold",
        tone: "patient_supportive"
      }
  }
}
```

---

### Example: Detecting Overconfidence

**Scenario:** User says "Yeah I totally get monads" but reflection reveals shallow understanding.

```typescript
// During intake
userSays("I'm pretty solid on functional programming")
→ confidence = 0.8

// System generates advanced path
generatePath("monads", difficulty: "intermediate")

// User's reflection
userReflects("Monads are like... wrappers? They wrap values.")
→ structuralUnderstanding = 0.3  // Very shallow

// System detects mismatch
const state = {
  confidence: 0.8,
  understanding: 0.3,
  quadrant: Quadrant.OVERCONFIDENT
}

// System responds
respondToQuadrant(state)
→ "You're on the right track with the wrapper idea! 
   Let me ask you this: why can't you just use a regular object? 
   What makes a monad special?"

// This reveals the gap without saying "you're wrong"
// User realizes they don't know as much as they thought
// Confidence adjusts down, learning continues
```

---

### Implementation Summary

**Confidence Measurement:**
```typescript
const confidence = weightedAverage([
  { value: selfReported, weight: 0.3 },
  { value: behavioralSignals, weight: 0.3 },
  { value: performanceScore, weight: 0.4 }
])
```

**Structural Understanding Measurement:**
```typescript
const understanding = weightedAverage([
  { value: reflectionDepth, weight: 0.4 },
  { value: graphConnectedness, weight: 0.3 },
  { value: transferTestScore, weight: 0.3 }
])
```

**Both stored per concept:**
```typescript
interface ConceptMastery {
  concept: string
  confidence: number
  understanding: number
  quadrant: Quadrant
  lastUpdated: Date
  history: MasterySnapshot[]  // Track changes over time
}
```

---

## Part 2: "I Don't Get It" Moments

### The Vision Statement

> *"System should allow for 'I don't get it' moments to reset the pacing or rotate the framing."*

### What This Actually Means

When learning breaks down, we need to:
1. **Detect** the struggle (before user gives up)
2. **Elicit** explicit feedback ("I'm lost")
3. **Respond** with adjusted content (reset/reframe)

---

### Detection: How Do We Know User Is Struggling?

#### Detection Method 1: Explicit Signals (Easy)

**Always-visible "Help" button:**

```typescript
// UI: Always present in learning interface
<FloatingHelpButton>
  <IconButton onClick={handleStruggle}>
    <HelpIcon />
  </IconButton>
</FloatingHelpButton>

// When clicked:
function handleStruggle() {
  showStruggleDialog({
    title: "What's happening?",
    options: [
      {
        label: "This is moving too fast",
        action: "slow_down"
      },
      {
        label: "I'm not following the explanation",
        action: "reframe"
      },
      {
        label: "I need an example",
        action: "show_example"
      },
      {
        label: "Can we start over?",
        action: "reset"
      },
      {
        label: "Just let me type my question",
        action: "open_chat"
      }
    ]
  })
}
```

**Inline "explain again" links:**

```markdown
Types are essentially promises about data structure.

[Not following? Try another angle →]
```

**Reflection opt-out:**

```
During Reflect Mode:

"Now explain types in your own words..."

[I need to review first] ← Explicit signal of unreadiness
```

#### Detection Method 2: Implicit Behavioral Signals

**Signal A: Long pause after content**

```typescript
// User sees content, doesn't click "next" for 2+ minutes
const contentDisplayed = Date.now()

setTimeout(() => {
  const timeSinceDisplay = Date.now() - contentDisplayed
  
  if (timeSinceDisplay > 120000 && !userClickedNext) {
    // They're stuck or re-reading
    showGentlePrompt({
      message: "Taking your time? Want me to explain this differently?",
      options: ["I'm good, just thinking", "Yeah, explain again"]
    })
  }
}, 120000)
```

**Signal B: Repeatedly scrolling back**

```typescript
// User scrolls up and down multiple times
let scrollBackCount = 0

onScroll((event) => {
  if (event.direction === "up") {
    scrollBackCount++
  }
  
  if (scrollBackCount > 3) {
    // They're re-reading, likely confused
    showContextualHelp({
      message: "Need me to break this down more?",
      anchor: currentScrollPosition
    })
  }
})
```

**Signal C: Hover on "Next" without clicking**

```typescript
// User hovers over "Next" button but doesn't click (5+ seconds)
// They're uncertain whether to proceed

onButtonHover("next", (duration) => {
  if (duration > 5000) {
    showTooltip({
      message: "Not sure? It's okay to ask for clarification!",
      action: openHelpDialog
    })
  }
})
```

**Signal D: Reflection response is very short or vague**

```typescript
// Already covered in edge cases, but bears repeating

const reflection = userSubmitsReflection()

if (reflection.split(" ").length < 10) {
  // Too short - they don't know how to answer
  struggle_detected = true
}

if (reflection.match(/idk|not sure|confusing|don't get/i)) {
  // Explicit confusion
  struggle_detected = true
}
```

**Signal E: Asking basic questions mid-path**

```typescript
// During a path on "advanced types", user asks:
"What's a type again?"

// This is a reset signal - they're lost
→ detectStruggle({
  type: "lost_fundamentals",
  action: "restart_simpler"
})
```

#### Detection Method 3: LLM Analysis of User Language

```typescript
async function detectStruggleFromMessage(
  message: string
): Promise<StruggleSignal | null> {
  
  const analysis = await callLLM({
    prompt: `
SYSTEM: Detect if learner is struggling.

USER MESSAGE: "${message}"

STRUGGLE INDICATORS:
- Confusion phrases ("huh?", "wait", "I'm lost")
- Questions about basics when we're advanced
- Hedging language ("I guess...", "maybe...")
- Meta-comments ("this is hard", "I don't understand")

OUTPUT: JSON
{
  "isStruggling": boolean,
  "confidence": 0.0-1.0,
  "indicators": string[],
  "suggestedAction": "reframe" | "simplify" | "reset" | "example"
}
`
  })
  
  if (analysis.isStruggling && analysis.confidence > 0.7) {
    return {
      detected: true,
      indicators: analysis.indicators,
      suggestedAction: analysis.suggestedAction
    }
  }
  
  return null
}
```

---

### Response: What Do We Do When Struggle Is Detected?

#### Response Strategy 1: Reset the Pacing (Slow Down)

```typescript
async function resetPacing(
  currentPath: MicroPath,
  profile: LearnerProfile
): Promise<MicroPath> {
  
  // Regenerate path with explicit "slow down" instruction
  
  const slowerPath = await generatePath({
    topic: currentPath.topic,
    profile: profile,
    
    additionalInstructions: `
IMPORTANT: Learner is feeling overwhelmed. Adjust:

1. PACE: Slower. One concept at a time.
2. STEPS: Break current step into 2-3 smaller steps.
3. EXAMPLES: More concrete examples before abstractions.
4. CHECKPOINTS: Add understanding checks after each mini-step.

EXAMPLE of slower pacing:
  ORIGINAL: "Types are contracts. They specify inputs and outputs."
  
  SLOWER: 
    Step 1: "What's a contract in the real world? 
             It's a promise. 'I'll do X if you do Y.'"
    
    Step 2: "Code has promises too. When you call a function,
             you expect certain inputs and outputs, right?"
    
    Step 3: "A type is just that promise, written down.
             It says: 'Give me a string, I'll give you a number.'"
`
  })
  
  return slowerPath
}
```

**UI Indication:**
```
[Notification appears]
"Let's slow this down. I'm going to break this into smaller pieces."

[Path regenerates with more granular steps]
```

#### Response Strategy 2: Rotate the Framing (Different Angle)

```typescript
async function rotateFraming(
  concept: string,
  currentFraming: string,
  profile: LearnerProfile
): Promise<string> {
  
  // Generate alternative explanation using different metaphor/angle
  
  const alternativeExplanation = await callLLM({
    prompt: `
SYSTEM: Learner didn't understand first explanation. Try different angle.

CONCEPT: ${concept}
ORIGINAL FRAMING: ${currentFraming}
LEARNER PROFILE: ${profile.metaphorBias}, ${profile.domains}

TASK: Re-explain using DIFFERENT:
- Metaphor (if we used "contract", try "recipe" or "map")
- Domain (if we used React, try Python or math)
- Abstraction level (if abstract, get concrete; if concrete, show pattern)

EXAMPLES OF ROTATION:

Original: "A monad is a design pattern for chaining operations"
Rotated: "Think of Promise.then(). Each step gets the result of the 
         previous step. That's monadic chaining."

Original: "Types specify the shape of data"
Rotated: "When you write interface ButtonProps { label: string }, 
         you're saying 'label must be text, not a number'. 
         That's a type—just a rule about what's allowed."

OUTPUT: New explanation (markdown)
`
  })
  
  return alternativeExplanation
}
```

**UI Indication:**
```
"Okay, let me try explaining this a different way..."

[Content morphs to new framing]

"Does this angle make more sense?"
[👍 Yes, better] [👎 Still confused]
```

#### Response Strategy 3: Provide Concrete Example

```typescript
async function provideConcreteExample(
  concept: string,
  profile: LearnerProfile
): Promise<CodeExample> {
  
  return await generateCodeExample({
    concept: concept,
    language: profile.domains[0], // Use their familiar language
    
    prompt: `
LEARNER IS CONFUSED BY ABSTRACT EXPLANATION.

GENERATE: Very concrete, runnable code example that demonstrates ${concept}.

REQUIREMENTS:
- Use ${profile.domains[0]}
- Include comments explaining every line
- Show before/after to illustrate the concept
- Keep it under 20 lines

EXAMPLE FORMAT:
\`\`\`typescript
// Without types (notice the problem):
function greet(name) {
  return "Hello, " + name.toUpperCase()
}

greet(42) // 💥 Runtime error! No toUpperCase() on numbers

// With types (caught at compile-time):
function greet(name: string) {
  return "Hello, " + name.toUpperCase()
}

greet(42) // ❌ TypeScript error: Argument must be string
\`\`\`
`
  })
}
```

#### Response Strategy 4: Full Reset (Start Over)

```typescript
async function resetPath(
  originalTopic: string,
  profile: LearnerProfile,
  struggleContext: StruggleSignal
): Promise<MicroPath> {
  
  // Go back to basics, assume less prior knowledge
  
  return await generatePath({
    topic: originalTopic,
    profile: {
      ...profile,
      // Temporarily lower their assessed knowledge
      confidence: { ...profile.confidence, [originalTopic]: 0.2 }
    },
    
    additionalInstructions: `
LEARNER STRUGGLED WITH PREVIOUS ATTEMPT.

START FROM SCRATCH:
1. Assume minimal prior knowledge
2. Build up from very basic foundation
3. Use simplest possible language
4. Heavy use of analogies and examples
5. Check understanding every 2-3 sentences

They struggled because: ${struggleContext.indicators.join(", ")}
`
  })
}
```

**UI Flow:**
```
User: "I don't get it"

System: "No problem! Want to:
  • Try a different explanation?
  • See a concrete example?
  • Start from the basics?
  
[User picks "Start from basics"]

System: "Okay, let's build this up from scratch. 
         Forget what I just said. Here's the foundation..."

[New path begins, much simpler]
```

---

### Proactive Struggle Prevention

**Instead of waiting for struggle, anticipate it:**

#### Checkpoint Questions (Frequent Validation)

```typescript
// After every 2-3 concepts, insert micro-checkpoint

interface CheckpointQuestion {
  type: "understanding_check"
  question: string
  quickResponse: boolean  // Not full reflection, just quick check
}

// Example:
{
  question: "Quick check: In your own words, what's a type? 
             (One sentence is fine!)",
  expectedKeywords: ["promise", "contract", "shape", "rule"],
  
  onResponse: async (response) => {
    if (containsKeywords(response, expectedKeywords)) {
      return "Great! Moving on..."
    } else {
      return "Hmm, let's clarify that before we continue..."
      → rotateFraming()
    }
  }
}
```

#### Complexity Meter (Visible Indicator)

```typescript
// Show user where they are on complexity curve

<ComplexityMeter>
  <Label>Pacing:</Label>
  <Dots>
    ●●●○○  {/* 3/5 complexity */}
  </Dots>
  <Controls>
    <Button onClick={() => adjustPacing("slower")}>Slower</Button>
    <Button onClick={() => adjustPacing("faster")}>Faster</Button>
  </Controls>
</ComplexityMeter>
```

#### Adaptive Micro-Pauses

```typescript
// After heavy conceptual content, force a pause

after_complex_explanation()

show_breather({
  message: "Take a breath. That was dense. Before we continue:",
  options: [
    "I'm good, keep going",
    "Let me re-read that",
    "Explain it again differently"
  ]
})
```

---

### Implementation Summary: Struggle Detection & Response

**Detection Methods (in priority order):**

1. **Explicit** - User clicks "I don't get it" button ✅ Most reliable
2. **Reflection quality** - Short/vague answers ✅ Already measuring
3. **Behavioral** - Long pauses, scrolling back ⚠️ Can implement
4. **Language analysis** - LLM detects confusion ⚠️ Requires testing

**Response Actions:**

| User Says | Detected Signal | System Response |
|-----------|----------------|-----------------|
| "Too fast" | Explicit | `resetPacing()` - Break into smaller steps |
| "I'm confused" | Explicit | `rotateFraming()` - Try different angle |
| "What's X?" (basic question) | Implicit | `provideExample()` - Show concrete code |
| [Vague reflection] | Implicit | Prompt: "Want me to explain differently?" |
| [Long pause] | Behavioral | "Taking time? Need help?" |
| "Start over" | Explicit | `resetPath()` - Begin from basics |

**Always Available UI:**
```typescript
<LearningInterface>
  {/* Main content */}
  
  {/* Always-present help */}
  <FloatingControls>
    <IconButton tooltip="I'm stuck">
      <HelpIcon onClick={showStruggleDialog} />
    </IconButton>
    
    <IconButton tooltip="Go slower">
      <SlowIcon onClick={() => adjustPacing("slower")} />
    </IconButton>
    
    <IconButton tooltip="Show example">
      <CodeIcon onClick={provideExample} />
    </IconButton>
  </FloatingControls>
</LearningInterface>
```

---

## Part 3: Implementation Roadmap

### What We Can Build in MVP

**✅ Doable in Phase 1:**
- Basic confidence tracking (self-report + reflection score)
- Explicit "I don't get it" button with response options
- Reflection-based understanding measurement
- Simple framing rotation (regenerate with "explain differently" prompt)

**⚠️ Phase 2 (Post-MVP):**
- Behavioral signal detection (pause tracking, scroll analysis)
- Transfer tests for structural understanding
- Graph-based understanding metrics
- Sophisticated quadrant-based responses

**🔮 Phase 3 (Advanced):**
- Real-time confidence adjustment based on micro-signals
- Predictive struggle detection (before user realizes they're lost)
- Multi-modal understanding assessment (not just text)

---

### Prompts We Need to Write

#### 1. Understanding Depth Analyzer

```typescript
const UNDERSTANDING_DEPTH_PROMPT = `
SYSTEM: Analyze the depth of this explanation.

TOPIC: {topic}
KEY CONCEPTS: {concepts}

LEARNER EXPLANATION:
{reflection}

SCORE (0.0-1.0) on:
- Breadth: Coverage of key points
- Depth: Surface vs deep understanding
- Connections: Links to other concepts
- Synthesis: Original thinking vs parroting

OUTPUT: JSON with scores and evidence
`
```

#### 2. Framing Rotator

```typescript
const ROTATE_FRAMING_PROMPT = `
SYSTEM: First explanation didn't land. Try different angle.

ORIGINAL: {original_explanation}
LEARNER PROFILE: {profile}

GENERATE: New explanation using different:
- Metaphor
- Domain/language
- Abstraction level

Keep the SAME concept, DIFFERENT framing.
`
```

#### 3. Struggle Detector

```typescript
const DETECT_STRUGGLE_PROMPT = `
SYSTEM: Is this learner struggling?

MESSAGE: {user_message}
CONTEXT: {learning_context}

INDICATORS:
- Confusion language
- Basic questions when advanced
- Hedging/uncertainty
- Meta-frustration

OUTPUT: JSON
{
  "isStruggling": boolean,
  "confidence": 0-1,
  "reason": string,
  "suggestedAction": string
}
`
```

#### 4. Simplified Path Generator

```typescript
const SIMPLIFY_PROMPT = `
SYSTEM: Learner struggled. Regenerate simpler.

ORIGINAL TOPIC: {topic}
WHAT DIDN'T WORK: {struggle_context}

GENERATE: Much simpler version
- Start from basics
- Smaller steps
- More examples
- Frequent understanding checks

TONE: Patient, encouraging, not condescending
`
```

---

## Part 4: Measurement & Validation

### How Do We Know This Works?

**Metrics to Track:**

```typescript
interface LearningQualityMetrics {
  // Confidence-understanding alignment
  overconfidenceRate: number      // % of high-conf, low-understanding
  imposterRate: number            // % of low-conf, high-understanding
  masteryRate: number             // % reaching both high
  
  // Struggle detection & response
  explicitStruggleEvents: number  // User clicked "help"
  implicitStruggleDetected: number // System detected
  falsePositives: number          // System thought they struggled, they didn't
  
  responseEffectiveness: {
    resetPacing: number           // % that helped after pacing reset
    rotateFraming: number         // % that helped after reframe
    provideExample: number        // % that helped after example
  }
  
  // Long-term
  conceptRetention: number        // Do they remember 1 week later?
  transferSuccess: number         // Can they apply in new contexts?
}
```

**Validation Studies:**

1. **A/B Test:** With vs without struggle detection
   - Measure: completion rates, reflection quality, retention

2. **Prompt Effectiveness:** Test different framing rotation prompts
   - Measure: user satisfaction, understanding improvement

3. **Quadrant Accuracy:** Is our confidence/understanding classification correct?
   - Method: User self-assessment vs our classification

---

## Summary: Vision → Implementation

| Vision Statement | How We Implement It | MVP Status |
|-----------------|-------------------|------------|
| "78% confidence but 31% structural understanding" | Multi-signal confidence tracking + reflection depth analysis + graph connectedness | ✅ Basic version in MVP |
| "Allow 'I don't get it' moments" | Always-visible help button + behavioral signal detection + adaptive response | ✅ Explicit signals in MVP, implicit in Phase 2 |
| "Reset the pacing" | Regenerate path with "slower" instruction + smaller steps | ✅ MVP |
| "Rotate the framing" | Regenerate with different metaphor/angle using targeted prompt | ✅ MVP |
| "Abstraction scaffolding" | Surface patterns across topics using graph analysis | ⚠️ Phase 2 |
| "Quiz-verified mastery" | 4-question quizzes per objective (MC, T/F, MC, Short Answer), ≥3/4 to pass | ✅ Implemented |
| "Adaptive density" | "Unpack this" breaks dense AI responses into 2–3 expanded chunks | ✅ Implemented |
| "Bold term awareness" | AI bolds all domain terms, injects known concepts into prompt for consistency | ✅ Implemented |

---

## Appendix A: Quiz-Gated Mastery System *(Implemented)*

### Design Rationale

Self-assessment checkboxes for objectives led to unreliable mastery signals. The quiz system replaces auto-completion with verified understanding:

### How It Works

1. **AI Assessment Phase:** During conversation, `assess-objectives` endpoint evaluates whether objectives have been sufficiently covered (not whether learner has mastered them)
2. **Ready to Quiz State:** Sufficiently-covered objectives transition to "ready to quiz" (🧪 amber pill in UI)
3. **Quiz Generation:** When learner clicks an amber pill, `/api/quiz/generate` creates a 4-question quiz:
   - Question 1: Multiple Choice
   - Question 2: True/False
   - Question 3: Multiple Choice
   - Question 4: Short Answer (essay)
4. **Grading:** MC/TF auto-graded client-side; short answer AI-graded via `/api/quiz/grade-essay` (score ≥ 0.6 = pass)
5. **Pass Threshold:** ≥3/4 correct → objective marked ✅ mastered
6. **Failure Path:** <3/4 → feedback shown with explanation of correct answers, retry available

### 3-State Objective Pills

| State | Visual | Meaning | Interaction |
|-------|--------|---------|-------------|
| Not ready | ○ (gray) | Objective not yet covered in conversation | Non-interactive |
| Ready to quiz | 🧪 (amber) | AI detected sufficient coverage | Click to start quiz |
| Mastered | ✅ (green) | Passed quiz with ≥3/4 | Non-interactive badge |

### Impact on Learning Mechanics

- **Confidence vs Understanding:** Quiz results provide a concrete structural understanding signal, not just self-reported confidence
- **Overconfidence detection:** Learners who think they understand but fail quizzes reveal confidence-understanding gaps
- **Active recall:** Quiz questions force retrieval practice, a proven learning technique

---

## Next Steps

### For MVP Development:

1. **Implement confidence tracking**
   - Add self-report slider after learning
   - Store reflection scores as confidence signal
   - Calculate weighted average

2. **Add "I don't get it" button**
   - Floating help button always visible
   - Dialog with response options (slower, reframe, example, reset)
   - Wire up response handlers

3. **Write core prompts**
   - Understanding depth analyzer
   - Framing rotator
   - Path simplifier

4. **Test with alpha users**
   - Does struggle detection work?
   - Do rotated framings help?
   - Measure overconfidence detection accuracy

---

**Document Status:** Implementation-Ready (Quiz system implemented)  
**Next Review:** After alpha testing  
**Owner:** Blast  
**Last Updated:** January 27, 2026
