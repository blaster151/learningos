# LearningOS: Epic & User Story Breakdown

**Project:** LearningOS  
**Version:** 1.0  
**Date:** January 27, 2026  
**Author:** Blast  
**Purpose:** Convert MVP features into traceable user stories with acceptance criteria

---

## Story Format

Each story follows the standard format:

```
**ID:** E{epic}-S{story}
**Title:** [Action-oriented title]
**As a** [user type]
**I want to** [action]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] Given/When/Then criteria

**Story Points:** [1, 2, 3, 5, 8, 13]
**Priority:** [P0-Critical, P1-High, P2-Medium, P3-Low]
**Dependencies:** [Story IDs]
**UX Reference:** [Section in ux-specifications.md]
**API Reference:** [Endpoint in api-contracts.md]
```

---

## Epic Overview

| Epic | Title | Stories | Total Points |
|------|-------|---------|--------------|
| E1 | Authentication & Account | 6 | 23 |
| E2 | Onboarding & Profile | 7 | 34 |
| E3 | Learning Paths | 10 | 60 |
| E4 | Reflect Mode | 5 | 34 |
| E5 | Chat Mode | 5 | 29 |
| E6 | Concept Graph | 6 | 42 |
| E7 | Dashboard & Navigation | 5 | 18 |
| E8 | Settings & Data Export | 4 | 13 |
| | | | |
| **MVP Total** | | **48** | **253** |
| | | | |
| *Phase 2* | | | |
| E9 | Mentor Personas (GEB) | 5 | 24 |
| E10 | Tone Matrix | 3 | 11 |
| E11 | "My Book" Export | 4 | 21 |
| E12 | Achievement System | 4 | 17 |
| E13 | Dynamic Glossary | 4 | 18 |
| E14 | Prerequisite Intelligence | 5 | 29 |
| E15 | Adaptive Difficulty & Learner Level | 4 | 21 |
| E16 | User Highlights & Annotations | 3 | 15 |
| **Phase 2 Total** | | **29** | **141** |
| **Grand Total** | | **79** | **394** |

---

## Epic 1: Authentication & Account

### E1-S1: User Sign Up with Email

**As a** new visitor  
**I want to** create an account with my email and password  
**So that** I can start my learning journey

**Acceptance Criteria:**
- [ ] Given I am on the signup page, when I enter a valid email and password (8+ chars), then my account is created
- [ ] Given I enter an invalid email format, when I blur the field, then I see "Please enter a valid email"
- [ ] Given I enter a password under 8 characters, when I submit, then I see "Password must be at least 8 characters"
- [ ] Given my email is already registered, when I submit, then I see "This email is already registered. Log in instead?"
- [ ] Given successful signup, when completed, then I am redirected to onboarding
- [ ] Given successful signup, when completed, then I receive a Firebase auth token

**Story Points:** 3  
**Priority:** P0-Critical  
**Dependencies:** None  
**UX Reference:** Section 2a - Sign Up Page  
**API Reference:** POST /auth/signup

---

### E1-S2: User Sign Up with OAuth (Google)

**As a** new visitor  
**I want to** sign up using my Google account  
**So that** I don't need to create another password

**Acceptance Criteria:**
- [ ] Given I click "Continue with Google", when I authorize, then my account is created with Google email
- [ ] Given I complete Google OAuth, when successful, then I am redirected to onboarding
- [ ] Given my Google email is already registered with email/password, when I try OAuth, then I see "This email is registered. Please log in with email."
- [ ] Given OAuth fails, when error occurs, then I see "Couldn't connect to Google. Please try again."

**Story Points:** 5  
**Priority:** P1-High  
**Dependencies:** E1-S1  
**UX Reference:** Section 2a - Sign Up Page  
**API Reference:** POST /auth/signup (Firebase handles OAuth)

---

### E1-S3: User Sign Up with OAuth (GitHub)

**As a** developer  
**I want to** sign up using my GitHub account  
**So that** I can use my existing developer identity

**Acceptance Criteria:**
- [ ] Given I click "Continue with GitHub", when I authorize, then my account is created
- [ ] Given I have no public email on GitHub, when signing up, then I'm prompted to add email manually
- [ ] Given successful signup, when completed, then I am redirected to onboarding

**Story Points:** 3  
**Priority:** P2-Medium  
**Dependencies:** E1-S2  
**UX Reference:** Section 2a - Sign Up Page  
**API Reference:** POST /auth/signup (Firebase handles OAuth)

---

### E1-S4: User Login

**As a** returning user  
**I want to** log in to my account  
**So that** I can continue my learning

**Acceptance Criteria:**
- [ ] Given I have an account, when I enter correct credentials, then I am logged in
- [ ] Given I enter wrong credentials, when I submit, then I see "Invalid email or password"
- [ ] Given I fail login 5 times, when I try again, then I see "Too many attempts. Try again in 5 minutes."
- [ ] Given I have no profile, when login succeeds, then I am redirected to onboarding
- [ ] Given I have a profile, when login succeeds, then I am redirected to dashboard

**Story Points:** 3  
**Priority:** P0-Critical  
**Dependencies:** E1-S1  
**UX Reference:** Section 2b - Login Page  
**API Reference:** POST /auth/login

---

### E1-S5: Session Management

**As a** logged-in user  
**I want to** stay logged in across browser sessions  
**So that** I don't have to log in every time

**Acceptance Criteria:**
- [ ] Given I log in, when I close and reopen the browser, then I remain logged in
- [ ] Given my token expires, when I make a request, then the token is refreshed automatically
- [ ] Given I click logout, when confirmed, then I am redirected to landing page
- [ ] Given I am logged out, when I try to access protected routes, then I am redirected to login

**Story Points:** 5  
**Priority:** P0-Critical  
**Dependencies:** E1-S4  
**UX Reference:** N/A (System behavior)  
**API Reference:** POST /auth/refresh, POST /auth/logout

---

### E1-S6: Password Reset

**As a** user who forgot their password  
**I want to** reset my password via email  
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] Given I click "Forgot password", when I enter my email, then I receive a reset link
- [ ] Given I enter an unregistered email, when I submit, then I still see "Check your email" (no email enumeration)
- [ ] Given I click the reset link, when I enter a new password, then my password is updated
- [ ] Given the reset link is expired (>1hr), when I click it, then I see "Link expired. Request new one."

**Story Points:** 4  
**Priority:** P2-Medium  
**Dependencies:** E1-S4  
**UX Reference:** Section 2b - Login Page  
**API Reference:** Firebase Auth (built-in)

---

## Epic 2: Onboarding & Profile

### E2-S1: Welcome Screen

**As a** new user  
**I want to** be welcomed and enter my name  
**So that** my experience feels personal

**Acceptance Criteria:**
- [ ] Given I complete signup, when I land on onboarding, then I see a friendly welcome message
- [ ] Given I enter my name, when I click continue, then my name is stored
- [ ] Given I skip the name, when I continue, then "Learner" is used as default
- [ ] Given I am on this screen, when I see the progress indicator, then it shows Step 1 of 4

**Story Points:** 2  
**Priority:** P0-Critical  
**Dependencies:** E1-S1  
**UX Reference:** Section 3a - Welcome Screen  
**API Reference:** None (client-side state)

---

### E2-S2: Conversational Intake

**As a** new user  
**I want to** tell the system about my background through conversation  
**So that** it can personalize content to my experience

**Acceptance Criteria:**
- [ ] Given I am on step 2, when I see the chat interface, then I see a question about my background
- [ ] Given I respond, when the AI replies, then it acknowledges my background and asks follow-ups
- [ ] Given the conversation completes (2-3 turns), when done, then system extracts domains and metaphors
- [ ] Given I want to skip, when I click skip, then I can continue with minimal profile
- [ ] Given the AI takes >10 seconds, when waiting, then I see "Taking longer than expected..."

**Story Points:** 8  
**Priority:** P0-Critical  
**Dependencies:** E2-S1  
**UX Reference:** Section 3b - About You  
**API Reference:** POST /profile/analyze-intake

---

### E2-S3: Learning Preferences Selection

**As a** new user  
**I want to** choose my tone and goal preferences  
**So that** content matches my learning style

**Acceptance Criteria:**
- [ ] Given I am on step 3, when I see the options, then I can select tone preference (conversational/formal/playful/socratic)
- [ ] Given I select a tone, when I see meta-goal options, then I can select my goal (curiosity/mastery/application/etc.)
- [ ] Given I make selections, when I continue, then preferences are stored in profile
- [ ] Given I don't select anything, when I continue, then defaults are used (conversational + curiosity)

**Story Points:** 3  
**Priority:** P0-Critical  
**Dependencies:** E2-S2  
**UX Reference:** Section 3c - Learning Preferences  
**API Reference:** POST /profile

---

### E2-S4: First Topic Selection

**As a** new user  
**I want to** choose my first learning topic  
**So that** I can start learning immediately

**Acceptance Criteria:**
- [ ] Given I am on step 4, when I see suggestions, then they are based on my background (from intake)
- [ ] Given I see suggestions, when I click one, then it is selected as my topic
- [ ] Given I want a different topic, when I type in the input, then I can enter any topic
- [ ] Given I select a topic, when I click "Start Learning", then a path is generated
- [ ] Given path generation, when it completes, then I am redirected to dashboard with path ready

**Story Points:** 5  
**Priority:** P0-Critical  
**Dependencies:** E2-S3  
**UX Reference:** Section 3d - First Topic Selection  
**API Reference:** POST /paths/generate

---

### E2-S5: Profile API Integration

**As a** system  
**I want to** save onboarding data to the profile  
**So that** it persists across sessions

**Acceptance Criteria:**
- [ ] Given onboarding completes, when all steps done, then profile is created via API
- [ ] Given profile exists, when I return after logout, then my preferences are loaded
- [ ] Given profile creation fails, when error occurs, then I can retry or continue with local data

**Story Points:** 3  
**Priority:** P0-Critical  
**Dependencies:** E2-S4  
**UX Reference:** N/A  
**API Reference:** POST /profile, GET /profile

---

### E2-S6: Skip/Resume Onboarding

**As a** user who was interrupted  
**I want to** resume onboarding where I left off  
**So that** I don't have to start over

**Acceptance Criteria:**
- [ ] Given I exit mid-onboarding, when I return, then I resume at the step I left off
- [ ] Given I completed some steps, when I return, then my previous answers are preserved
- [ ] Given I want to restart, when I click "Start over", then I can redo onboarding

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E2-S5  
**UX Reference:** Section 3  
**API Reference:** PATCH /profile

---

### E2-S7: Profile Edit from Settings

**As a** user  
**I want to** edit my profile preferences later  
**So that** I can adjust as my needs change

**Acceptance Criteria:**
- [ ] Given I am in settings, when I change tone preference, then it is saved immediately
- [ ] Given I am in settings, when I add/remove domains, then my expertise list updates
- [ ] Given I change meta-goal, when saved, then future paths reflect new goal
- [ ] Given I make changes, when I return to learning, then AI uses updated preferences

**Story Points:** 8  
**Priority:** P1-High  
**Dependencies:** E2-S5  
**UX Reference:** Section 9 - Profile Settings  
**API Reference:** PATCH /profile

---

## Epic 3: Learning Paths

### E3-S1: Path Generation

**As a** learner  
**I want to** generate a personalized learning path on any topic  
**So that** I can learn in a structured way

**Acceptance Criteria:**
- [ ] Given I enter a topic, when I request a path, then a 5-7 step path is generated
- [ ] Given path generates, when I see content, then it uses my preferred metaphors and examples
- [ ] Given path generates, when I see content, then code examples are in my known languages
- [ ] Given generation starts, when in progress, then I see a loading state with progress
- [ ] Given generation fails, when error occurs, then I see "Having trouble. Try a different topic?"

**Story Points:** 8  
**Priority:** P0-Critical  
**Dependencies:** E2-S5  
**UX Reference:** Section 5 - Learning Session  
**API Reference:** POST /paths/generate, GET /paths/generate/stream

---

### E3-S2: Milestone Learning Experience

**As a** learner  
**I want to** have an interactive learning experience within each milestone  
**So that** I can track my progress and engage with AI-powered learning

**Acceptance Criteria:**
- [x] Given I expand an in-progress milestone, when I see the objectives, then they render as interactive checkboxes I can check/uncheck
- [x] Given I check/uncheck objectives, when viewing progress, then the progress bar updates to reflect checked objectives count
- [x] Given objectives are checked, when I view the milestone header, then the stats row shows "N/M objectives" instead of just count
- [x] Given I expand an in-progress milestone, when I see the CTA area, then I see a prominent "💬 Learn with AI" button
- [x] Given I click "Learn with AI", when the chat opens, then it auto-creates a session with the milestone's concept names as topic
- [x] Given I see concept pills, when I click one, then I navigate to an AI chat session about that specific concept
- [x] Given I expand a not-started/available milestone, when I see actions, then "Learn with AI" appears as a secondary button
- [x] Given a milestone is completed, when I see objectives, then they show check marks (non-interactive)

**Story Points:** 5  
**Priority:** P0-Critical  
**Dependencies:** E3-S1  
**UX Reference:** Section 5 - Learning Session  
**API Reference:** GET /paths/:pathId, PATCH /paths/:pathId  
**Implementation Notes:** AI-first architecture — learning happens through chat rather than static content pages. Objective checkboxes are client-side self-assessment (persisted in local state for now).

---

### E3-S3: Path Navigation

**As a** learner  
**I want to** move through path steps at my own pace  
**So that** I control my learning speed

**Acceptance Criteria:**
- [ ] Given I am on step N, when I click "Next", then I move to step N+1
- [ ] Given I am on step N>1, when I click "Previous", then I move to step N-1
- [ ] Given I am on step 1, when I see Previous button, then it is disabled
- [ ] Given I am on last step, when I see Next button, then it says "Complete & Reflect"
- [ ] Given I navigate, when I see progress bar, then it updates to show current position

**Story Points:** 3  
**Priority:** P0-Critical  
**Dependencies:** E3-S2  
**UX Reference:** Section 5 - Learning Session  
**API Reference:** POST /paths/:pathId/progress

---

### E3-S4: Step Checkpoints

**As a** learner  
**I want to** answer checkpoint questions on some steps  
**So that** I can validate my understanding as I go

**Acceptance Criteria:**
- [ ] Given a step has a checkpoint, when I see it, then I see a question with textarea
- [ ] Given I write an answer, when I submit, then my answer is analyzed
- [ ] Given analysis completes, when I see feedback, then I see a brief score and hint
- [ ] Given I want to skip, when I click skip, then I can proceed without answering
- [ ] Given I skipped, when I see progress, then the step is marked as skipped (not completed)

**Story Points:** 5  
**Priority:** P1-High  
**Dependencies:** E3-S3  
**UX Reference:** Section 5 - Learning Session  
**API Reference:** POST /paths/:pathId/progress

---

### E3-S5: Progress Persistence

**As a** learner  
**I want to** have my progress saved automatically  
**So that** I can continue where I left off

**Acceptance Criteria:**
- [ ] Given I complete a step, when I close browser, then my progress is saved
- [ ] Given I return to an in-progress path, when I load it, then I start at last completed step + 1
- [ ] Given I have an in-progress path, when I see dashboard, then I see "Continue" option
- [ ] Given I am offline, when I complete a step, then progress saves when back online

**Story Points:** 5  
**Priority:** P0-Critical  
**Dependencies:** E3-S4  
**UX Reference:** Section 4 - Dashboard  
**API Reference:** POST /paths/:pathId/progress, GET /paths

---

### E3-S6: Struggle Button & Help

**As a** learner who is confused  
**I want to** get help when I'm stuck  
**So that** I can keep learning without frustration

**Acceptance Criteria:**
- [ ] Given I am on any step, when I see the floating help button, then I can click it
- [ ] Given I click help, when dialog opens, then I see struggle type options
- [ ] Given I select "explain differently", when I submit, then the step content is regenerated
- [ ] Given I select "concrete example", when I submit, then an example is added
- [ ] Given I select "missed earlier", when I submit, then I see a prerequisite concept recap
- [ ] Given I select "too advanced", when I submit, then the path is simplified

**Story Points:** 8  
**Priority:** P1-High  
**Dependencies:** E3-S3  
**UX Reference:** Section 5 - Struggle Dialog  
**API Reference:** POST /paths/:pathId/struggle

---

### E3-S7: Path Completion

**As a** learner  
**I want to** complete a path and see my achievement  
**So that** I feel accomplished

**Acceptance Criteria:**
- [ ] Given I am on last step, when I click "Complete & Reflect", then path is marked complete
- [ ] Given path is complete, when I see the result, then I am taken to Reflect Mode
- [ ] Given I skip reflection, when I choose to, then path is still marked complete
- [ ] Given path is complete, when I see path list, then it shows as completed with date

**Story Points:** 3  
**Priority:** P0-Critical  
**Dependencies:** E3-S5  
**UX Reference:** Section 5 - Learning Session  
**API Reference:** POST /paths/:pathId/progress

---

### E3-S8: Path History

**As a** learner  
**I want to** see my completed paths  
**So that** I can review or redo them

**Acceptance Criteria:**
- [ ] Given I go to path history, when I see the list, then I see all my paths with status
- [ ] Given I see a completed path, when I click it, then I can review the content
- [ ] Given I see a completed path, when I want to redo, then I can restart it
- [ ] Given I have many paths, when I scroll, then more paths load (pagination)

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E3-S7  
**UX Reference:** Section 4 - Dashboard  
**API Reference:** GET /paths

---

### E3-S9: Path Suggestions

**As a** learner  
**I want to** see suggested next topics  
**So that** I can continue learning relevant material

**Acceptance Criteria:**
- [ ] Given I complete a path, when I see suggestions, then they relate to what I just learned
- [ ] Given I am on dashboard, when I see suggestions, then they connect to my concept graph
- [ ] Given I click a suggestion, when it loads, then that topic is pre-filled for path generation

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E3-S7  
**UX Reference:** Section 4 - Dashboard  
**API Reference:** GET /paths/:pathId/suggestions

---

### E3-S10: Cheat Sheet Summarizer

**As a** learner  
**I want to** get a personalised cheat sheet after completing a path  
**So that** I have a concise reference that uses my own metaphors and breakthroughs

**Acceptance Criteria:**
- [ ] Given I complete a path, when I see the completion screen, then I see a "Generate Cheat Sheet" button
- [ ] Given I click generate, when the cheat sheet is ready, then it shows 4-5 bullets summarising the concept using metaphors and analogies I used during the path
- [ ] Given the cheat sheet references my reflections, when I read it, then it highlights what I got right and where I had breakthroughs ("When you realised X, that was Y")
- [ ] Given I see the cheat sheet, when I click "Save", then it is stored and accessible from my concept graph and glossary
- [ ] Given I have saved cheat sheets, when I visit a concept in my graph, then I can view the cheat sheet for that concept
- [ ] Given I want to share, when I click "Copy", then the cheat sheet is copied as Markdown

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E3-S7, E6-S1  
**UX Reference:** Section 4 - Dashboard, Section 6 - Reflect  
**API Reference:** POST /paths/generate (with suggestions logic)

---

## Epic 4: Reflect Mode

### E4-S1: Reflection Prompt Display

**As a** learner  
**I want to** see a reflection prompt after completing a path  
**So that** I know what to explain

**Acceptance Criteria:**
- [ ] Given I complete a path, when Reflect Mode loads, then I see a personalized prompt
- [ ] Given I see the prompt, when I read it, then it asks me to explain in my own words
- [ ] Given I see the prompt, when I see hints, then I know what concepts to cover
- [ ] Given I see the input, when I focus, then I see word count guidance (50-200 words)

**Story Points:** 3  
**Priority:** P0-Critical  
**Dependencies:** E3-S7  
**UX Reference:** Section 6 - Reflect Mode  
**API Reference:** GET /reflect/:pathId/prompt

---

### E4-S2: Reflection Submission

**As a** learner  
**I want to** submit my reflection  
**So that** I can get feedback on my understanding

**Acceptance Criteria:**
- [ ] Given I type a reflection, when I have 20+ words, then Submit button is enabled
- [ ] Given I have <20 words, when I try to submit, then I see "Please write a bit more"
- [ ] Given I click submit, when processing, then I see "Analyzing your reflection..."
- [ ] Given analysis fails, when error occurs, then I can retry or skip

**Story Points:** 3  
**Priority:** P0-Critical  
**Dependencies:** E4-S1  
**UX Reference:** Section 6 - Reflect Mode  
**API Reference:** POST /reflect/:pathId

---

### E4-S3: Reflection Analysis Display

**As a** learner  
**I want to** see detailed feedback on my reflection  
**So that** I know what I understood and what I missed

**Acceptance Criteria:**
- [ ] Given analysis completes, when I see results, then I see overall score with visual
- [ ] Given I see results, when I look at strengths, then I see what I got right
- [ ] Given I see results, when I look at suggestions, then I see what to improve
- [ ] Given I had misconceptions, when I see them, then I see correction (not judgment)
- [ ] Given I see a suggested definition, when I click "Save", then it goes to my glossary

**Story Points:** 8  
**Priority:** P0-Critical  
**Dependencies:** E4-S2  
**UX Reference:** Section 6 - Reflect Mode (After Submission)  
**API Reference:** POST /reflect/:pathId

---

### E4-S4: Learner State Update

**As a** learner  
**I want to** see how my understanding changed after reflection  
**So that** I can track my growth

**Acceptance Criteria:**
- [ ] Given analysis completes, when I see quadrant update, then I see before vs after
- [ ] Given my quadrant changed, when I see the badge, then it shows new state (e.g., Beginner → Getting It)
- [ ] Given my confidence increased, when I see meters, then they visually show the change
- [ ] Given I completed reflection, when I return to dashboard, then my stats are updated

**Story Points:** 5  
**Priority:** P1-High  
**Dependencies:** E4-S3  
**UX Reference:** Section 6 - Reflect Mode (Quadrant Update)  
**API Reference:** POST /reflect/:pathId (returns learnerStateUpdate)

---

### E4-S5: Skip Reflection

**As a** learner  
**I want to** skip reflection if I'm in a hurry  
**So that** I'm not forced to do it every time

**Acceptance Criteria:**
- [ ] Given I am in Reflect Mode, when I see "Skip" option, then I can click it
- [ ] Given I click skip, when confirmed, then I go to dashboard without feedback
- [ ] Given I skipped, when I see path in history, then it shows reflection was skipped
- [ ] Given I skipped, when I revisit the concept, then I can reflect later

**Story Points:** 2  
**Priority:** P2-Medium  
**Dependencies:** E4-S1  
**UX Reference:** Section 6 - Reflect Mode  
**API Reference:** POST /reflect/:pathId (with skip flag)

---

## Epic 5: Chat Mode

### E5-S1: Chat Interface

**As a** learner  
**I want to** chat freely with the learning assistant  
**So that** I can explore topics conversationally

**Acceptance Criteria:**
- [ ] Given I open Chat, when I see the interface, then I see a message input
- [ ] Given it's a new session, when chat loads, then I see a welcome message
- [ ] Given I have previous sessions, when I see history, then I can access past conversations
- [ ] Given I am chatting, when I see messages, then user and assistant messages are visually distinct

**Story Points:** 5  
**Priority:** P0-Critical  
**Dependencies:** E2-S5  
**UX Reference:** Section 7 - Chat Mode  
**API Reference:** GET /chat/sessions, GET /chat/sessions/:id

---

### E5-S2: Send & Receive Messages

**As a** learner  
**I want to** send messages and receive AI responses  
**So that** I can learn through conversation

**Acceptance Criteria:**
- [ ] Given I type a message, when I press Enter or click Send, then message appears in chat
- [ ] Given I send a message, when AI responds, then response streams in word by word
- [ ] Given AI is responding, when I see it, then I see typing indicator
- [ ] Given response completes, when I see it, then code blocks are syntax highlighted
- [ ] Given AI fails, when error occurs, then I see "Couldn't respond. Try again?"

**Story Points:** 8  
**Priority:** P0-Critical  
**Dependencies:** E5-S1  
**UX Reference:** Section 7 - Chat Mode  
**API Reference:** POST /chat/message, GET /chat/message/stream

---

### E5-S3: Context-Aware Suggestions

**As a** learner  
**I want to** see relevant follow-up suggestions  
**So that** I can explore without knowing what to ask

**Acceptance Criteria:**
- [ ] Given AI responds, when I see suggestions, then they relate to the response
- [ ] Given I see a suggestion pill, when I click it, then it sends that as my next message
- [ ] Given I discussed a topic, when I see "Create path", then I can generate a path on it
- [ ] Given I learned something, when I see "Add to concepts", then I can save it to my graph

**Story Points:** 5  
**Priority:** P1-High  
**Dependencies:** E5-S2  
**UX Reference:** Section 7 - Chat Mode  
**API Reference:** POST /chat/message (returns suggestions)

---

### E5-S4: Chat Session Management

**As a** learner  
**I want to** manage multiple chat sessions  
**So that** I can have separate conversations per topic

**Acceptance Criteria:**
- [ ] Given I have chat history, when I see session list, then I see titles and dates
- [ ] Given I click a session, when it loads, then I see full message history
- [ ] Given I start new chat, when I click "New Chat", then previous session is saved
- [ ] Given session has no messages, when I navigate away, then empty session is not saved

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E5-S2  
**UX Reference:** Section 7 - Chat Mode  
**API Reference:** GET /chat/sessions, GET /chat/sessions/:id

---

### E5-S5: Chat from Context

**As a** learner  
**I want to** start a chat about something I'm learning  
**So that** I can ask questions in context

**Acceptance Criteria:**
- [ ] Given I click help → "Something else" in a path, when chat opens, then it has context
- [ ] Given I click a concept in my graph, when I choose "Ask about this", then chat opens with context
- [ ] Given I have context, when AI responds, then it knows what I was learning

**Story Points:** 6  
**Priority:** P1-High  
**Dependencies:** E5-S2, E3-S6  
**UX Reference:** Section 5 - Struggle Dialog, Section 7 - Chat  
**API Reference:** POST /chat/message (with context parameter)

---

## Epic 6: Concept Graph

### E6-S1: Graph Visualization

**As a** learner  
**I want to** see my knowledge as a visual graph  
**So that** I can understand how concepts connect

**Acceptance Criteria:**
- [ ] Given I open Concept Map, when it loads, then I see nodes representing concepts
- [ ] Given I see nodes, when I look at colors/icons, then I understand mastery levels
- [ ] Given I see edges, when I look at connections, then I understand relationships
- [ ] Given I have no concepts, when graph loads, then I see an encouraging empty state

**Story Points:** 8  
**Priority:** P0-Critical  
**Dependencies:** E4-S3  
**UX Reference:** Section 8 - Concept Map  
**API Reference:** GET /graph

---

### E6-S2: Graph Interaction (Pan/Zoom)

**As a** learner  
**I want to** navigate the graph easily  
**So that** I can explore my knowledge

**Acceptance Criteria:**
- [ ] Given I am on the graph, when I drag, then the view pans
- [ ] Given I am on the graph, when I scroll, then the view zooms
- [ ] Given I click "Fit", when it activates, then all nodes fit in view
- [ ] Given I click zoom buttons, when I use them, then zoom adjusts incrementally

**Story Points:** 5  
**Priority:** P1-High  
**Dependencies:** E6-S1  
**UX Reference:** Section 8 - Concept Map  
**API Reference:** None (client-side)

---

### E6-S3: Concept Detail Panel

**As a** learner  
**I want to** see details about a concept when I click it  
**So that** I can review and act on it

**Acceptance Criteria:**
- [ ] Given I click a node, when selected, then a side panel opens
- [ ] Given I see the panel, when I read it, then I see my definition of the concept
- [ ] Given I see the panel, when I look at metrics, then I see confidence and understanding scores
- [ ] Given I see the panel, when I look at history, then I see when I learned it
- [ ] Given I see actions, when I click "Start path", then a path generates for that concept

**Story Points:** 5  
**Priority:** P0-Critical  
**Dependencies:** E6-S1  
**UX Reference:** Section 8 - Concept Map (Side Panel)  
**API Reference:** GET /graph/concepts/:id

---

### E6-S4: Graph Filtering

**As a** learner with many concepts  
**I want to** filter the graph by domain  
**So that** I can focus on specific areas

**Acceptance Criteria:**
- [ ] Given I see filter dropdown, when I select a domain, then only that domain's concepts show
- [ ] Given I select "All", when applied, then all concepts show
- [ ] Given I have no concepts in a domain, when I filter, then I see empty state for that filter

**Story Points:** 3  
**Priority:** P2-Medium  
**Dependencies:** E6-S1  
**UX Reference:** Section 8 - Concept Map (Toolbar)  
**API Reference:** GET /graph?domain=X

---

### E6-S5: Graph Auto-Update

**As a** learner  
**I want to** see my graph update after learning  
**So that** I see progress in real-time

**Acceptance Criteria:**
- [ ] Given I complete a reflection, when I open graph, then new concepts appear
- [ ] Given I learn a connection, when I see graph, then new edge appears
- [ ] Given a concept's mastery changes, when I see it, then the node color/icon updates
- [ ] Given new nodes are added, when I open graph, then they animate into position

**Story Points:** 8  
**Priority:** P1-High  
**Dependencies:** E6-S1, E4-S3  
**UX Reference:** Section 8 - Concept Map  
**API Reference:** GET /graph (polling or websocket)

---

### E6-S6: Manual Concept Addition

**As a** learner  
**I want to** add concepts manually from chat  
**So that** I can capture learning that wasn't in a path

**Acceptance Criteria:**
- [ ] Given I am in chat, when I see "Add to concepts" action, then I can click it
- [ ] Given I click add, when dialog opens, then I can edit name and definition
- [ ] Given I save the concept, when added, then it appears in my graph
- [ ] Given I add a concept, when I can relate it, then I can connect to existing concepts

**Story Points:** 8  
**Priority:** P2-Medium  
**Dependencies:** E5-S3, E6-S1  
**UX Reference:** Section 7 - Chat Mode (Actions)  
**API Reference:** POST /graph/concepts, POST /graph/edges

---

## Epic 7: Dashboard & Navigation

### E7-S1: Dashboard Home

**As a** learner  
**I want to** see my learning status at a glance  
**So that** I know where to pick up

**Acceptance Criteria:**
- [ ] Given I am logged in, when I go to dashboard, then I see personalized greeting
- [ ] Given I have an in-progress path, when I see dashboard, then I see "Continue" prominently
- [ ] Given I have stats, when I see them, then I see concepts learned and domains covered
- [ ] Given I have recent activity, when I see it, then I see what I did recently

**Story Points:** 5  
**Priority:** P0-Critical  
**Dependencies:** E2-S5, E3-S5  
**UX Reference:** Section 4 - Dashboard  
**API Reference:** GET /profile, GET /paths, GET /sessions/stats

---

### E7-S2: Quadrant Display on Dashboard

**As a** learner  
**I want to** see my current learning state quadrant  
**So that** I understand where I am in my journey

**Acceptance Criteria:**
- [ ] Given I am on dashboard, when I see the quadrant badge, then it shows my current state
- [ ] Given my state is "Beginner", when I see badge, then it says "Building Up" with 🌱
- [ ] Given my state is "Mastery", when I see badge, then it says "You've got this!" with 🌟
- [ ] Given I click "What does this mean?", when modal opens, then I see explanation of quadrants

**Story Points:** 3  
**Priority:** P1-High  
**Dependencies:** E7-S1, E4-S4  
**UX Reference:** Section 4 - Dashboard (Quadrant Badge)  
**API Reference:** GET /profile (includes quadrant)

---

### E7-S3: Header Navigation

**As a** user  
**I want to** navigate between main sections easily  
**So that** I can access features quickly

**Acceptance Criteria:**
- [ ] Given I see the header, when I click logo, then I go to dashboard
- [ ] Given I see the header, when I click Chat, then I go to chat mode
- [ ] Given I see the header, when I click Map, then I go to concept graph
- [ ] Given I see the header, when I click Settings, then I go to settings
- [ ] Given I am on a section, when I see nav, then current section is highlighted

**Story Points:** 3  
**Priority:** P0-Critical  
**Dependencies:** None  
**UX Reference:** Section 10a - Header Navigation  
**API Reference:** None (client-side routing)

---

### E7-S4: Mobile Navigation

**As a** mobile user  
**I want to** navigate on smaller screens  
**So that** I can learn on my phone

**Acceptance Criteria:**
- [ ] Given I am on mobile, when I see header, then nav items collapse to hamburger menu
- [ ] Given I click hamburger, when menu opens, then I see all nav options
- [ ] Given I select an option, when I tap, then I navigate and menu closes
- [ ] Given I am in a path, when on mobile, then content is readable and scrollable

**Story Points:** 5  
**Priority:** P1-High  
**Dependencies:** E7-S3  
**UX Reference:** Section 10a - Header Navigation (Mobile)  
**API Reference:** None (client-side)

---

### E7-S5: Toast Notifications

**As a** user  
**I want to** see feedback for actions  
**So that** I know when things succeed or fail

**Acceptance Criteria:**
- [ ] Given I save something, when successful, then I see success toast (green)
- [ ] Given an action fails, when error occurs, then I see error toast (red)
- [ ] Given I see a toast, when 4 seconds pass, then it auto-dismisses
- [ ] Given I see a toast, when I click X, then it dismisses immediately
- [ ] Given toast has action, when I see "Retry", then I can click to retry

**Story Points:** 2  
**Priority:** P1-High  
**Dependencies:** None  
**UX Reference:** Section 10b - Toast Notifications  
**API Reference:** None (client-side)

---

## Epic 8: Settings & Data Export

### E8-S1: Settings Page

**As a** user  
**I want to** access my account settings  
**So that** I can manage my account

**Acceptance Criteria:**
- [ ] Given I go to settings, when I see the page, then I see sidebar navigation
- [ ] Given I click Profile, when selected, then I see profile settings
- [ ] Given I click Account, when selected, then I see account settings
- [ ] Given I click Data, when selected, then I see data/export options

**Story Points:** 3  
**Priority:** P1-High  
**Dependencies:** E2-S7  
**UX Reference:** Section 9 - Profile Settings  
**API Reference:** GET /profile

---

### E8-S2: Account Deletion

**As a** user  
**I want to** delete my account if I choose  
**So that** I have control over my data

**Acceptance Criteria:**
- [ ] Given I am in account settings, when I click "Delete Account", then I see confirmation modal
- [ ] Given I see confirmation, when I type "DELETE", then button enables
- [ ] Given I confirm deletion, when processed, then my account and all data are deleted
- [ ] Given deletion completes, when done, then I am logged out and redirected to landing

**Story Points:** 3  
**Priority:** P1-High  
**Dependencies:** E8-S1  
**UX Reference:** Section 9 - Profile Settings (Account)  
**API Reference:** DELETE /auth/me (TBD)

---

### E8-S3: Data Export (GDPR)

**As a** user  
**I want to** export all my data  
**So that** I can have a copy or move to another service

**Acceptance Criteria:**
- [ ] Given I am in data settings, when I click "Export All Data", then export begins
- [ ] Given export is processing, when I wait, then I see progress indicator
- [ ] Given export completes, when ready, then I can download as JSON
- [ ] Given I download, when I open file, then I see all my profile, paths, reflections, graph data

**Story Points:** 5  
**Priority:** P1-High  
**Dependencies:** E8-S1  
**UX Reference:** Section 9 - Profile Settings (Data)  
**API Reference:** GET /export/data

---

### ~~E8-S4: "My Book" Export~~ → Moved to E11

*This story has been expanded into Epic 11 (Phase 2) with 4 stories. See E11-S1 through E11-S4.*

---

---

# Phase 2 Epics

The following epics extend MVP functionality. They depend on MVP epics being complete and are scoped for Phase 2 delivery.

---

## Epic 9: Mentor Personas (GEB)

**Phase:** 2  
**Vision Reference:** Gap Analysis §13 — Mentor Persona Selection  
**Depends on:** E2 (Onboarding & Profile), E3 (Learning Paths), E5 (Chat Mode)

> "Choose Your Guide... Gödel (The Analyst), Escher (Visual Thinker), Bach (Harmonizer)"

Three persistent teaching voices that color all AI interactions. Implemented as system prompt modifiers — no model fine-tuning required.

---

### E9-S1: Persona Selection During Onboarding

**As a** new user  
**I want to** choose a mentor persona during onboarding  
**So that** my learning experience has a consistent voice from the start

**Acceptance Criteria:**
- [ ] Given I am on onboarding step 3 (preferences), when I see mentor options, then I see Gödel, Escher, and Bach with descriptions and sample phrases
- [ ] Given I hover/tap a persona card, when I see the preview, then I read 2-3 example phrases in that voice
- [ ] Given I select a persona, when I continue, then it is saved to my profile as `mentorPersona`
- [ ] Given I don't select one, when I continue, then no persona is applied (neutral AI voice)

**Story Points:** 3  
**Priority:** P2-Medium  
**Dependencies:** E2-S3  
**UX Reference:** Section 3c - Learning Preferences (extended)  
**API Reference:** PATCH /profile

---

### E9-S2: Persona System Prompt Injection

**As a** system  
**I want to** inject the selected persona's voice into all AI prompts  
**So that** path content, reflections, and chat all speak in the chosen voice

**Acceptance Criteria:**
- [ ] Given user has persona "godel", when any AI prompt is constructed, then Gödel's system prompt addition is prepended
- [ ] Given user has persona "escher", when generating a path, then explanations favour spatial metaphors and diagrams
- [ ] Given user has persona "bach", when providing reflection feedback, then it uses musical/compositional metaphors
- [ ] Given user has no persona, when AI prompts are constructed, then no persona modifier is added
- [ ] Given persona prompt is injected, when response is generated, then tone preference (E2-S3) is also respected — persona and tone coexist

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E9-S1, E3-S1, E5-S2  
**UX Reference:** N/A (backend)  
**API Reference:** All AI endpoints (internal change)

---

### E9-S3: Persona Switching from Settings

**As a** learner  
**I want to** change my mentor persona after onboarding  
**So that** I can try a different voice if my preference changes

**Acceptance Criteria:**
- [ ] Given I am in profile settings, when I see the Persona section, then I see all three personas with my current selection highlighted
- [ ] Given I select a different persona, when I save, then future AI responses use the new voice
- [ ] Given I switch persona, when I return to an active path, then remaining steps use the new voice (already-completed steps are not regenerated)
- [ ] Given I want no persona, when I select "Neutral", then the persona modifier is removed

**Story Points:** 3  
**Priority:** P2-Medium  
**Dependencies:** E9-S2, E2-S7  
**UX Reference:** Section 9 - Profile Settings  
**API Reference:** PATCH /profile

---

### E9-S4: Persona Consistency Validation

**As a** learner  
**I want to** receive responses that consistently match my chosen persona  
**So that** the experience doesn't feel inconsistent or generic

**Acceptance Criteria:**
- [ ] Given persona is "godel", when I read a path step, then language is precise, logical, and builds from first principles
- [ ] Given persona is "escher", when I read a path step, then it includes visual/spatial framing and suggests diagrams where relevant
- [ ] Given persona is "bach", when I read a path step, then it uses compositional metaphors (themes, variations, harmony)
- [ ] Given any persona, when AI drifts to generic tone, then a post-generation check flags it and the response is regenerated (up to 1 retry)

**Story Points:** 5  
**Priority:** P3-Low  
**Dependencies:** E9-S2  
**UX Reference:** N/A  
**API Reference:** N/A (internal quality gate)

---

### E9-S5: Secret & Unlockable Mentors

**As a** learner  
**I want to** discover and unlock hidden mentor personas  
**So that** my learning journey has delightful surprises that reward exploration

**Acceptance Criteria:**
- [ ] Given I have not unlocked any secret mentors, when I view the persona picker, then I see 3 locked slots with mystery silhouettes and playful hints
- [ ] Given I meet Ada's unlock criteria (complete 5 paths involving code), when the achievement triggers, then Ada is revealed with a toast: "Ada Lovelace has entered the chat"
- [ ] Given I select Ada, when AI generates content, then it speaks in vision, creativity, and exacting prose — the first code poet
- [ ] Given I meet Turing's unlock criteria (reach Mastery quadrant on any concept), when unlocked, then Turing is available — cares deeply about what is computable and why
- [ ] Given I meet CategoryBot 3000's unlock criteria (connect 25+ concepts in my graph), when unlocked, then CategoryBot is available — communicates entirely through commuting diagrams; no words, no apologies
- [ ] Given CategoryBot is selected, when AI generates content, then responses are primarily Mermaid/ASCII diagrams with minimal text — the system respects the bit
- [ ] Given I have unlocked a secret mentor, when I view persona picker in settings, then the unlocked mentor appears alongside GEB with an "Unlocked" badge

**Story Points:** 8  
**Priority:** P2-Medium  
**Dependencies:** E9-S2, E12-S2  
**UX Reference:** Section 3c - Learning Preferences (extended)  
**API Reference:** GET /achievements, PATCH /profile

---

## Epic 10: Tone Matrix

**Phase:** 2  
**Vision Reference:** Gap Analysis §11 — Tone Preference Details  
**Depends on:** E2 (Onboarding & Profile)

> "Lighthearted but deep" ≠ "playful." System needs multi-dimensional tone control.

Extends the MVP's single tone preference (casual/formal/playful/socratic) into a 4-axis matrix: formality, energy, humour, technicality.

---

### E10-S1: Tone Matrix UI in Onboarding

**As a** new user  
**I want to** fine-tune my preferred tone across multiple dimensions  
**So that** the AI voice matches how I actually like to communicate

**Acceptance Criteria:**
- [ ] Given I am on onboarding step 3, when I see tone options, then I see 4 sliders or toggle groups: Formality (casual → formal), Energy (calm → enthusiastic), Humour (none → playful), Technicality (accessible → technical)
- [ ] Given I move a slider, when I see the live preview, then a sample sentence updates to demonstrate the combined tone
- [ ] Given I don't interact with sliders, when I continue, then sensible defaults are used (casual, moderate, light, balanced)
- [ ] Given I set all four dimensions, when I continue, then the full `ToneProfile` object is saved to my profile

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E2-S3  
**UX Reference:** Section 3c - Learning Preferences (extended)  
**API Reference:** PATCH /profile

---

### E10-S2: Tone Matrix Prompt Construction

**As a** system  
**I want to** translate the 4-axis tone profile into a system prompt modifier  
**So that** AI responses match the learner's multi-dimensional preference

**Acceptance Criteria:**
- [ ] Given profile has `ToneProfile { formality: "casual", energy: "calm", humor: "light", technicality: "technical" }`, when system prompt is built, then it instructs the LLM: "Use casual language, keep energy calm and measured, include light humour where natural, and maintain technical precision"
- [ ] Given any combination of the 4 axes, when prompt is built, then the instruction is coherent (no contradictions)
- [ ] Given tone matrix and persona are both set, when prompt is built, then both are included — persona shapes *what* is said, tone shapes *how* it's said
- [ ] Given the old single-tone preference exists on a profile, when the system reads it, then it maps to the nearest tone matrix equivalent for backward compatibility

**Story Points:** 3  
**Priority:** P2-Medium  
**Dependencies:** E10-S1  
**UX Reference:** N/A (backend)  
**API Reference:** All AI endpoints (internal change)

---

### E10-S3: Tone Adjustment from Settings

**As a** learner  
**I want to** adjust my tone matrix from settings  
**So that** I can refine my preference over time

**Acceptance Criteria:**
- [ ] Given I am in profile settings, when I see the Tone section, then I see the same 4-axis control from onboarding with my current values
- [ ] Given I adjust a slider, when I see the live preview, then the sample sentence updates
- [ ] Given I save changes, when future AI responses are generated, then they reflect the updated tone
- [ ] Given I want to reset, when I click "Reset to defaults", then sliders return to defaults

**Story Points:** 3  
**Priority:** P2-Medium  
**Dependencies:** E10-S2, E2-S7  
**UX Reference:** Section 9 - Profile Settings  
**API Reference:** PATCH /profile

---

## Epic 11: "My Book" Export

**Phase:** 2  
**Vision Reference:** Gap Analysis §15 — Exportable Learning Journey  
**Depends on:** E4 (Reflect Mode), E6 (Concept Graph), E8-S1 (Settings)  
**Replaces:** E8-S4 (which was a placeholder stub)

> "A generated, exportable representation of your learning journey — definitions in your own words, diagrams, reflections, and 'what I used to think' vs 'what I now understand'."

---

### E11-S1: Book Generation Engine

**As a** system  
**I want to** compile a learner's journey into a structured document  
**So that** the export contains meaningful, personalised content

**Acceptance Criteria:**
- [ ] Given a user requests export, when generation starts, then the system collects: profile, concept graph, all completed paths, all reflections, and glossary entries
- [ ] Given data is collected, when the book is assembled, then it includes: table of contents, per-concept sections (current definition, evolution of understanding, related concepts, reflections), a Mermaid concept map, and learning stats
- [ ] Given a concept has multiple reflection entries, when displayed, then they appear as a timeline showing understanding evolution
- [ ] Given generation completes, when the output is ready, then it is valid Markdown

**Story Points:** 8  
**Priority:** P2-Medium  
**Dependencies:** E4-S3, E6-S1  
**UX Reference:** Section 9 - Profile Settings (Data)  
**API Reference:** POST /export/my-book

---

### E11-S2: Export Format Options

**As a** learner  
**I want to** choose the export format  
**So that** I can use my book in the way that suits me

**Acceptance Criteria:**
- [ ] Given I click "Export My Book", when I see options, then I can select Markdown or JSON
- [ ] Given I select Markdown, when export completes, then I download a `.md` file with proper formatting
- [ ] Given I select JSON, when export completes, then I download a `.json` file with structured data (portable)
- [ ] Given the export is large (100+ concepts), when generating, then I see a progress indicator

**Story Points:** 3  
**Priority:** P2-Medium  
**Dependencies:** E11-S1  
**UX Reference:** Section 9 - Profile Settings (Data)  
**API Reference:** POST /export/my-book, GET /export/:id

---

### E11-S3: Export Preview

**As a** learner  
**I want to** preview my book before downloading  
**So that** I know what I'm getting

**Acceptance Criteria:**
- [ ] Given I click "Preview My Book", when preview loads, then I see a rendered Markdown view of the first 3 concept sections
- [ ] Given I see the preview, when I scroll, then I can read through the full document
- [ ] Given I like what I see, when I click "Download", then export begins with my chosen format
- [ ] Given I want changes, when I click "Back", then I return to settings without downloading

**Story Points:** 5  
**Priority:** P3-Low  
**Dependencies:** E11-S1  
**UX Reference:** Section 9 - Profile Settings (Data)  
**API Reference:** POST /export/my-book (preview mode)

---

### E11-S4: PDF Export

**As a** learner  
**I want to** download my book as a PDF  
**So that** I have a printable, shareable record

**Acceptance Criteria:**
- [ ] Given I select PDF format, when export completes, then I download a styled `.pdf` file
- [ ] Given the PDF is generated, when I open it, then it has proper typography, headers, and page breaks
- [ ] Given my book includes a concept map, when I see it in the PDF, then the Mermaid diagram is rendered as an image

**Story Points:** 5  
**Priority:** P3-Low  
**Dependencies:** E11-S2  
**UX Reference:** Section 9 - Profile Settings (Data)  
**API Reference:** POST /export/my-book (format=pdf)

---

## Epic 12: Achievement System

**Phase:** 2  
**Vision Reference:** Gap Analysis §20 — Badges, Achievements  
**Depends on:** E4 (Reflect Mode), E6 (Concept Graph), E7 (Dashboard)

> "Celebrate progress, not competition. Intrinsic motivation over extrinsic. No leaderboards."

Criteria-based personal milestones. Optional — users can disable achievement notifications.

---

### E12-S1: Achievement Data Model & Seed Definitions

**As a** system  
**I want to** have a defined set of achievements with clear criteria  
**So that** they can be checked automatically

**Acceptance Criteria:**
- [ ] Given the system starts, when achievements are loaded, then at least 10 achievements are defined covering: first reflection, first path, concept count milestones (5, 10, 25, 50), connection milestones, mastery quadrant reached, streak (3 days, 7 days), and first emergent abstraction
- [ ] Given each achievement, when inspected, then it has: id, name, description, icon/emoji, and a machine-evaluable criteria object
- [ ] Given criteria definitions, when user stats change, then the system can evaluate whether any new achievement is earned
- [ ] Given an achievement is earned, when recorded, then `earnedAt` timestamp is set and it cannot be un-earned

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** None  
**UX Reference:** N/A (data model)  
**API Reference:** GET /achievements

---

### E12-S2: Achievement Evaluation Engine

**As a** system  
**I want to** check for newly earned achievements after each learning action  
**So that** users are recognised in real time

**Acceptance Criteria:**
- [ ] Given a user completes a reflection, when the action completes, then achievements are evaluated
- [ ] Given a user's concept graph updates, when new concepts or connections are added, then achievements are evaluated
- [ ] Given a user logs in on consecutive days, when the session starts, then streak achievements are evaluated
- [ ] Given evaluation finds a new achievement, when it is detected, then it is persisted and a notification event is emitted
- [ ] Given evaluation finds no new achievements, when it completes, then no notification is emitted and no writes occur

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E12-S1, E4-S3, E6-S5  
**UX Reference:** N/A (backend)  
**API Reference:** Internal (triggered by other endpoints)

---

### E12-S3: Achievement Toast & Dashboard Display

**As a** learner  
**I want to** see a celebration when I earn an achievement  
**So that** my progress is recognised and I feel motivated

**Acceptance Criteria:**
- [ ] Given I earn an achievement, when the toast appears, then I see the icon, name, and description with a brief animation
- [ ] Given I see the toast, when I click it, then I navigate to my achievements page
- [ ] Given I dismiss the toast, when it closes, then the achievement is still recorded
- [ ] Given I visit my dashboard, when I look at the achievements section, then I see all earned achievements with dates and all unearned achievements greyed out
- [ ] Given I have no achievements yet, when I see the section, then I see "Start learning to earn your first achievement!"

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E12-S2, E7-S5  
**UX Reference:** Section 8 - Dashboard (extended)  
**API Reference:** GET /achievements

---

### E12-S4: Achievement Preferences

**As a** learner  
**I want to** control whether I see achievement notifications  
**So that** they don't distract me if I find them unhelpful

**Acceptance Criteria:**
- [ ] Given I am in settings, when I see "Achievements", then I see a toggle for notifications (default: on)
- [ ] Given I turn off notifications, when I earn an achievement, then no toast appears but the achievement is still recorded
- [ ] Given I turn off notifications, when I visit dashboard, then I still see my earned achievements
- [ ] Given I turn notifications back on, when I next earn an achievement, then toasts resume

**Story Points:** 2  
**Priority:** P3-Low  
**Dependencies:** E12-S3, E8-S1  
**UX Reference:** Section 9 - Profile Settings  
**API Reference:** PATCH /profile

---

## Epic 13: Dynamic Glossary

**Phase:** 2  
**Vision Reference:** Gap Analysis §14 — Dynamic, Personal Glossary; Brainstorming doc "Glossary-as-Experience"  
**Depends on:** E4 (Reflect Mode), E6 (Concept Graph)

> "It's not just a dictionary. It's the history of your understanding."

A living glossary that speaks in the learner's language, grows with their journey, and stores the evolution of what each term means to them — from first encounter to mastery.

---

### E13-S1: Glossary Data Model & Auto-Population

**As a** system  
**I want to** automatically create and update glossary entries as the learner progresses  
**So that** the glossary grows organically without manual effort

**Acceptance Criteria:**
- [ ] Given a learner completes a reflection, when the analysis extracts concept definitions, then a glossary entry is created or updated with the learner's own phrasing
- [ ] Given a glossary entry already exists for a concept, when a new definition is extracted, then it is added to the entry's `definitionHistory` — the old definition is preserved, not overwritten
- [ ] Given each definition in the history, when stored, then it includes: text, source (reflection/path/chat/user-edited), timestamp, and confidence score at time of writing
- [ ] Given a learner's first encounter with a concept, when the entry is created, then it records `learnedFrom` (which path/session) and initial confidence
- [ ] Given the LLM extracts a definition, when parsing fails or is ambiguous, then no entry is created (prefer silence over noise)

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E4-S3, E6-S1  
**UX Reference:** N/A (data model)  
**API Reference:** GET /glossary, GET /glossary/:conceptId

---

### E13-S2: Glossary Page & Search

**As a** learner  
**I want to** browse and search my personal glossary  
**So that** I can look up concepts in my own words

**Acceptance Criteria:**
- [ ] Given I navigate to Glossary, when the page loads, then I see an alphabetised list of all my glossary entries with current definitions
- [ ] Given I type in the search bar, when I search, then entries are filtered by concept name and definition text
- [ ] Given I click an entry, when the detail view opens, then I see: current definition, confidence badge, source path, and related concepts
- [ ] Given I have no glossary entries yet, when I visit the page, then I see "Your glossary will grow as you learn. Complete your first path to get started."
- [ ] Given I want to edit a definition, when I click "Edit", then I can rewrite it in my own words and save (source = "user-edited")

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E13-S1  
**UX Reference:** Section 4 - Dashboard (extended)  
**API Reference:** GET /glossary, PATCH /glossary/:conceptId

---

### E13-S3: Definition Evolution Timeline

**As a** learner  
**I want to** see how my understanding of a concept evolved over time  
**So that** I can appreciate my growth and spot patterns in how I learn

**Acceptance Criteria:**
- [ ] Given a glossary entry has 2+ definitions, when I view it, then I see a timeline showing each definition with its date and confidence badge
- [ ] Given the timeline, when I read entries chronologically, then I see my understanding progressing (e.g. "A monad is... a wrapper?" → "A design pattern for sequential composition with context")
- [ ] Given each timeline entry, when I see the badge, then it shows a learning stage label (🌱 Beginner, 💡 Getting It, 🌟 Mastery) based on the confidence at that time
- [ ] Given I want to revisit a concept, when I click "Teach this back", then Reflect Mode opens for that concept

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E13-S2  
**UX Reference:** Section 4 - Dashboard (extended)  
**API Reference:** GET /glossary/:conceptId (includes definitionHistory)

---

### E13-S4: Glossary–Graph Integration

**As a** learner  
**I want to** access glossary entries from my concept graph and vice versa  
**So that** the two views of my knowledge are connected

**Acceptance Criteria:**
- [ ] Given I click a node in my concept graph, when the detail panel opens, then I see my glossary definition (if one exists) alongside the graph data
- [ ] Given I view a glossary entry, when I see "Related concepts", then they link to the concept graph view
- [ ] Given I view a glossary entry, when I see "View in graph", then the concept graph opens centred on that node
- [ ] Given I save a cheat sheet (E3-S10), when I view the glossary entry for that concept, then the cheat sheet is accessible from the entry

**Story Points:** 3  
**Priority:** P2-Medium  
**Dependencies:** E13-S2, E6-S3  
**UX Reference:** Section 5 - Concept Graph (extended)  
**API Reference:** GET /glossary/:conceptId, GET /concepts/:conceptId

---

## Story Summary by Priority

### P0 - Critical (Must Have for MVP)
| ID | Title | Points |
|----|-------|--------|
| E1-S1 | User Sign Up with Email | 3 |
| E1-S4 | User Login | 3 |
| E1-S5 | Session Management | 5 |
| E2-S1 | Welcome Screen | 2 |
| E2-S2 | Conversational Intake | 8 |
| E2-S3 | Learning Preferences | 3 |
| E2-S4 | First Topic Selection | 5 |
| E2-S5 | Profile API Integration | 3 |
| E3-S1 | Path Generation | 8 |
| E3-S2 | Path Content Display | 5 |
| E3-S3 | Path Navigation | 3 |
| E3-S5 | Progress Persistence | 5 |
| E3-S7 | Path Completion | 3 |
| E4-S1 | Reflection Prompt Display | 3 |
| E4-S2 | Reflection Submission | 3 |
| E4-S3 | Reflection Analysis Display | 8 |
| E5-S1 | Chat Interface | 5 |
| E5-S2 | Send & Receive Messages | 8 |
| E6-S1 | Graph Visualization | 8 |
| E6-S3 | Concept Detail Panel | 5 |
| E7-S1 | Dashboard Home | 5 |
| E7-S3 | Header Navigation | 3 |
| **Total P0** | | **104** |

### P1 - High (Should Have)
| ID | Title | Points |
|----|-------|--------|
| E1-S2 | OAuth Google | 5 |
| E2-S7 | Profile Edit from Settings | 8 |
| E3-S4 | Step Checkpoints | 5 |
| E3-S6 | Struggle Button & Help | 8 |
| E4-S4 | Learner State Update | 5 |
| E5-S3 | Context-Aware Suggestions | 5 |
| E5-S5 | Chat from Context | 6 |
| E6-S2 | Graph Pan/Zoom | 5 |
| E6-S5 | Graph Auto-Update | 8 |
| E7-S2 | Quadrant Display | 3 |
| E7-S4 | Mobile Navigation | 5 |
| E7-S5 | Toast Notifications | 2 |
| E8-S1 | Settings Page | 3 |
| E8-S2 | Account Deletion | 3 |
| E8-S3 | Data Export (GDPR) | 5 |
| E15-S1 | Level-Aware AI Chat | 5 |
| **Total P1** | | **81** |

### P2 - Medium (Nice to Have)
| ID | Title | Points |
|----|-------|--------|
| E1-S3 | OAuth GitHub | 3 |
| E1-S6 | Password Reset | 4 |
| E2-S6 | Skip/Resume Onboarding | 5 |
| E3-S8 | Path History | 5 |
| E3-S9 | Path Suggestions | 5 |
| E3-S10 | Cheat Sheet Summarizer | 5 |
| E4-S5 | Skip Reflection | 2 |
| E5-S4 | Chat Session Management | 5 |
| E6-S4 | Graph Filtering | 3 |
| E6-S6 | Manual Concept Addition | 8 |
| **Total P2** | | **45** |

### P3 - Low (Phase 2)
| ID | Title | Points |
|----|-------|--------|
| E9-S4 | Persona Consistency Validation | 5 |
| E11-S3 | Export Preview | 5 |
| E11-S4 | PDF Export | 5 |
| E12-S4 | Achievement Preferences | 2 |
| E14-S4 | Prerequisite Visualization on Path Detail | 3 |
| E15-S3 | Implicit Level Detection | 8 |
| E15-S4 | Age-Appropriate Content Guardrails | 3 |
| **Total P3** | | **31** |

### Phase 2 - P2 (New Epics)
| ID | Title | Points |
|----|-------|--------|
| E9-S1 | Persona Selection During Onboarding | 3 |
| E9-S2 | Persona System Prompt Injection | 5 |
| E9-S3 | Persona Switching from Settings | 3 |
| E9-S5 | Secret & Unlockable Mentors | 8 |
| E10-S1 | Tone Matrix UI in Onboarding | 5 |
| E10-S2 | Tone Matrix Prompt Construction | 3 |
| E10-S3 | Tone Adjustment from Settings | 3 |
| E11-S1 | Book Generation Engine | 8 |
| E11-S2 | Export Format Options | 3 |
| E12-S1 | Achievement Data Model & Seed Definitions | 5 |
| E12-S2 | Achievement Evaluation Engine | 5 |
| E12-S3 | Achievement Toast & Dashboard Display | 5 |
| E13-S1 | Glossary Data Model & Auto-Population | 5 |
| E13-S2 | Glossary Page & Search | 5 |
| E13-S3 | Definition Evolution Timeline | 5 |
| E13-S4 | Glossary–Graph Integration | 3 |
| E14-S1 | Prerequisite Assessment Chat | 8 |
| E14-S2 | Concept Graph Prerequisite Walking | 5 |
| E14-S3 | Dynamic Prerequisite Detection During Learning | 8 |
| E14-S5 | Prerequisite Knowledge Report | 5 |
| E15-S2 | Completion Level Tracking | 5 |
| **Total Phase 2 P2** | | **124** |

---

## Epic 14: Prerequisite Intelligence

> **Design Problem:** When a learner requests a path (e.g., "learn React"), how does the system handle prerequisite gaps (e.g., they don't know JavaScript)? What about hidden prerequisites they don't even know exist? What if they already know the prerequisites (e.g., a nurse learning cardio health already knows anatomy)?

> **Approach:** Hybrid — brief upfront assessment during path generation, plus dynamic detection during learning. The concept graph's `prerequisite` relations provide the structural backbone, while AI conversation provides the nuanced assessment.

### E14-S1: Prerequisite Assessment Chat

**As a** learner  
**I want to** have a brief "what do you already know?" conversation before my path is generated  
**So that** the path skips concepts I've mastered and includes ones I'm missing

**Acceptance Criteria:**
- [ ] Given I request a new path, when the AI generates it, then it first asks 2-3 screening questions about prerequisite knowledge
- [ ] Given I demonstrate prerequisite knowledge, when the path is generated, then those prerequisites are skipped
- [ ] Given I reveal a knowledge gap, when the path is generated, then prerequisite milestones are prepended
- [ ] Given the concept graph has `prerequisite` relations for the target concepts, when generating, then those relations inform the screening questions
- [ ] Given I say "I don't know" to a screening question, when the path is generated, then prerequisite milestones include that topic

**Story Points:** 8  
**Priority:** P2-Medium  
**Dependencies:** E3-S1, E6-S1  
**Implementation Notes:** Extend the path generation prompt to include a prerequisite analysis phase. The AI should walk backward through concept graph prereqs and generate targeted questions.

---

### E14-S2: Concept Graph Prerequisite Walking

**As a** system  
**I want to** automatically identify prerequisite chains from the concept graph  
**So that** path generation knows what foundational concepts are needed

**Acceptance Criteria:**
- [ ] Given a target concept with `prerequisite` relations, when walking the graph, then all transitive prerequisites are identified
- [ ] Given a prerequisite has high mastery (≥80%), when building the prereq chain, then it is marked as "likely known"
- [ ] Given a prerequisite has low mastery (<30%), when building the prereq chain, then it is flagged as "needs assessment"
- [ ] Given a concept has no graph data yet, when building prereqs, then the AI infers likely prerequisites from domain knowledge
- [ ] Given circular dependencies exist, when walking the graph, then cycles are detected and handled gracefully

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E6-S1  
**Implementation Notes:** New service function `getPrerequisiteChain(conceptId)` that performs BFS/DFS on `prerequisite` relations and returns an ordered list with mastery levels.

---

### E14-S3: Dynamic Prerequisite Detection During Learning

**As a** learner  
**I want to** be alerted if the AI detects I'm struggling due to a missing prerequisite  
**So that** I can fill the gap before continuing

**Acceptance Criteria:**
- [ ] Given I'm chatting about a milestone concept, when the AI detects confusion stemming from a missing prerequisite, then it flags the gap
- [ ] Given a prerequisite gap is flagged, when I see the suggestion, then I can choose "Add prerequisite milestone" or "I know this, continue"
- [ ] Given I choose to add a prerequisite, when accepted, then a new milestone is inserted into my path before the current one
- [ ] Given I choose "I know this," when continuing, then the system records that I self-assessed as knowing it
- [ ] Given the AI flags a gap, when recording, then the concept graph is updated with a new `prerequisite` relation if one doesn't exist

**Story Points:** 8  
**Priority:** P2-Medium  
**Dependencies:** E14-S1, E5-S2  
**Implementation Notes:** Extend the chat system prompt to include prerequisite monitoring. Add a new PATCH action `insert_milestone` that adds a milestone at a specific position.

---

### E14-S4: Prerequisite Visualization on Path Detail

**As a** learner  
**I want to** see which milestones are prerequisites vs. core content  
**So that** I understand why certain milestones were added

**Acceptance Criteria:**
- [ ] Given a milestone was added as a prerequisite, when viewing the path, then it shows a "Prerequisite" badge
- [ ] Given a prerequisite milestone is completed, when viewing the path, then a visual connector shows which later milestone it unlocked
- [ ] Given I already knew a prerequisite (self-assessed), when viewing the path, then the milestone shows as "Skipped — Already Known"

**Story Points:** 3  
**Priority:** P3-Low  
**Dependencies:** E14-S3  

---

### E14-S5: Prerequisite Knowledge Report

**As a** learner  
**I want to** see a summary of my prerequisite knowledge gaps across all my paths  
**So that** I can prioritize foundational learning

**Acceptance Criteria:**
- [ ] Given I have multiple paths, when viewing the report, then I see a list of common prerequisite gaps
- [ ] Given a prerequisite appears in multiple paths, when viewing the report, then it is ranked higher
- [ ] Given I click a prerequisite, when navigating, then I'm offered a focused mini-path for just that concept

**Story Points:** 5  
**Priority:** P3-Low  
**Dependencies:** E14-S2, E14-S4  

---

## Epic 15: Adaptive Difficulty & Learner Level

> **Design Problem:** A 12-year-old and a 50-year-old high school graduate both want to learn "cardio health." Can the system adapt explanations to their level? Can both "complete" the same path in good faith, with the system tracking what depth they achieved?

> **Approach:** Start with explicit level selection (already captured as `userLevel` during path generation), feed it into AI system prompts, and record `completionLevel` on path completion. Later, add implicit level detection from conversation quality and vocabulary.

### E15-S1: Level-Aware AI Chat

**As a** learner  
**I want to** receive explanations matched to my knowledge level  
**So that** I can understand concepts without being overwhelmed or bored

**Acceptance Criteria:**
- [ ] Given my profile has a `userLevel` (beginner/intermediate/advanced), when chatting with AI, then explanations use appropriate vocabulary and complexity
- [ ] Given I'm a beginner, when the AI explains a concept, then it uses simple analogies and avoids jargon
- [ ] Given I'm advanced, when the AI explains a concept, then it includes deeper mechanisms, edge cases, and references
- [ ] Given my path was generated with a specific level, when chatting about that path's concepts, then the level is passed to the AI system prompt
- [ ] Given I ask to "explain it simpler" or "go deeper," when the AI responds, then it adjusts for that exchange

**Story Points:** 5  
**Priority:** P1-High  
**Dependencies:** E5-S2  
**Implementation Notes:** Inject `userLevel` from the path's `generatedFrom.userLevel` into the chat system prompt. Quick win — can be done with minimal code change.

---

### E15-S2: Completion Level Tracking

**As a** learner  
**I want to** see what depth I completed a learning path at  
**So that** I can revisit it later for deeper understanding

**Acceptance Criteria:**
- [ ] Given I complete a path, when the completion is recorded, then a `completionLevel` is stored (foundational/intermediate/advanced)
- [ ] Given the same path is completed by different users at different levels, when comparing, then each completion reflects the appropriate depth
- [ ] Given I completed a path at foundational level, when viewing it later, then I see an option to "Deepen — study at intermediate level"
- [ ] Given I choose to deepen, when a new path is generated, then it skips foundational content and adds advanced milestones

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E15-S1, E3-S6  
**Implementation Notes:** Add `completionLevel` and `assessmentDepth` fields to the LearningPath type. Derive from `generatedFrom.userLevel` initially, refine based on AI assessment of conversation quality.

---

### E15-S3: Implicit Level Detection

**As a** system  
**I want to** infer the learner's actual level from their conversation  
**So that** I can adapt difficulty even without explicit selection

**Acceptance Criteria:**
- [ ] Given a learner chats about a concept, when analyzing their messages, then the system estimates vocabulary level and conceptual depth
- [ ] Given the estimated level diverges from the explicit level, when detected, then the system asks "Should I adjust the difficulty?"
- [ ] Given the learner confirms adjustment, when applied, then subsequent explanations match the detected level
- [ ] Given level is implicitly detected, when stored, then the user profile records detected level alongside self-reported level

**Story Points:** 8  
**Priority:** P3-Low  
**Dependencies:** E15-S1  
**Implementation Notes:** Add a periodic level-assessment prompt to the AI conversation. Analyze message length, vocabulary complexity, question sophistication. Store as `detectedLevel` on the user profile.

---

### E15-S4: Age-Appropriate Content Guardrails

**As a** parent or young learner  
**I want to** ensure content is age-appropriate  
**So that** a 12-year-old gets explanations suitable for their maturity level

**Acceptance Criteria:**
- [ ] Given a user's profile indicates age (or age range), when the AI generates content, then it avoids inappropriate complexity or examples
- [ ] Given a health topic, when explaining to a young learner, then anatomical/medical details are simplified appropriately
- [ ] Given age-appropriate mode is active, when the AI generates content, then a content safety check is applied to responses

**Story Points:** 3  
**Priority:** P3-Low  
**Dependencies:** E15-S1  
**Implementation Notes:** Add optional `ageRange` to user profile. Include age-appropriate instructions in the AI system prompt when set.

---

## Epic 16: User Highlights & Annotations

**Goal:** Allow learners to highlight text in AI responses and their own notes, creating a personal glossary of important terms and passages that can be reviewed later.

**Rationale:** While the system auto-bolds key terminology, learners should also be able to mark what *they* find important. User highlights serve as a study aid, create implicit signal about what the learner is focusing on, and provide data for the AI to personalize future responses.

### Priority Table

| Story ID | Title | Points |
|----------|-------|--------|
| E16-S1 | Text Selection & Highlight in Chat | 5 |
| E16-S2 | Highlights Review Panel | 5 |
| E16-S3 | AI-Aware Highlights (Personalization) | 5 |

**Total: 3 stories, 15 points**

---

### E16-S1: Text Selection & Highlight in Chat

**ID:** E16-S1  
**Title:** Text Selection & Highlight in Chat  
**As a** learner  
**I want to** highlight text in AI responses by selecting it  
**So that** I can mark key passages and terms for later review

**Acceptance Criteria:**
- [ ] Given an AI response is displayed, when the user selects text in a message bubble, then a "Highlight" tooltip/button appears
- [ ] Given the user confirms a highlight, then the selected text is visually marked (e.g. yellow background) and persisted to Firestore
- [ ] Given a message has existing highlights, when the message renders, then highlights are restored from persisted data
- [ ] Given a highlighted term, when the user clicks it, then it behaves like a bold term (sends "Tell me about {X}")
- [ ] Given a highlight exists, when the user clicks the highlight again, then they can remove it

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E5-S2  
**Implementation Notes:** Store highlights as `{messageId, sessionId, text, startOffset, endOffset, createdAt}` in a `highlights` Firestore collection. Use the Selection API for text selection detection. Render highlights by wrapping matched ranges in `<mark>` elements.

---

### E16-S2: Highlights Review Panel

**ID:** E16-S2  
**Title:** Highlights Review Panel  
**As a** learner  
**I want to** see all my highlights across sessions in one place  
**So that** I can review key concepts and passages I've marked

**Acceptance Criteria:**
- [ ] Given the user navigates to the Highlights panel (accessible from dashboard or chat sidebar), then all highlights are displayed grouped by session/topic
- [ ] Given a highlight is shown, then it includes the surrounding context (1-2 sentences around the highlighted text)
- [ ] Given a highlight is clicked, when navigating, then the user is taken to that session at the relevant message
- [ ] Given the user wants to clean up, when they delete a highlight from the panel, then it is removed from Firestore and the chat view
- [ ] Given highlights exist, when the user searches, then highlights are filterable by keyword

**Story Points:** 5  
**Priority:** P2-Medium  
**Dependencies:** E16-S1  
**Implementation Notes:** New route `/dashboard/highlights`. API endpoint `GET /api/highlights?userId=...` with optional `sessionId` filter. Consider flashcard-style review mode as future enhancement.

---

### E16-S3: AI-Aware Highlights (Personalization)

**ID:** E16-S3  
**Title:** AI-Aware Highlights (Personalization)  
**As a** learner  
**I want** the AI to know what I've highlighted  
**So that** it can emphasize those concepts in future conversations and track my focus areas

**Acceptance Criteria:**
- [ ] Given a user has highlights, when starting a new chat session on a related topic, then the system prompt includes the user's highlighted terms as "areas of focus"
- [ ] Given frequent highlights on a specific concept, when the AI generates follow-up suggestions, then it prioritizes questions related to highlighted material
- [ ] Given the user's highlight history, when generating learning path suggestions, then highlighted concepts influence path recommendations
- [ ] Given the AI references a concept the user previously highlighted, then it acknowledges the user's prior interest ("You highlighted this earlier — let's go deeper")

**Story Points:** 5  
**Priority:** P3-Low  
**Dependencies:** E16-S1, E16-S2  
**Implementation Notes:** Aggregate highlights into a per-user `focusTerms` summary. Inject top highlighted terms into the system prompt. Use highlight frequency as a signal in path generation and follow-up suggestion APIs.

---

**Grand Total (all phases):** 409 story points

**MVP Target (P0 only):** 104 points  
**Full MVP (P0 + P1):** 180 points  
**Phase 2 (P2 new epics + P3 deferred):** 106 points

---

**Document Status:** Complete Epic/Story Breakdown  
**Next:** Traceability Matrix  
**Owner:** Blast  
**Last Updated:** February 12, 2026
