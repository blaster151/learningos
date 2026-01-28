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
| E3 | Learning Paths | 9 | 55 |
| E4 | Reflect Mode | 5 | 34 |
| E5 | Chat Mode | 5 | 29 |
| E6 | Concept Graph | 6 | 42 |
| E7 | Dashboard & Navigation | 5 | 18 |
| E8 | Settings & Data Export | 4 | 13 |
| **Total** | | **47** | **248** |

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

### E3-S2: Path Content Display

**As a** learner  
**I want to** see beautifully formatted learning content  
**So that** I can focus on understanding

**Acceptance Criteria:**
- [ ] Given I am on a path step, when I see text content, then it renders as styled Markdown
- [ ] Given I see code blocks, when displayed, then they have syntax highlighting
- [ ] Given I see code blocks, when I hover, then I see a copy button
- [ ] Given I click copy, when successful, then I see "Copied!" toast
- [ ] Given content is long, when scrolling, then the step container scrolls independently

**Story Points:** 5  
**Priority:** P0-Critical  
**Dependencies:** E3-S1  
**UX Reference:** Section 5 - Learning Session  
**API Reference:** GET /paths/:pathId

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

### E8-S4: "My Book" Export

**As a** learner  
**I want to** export my learning journey as a document  
**So that** I have a tangible record of what I learned

**Acceptance Criteria:**
- [ ] Given I am in data settings, when I see "Export My Book", then I can select format (Markdown/PDF)
- [ ] Given I select options, when I click export, then generation begins
- [ ] Given generation completes, when ready, then I can download the file
- [ ] Given I open the file, when I read it, then I see my definitions, reflections, and concept map

**Story Points:** 8 (Phase 2, but specced for MVP if time)
**Priority:** P3-Low  
**Dependencies:** E8-S1  
**UX Reference:** Section 9 - Profile Settings (Data)  
**API Reference:** POST /export/my-book, GET /export/:id

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
| **Total P1** | | **76** |

### P2 - Medium (Nice to Have)
| ID | Title | Points |
|----|-------|--------|
| E1-S3 | OAuth GitHub | 3 |
| E1-S6 | Password Reset | 4 |
| E2-S6 | Skip/Resume Onboarding | 5 |
| E3-S8 | Path History | 5 |
| E3-S9 | Path Suggestions | 5 |
| E4-S5 | Skip Reflection | 2 |
| E5-S4 | Chat Session Management | 5 |
| E6-S4 | Graph Filtering | 3 |
| E6-S6 | Manual Concept Addition | 8 |
| **Total P2** | | **40** |

### P3 - Low (Phase 2)
| ID | Title | Points |
|----|-------|--------|
| E8-S4 | "My Book" Export | 8 |
| **Total P3** | | **8** |

---

**Grand Total:** 228 story points

**MVP Target (P0 only):** 104 points  
**Full MVP (P0 + P1):** 180 points

---

**Document Status:** Complete Epic/Story Breakdown  
**Next:** Traceability Matrix  
**Owner:** Blast  
**Last Updated:** January 27, 2026
