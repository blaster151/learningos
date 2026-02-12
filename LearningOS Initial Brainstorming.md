# LearningOS

Place to build an idea that’s fire.

# What It Is

**LearningOS is a radically personal learning companion—built not from prewritten courses, but from conversation, curiosity, and context.** Instead of giving everyone the same curriculum, it listens to who *you* are: what you know, how you think, what lights you up—and builds your learning path in real time, metaphor by metaphor, concept by concept. It reflects back what you understand in your own words, helps you teach yourself better than any class could, and grows a concept map that’s uniquely yours. This isn’t just another educational tool—it’s the start of something new: a system that learns you as you learn, and helps you become the person who *gets it*.

(for dev blog) **LearningOS is what happens when you stop trying to adopt another course platform and start building a learning partner instead.** It doesn’t dump content on you—it asks what you know, how you think, what metaphors actually land for you, and builds your path from there. Every concept gets shaped in real time, every explanation is tailored, and when you teach it back (which you will), it listens and evolves with you. It remembers what matters, forgets the fluff, and connects ideas across domains in ways even you didn’t expect. This is learning as a system, not a syllabus. It’s like if ChatGPT had a memory, a purpose, and cared deeply about making you smarter.

# **Core UX Mechanics**

- **Reflect Mode**
  
    *Learner is prompted to "teach back" what they’ve just learned—activates deep recall, exposes fuzzy understanding, and gives the system a chance to confirm or course-correct their model.*
    
    *“Now you teach me.”*
    
- **Abstraction Scaffolding**
  
    *System detects repeatable conceptual shapes across learning modules and surfaces them just-in-time. These are framed in the learner’s own previous examples/metaphors (e.g., Redux reducers and `fold` as monoids).*
    
- **Dynamic Tone Modulation**
  
    *System tunes its communication style based on learner’s preferred tone (e.g., playful, formal, coachy, Socratic, cozy).*
    

# 🧠 **Learner Mental Models/tog**

- *“The user may have a 78% confidence level but only 31% structural understanding. System should model both.”*
- *“The best way to learn is to teach—so build reflective teaching moments into the loop.”*
- *“A second brain is still just a brain if it doesn't help me think in my own way.”*
  
    ## 🔁 **Feedback Loops**
    
    - *“Feedback during each micro-path checkpoint is used to dynamically adjust future path composition, sequence, or metaphor framing.”*
    - *System should allow for “I don’t get it” moments to reset the pacing or rotate the framing.*
    
    ## 🧭 **Personalization Variables**
    
    - Learner’s preferred **input modality** (e.g., dialogue, diagrams, code)
    - Preferred **conceptual metaphors** (e.g., “I think in frontend frameworks,” or “I like physical analogies”)
    - Emotional/intellectual **tone preference** (e.g., “lighthearted but deep,” “calm & precise,” “friendly but nerdy”)
    - Current **meta-goal state** (e.g., “just trying to follow my curiosity,” “working toward mastering ___,” “looking to apply this in my job/project”)

# 🔧 **MVP Skeleton**

What are the smallest set of working components that demonstrate the soul of this idea?

**Sections to include:**

- **Goal:** What the MVP proves or demonstrates
- **Core Loop:** Learner intake → personalized path → conversation-driven learning → reflection → realignment
- **Includes:**
    - Micro-path generator (just one topic category to start)
    - Reflect Mode (simplest possible)
    - Bite-sized content delivery
    - Summarizer or "Cheat Sheet" generator
    - Feedback → adjust loop
- **Excludes (for now):**
    - External plugins
    - Full-featured spaced repetition or export systems

🟨 Add a bullet list: *“We know we’re done with MVP when…”*

# 🗺️ **Visual System Map (Placeholder)**

> A place to embed or sketch a future diagram of system flows.
> 
- Until we drop in a visual, just list high-level components like:
    - Learner Onboarding
    - Profile & Preferences
    - Micro-path Builder
    - Concept Delivery
    - Reflection Mode
    - Feedback Handler
    - Personal Map Generator
    - Emergent Abstraction Tracker

You can also label this **"Learning Loop Architecture"** if you want to feel fancy.

# 💬 **Voice & Tone**

> What kind of teacher is this thing?
> 

Add a few example styles:

- “Like your nerdy future self who totally gets it”
- “Mix of Socratic tutor, jazz soloist, and friendly debugger”
- “Tone morphs based on user input (playful? poetic? precise?)”

🧪 Drop in example dialog snippets to show what it *feels* like.

# **📚 Domain Types & UI Modes**

> Not just what people want to learn—but how it should be presented
> 

Create a table or list like this:

| **Domain Type** | **UI Mode(s)** | **Notes** |
| --- | --- | --- |
| Conceptual Theory | Dialog, Diagrams | e.g. Category theory, logic |
| Programming / Code | Inline editor, Koans | e.g. Agda, Haskell, Langchain |
| Simulative Fields | Visual sims, timelines | e.g. chemistry, physics |
| Applied Creativity | Sandbox, prompts | e.g. writing, UX design |

🎯 This makes your system **content-agnostic but experience-aware**.

# 💡 **Glossary / Core Terms**

Start tracking system-native terms:

- **Reflect Mode** – learner teaches it back
    - **Abstraction Scaffolding** – surfacing shared structure across topics
    - **Micro-Path** – a modular step toward a macro-goal
    - **Macro-Target** – what the learner dreams of understanding
    - **Concept Graph** – the map of what they know & how it connects
    - **Learning Loop** – content → interaction → feedback → re-alignment
    - **Emergent Abstractions** – patterns the system detects from learner journeys
    
    Optional: give them emoji tags for visual charm.
    

# 🔍 Options for API Cost Models

### ✅ **Option 1: User Brings Their Own Key**

> “Plug in your OpenAI API key to get started!”
> 

**Pros:**

- Zero cost to you at scale
- User only pays for what they use
- Great for dev/early-adopter crowd

**Cons:**

- High friction onboarding
- Not beginner-friendly
- You lose control over cost smoothing, fallbacks, error handling
- Makes people feel like they're *installing a lab*, not *starting a journey*

**👉 Best for: alpha/beta mode, dev community previews**

---

### ✅ **Option 2: Shared App-Level OpenAI Key (paid by you)**

> You provide the backend key, users never touch API keys
> 

**Pros:**

- Seamless UX
- You can throttle usage / meter per-user if needed
- Enables tiered feature access
- Lets you manage load, caching, fallback models, etc.

**Cons:**

- You eat the cost (initially)
- Risk of abuse if not rate-limited
- Requires careful usage logging to avoid runaway charges

**👉 Best for: early access with a capped freemium plan**

---

### ✅ **Option 3: Metered Access with Subscription / Credit System**

> You provide access tiers: Free = X chats per week, Premium = full.
> 

**Pros:**

- Predictable cost recovery
- Smooth UX
- Enables perks: GPT-4 access, custom memory, priority compute, etc.

**Cons:**

- You’re now a SaaS platform (Stripe, auth, usage tracking)
- Requires onboarding flows that feel delightful, not extractive

**👉 Best for: v1 public launch**

## 💳 Suggested Tier Breakdown

| Tier | Access | Notes |
| --- | --- | --- |
| **Free** | - Limited GPT-4 sessions/week- 1–2 active micro-paths- Basic Reflect Mode- No deep memory | Onboarding-friendly, for the curious and the cautious |
| **Supporter** ($5/mo) | - 3–5x chat volume- Expanded micro-paths- Priority caching/memory- Custom tone settings | For people who want to go deeper, casually |
| **Pro** ($15–20/mo) | - Full access to all flows- Custom memory- Persistent profiles- Summary exports- "My Book" feature | This is the real journey tier |
| **Patron / Mentor** ($30+/mo) | - Everything in Pro- Support community- Ability to “gift” access- Influence roadmap | Feels like they're helping build the cathedral |

---

# 🔥 Risk Factors & Mitigations

### 🤖 Overuse / Abuse

- **Risk:** Heavy users consume API calls way beyond what’s sustainable
- **Mitigation:**
    - Light rate-limiting (“You’ve reached today’s reflection limit. Let’s pause and breathe.”)
    - Friendly notifications, not hard failures
    - Token counters *only shown if requested* (transparency without pressure)

---

### 📉 Loss of Control Over Costs

- **Risk:** Usage spikes before revenue exists
- **Mitigation:**
    - Start small, use GPT-3.5 for non-Reflect interactions
    - Offload longform summarization to cheaper model
    - Add daily/monthly user caps in early beta
    - Create dev-only testing tier with fixed mock responses

---

### 🧠 Perceived Value

- **Risk:** Users don’t understand what makes this different than “just using ChatGPT”
- **Mitigation:**
    - **Tone & personalization** front and center
    - Give learners a “first micro-path” experience that *proves* the concept
    - Reflect Mode + “You said this earlier…” moments
    - Show them their *learning map growing*

---

### 🔒 Context / Memory Concerns

- **Risk:** Stateless LLM sessions feel disconnected
- **Mitigation:**
    - Use **local memory** (e.g. store profile/context per user and inject into system prompts)
    - Let users **customize their memory** (what to retain across sessions)
    - Offer **session summaries** to restart with coherence
    - Tag previous thoughts: *“Looks like you once connected ‘category theory’ to ‘Redux reducers’. Want to revisit?”*

---

# 🧠 On Memory: Some Model-Agnostic Strategy

Even without built-in stateful memory:

- Store:
    - Learner goals
    - Past questions
    - Micro-path progress
    - Learning metaphors they use
    - Self-descriptions (“I think visually,” “I like short examples”)

Then inject dynamically into:

- System prompts
- Micro-path generators
- Reflect Mode entries

> Effect: Learners feel known, even across sessions
> 

Even with OpenAI today, we can *simulate continuity better than most platforms do with full backend state.*

# 🗺️ Visual System Map (LearningOS Architecture)

> “How does the system flow from learner curiosity to conceptual clarity?”
> 

### 🔹 High-Level Flow

1. **Learner Intake**
    - Goal discovery
    - Learning tone & metaphor preferences
    - Prior knowledge (real + self-perceived)
2. **Micro-Path Generator**
    - Based on goal + current state
    - Selects Domain Type (e.g. Conceptual, Code-Interactive)
    - Outputs sequence of modular learning moments
3. **Learning Delivery Loop**
    - Conversational instruction
    - Visuals, code, metaphors
    - Reflect Mode checkpoints
    - Summaries + cheat sheets
4. **Feedback Layer**
    - Real-time adjustments to tone/content
    - Learner flags confusion or interest
    - Optional progress nudges or “slow down” triggers
5. **Memory & Evolution**
    - Update learner concept graph
    - Adjust future micro-paths
    - Build “My Book of Understanding” (exportable wiki view)

---

### 🔸 Component Blocks

- **Profile Engine** (user metaphors, tone, pace)
- **Content Synthesizer** (LLM with context injection)
- **Reflect Engine** (feedback-based reconstruction)
- **Concept Graph Builder** (growing visual map)
- **Export Tools** (cheat sheets, journal, glossary)

---

# 👩‍💻 Grace: A Learner Flow

> “I build React apps, but I want to understand what types really are. Everyone keeps talking about monads, and I smile and nod... but I want it to click.”
> 

---

### 🎯 What Grace *says* she wants:

- “I want to understand type theory.”
- “I’m curious about functional programming.”
- “Everyone says Haskell makes sense once you get it.”

### 💡 What Grace *really* wants:

- To see that what she already knows (like React state, `useReducer`, Redux, `Promise.then`) is *a shadow* of deeper patterns
- To feel *not behind*, but *already halfway there*

---

### 🔁 How LearningOS responds:

**Intake:**

- Detects her tone: conversational, confident but curious
- Tags her experience: React dev, mid-senior level, fluent in JS patterns
- Picks initial domain path: *“Category Theory Through Frontend Abstractions”*

---

**First Micro-Path Title:**

> “From useReducer to Monoids: How State Updates Compose”
> 

**Content:**

- React reducer as a binary operation
- Initial state = identity
- Associativity of action chaining
- Monoid defined through *exactly* this pattern

---

**Reflect Mode Prompt:**

> “Can you explain how your app's state management already satisfies the monoid laws? Teach me, like I’m your junior dev.”
> 

**Grace’s response:**

> “Okay… so my reducer combines state and action, and I guess if I apply dispatch in order, it doesn’t matter how I group them… oh.”
> 

✅ **Lightbulb.**

---

**Follow-up Path Options Offered:**

- “Fold vs Reduce: Aggregating Patterns”
- “Side Effects and Sequencing: Promises as Monads?”
- “Why Types Are More Than Constraints: They’re Guarantees”

---

And boom—she’s *in*.

The system scaffolds her curiosity with real-time reinforcement of what she already gets, what she’s building, and where it leads next.

# Teacher Selection Onboarding

## 🎩 Choose Your Guide

> Your learning journey is deeply personal. Choose a mentor whose voice matches the way you like to think. Don’t worry—you can always switch later.
> 

---

### 🧠 Gödel

*The Analyst*

- Speaks precisely, recursively, and with quiet intensity
- Will prove your soul in Peano arithmetic
- Metaphors built from formal logic and abstract structure

🗣️ “Let’s trace this from the axioms. No shortcuts.”

---

### 🧩 Escher

*The Visual Thinker*

- Loves paradoxes and impossible diagrams
- Will literally draw you a new perspective
- Best for learning through patterns, feedback loops, and twisting intuitions

🗣️ “Come walk this staircase with me. It never ends.”

---

### 🎼 Bach

*The Harmonizer*

- Explains concepts through rhythm, structure, and metaphor
- Every abstraction is a motif
- Feels the shape of ideas before defining them

🗣️ “This function is a fugue in disguise.”

---

## 🔒 Secret Mentors (Unlockable)

- **Ada** – The first code poet
  
    *Speaks in vision, creativity, and exacting prose*
    
- **Turing** – The machine whisperer
  
    *Cares deeply about what is computable… and why*
    
- **CategoryBot 3000** –
  
    *Communicates entirely through commuting diagrams. No words. No apologies.*
    

---

💡 **Unsure?**

Choose one. Switch anytime. Or let the system assign a tone based on how you think.

# Glossary

## 📖 Glossary Philosophy: What Makes This Different?

Traditional glossaries:

- Are static
- Are intimidating
- Define everything as if everyone’s a textbook

**This glossary:**

- Is dynamic
- Speaks in the learner’s language
- Grows with the learner’s journey
- Stores “what this used to mean to me” and “what it means now”
- Reflects how a term *fits* inside their growing concept graph

> It's not just a dictionary. It’s the history of your understanding.
> 

---

---

## 🌈 Future Feature: **Glossary-as-Experience**

Every entry could:

- Show how you defined it *last time*
- Offer “Show me this in code / a diagram / my own words”
- Let you “Teach it to Grace” as a micro-review challenge
- Trigger Reflect Mode if you hover long enough with uncertainty

## 📘 LearningOS Glossary (Starter Terms)

> These are core concepts used throughout the LearningOS system. Each one will evolve as you learn—your understanding grows, and so does the definition.
> 

---

### 🔁 Reflect Mode

*“The best way to learn is to teach it back.”*

A moment where the system prompts the learner to explain a concept in their own words. Used to check comprehension, reveal misunderstandings, and reinforce ideas.

*Also trains you to internalize abstraction as communicable structure.*

---

### 🧱 Abstraction Scaffolding

The system’s method of surfacing deep patterns or common structures between seemingly unrelated concepts.

“You’ve seen this shape before.”

Connects previous metaphors, topics, and mental models.

---

### 🧩 Micro-Path

A short, focused conceptual journey tailored to the learner’s current knowledge and goals.

Each micro-path builds one idea clearly and connects it to others.

Stack enough of them = you build toward your macro-target.

---

### 🎯 Macro-Target

A larger conceptual goal the learner wants to reach.

Examples: “Understand type theory,” “Be able to explain recursion to my team,” “Grasp what a Hilbert space is.”

The system builds paths toward this, step by personalized step.

---

### 🧠 Concept Graph

A growing internal map of your learning—shows how ideas connect, build on each other, and reappear.

Used for:

- Surfacing scaffolding
- Generating custom reviews
- Showing your personal “theory of understanding”

---

### ✍️ Learner Voice

The unique tone, metaphor style, and language that the system adapts to.

You shape it with:

- Your questions
- Your explanations
- Your choices of guides and topic framings

---

### 📚 My Book (or “My Understanding”)

A generated, exportable representation of your learning journey.

Includes:

- Definitions in your own words
- Diagrams and metaphors you used
- Reflect Mode moments
- “What I used to think” vs “What I now understand”

---

### 🌱 Emergent Abstraction

A pattern or connection between concepts that *you* discover, or that LearningOS notices across your journey.

Stored, tagged, and optionally contributed to the community graph of insights.

---

# Design Principles

- Prompt compression, smart reuse of known info, and caching summaries to minimize re-sending user data
- Memory, learning, open-ended knowledge, rewriting & extension

# Slogan (or Rotating Virtual Hype-Man) Ideas

- The tutor you would’ve invented for yourself if you had a lab and a lifetime.
- The thing you wish college had been.

# **Candidate Bullet Points for Promo Material**

- Remembers how you like metaphors
- Speaks in your rhythm
- Teaches in the way your brain actually learns
- Reflects back not just **what you got wrong**, but **how you’re evolving**
- A **learning co-pilot**
- A **conversation-to-curriculum engine**
- A system that **helps you connect ideas across your own life**
- And eventually? A platform where learners **teach each other without realizing it**, because their questions shape better responses for everyone else.
- Turn any field, including “what do I want to learn?” into a dynamic prompt expansion chat that feels like you’re co-authoring the question with someone who cares

# Advantages

Even with OpenAI today, we can *simulate continuity better than most platforms do with full backend state.*

# External Systems We Can Leverage

## 🖼️ Diagrams and Visual Learning Trackers

> “Mermaid diagrams? Regex playgrounds? Visuals of learner progress?”
> 

💥 YES to all. I can generate:

- **Mermaid.js** syntax (flowcharts, class diagrams, graphs)
- **WebSequenceDiagrams** markup
- **Graphviz DOT** format
- **Regex101** style test suites
- **Blender Python scripts**
- **SVG / Canvas-compatible instructions**
- *Static HTML/JS/CSS snippets* for embedding explainers

# 🏗️ When to Generate Content vs. When to Cache It

> “Do we prewrite micro-loops? Or generate on the fly every time?”
> 

This is *the* foundational design tension for AI platforms. Here’s the hybrid model:

### 📦 Prebuilt (cached/generated-once):

- Definitions
- First-time analogies
- Diagrams
- Reflect prompts
- Cheat sheets

### 🔁 Live / Conversational:

- Help mode
- Reasoning-through logic
- “What am I missing?” clarifications
- “Can you slow this down for me?”
- Reflect Mode answers + feedback

✅ *We can also generate once → store summary → reframe later* to avoid re-tokenizing.

# 🛠️ External Tooling Capability Checklist

Here’s what we *can generate / wire up* right now:

| Tool / Format | GPT Can Generate It? | Embed into Product? | Costly to Run? |
| --- | --- | --- | --- |
| Mermaid diagrams | ✅ | ✅ | 🟢 No |
| Code editors/tests | ✅ | ✅ (via embeds) | 🟢 No |
| Regex playgrounds | ✅ | ✅ (e.g. Regex101) | 🟢 No |
| Concept Graphs | ✅ (in markup) | ✅ (Mermaid, D3) | 🟢 No |
| Dynamic module linking | ✅ (via reasoning) | ✅ | 🟠 Moderate (API call) |
| Book/video recs | ✅ (via web search/API) | ✅ (webhooks/embed) | 🟠 Moderate |

# Multilingual Support

> Yes. Because we have GPT-4.
> 
- GPT-4 supports multilingual inputs and can be prompted to reply natively in:
    - 🇪🇸 Spanish
    - 🇫🇷 French
    - 🇯🇵 Japanese
    - 🇩🇪 German
    - 🇮🇳 Hindi
    - 🇧🇷 Portuguese
    - ✅ Others

💡 We can have the **LearnerProfileParser** extract *preferred language + metaphor style*

💡 We can dynamically translate Reflect Mode prompts

💡 We can even offer *side-by-side responses* for bilingual learning (premium feature?

# 🤯 Learner Visualization, T-Shirts, and “Better Than Khan” Badges

> ✅ Microlesson thumbnails that show “what you’ve out-learned”
> 
> 
> ✅ Exportable learning paths = yes
> 
> ✅ Printable diagrams + visual trackers = yes
> 
> ✅ Self-generating visual cheat sheets = YES
> 
> ✅ “Path on a T-shirt” = merch idea of the century
> 
> ✅ Blog/devlog = massive potential (we *could* obfuscate magic while showcasing breakthroughs)
> 

# ✅ **Use Mistral or other lightweight models for helper tasks?**

**Absolutely.** Think of it like this:

| **Task Type** | **Model** |
| --- | --- |
| Fast summarizing | Mistral / Claude / GPT-3.5 |
| Personalized lesson weaving | GPT-4 |
| Concept graph updates | Internal logic / Mistral |
| Tiny clarifiers | Open-source model w/ embeddings |

💡 We could build an **internal “skills router”**—our own little AI load balancer.

# 🧢 Blog/devlog: Medium vs Homegrown

If we want **inbound traffic + organic SEO**, we go:

- **Homegrown blog** (e.g. blog.learningos.com)
- Static site generator (e.g. Astro, Next.js)
- Tailor to:
    - Founder's voice (👋 you)
    - Devlog entries (deep builds)
    - User stories (insane paths learners took)

**Then cross-post highlights to Medium** or dev.to with canonical tags.

Use the blog to explain:

- “What a micro-path is”
- “How Reflect Mode works”
- “Why this changes everything”

# Future Ideas

### 🧠 GPT-powered VSCode extension — but *personalized*?

> “You mentioned generics in C#... so this concept will feel familiar.”
> 

### 🧸 Fun stickers / thumbnails / logos?

YES. GPT-4 can:

- Generate **SVG sticker components**
- Describe logo ideas
- Write promptable templates for services like [Looka](https://looka.com/), [Brandmark](https://brandmark.io/), Hatchful

And we can literally make a feature called:

> ✨ “Earned Stickers”
> 
> 
> *Custom-generated art that reflects the metaphor you used to learn something.*
> 

(Imagine a 🐑 sheep with monad sunglasses titled “You Herd the Function.”)

### 🌍 Internationalization + Metaphor Mapping

> “Do high-concept tech terms translate well?”
> 

Most: **yes**.

Some: **absolutely don’t**, which is why…

💡 **Metaphor bias detection** helps:

If someone uses music metaphors in Spanish, we **use music metaphors in Spanish**.

If someone says *“variables are like containers”* → we note “object metaphor bias.”

And yes, we can infer *metaphor style* from:

- Explicit profile
- Natural language usage
- Which kinds of prompts they “light up” in response to

**And THAT is the memory you carry across micro-paths.** 🔥

# Tech Stack

- **React + Tailwind + Firebase** → rock-solid MVP core
- **Next.js**: Optional; can absolutely add it (esp. if you want SSR, route-based content)
- **TypeScript?** YES. Treat it as *formalized shared language* across client and server. Especially when:
    - Generating prompt types
    - Representing micro-path graphs
    - Managing reflection schemas
- **Vite** (builds)

# LearningOS Prompt Framework

This document describes reusable prompt templates used throughout the system.

Each prompt defines a goal, interaction type, and output schema.

---

## 🧠 1. LearnerProfileParser

**PromptType:** `mini-convo`

**Goal:** Convert a learner’s natural-language description of their background into a structured JSON profile

**Used In:** Onboarding, profile enrichment, Reflect Mode input

### Initial Prompt (system):

> “You are a thoughtful tutor and learning architect. Your job is to ask a learner clarifying questions about their current knowledge, background, metaphors they use, and what they hope to understand. Then, synthesize this into a structured learner profile in JSON form.”
> 

### First user message example:

> “I’m a frontend dev, I use React and Redux. I sort of get functional programming but never clicked with monads. I’m curious about type theory and would love to feel fluent in Haskell someday.”
> 

### Output structure:

```json
{
  "domains": [...],
  "confidence": { "React": 0.9, ... },
  "metaphor_bias": [...],
  "tone_preference": "...",
  "known_unknowns": [...],
  "preferred_learning_style": "...",
  "suggested_questions": [...]
}
```

## 📘 2. MicropathGenerator

**PromptType:** `one-shot`

**Goal:** Generate a micro-lesson around a specific topic, tuned to the learner’s profile

### Prompt:

> “Create a metaphor-driven learning micro-path that introduces the concept of [TOPIC] to a learner who prefers [style/metaphors]. Use no equations. Include: title, learning goal, mini-content, reflect prompt, feedback example, and follow-up path options. Format in Markdown.”
> 

## 🔁 3. ReflectPromptWriter

**PromptType:** `one-shot` or `mini-convo`

**Goal:** Generate a tailored prompt to help learners re-express a concept they just explored

### Prompt:

> “Write a friendly, slightly challenging prompt that invites the learner to explain [CONCEPT] in their own words. Prefer analogies they’ve used before if available.”
> 

**Examples:**

- “How is your app's state reducer a monoid?”
- “Can you explain a field like it's a temperature map?”

## 🧭 4. HelpMeThinkAgent

**PromptType:** `mini-convo`

**Goal:** Turn a vague or underdeveloped question into a clarified, structured version

### Initial prompt:

> “You are a calm, helpful coach who asks short, focused questions to help learners clarify what they want to ask. Your goal is to help them phrase the best version of their own question, using metaphors or analogies they respond well to.”
> 

### Example Use:

User types:

> “I don’t really get monads.”
> 
> 
> → Bot: “Where have you seen the term used before—code, math, or metaphors?”
> 
> → … few rounds later:
> 
> “I want to understand monads as they apply to `Promise.then()` in JavaScript.”
> 

**Output:**

```json
{
  "clarified_goal": "Understand monads through Promise.then chaining",
  "related_knowledge": ["JavaScript", "asynchronous programming"],
  "preferred_frame": "code-based metaphor"
}

```

## 📝 5. ClarifyingQuestionsOnlyBot

**PromptType:** `mini-convo`

**Goal:** Ask 1–3 targeted follow-up questions based on a learner’s freeform input

### Prompt:

> “You are an onboarding coach. A learner just shared their background. Ask 2–3 thoughtful questions that will help you better understand their experience, tone preference, and knowledge gaps.”
> 

**System Behavior:**

- Never explain—only ask
- Gently phrased
- Uses references to what they just said

## 🧾 6. CheatSheetSummarizer

**PromptType:** `one-shot`

**Goal:** Generate a concise, personalized summary of a concept in the learner’s own terms

### Prompt:

> “Summarize this concept in 4–5 bullets, referencing the metaphors, analogies, or frames this learner previously used. Emphasize what they already understood and where they made breakthroughs.”
> 

**Example Output:**

### Cheat Sheet: Monoids

- Think of a reducer in Redux: it combines actions in order.
- A monoid is just: an identity + an associative binary function.
- You've already been using them anytime you chained `.reduce()` in JS.
- When you realized order didn’t matter, that was associativity.

## 📚 7. ConceptGraphUpdater

**PromptType:** `one-shot` or `mini-convo`

**Goal:** Integrate new learner insights into their personal concept graph

### Prompt:

> “You are maintaining a concept graph for a learner. Given their latest Reflect Mode response and the current micro-path topic, identify what concepts have been reinforced, introduced, or connected. Return a list of updates in structured form.”
> 

### Input includes:

- Learner’s current concept graph
- Their Reflect Mode response
- Topic of current micro-path

### Output:

```json
{
  "added_concepts": ["scalar field", "vector field"],
  "reinforced_concepts": ["functions as mappings"],
  "linked_concepts": [
    { "from": "temperature map", "to": "scalar field", "type": "metaphor" }
  ],
  "suggested_next_topics": ["field operators", "wave equations"]
}
```

## 🧠 8. MemoryCondenser (Session Compressor)

**PromptType:** `one-shot`

**Goal:** Take a long conversation or learning session and distill it into an efficient state summary for reuse

### Prompt:

> “Given this transcript of a learning session, produce a memory summary that retains all necessary conceptual updates, metaphors, learner phrasing, and progress milestones, while removing filler or redundant prompts. Output a compact memory object for reinjection into future prompts.”
> 

### Output format:

{

[
"learned_concepts": ["monoids", "reducer patterns"],
"key_metaphors": ["state update as composition", "reducers as monoids"],
"new_links": ["JavaScript Promises → monadic chaining"],
"flagged_uncertainties": ["associativity in non-code contexts"],
"summarized_reflections": [
"I realized chaining `.reduce()` is associative.",
"Redux has always been using this pattern—I just didn't know the name."
]

}

---

# 📝 Retrospective: Where Epic Planning Refined the Vision

*Added February 11, 2026 — notes from translating this brainstorming doc into epics and stories.*

When converting the vision into implementable stories, a few things got *sharper* in ways worth recording back here:

### 1. Persona ≠ Tone (now orthogonal systems)

This doc blends "choose your guide" (Gödel/Escher/Bach) with "tone preference" (playful/formal/Socratic). In the epics, these became two independent systems:

- **Persona** (E9) = *what voice* speaks — the character, metaphor palette, worldview
- **Tone Matrix** (E10) = *how it speaks* — formality, energy, humour, technicality

This means you can have "Bach, but calm and technical" or "Gödel, but playful." The original doc's "lighthearted but deep ≠ playful" observation actually demanded this split — a single dropdown couldn't express it.

### 2. Achievement opt-out (respecting different learner types)

This doc is all enthusiasm about badges, stickers, and "Better Than Khan" moments. The epics added an explicit opt-out (E12-S4: Achievement Preferences). Some learners find gamification distracting or patronising — especially the "calm & precise" crowd. Celebrating progress matters, but so does respecting the learner who just wants to *learn*.

### 3. Backward compatibility for evolving preferences

When tone goes from a single value ("conversational") to a 4-axis matrix, what happens to existing profiles? The epics include a migration story (E10-S2) that maps old values to the nearest matrix equivalent. The brainstorming doc (understandably) doesn't think about users who already exist — but any live system has to.

### 4. CategoryBot 3000 got real

"Communicates entirely through commuting diagrams. No words. No apologies." This was a joke-that-wasn't-a-joke in the brainstorming doc. It's now a real unlockable mentor (E9-S5) with actual acceptance criteria — including "the system respects the bit" (responses are primarily Mermaid/ASCII diagrams with minimal text). The unlock criteria ties it to the achievement system: connect 25+ concepts in your graph. If you've built a graph that dense, you've earned the right to learn from pure diagrams.

### 5. Cheat Sheet Summarizer was always implied, never explicit

The `CheatSheetSummarizer` prompt template (#6 in the Prompt Framework section below) was fully designed, but no user story existed for it anywhere — not in MVP, not in Phase 2. It fell through the cracks between "prompt design" and "feature planning." Now it's E3-S10, tied to path completion.