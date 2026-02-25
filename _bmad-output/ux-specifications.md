# LearningOS: Detailed UX Specifications

**Project:** LearningOS  
**Version:** 1.0  
**Date:** January 27, 2026  
**Author:** Blast  
**Purpose:** Component-level UX flows, screen states, interactions, and wireframe descriptions for MVP

---

## Document Structure

Each screen/component documented with:
- **Purpose:** What this screen accomplishes
- **Entry Points:** How users arrive here
- **Wireframe Description:** Layout in detail
- **Component States:** Loading, empty, populated, error
- **Interactions:** What users can do, system responses
- **Validation Rules:** Input constraints
- **Edge Cases:** Unusual scenarios and handling
- **Exit Points:** Where users go next
- **Accessibility:** A11y considerations

---

## Table of Contents

1. [Landing Page](#1-landing-page)
2. [Authentication Flow](#2-authentication-flow)
3. [Onboarding Flow](#3-onboarding-flow)
4. [Dashboard (Home)](#4-dashboard-home)
5. [Learning Session (Path Mode)](#5-learning-session-path-mode)
6. [Reflect Mode](#6-reflect-mode)
7. [Chat Mode](#7-chat-mode)
8. [Concept Map](#8-concept-map)
9. [Profile Settings](#9-profile-settings)
10. [Global Components](#10-global-components)

---

## 1. Landing Page

### Purpose
Convert visitors to signups. Communicate value proposition clearly.

### Entry Points
- Direct URL (learningos.com)
- Shared links
- Search engine results

### Wireframe Description

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                              │
│  ┌──────────┐                           ┌────────┐ ┌────────────────┤
│  │ LearningOS│                          │ Log In │ │ Get Started →  │
│  │   Logo    │                          │ (text) │ │ (primary btn)  │
│  └──────────┘                           └────────┘ └────────────────│
├─────────────────────────────────────────────────────────────────────┤
│  HERO SECTION                                                        │
│                                                                      │
│     ┌─────────────────────────────────────────────────┐             │
│     │                                                  │             │
│     │  "Learn anything, your way."                    │             │
│     │                                                  │             │
│     │  [Subheadline: A conversational learning         │             │
│     │   companion that adapts to how YOU think]        │             │
│     │                                                  │             │
│     │     ┌──────────────────────────┐                │             │
│     │     │   Start Learning Free →   │                │             │
│     │     └──────────────────────────┘                │             │
│     │                                                  │             │
│     └─────────────────────────────────────────────────┘             │
│                                                                      │
│                    [Animated concept graph visual]                   │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  VALUE PROPS (3 columns)                                             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   🎯         │  │   🧠         │  │   📊         │               │
│  │ Personalized │  │ Teach to     │  │ Track Your   │               │
│  │ Paths        │  │ Learn        │  │ Growth       │               │
│  │              │  │              │  │              │               │
│  │ Built around │  │ Reflect Mode │  │ Visual       │               │
│  │ YOUR examples│  │ cements      │  │ concept map  │               │
│  │ & metaphors  │  │ understanding│  │ shows journey│               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  HOW IT WORKS (Numbered steps)                                       │
│                                                                      │
│  1. Tell us about yourself (quick chat)                              │
│  2. Pick what you want to learn                                      │
│  3. We create personalized micro-lessons                             │
│  4. Teach it back to cement understanding                            │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  TESTIMONIAL / SOCIAL PROOF                                          │
│  (Phase 2 - placeholder for launch)                                  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  CTA SECTION                                                         │
│                                                                      │
│     Ready to learn differently?                                      │
│     ┌──────────────────────────┐                                    │
│     │   Get Started Free →      │                                    │
│     └──────────────────────────┘                                    │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                              │
│  About | Privacy | Terms | Contact | Twitter                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Component States

| State | Appearance |
|-------|------------|
| Default | Full page as shown |
| Mobile | Single column, stacked sections |
| Loading | Skeleton placeholder for animated graph |

### Interactions

| Element | Action | Response |
|---------|--------|----------|
| "Get Started" button | Click | Navigate to /signup |
| "Log In" link | Click | Navigate to /login |
| Logo | Click | Scroll to top |
| Animated graph | Hover | Nodes highlight, show concept labels |

### Edge Cases
- **Already logged in:** Redirect to /dashboard automatically
- **Deep link with topic:** Redirect to signup with topic pre-filled

### Accessibility
- Skip link to main content
- Alt text for all images
- Focus-visible styles on all interactive elements
- Color contrast AAA for text

---

## 2. Authentication Flow

### 2a. Sign Up Page

### Purpose
Create new account. Capture email/password or OAuth.

### Entry Points
- Landing page CTA
- Login page "Create account" link
- Direct URL /signup

### Wireframe Description

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                                                       │
│  │ LearningOS│                                              [Log In]│
│  └──────────┘                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│              ┌─────────────────────────────────┐                    │
│              │                                 │                    │
│              │       Create Your Account       │                    │
│              │                                 │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ Continue with Google    │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ Continue with GitHub    │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  ──────── or ────────          │                    │
│              │                                 │                    │
│              │  Email                          │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │                         │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  Password                       │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │          ••••••    👁    │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │  (min 8 chars, shown on focus)  │                    │
│              │                                 │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │   Create Account →       │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  Already have account? Log in   │                    │
│              │                                 │                    │
│              │  By signing up, you agree to    │                    │
│              │  Terms of Service and Privacy   │                    │
│              │                                 │                    │
│              └─────────────────────────────────┘                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Validation Rules

| Field | Rules | Error Message |
|-------|-------|---------------|
| Email | Required, valid email format | "Please enter a valid email address" |
| Password | Required, min 8 chars | "Password must be at least 8 characters" |

### Component States

| State | Appearance |
|-------|------------|
| Default | Form as shown |
| Email focused | Blue border, label floats up |
| Password focused | Show requirements hint below |
| Submitting | Button shows spinner, fields disabled |
| Error (validation) | Red border on field, error text below |
| Error (server) | Toast notification at top |

### Interactions

| Element | Action | Response |
|---------|--------|----------|
| Google OAuth | Click | Redirect to Google, return to /onboarding on success |
| GitHub OAuth | Click | Redirect to GitHub, return to /onboarding on success |
| Email field | Blur | Validate format |
| Password field | Focus | Show requirements hint |
| Eye icon | Click | Toggle password visibility |
| Create Account | Click | Validate → Submit → Navigate to /onboarding |
| "Log in" link | Click | Navigate to /login |

### Edge Cases
- **Email already exists:** "This email is already registered. Log in instead?" with link
- **OAuth account exists with different provider:** "This email is registered with Google. Please log in with Google."
- **Network error:** "Unable to connect. Please check your internet and try again."

### Exit Points
- Success → /onboarding (first-time user flow)
- "Log in" → /login

---

### 2b. Login Page

### Wireframe Description

```
┌─────────────────────────────────────────────────────────────────────┐
│              ┌─────────────────────────────────┐                    │
│              │                                 │                    │
│              │         Welcome Back            │                    │
│              │                                 │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ Continue with Google    │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ Continue with GitHub    │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  ──────── or ────────          │                    │
│              │                                 │                    │
│              │  Email                          │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │                         │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  Password                       │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │                    👁    │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │              Forgot password?   │                    │
│              │                                 │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │      Log In →            │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  New here? Create account       │                    │
│              │                                 │                    │
│              └─────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component States

| State | Appearance |
|-------|------------|
| Default | Form as shown |
| Submitting | Button spinner, fields disabled |
| Invalid credentials | Form shakes, "Invalid email or password" error |
| Too many attempts | Show "Too many attempts. Try again in 5 minutes." |

### Edge Cases
- **Account not found:** "No account found. Create one?" (avoid revealing if email exists for security)
- **Account locked:** "Account temporarily locked. Reset password?"
- **Unverified email:** (Phase 2: email verification)

### Exit Points
- Success (has profile) → /dashboard
- Success (no profile) → /onboarding
- "Create account" → /signup
- "Forgot password" → /reset-password

---

## 3. Onboarding Flow

### Purpose
Build learner profile through conversational intake. Capture preferences, domains, metaphors, tone.

### Entry Points
- After signup (automatic redirect)
- After login (if profile incomplete)

### Flow Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                       ONBOARDING FLOW                             │
│                                                                   │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐       │
│  │ Welcome │ → │ About   │ → │ Learning│ → │ First   │         │
│  │         │    │ You     │    │ Prefs   │    │ Topic   │         │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘         │
│      │              │              │              │                │
│      v              v              v              v                │
│   Greeting     Background     Tone/Style     Pick topic           │
│   + name       + domains      + metaphor     + generate           │
│                                              first path           │
│                                                   │                │
│                                                   v                │
│                                          ┌──────────────┐         │
│                                          │  Dashboard   │         │
│                                          │  with path   │         │
│                                          └──────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

### 3a. Welcome Screen

### Wireframe Description

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│    Progress: ○ ○ ○ ○  (Step 1 of 4)                                 │
│                                                                      │
│              ┌─────────────────────────────────┐                    │
│              │                                 │                    │
│              │  👋 Hey there!                  │                    │
│              │                                 │                    │
│              │  I'm your learning companion.   │                    │
│              │  Let's get to know each other   │                    │
│              │  so I can personalize your      │                    │
│              │  experience.                    │                    │
│              │                                 │                    │
│              │  What should I call you?        │                    │
│              │                                 │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │  Your name              │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │      Continue →          │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  This takes about 3 minutes.    │                    │
│              │  You can always update later.   │                    │
│              │                                 │                    │
│              └─────────────────────────────────┘                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Validation
- Name: Required, 1-50 characters, no special chars except hyphen/apostrophe

---

### 3b. About You (Conversational)

### Wireframe Description

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│    Progress: ● ○ ○ ○  (Step 2 of 4)                                 │
│                                                                      │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ CHAT INTERFACE                                              │   │
│    │                                                             │   │
│    │  ┌──────────────────────────────────────────────┐          │   │
│    │  │ 🤖 Nice to meet you, {name}!                  │          │   │
│    │  │                                               │          │   │
│    │  │ Tell me a bit about your background. What do │          │   │
│    │  │ you work with? What are you experienced in?  │          │   │
│    │  │                                               │          │   │
│    │  │ (No wrong answers - just helps me understand │          │   │
│    │  │ what examples and metaphors will click for   │          │   │
│    │  │ you!)                                         │          │   │
│    │  └──────────────────────────────────────────────┘          │   │
│    │                                                             │   │
│    │                                                             │   │
│    │  ┌──────────────────────────────────────────────┐          │   │
│    │  │ 👤 I'm a frontend developer, mostly React    │          │   │
│    │  │ and TypeScript. Some Node. Not much          │          │   │
│    │  │ experience with FP or type theory.           │          │   │
│    │  └──────────────────────────────────────────────┘          │   │
│    │                                                             │   │
│    │  ┌──────────────────────────────────────────────┐          │   │
│    │  │ 🤖 Great! So when I explain things, I can    │          │   │
│    │  │ use React components as analogies. That'll   │          │   │
│    │  │ make abstract concepts click faster!         │          │   │
│    │  │                                               │          │   │
│    │  │ Do you have any examples or metaphors that   │          │   │
│    │  │ have helped you understand tricky concepts   │          │   │
│    │  │ in the past?                                  │          │   │
│    │  └──────────────────────────────────────────────┘          │   │
│    │                                                             │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│    ┌────────────────────────────────────────────┐ ┌──────────────┐  │
│    │ Type your response...                      │ │ Send →       │  │
│    └────────────────────────────────────────────┘ └──────────────┘  │
│                                                                      │
│    [Skip this step]                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### AI Interaction Logic

**Turn 1 (System):** Ask about background/domains
**Turn 2 (User):** Response captured, extract domains
**Turn 3 (System):** Acknowledge domains, ask about metaphors
**Turn 4 (User):** Response captured, extract metaphor preferences
**Turn 5 (System):** Summarize understanding, proceed to next step

### Component States

| State | Appearance |
|-------|------------|
| AI thinking | Typing indicator (three dots animation) |
| AI responding | Text streams in word by word |
| User typing | Input active, Send button enabled |
| Error | "Something went wrong. Try again?" with retry button |

### Data Captured
```typescript
{
  domains: ["React", "TypeScript", "Node"],
  metaphorBias: ["code-based", "frontend frameworks"],
  rawIntakeText: "I'm a frontend developer..." // Store for later analysis
}
```

### Edge Cases
- **User gives one-word answers:** AI prompts for more detail
- **User skips:** Profile saved with minimal data, can expand later
- **AI timeout:** Show "Taking longer than expected..." after 10s

---

### 3c. Learning Preferences

### Wireframe Description

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│    Progress: ● ● ○ ○  (Step 3 of 4)                                 │
│                                                                      │
│              ┌─────────────────────────────────┐                    │
│              │                                 │                    │
│              │  How do you like to learn?      │                    │
│              │                                 │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ ◉ Conversational        │    │                    │
│              │  │   Chat-style, casual     │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ ○ Formal & Structured   │    │                    │
│              │  │   Precise, textbook-like │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ ○ Playful & Creative    │    │                    │
│              │  │   Analogies, humor, fun  │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ ○ Socratic              │    │                    │
│              │  │   Guided by questions    │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  ─────────────────────────      │                    │
│              │                                 │                    │
│              │  What brings you here?          │                    │
│              │                                 │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ ◉ Just curious          │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ ○ Mastering a topic     │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ ○ Need it for work      │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ ○ Preparing to teach    │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │      Continue →          │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              └─────────────────────────────────┘                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Captured
```typescript
{
  tonePreference: "conversational",
  metaGoal: "curiosity"
}
```

---

### 3d. First Topic Selection

### Wireframe Description

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│    Progress: ● ● ● ○  (Step 4 of 4)                                 │
│                                                                      │
│              ┌─────────────────────────────────┐                    │
│              │                                 │                    │
│              │  What would you like to learn   │                    │
│              │  first, {name}?                 │                    │
│              │                                 │                    │
│              │  Based on your background, you  │                    │
│              │  might enjoy:                   │                    │
│              │                                 │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ Functional Programming  │    │                    │
│              │  │ with JavaScript          │    │  ← AI suggested   │
│              │  └─────────────────────────┘    │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ TypeScript Advanced     │    │                    │
│              │  │ Types                    │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ Monads Explained        │    │                    │
│              │  │ (for JS devs)           │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  ──────── or ────────          │                    │
│              │                                 │                    │
│              │  Something else:                │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │ Type any topic...       │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              │  ┌─────────────────────────┐    │                    │
│              │  │   Start Learning →       │    │                    │
│              │  └─────────────────────────┘    │                    │
│              │                                 │                    │
│              └─────────────────────────────────┘                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Component States

| State | Appearance |
|-------|------------|
| Default | Show AI-suggested topics |
| Custom topic | Free text input active |
| Generating path | Full screen loading with "Creating your personalized path..." |

### AI Logic for Suggestions
Based on extracted domains + knownUnknowns, suggest 3 topics that:
1. Connect to existing knowledge
2. Align with expressed interests
3. Are learnable in ~10-15 min

### Exit Points
- Select topic → Generate path → /dashboard with first path ready
- Skip → /dashboard with empty state

---

## 4. Dashboard (Home)

### Purpose
Central hub. Show progress, continue learning, access features.

### Entry Points
- After onboarding
- After login (returning user)
- Logo click from any page

### Wireframe Description

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                              │
│  ┌──────────┐                    ┌──────┐ ┌──────┐ ┌─────────────┐  │
│  │ LearningOS│                   │ Chat │ │ Map  │ │ ⚙ Settings  │  │
│  └──────────┘                    └──────┘ └──────┘ └─────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  GREETING                                                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  Good morning, {name}! 👋                                      │  │
│  │                                                                │  │
│  │  You've learned 12 concepts across 3 domains.                  │  │
│  │  Ready to keep going?                                          │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CONTINUE LEARNING (if in-progress path exists)                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  ▶ Continue: "Monads for JS Developers"                        │  │
│  │    Step 3 of 5 • ~5 min remaining                              │  │
│  │                                                                │  │
│  │    ████████░░░░ 60%                                           │  │
│  │                                                                │  │
│  │    [Continue Learning →]                                       │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  START NEW PATH                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  What do you want to learn?                                    │  │
│  │  ┌──────────────────────────────────────────────┐  ┌────────┐ │  │
│  │  │ Type a topic or question...                  │  │ Go →   │ │  │
│  │  └──────────────────────────────────────────────┘  └────────┘ │  │
│  │                                                                │  │
│  │  Or explore:                                                   │  │
│  │  [Suggested 1] [Suggested 2] [Suggested 3]                     │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  LEARNING STATE INDICATOR (Quadrant Badge)                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  Your current state:                                           │  │
│  │                                                                │  │
│  │  ┌────────────────────┐                                        │  │
│  │  │  🌱 Building Up    │  You're laying foundations.            │  │
│  │  │                    │  Keep going!                           │  │
│  │  │  Confidence: ██░░  │                                        │  │
│  │  │  Understanding: █░░│                                        │  │
│  │  └────────────────────┘                                        │  │
│  │                                                                │  │
│  │  [What does this mean?]                                        │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  RECENT ACTIVITY                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  📚 Completed "Higher-Order Functions" • 2 days ago            │  │
│  │  📚 Completed "Pure Functions" • 3 days ago                    │  │
│  │  💡 Made a connection: map → functors                          │  │
│  │                                                                │  │
│  │  [View Concept Map →]                                          │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Component States

| State | Condition | Appearance |
|-------|-----------|------------|
| First visit | No paths completed | Welcome message, skip "Continue" section |
| Has in-progress | Path started, not finished | Show Continue section prominently |
| All complete | No active path | Hide Continue, emphasize "Start New" |
| Streak active | (Phase 2) | Show streak badge |

### Data Requirements
```typescript
interface DashboardData {
  user: { name: string }
  currentPath?: { id, title, step, totalSteps, percentComplete }
  stats: { conceptCount, domainCount, pathsCompleted }
  recentActivity: Activity[]
  suggestedTopics: string[]
  learnerState: { confidence, understanding, quadrant }
}
```

### Interactions

| Element | Action | Response |
|---------|--------|----------|
| Continue Learning | Click | Navigate to /path/{pathId} |
| Topic input | Submit | Generate path → Navigate to /path/{newPathId} |
| Suggested topic pill | Click | Fill input with topic |
| "What does this mean?" | Click | Open modal explaining quadrant system |
| View Concept Map | Click | Navigate to /map |

### Edge Cases
- **No activity yet:** Show encouraging empty state
- **Path generation fails:** "Having trouble creating this path. Try a different topic?"
- **Stale session:** If >30 days inactive, show "Welcome back!" variant

---

## 5. Learning Session (Path Mode)

### Purpose
Deliver personalized micro-learning path. Step-by-step content with checkpoints.

### Entry Points
- Dashboard "Continue" or "Start"
- Concept map node click
- Chat mode "Create path" suggestion

### Wireframe Description

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                              │
│  ┌──────┐                                          ┌──────────────┐ │
│  │ ← Back│  Monads for JS Developers               │ Step 2 of 5  │ │
│  └──────┘                                          └──────────────┘ │
│                                                                      │
│  PROGRESS BAR                                                        │
│  ████████░░░░░░░░░░░░░░░░░░░░░░ 40%                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CONTENT AREA                                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  ## What's a Monad, Really?                                    │  │
│  │                                                                │  │
│  │  You know how in React, you might wrap data in a component     │  │
│  │  to give it extra capabilities? A monad is similar—it's a      │  │
│  │  wrapper that gives values extra powers.                       │  │
│  │                                                                │  │
│  │  Remember `Promise.then()`? That's actually a monad in         │  │
│  │  disguise! Each `.then()` takes the result of the previous     │  │
│  │  step and passes it to the next function.                      │  │
│  │                                                                │  │
│  │  ```javascript                                                 │  │
│  │  // This is monadic!                                           │  │
│  │  fetch('/api/user')                                            │  │
│  │    .then(response => response.json())                          │  │
│  │    .then(user => user.name)                                    │  │
│  │    .then(name => console.log(name))                            │  │
│  │  ```                                                           │  │
│  │                                                                │  │
│  │  The key pattern:                                              │  │
│  │  1. Wrap a value (Promise wraps async result)                  │  │
│  │  2. Transform with `.then()` (or `flatMap` in other langs)     │  │
│  │  3. Chain transformations together                             │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CHECKPOINT (optional, not every step)                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  Quick check: In your own words, what does `.then()` do?       │  │
│  │                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │                                                         │  │  │
│  │  │ (textarea for response)                                 │  │  │
│  │  │                                                         │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  [Skip] [Submit Answer]                                        │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  NAVIGATION                                                          │
│  ┌────────────────┐                          ┌────────────────────┐ │
│  │ ← Previous     │                          │  Next Step →       │ │
│  └────────────────┘                          └────────────────────┘ │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  FLOATING HELP BUTTON (always visible)                               │
│                                                              ┌─────┐ │
│                                                              │ 🆘  │ │
│                                                              │Stuck│ │
│                                                              └─────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Component States

| State | Appearance |
|-------|------------|
| Loading step | Skeleton with shimmer |
| Content loaded | Markdown rendered with syntax highlighting |
| Checkpoint active | Show question + textarea |
| Checkpoint answered | Show feedback, enable Next |
| Last step | "Next" becomes "Complete & Reflect" |

### Content Types

| Type | Rendering |
|------|-----------|
| text | Markdown with typography |
| code | Syntax-highlighted with copy button |
| diagram | Mermaid.js rendered (Phase 2) |

### Interactions

| Element | Action | Response |
|---------|--------|----------|
| Back | Click | Confirm if unsaved → Navigate to dashboard |
| Previous | Click | Go to step N-1 |
| Next | Click | Save progress → Go to step N+1 |
| Checkpoint Submit | Click | Send to analysis → Show feedback |
| Skip (checkpoint) | Click | Mark skipped → Enable Next |
| Help button | Click | Open struggle dialog |
| Code block | Hover | Show "Copy" button |
| Copy button | Click | Copy to clipboard, show "Copied!" toast |

### Struggle Dialog

```
┌───────────────────────────────────────┐
│                                       │
│  🤔 What's tripping you up?           │
│                                       │
│  ○ I need this explained differently  │
│  ○ Can I see a concrete example?      │
│  ○ I think I missed something earlier │
│  ○ This is too advanced for me        │
│  ○ Something else (tell me)           │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ Optional: tell me more...       │  │
│  └─────────────────────────────────┘  │
│                                       │
│  [Cancel] [Help Me →]                 │
│                                       │
└───────────────────────────────────────┘
```

### Response Actions

| Selection | System Response |
|-----------|-----------------|
| Explain differently | Regenerate step with rotated framing |
| Concrete example | Add code/real-world example |
| Missed something | Link to prerequisite concept or quick recap |
| Too advanced | Offer to simplify or start with basics |
| Something else | Open chat mode with context |

### Data Captured
```typescript
// On each step completion
{
  stepId: string
  timeSpent: number  // seconds
  checkpointResponse?: string
  checkpointScore?: number
  helpRequested: boolean
  helpType?: string
}
```

### Edge Cases
- **Long content:** Scrollable content area
- **User idle >5min:** Gentle nudge "Still there?"
- **Network loss:** Save progress locally, sync on reconnect
- **Path generation failed mid-path:** "Having trouble. Would you like to continue with Chat Mode instead?"

---

## 6. Reflect Mode

### Purpose
"Teach back" moment. User explains what they learned, system analyzes understanding.

### Entry Points
- End of learning path ("Complete & Reflect")
- Manual trigger from concept map

### Wireframe Description

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                              │
│  Reflect Mode: Monads                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  INSTRUCTION                                                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  🎓 Time to teach!                                             │  │
│  │                                                                │  │
│  │  Imagine you're explaining monads to a fellow React developer  │  │
│  │  who hasn't seen them before. How would you describe:          │  │
│  │                                                                │  │
│  │  • What a monad IS                                             │  │
│  │  • Why it's useful                                             │  │
│  │  • How it relates to something they already know               │  │
│  │                                                                │  │
│  │  Don't worry about being perfect—this helps cement YOUR        │  │
│  │  understanding, and I'll give you feedback.                    │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  RESPONSE AREA                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  (large textarea)                                              │  │
│  │                                                                │  │
│  │                                                                │  │
│  │                                                                │  │
│  │                                                                │  │
│  │                                                                │  │
│  │                                                                │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Word count: 0 (aim for 50-200 words)                               │
│                                                                      │
│  ┌─────────────────────────┐                                        │
│  │   Submit Reflection →   │                                        │
│  └─────────────────────────┘                                        │
│                                                                      │
│  [Skip reflection] (you'll miss out on feedback)                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### After Submission - Feedback

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ANALYSIS RESULT                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  ✨ Great reflection, {name}!                                  │  │
│  │                                                                │  │
│  │  UNDERSTANDING SCORE                                           │  │
│  │  ████████░░ 78%                                               │  │
│  │                                                                │  │
│  │  💪 What you nailed:                                           │  │
│  │  • You correctly identified the "wrapper" pattern              │  │
│  │  • Good connection to Promise.then()                           │  │
│  │  • Clear explanation of chaining                               │  │
│  │                                                                │  │
│  │  🔍 To strengthen:                                             │  │
│  │  • You mentioned "wrapper" but didn't explain WHY we wrap      │  │
│  │  • The relationship to flatMap wasn't covered                  │  │
│  │                                                                │  │
│  │  📝 Here's a refined definition you can save:                  │  │
│  │  "A monad is a design pattern that wraps values to enable      │  │
│  │  sequential operations while handling context (like async,     │  │
│  │  errors, or state) automatically."                             │  │
│  │                                                                │  │
│  │  [Save to My Glossary]                                         │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  QUADRANT UPDATE                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  Your state for "Monads":                                      │  │
│  │                                                                │  │
│  │  Before: 🌱 Beginner → After: 💡 Getting It                    │  │
│  │                                                                │  │
│  │  Confidence: ██████░░ 75%                                     │  │
│  │  Understanding: ██████░░ 78%                                   │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  NEXT STEPS                                                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  What would you like to do next?                               │  │
│  │                                                                │  │
│  │  [Go Deeper: Monad Laws] [Related: Functors] [Back to Home]    │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Component States

| State | Appearance |
|-------|------------|
| Writing | Textarea active, word count updating |
| Submitting | Full-screen loading "Analyzing your reflection..." |
| Results | Feedback panel as shown above |
| Error | "Couldn't analyze. Would you like to try again or skip?" |

### Validation
- Minimum 20 words (encourage effort)
- Maximum 2000 words (prevent token overflow)

### Data Captured
```typescript
{
  pathId: string
  reflectionText: string
  analysis: {
    score: number
    breadth: number
    depth: number
    connections: number
    synthesis: number
  }
  conceptsCovered: string[]
  conceptsMissed: string[]
  misconceptions: Misconception[]
  suggestedDefinition: string
  timeSpent: number
}
```

### Graph Updates
After reflection:
1. Create/update concept nodes for covered concepts
2. Add edges based on connections mentioned
3. Update confidence/understanding scores
4. Flag emergent connections (user-discovered)

---

## 7. Chat Mode

### Purpose
Free-form exploration. Ask questions, get explanations, explore curiosity.

### Entry Points
- Header nav "Chat"
- Dashboard "Ask anything"
- Struggle dialog "Something else"

### Wireframe Description

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                              │
│  ┌──────────┐                    ┌──────┐ ┌──────┐ ┌─────────────┐  │
│  │ LearningOS│                   │ Chat │ │ Map  │ │ ⚙ Settings  │  │
│  │           │                   │ ████ │ │      │ │             │  │
│  └──────────┘                    └──────┘ └──────┘ └─────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CHAT AREA                                                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────┐              │  │
│  │  │ 👤 What's the difference between map and     │              │  │
│  │  │ flatMap? I keep getting confused.            │              │  │
│  │  └──────────────────────────────────────────────┘              │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────┐              │  │
│  │  │ 🤖 Great question! Since you know React,      │              │  │
│  │  │ let me use an analogy:                        │              │  │
│  │  │                                               │              │  │
│  │  │ **map** is like rendering a list of items:    │              │  │
│  │  │ ```jsx                                        │              │  │
│  │  │ items.map(item => <Item {...item} />)        │              │  │
│  │  │ ```                                           │              │  │
│  │  │ You get one component per item.               │              │  │
│  │  │                                               │              │  │
│  │  │ **flatMap** is like when each item might      │              │  │
│  │  │ render multiple things:                       │              │  │
│  │  │ ```jsx                                        │              │  │
│  │  │ items.flatMap(item => [                       │              │  │
│  │  │   <Item {...item} />,                         │              │  │
│  │  │   <Separator />                               │              │  │
│  │  │ ])                                            │              │  │
│  │  │ ```                                           │              │  │
│  │  │                                               │              │  │
│  │  │ `map` keeps structure. `flatMap` flattens.    │              │  │
│  │  │                                               │              │  │
│  │  │ Does that help? Want me to go deeper?         │              │  │
│  │  └──────────────────────────────────────────────┘              │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────┐              │  │
│  │  │ 👤 Yes! That helps. But why is it called     │              │  │
│  │  │ "flat"Map if it's adding more items?         │              │  │
│  │  └──────────────────────────────────────────────┘              │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────┐              │  │
│  │  │ 🤖 [typing...]                                │              │  │
│  │  └──────────────────────────────────────────────┘              │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  SUGGESTION PILLS (context-aware)                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  [Show me code] [Create a learning path] [Add to my concepts]  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  INPUT                                                               │
│  ┌──────────────────────────────────────────────────────┐ ┌──────┐ │
│  │ Ask anything...                                       │ │ Send │ │
│  └──────────────────────────────────────────────────────┘ └──────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Component States

| State | Appearance |
|-------|------------|
| Empty | Welcome message + suggested questions |
| Active conversation | Messages displayed with streaming |
| AI thinking | Typing indicator |
| AI streaming | Text appears word by word |
| Error | "Couldn't respond. Try again?" |

### Suggestion Pills (Dynamic)
Based on conversation context:
- After explanation: "Show me code", "Go deeper", "Create path"
- After code: "Explain this", "Why does this work?"
- After question: "Related concept", "Opposite of this"

### Quick Actions Bar *(Implemented)*

Displayed below every AI response message:

| Button | Label | Behavior |
|--------|-------|----------|
| 💡 | Explain more | Sends "Can you explain that in more detail?" |
| 📝 | Example | Sends "Can you give me a concrete example?" |
| ❓ | Quiz me | Sends "Quiz me on what we just covered" |
| 🎯 | Simplify | Triggers "Simplify this" crossfade (replaces message with simpler version) |
| 🔬 | Unpack this | Calls `/api/chat/unpack` to split response into 2–3 expanded chunks |
| 📍 | Continue milestone | *(Only shown during milestone chats)* Lists remaining objectives, asks AI to resume |

### Objective Quiz UI *(Implemented)*

Inline quiz displayed above the objectives tracker when a "ready to quiz" objective is clicked:

```
┌─────────────────────────────────────────────────────────────────┐
│  OBJECTIVE PILLS (3-state)                                       │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ ✅ Obj 1  │ │ 🧪 Obj 2     │ │ ○ Obj 3      │                │
│  │ (green)   │ │ (amber,click)│ │ (gray)       │                │
│  └──────────┘ └──────────────┘ └──────────────┘                │
├─────────────────────────────────────────────────────────────────┤
│  QUIZ (inline, when 🧪 clicked)                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Question 1 of 4 — Multiple Choice          ● ● ○ ○       │  │
│  │                                                            │  │
│  │ "What is the primary purpose of..."                       │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────┐                  │  │
│  │  │ ○ Option A                           │                  │  │
│  │  │ ○ Option B                           │                  │  │
│  │  │ ○ Option C                           │                  │  │
│  │  │ ○ Option D                           │                  │  │
│  │  └─────────────────────────────────────┘                  │  │
│  │                                                            │  │
│  │        [Submit Answer]        [Cancel Quiz]               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  RESULTS (after all 4 questions)                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Score: 3/4 — ✅ Passed!                                    │  │
│  │                                                            │  │
│  │ Q1 ✅  Q2 ✅  Q3 ❌  Q4 ✅                                 │  │
│  │                                                            │  │
│  │ Q3 Feedback: "The correct answer is B because..."         │  │
│  │                                                            │  │
│  │        [Continue Learning]                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Quiz Flow:**
1. AI marks objective "ready to quiz" during conversation assessment
2. Learner clicks amber 🧪 pill → quiz generates (4 questions)
3. Step-by-step: MC → T/F → MC → Short Answer
4. MC/TF auto-graded client-side; short answer AI-graded via API
5. ≥3/4 correct → objective marked ✅ mastered
6. <3/4 → feedback shown, retry available

### Unpack This UI *(Implemented)*

When "🔬 Unpack this" is clicked on an AI response:

```
┌─────────────────────────────────────────────────────────────────┐
│  ORIGINAL MESSAGE (collapsed)                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 📦 Unpacked into 3 parts (show original)                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  CHUNK 1 (indigo border, visible)                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1️⃣ [Expanded explanation of first concept...]              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  CHUNK 2 (indigo border, visible)                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 2️⃣ [Expanded explanation of second concept...]             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│           [Next part (3 of 3)]                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Unpack Flow:**
1. Learner clicks "🔬 Unpack this" on any AI message
2. Original crossfades to collapsed "📦 Unpacked into N parts" indicator
3. First chunk appears immediately with indigo border
4. "Next part" button progressively reveals remaining chunks
5. "Show original" link collapses chunks and restores original message with crossfade

### Bold Terms Behavior *(Implemented)*

- AI bolds **all domain-relevant terms** in every response (target: 3–8 per message)
- Bolded terms are clickable — clicking sends "Tell me about **{term}**" as next message
- System prompt includes up to 50 of the user's previously learned concept names for consistent bolding
- Bold formatting applies to: technical terms, concept names, methodology names, theory names

### Interactions

| Element | Action | Response |
|---------|--------|----------|
| Send | Click/Enter | Submit message, show AI response |
| Suggestion pill | Click | Insert as user message, submit |
| "Create learning path" | Click | Generate path from topic, navigate |
| "Add to my concepts" | Click | Extract concept, add to graph |
| Code block | Hover | Show "Copy" button |

### Session Management
- Chat persists within session
- New session = fresh conversation
- Context includes recent session history + profile
- Token budget: ~4000 for history, compress older messages

### Edge Cases
- **Long response:** Stream incrementally, allow interrupt
- **Off-topic:** Gentle redirect "I'm focused on learning—want to explore that topic through a path?"
- **Inappropriate:** "I can't help with that. Let's get back to learning!"

---

## 8. Concept Map

### Purpose
Visualize knowledge graph. See connections, track growth, explore concepts.

### Entry Points
- Header nav "Map"
- Dashboard "View Concept Map"
- After reflection

### Wireframe Description

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                              │
│  ┌──────────┐                    ┌──────┐ ┌──────┐ ┌─────────────┐  │
│  │ LearningOS│                   │ Chat │ │ Map  │ │ ⚙ Settings  │  │
│  │           │                   │      │ │ ████ │ │             │  │
│  └──────────┘                    └──────┘ └──────┘ └─────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TOOLBAR                                                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Filter by domain: [All ▼]  [Zoom +] [Zoom -] [Fit] [Export]  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  GRAPH VISUALIZATION                                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │                    ┌─────────┐                                 │  │
│  │                    │ Monads  │                                 │  │
│  │                    │   🌟    │ ← Mastery                       │  │
│  │                    └────┬────┘                                 │  │
│  │                         │                                      │  │
│  │            ┌────────────┼────────────┐                         │  │
│  │            │            │            │                         │  │
│  │       ┌────▼────┐  ┌────▼────┐  ┌────▼────┐                   │  │
│  │       │Functors │  │Promises │  │ Maybe   │                   │  │
│  │       │   💡    │  │   🌟    │  │   🌱    │                   │  │
│  │       └────┬────┘  └─────────┘  └─────────┘                   │  │
│  │            │                                                   │  │
│  │       ┌────▼────┐                                             │  │
│  │       │  map()  │                                             │  │
│  │       │   🌟    │                                             │  │
│  │       └─────────┘                                             │  │
│  │                                                                │  │
│  │  Legend: 🌟 Mastery  💡 Getting It  🌱 Learning  ⭕ Not started │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  SIDE PANEL (when node selected)                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  📘 Monads                                                     │  │
│  │                                                                │  │
│  │  Your definition:                                              │  │
│  │  "A wrapper pattern for sequential operations with context"    │  │
│  │                                                                │  │
│  │  State: 🌟 Mastery                                             │  │
│  │  Confidence: ██████████ 92%                                    │  │
│  │  Understanding: █████████░ 88%                                 │  │
│  │                                                                │  │
│  │  Learned: 3 days ago                                           │  │
│  │  Last reflected: 2 days ago                                    │  │
│  │                                                                │  │
│  │  [Start path] [Reflect again] [View in glossary]               │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Node Visualization

| Quadrant | Icon | Node Style |
|----------|------|------------|
| Mastery | 🌟 | Gold border, solid fill |
| Getting It (Imposter) | 💡 | Blue border, light fill |
| Learning (Beginner) | 🌱 | Green border, dashed outline |
| Overconfident | 🤔 | Orange border, striped fill |
| Not started | ⭕ | Gray, dotted outline |

### Edge Visualization

| Type | Style |
|------|-------|
| Prerequisite | Solid arrow |
| Related | Dashed line |
| Abstraction | Thick double line |
| User-discovered | Glowing/animated |

### Interactions

| Element | Action | Response |
|---------|--------|----------|
| Node | Click | Select, show side panel |
| Node | Double-click | Open "Start path" for that concept |
| Edge | Hover | Show relationship label |
| Canvas | Drag | Pan view |
| Canvas | Scroll | Zoom in/out |
| Fit button | Click | Zoom to fit all nodes |
| Export | Click | Download as PNG or SVG |
| Filter | Select | Show/hide nodes by domain |

### Empty State
```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  Your concept map is empty!                                   │
│                                                               │
│  As you learn, your concepts will appear here as an           │
│  interconnected web of knowledge.                             │
│                                                               │
│  [Start your first path →]                                    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Performance
- Lazy load nodes (render only visible)
- Cluster large graphs (collapse related nodes)
- WebGL rendering for 100+ nodes (Phase 2)

---

## 9. Profile Settings

### Purpose
Manage account, preferences, export data.

### Entry Points
- Header settings icon
- Dashboard avatar click

### Wireframe Description

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                              │
│  ┌──────┐                                                           │
│  │← Back│  Settings                                                  │
│  └──────┘                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SIDEBAR              CONTENT                                        │
│  ┌──────────────┐    ┌───────────────────────────────────────────┐  │
│  │              │    │                                            │  │
│  │ ▶ Profile    │    │  Profile                                   │  │
│  │   Account    │    │                                            │  │
│  │   Learning   │    │  Display Name                              │  │
│  │   Data       │    │  ┌─────────────────────────┐               │  │
│  │              │    │  │ Blast                   │               │  │
│  │              │    │  └─────────────────────────┘               │  │
│  │              │    │                                            │  │
│  │              │    │  Email                                     │  │
│  │              │    │  blast@example.com (from auth)             │  │
│  │              │    │                                            │  │
│  │              │    │  ─────────────────────────                 │  │
│  │              │    │                                            │  │
│  │              │    │  Learning Style                            │  │
│  │              │    │  ┌─────────────────────────┐               │  │
│  │              │    │  │ Conversational       ▼  │               │  │
│  │              │    │  └─────────────────────────┘               │  │
│  │              │    │                                            │  │
│  │              │    │  Current Goal                              │  │
│  │              │    │  ┌─────────────────────────┐               │  │
│  │              │    │  │ Just curious          ▼  │               │  │
│  │              │    │  └─────────────────────────┘               │  │
│  │              │    │                                            │  │
│  │              │    │  Domains (edit your expertise)             │  │
│  │              │    │  [React ×] [TypeScript ×] [Node ×] [+ Add] │  │
│  │              │    │                                            │  │
│  │              │    │  [Save Changes]                            │  │
│  │              │    │                                            │  │
│  └──────────────┘    └───────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Sections

**Profile:**
- Display name
- Learning style (tone preference)
- Current goal (meta-goal)
- Domains/expertise

**Account:**
- Email (read-only)
- Change password
- Linked accounts (Google, GitHub)
- Subscription tier
- Delete account

**Learning Preferences:**
- Quadrant visibility (show/hide on dashboard)
- Gamification (enable/disable achievements)
- Language preference (Phase 2)
- Persona selection (Phase 2)

**Data:**
- Export My Book (markdown/PDF)
- Export concept graph (JSON)
- Export all data (GDPR compliance)
- Delete learning data (reset, keep account)

### Interactions

| Element | Action | Response |
|---------|--------|----------|
| Save Changes | Click | Validate → Save → Toast "Saved!" |
| Delete Account | Click | Confirm modal → "Are you sure? This is permanent." |
| Export | Click | Generate file → Download |
| Add domain | Click | Open tag input |
| Remove domain (×) | Click | Remove with confirmation |

---

## 10. Global Components

### 10a. Header Navigation

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                    ┌──────┐ ┌──────┐ ┌─────────────┐  │
│  │ LearningOS│                   │ Chat │ │ Map  │ │ ⚙ Settings  │  │
│  └──────────┘                    └──────┘ └──────┘ └─────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

Mobile:
┌─────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                                            ┌───────┐  │
│  │ LearningOS│                                           │ ☰     │  │
│  └──────────┘                                            └───────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 10b. Toast Notifications

```
┌───────────────────────────────────┐
│ ✓ Progress saved                  │ ← Success (green)
└───────────────────────────────────┘

┌───────────────────────────────────┐
│ ⚠ Connection lost. Reconnecting...│ ← Warning (yellow)
└───────────────────────────────────┘

┌───────────────────────────────────┐
│ ✗ Couldn't save. Try again?       │ ← Error (red)
└───────────────────────────────────┘
```

Position: Top-right
Duration: 4 seconds (auto-dismiss)
Action: Can have "Undo" or "Retry" button

### 10c. Loading States

**Full page:**
```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                    ┌──────────────────┐                       │
│                    │   [Spinner]      │                       │
│                    │                  │                       │
│                    │  Loading...      │                       │
│                    └──────────────────┘                       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Skeleton:**
```
┌───────────────────────────────────────────────────────────────┐
│ ████████████████████                                          │
│ ██████████████████████████████                                │
│ ████████████████                                              │
└───────────────────────────────────────────────────────────────┘
```

### 10d. Error States

**Page-level error:**
```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                    😕 Something went wrong                    │
│                                                               │
│                    We couldn't load this page.                │
│                                                               │
│                    [Try Again] [Go Home]                      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Component-level error:**
```
┌───────────────────────────────────────────────────────────────┐
│  ⚠ Couldn't load concept map. [Retry]                        │
└───────────────────────────────────────────────────────────────┘
```

### 10e. Modals

**Confirmation Modal:**
```
┌───────────────────────────────────────┐
│                                       │
│  Are you sure?                        │
│                                       │
│  This will delete all your learning   │
│  data. This cannot be undone.         │
│                                       │
│  [Cancel]        [Delete Everything]  │
│                 (red, destructive)    │
│                                       │
└───────────────────────────────────────┘
```

### 10f. Accessibility Standards

All components must:
- ✅ Support keyboard navigation
- ✅ Have ARIA labels where needed
- ✅ Meet WCAG 2.1 AA color contrast
- ✅ Work with screen readers
- ✅ Respect prefers-reduced-motion
- ✅ Have visible focus states

---

## Appendix: Component Library Reference

### MVP Components List

| Component | Priority | Complexity |
|-----------|----------|------------|
| Button | P0 | Low |
| Input | P0 | Low |
| TextArea | P0 | Low |
| Select | P0 | Medium |
| Card | P0 | Low |
| Modal | P0 | Medium |
| Toast | P0 | Medium |
| Skeleton | P0 | Low |
| Badge | P1 | Low |
| Progress Bar | P1 | Low |
| Tabs | P1 | Medium |
| Chat Message | P0 | Medium |
| Code Block | P0 | Medium |
| Concept Node | P0 | High |
| Graph Canvas | P0 | High |

---

## 11. Prerequisite Badges & Gap Interaction (Epic 14)

> Added: February 25, 2026 — UX note covering where prerequisite badges appear and how the "Add prerequisite milestone" flow works.

### 11a. Prerequisite Badge on Path Detail

When viewing a learning path (`/dashboard/paths/:pathId`), milestones that were **inserted as prerequisites** display a visual badge.

```
┌─────────────────────────────────────────────────────────────┐
│  Milestone 2 of 6                                           │
│                                                              │
│  📘 JavaScript Closures            [Prerequisite] ← badge   │
│  Added because a gap was detected in "React Hooks"          │
│                                                              │
│  Status: 🌱 Not Started                                     │
│                                                              │
│  ───────────── or, if self-assessed ─────────────            │
│                                                              │
│  📘 JavaScript Closures     [Prerequisite · Skipped] ← badge│
│  You indicated you already know this.                        │
│  Status: ✅ Completed (self-assessed)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

| Badge State | Appearance | Meaning |
|-------------|------------|---------|
| `Prerequisite` | Purple outline badge | Inserted by system to fill a gap |
| `Prerequisite · Skipped` | Gray outline badge | User self-assessed as already known |

**Visual connector:** A thin dashed arrow connects the prerequisite milestone to the milestone it unlocks, reinforcing the dependency.

### 11b. "Add Prerequisite Milestone" Interaction (In-Chat)

When the AI detects a prerequisite gap during a chat session (E14-S3), a **non-blocking inline card** appears in the chat stream:

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Possible Knowledge Gap Detected                        │
│                                                              │
│  It looks like understanding **closures** would help here.   │
│  This is a prerequisite for the concept you're working on.   │
│                                                              │
│  [➕ Add prerequisite milestone]    [I know this, continue]  │
│       (primary button)                (secondary button)     │
└─────────────────────────────────────────────────────────────┘
```

| User Action | System Behavior |
|-------------|----------------|
| **"Add prerequisite milestone"** | Calls `PATCH /paths/:pathId/milestones/insert` with `userChoice: "accepted"`. New milestone inserted before the current one. Chat shows confirmation: "✅ Added 'JavaScript Closures' as a new milestone. You can tackle it whenever you're ready." Current milestone status unchanged. |
| **"I know this, continue"** | Calls `PATCH /paths/:pathId/milestones/insert` with `userChoice: "self_assessed_known"`. Milestone is inserted **and immediately completed**. Chat shows: "👍 Got it — recorded as already known. Let's keep going." Concept graph updated with self-assessed mastery. |

### 11c. Prerequisite Indicators on Concept Graph

Already covered by existing edge visualization (§8 Edge Visualization):

| Type | Style |
|------|-------|
| Prerequisite | Solid red arrow (`#EF4444`) |

No changes needed to the graph page; the existing `prerequisite` edge style is sufficient.

### 11d. Accessibility

- Badge text is readable by screen readers (`role="status"`, `aria-label="Prerequisite milestone"`).
- The in-chat gap card is keyboard-navigable; buttons are focusable.
- Color is never the sole indicator — text labels accompany every badge.

---

## 12. Adaptive Screening Conversation (E14-S1)

> Added: February 25, 2026 — UX spec for the adaptive screening conversation that replaces the scope-analysis → narrowing → pills pipeline.

### 12a. Auto-Skip Confirmation

When the S2 prerequisite chain walker returns all `likely_known` for the user's goal, screening is skipped with a brief inline message:

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Based on your learning history, you're ready for this.  │
│     Generating your path now...                             │
│                                                              │
│     [⏳ spinner]                                             │
└─────────────────────────────────────────────────────────────┘
```

This replaces the goal input area momentarily, then transitions to the generated path card.

### 12b. Screening Chat Interface

When screening is needed, the goal input area expands into a compact chat interface **inline on the Learn page** (not a separate page):

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 Goal: "Learn React hooks"                    [✕ Cancel] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🤖 Great goal! Before I build your path, let me            │
│     understand where you're starting from.                   │
│                                                              │
│     Have you worked with JavaScript before? If so,           │
│     what kinds of things have you built?                     │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  👤 Yes, I've built a couple of small web apps with          │
│     vanilla JS and used some jQuery                          │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  🤖 Good foundation! Do you know how JavaScript              │
│     handles asynchronous operations — things like            │
│     Promises or async/await?                                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  [Type your answer...]                                       │
│                                                              │
│  [🤷 I don't know enough to answer]   [🚀 Generate my path] │
└─────────────────────────────────────────────────────────────┘
```

**Key UI elements:**

| Element | Behavior |
|---------|----------|
| Chat message area | Scrollable, displays AI questions and user responses |
| Text input | Standard text input with Enter-to-send |
| "I don't know enough to answer" button | Sends `userAction: "dont_know"`. AI drops to broader probing level. |
| "Generate my path" button | Sends `userAction: "generate_now"`. AI wraps up immediately and produces `ScreeningResult`. Always visible. |
| "Cancel" (✕) | Returns to the goal input state. No path created. |
| Progress indicator | Subtle text: "Assessed 3 of ~5 areas" — updates as conversation progresses |

### 12c. "I Don't Know" Escalation

When the user clicks "I don't know enough to answer," the AI acknowledges gracefully and broadens:

```
  🤖 Do you understand JavaScript closures and lexical scope?

  👤 [🤷 I don't know enough to answer]

  🤖 No problem! Let me back up a bit —
     Have you done any programming before, in any language?
```

The AI continues broadening until it finds a floor. If the user hits "I don't know" to even very basic questions, the AI recognizes a large gap:

```
  🤖 It sounds like you're completely new to programming.
     That's totally fine! But before diving into React hooks,
     I'd recommend starting with JavaScript fundamentals.

     Want me to create a "JavaScript Basics" path first?
     Once you complete it, React hooks will make much more sense.

     [✅ Yes, start with JavaScript Basics]
     [🚀 No, generate the React hooks path anyway]
```

### 12d. Gap-Tier Responses

**Small gap (1-3 concepts):**
Screening ends normally. Extra prerequisite milestones are silently prepended to the generated path.

**Medium gap (one prerequisite area):**
```
  🤖 Based on our conversation, it looks like you'd benefit
     from building a foundation in JavaScript fundamentals
     before tackling React hooks.

     I can create a focused "JavaScript Fundamentals" path
     (~6 milestones) that leads directly into React hooks.

     [✅ Create prerequisite path → then React hooks]
     [🚀 Skip, just build the React hooks path]
```

**Large gap (multiple areas):**
```
  🤖 To get to React hooks, you'd want to build up through:

     1. 📘 Programming Basics (~5 milestones)
     2. 📘 JavaScript Fundamentals (~6 milestones)
     3. 📘 React Basics (~4 milestones)
     4. 🎯 React Hooks (your goal!)

     Want me to set up this learning journey?
     You can always skip ahead if things feel easy.

     [✅ Set up the full journey]
     [📘 Just start with Programming Basics for now]
     [🚀 Skip everything, just build React hooks]
```

### 12e. Conversation Saved as First Session

After path generation, the screening conversation becomes the first chat session of the path. On the path detail view, it appears as:

```
  Session 1: "Getting Started" (screening)      ← auto-titled
  Session 2: "Milestone 1: JavaScript Closures"  ← normal session
```

The learner can revisit the screening conversation to remember what was discussed about their starting point. When they eventually **complete** the path, the system can reference this first session to celebrate how far they've come (future enhancement).

### 12f. Accessibility

- Chat messages use `role="log"` with `aria-live="polite"` for screen reader updates.
- "I don't know enough to answer" button has `aria-label="I don't know enough to answer this question"`.
- "Generate my path" button has `aria-label="End screening and generate my learning path"`.
- Focus moves to the text input after each AI response.
- All buttons are keyboard-navigable.

---

**Document Status:** Complete UX Specifications  
**Next:** API Contract Documentation  
**Owner:** Blast  
**Last Updated:** February 25, 2026
