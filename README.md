# LearningOS

AI-powered conversational learning platform that helps users master any topic through intelligent conversation and visual knowledge mapping.

## 📚 Project Status

**Phase:** Sprint 2 - Core Chat Features (Complete)  
**Start Date:** January 27, 2026  
**Last Updated:** January 31, 2026

### ✅ Sprint 0-1: Foundation Complete
- Next.js 15 + TypeScript + Tailwind CSS
- Firebase project (`learningos-2026`) with Firestore
- OpenAI API integration with streaming
- Authentication system (email/password)
- Vitest + React Testing Library (84 unit tests passing)
- Playwright E2E test infrastructure

### ✅ Sprint 2: Core Chat Complete
- ✅ Real-time AI chat with streaming responses
- ✅ Session management (CRUD operations)
- ✅ Message history and persistence
- ✅ AI concept extraction from conversations
- ✅ Clickable concept tags with detail panels
- ✅ AI-powered session summaries
- ✅ Mobile-responsive chat interface
- ✅ Accessibility features (ARIA labels, keyboard navigation)
- ✅ E2E tests for chat and session flows

### 🔄 Next: Sprint 3 - Concept Mapping
- Visual knowledge graph display
- Interactive concept relationships
- Mastery tracking and progress visualization

## 🏗️ Architecture

See detailed documentation in `_bmad-output/`:
- [Product Brief](/_bmad-output/product-brief.md)
- [Technical Architecture](/_bmad-output/technical-architecture.md)
- [UX Specifications](/_bmad-output/ux-specifications.md)
- [API Contracts](/_bmad-output/api-contracts.md)
- [Sprint Planning](/_bmad-output/sprint-planning.md)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (with npm)
- Firebase account
- OpenAI API key
- Redis Cloud account (optional for MVP)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys (see SETUP_DAY2.md)

# Verify setup
npm run verify-setup

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler check

# Testing
npm test                 # Run unit tests (Vitest + RTL)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Run E2E tests with UI

# Utilities
npm run verify-setup     # Verify environment setup
node scripts/seed-concepts.js  # View sample concept data
```

## 📁 Project Structure

```
/src
  /app                 # Next.js App Router pages
    /api
      /chat            # Streaming chat endpoint
      /sessions        # Session CRUD + summary generation
      /messages        # Message retrieval
      /concepts        # Concept extraction + retrieval
    /(auth)            # Auth-related pages (login, signup)
    /(dashboard)       # Protected dashboard pages (chat, concepts, sessions)
  /components
    /ui                # Base UI components (buttons, inputs, cards)
    /chat              # Chat-specific components (ChatInterface, ConceptTag, SessionSummary)
    /auth              # Auth components (LoginForm, SignupForm)
  /lib
    /ai                # AI service layer
      - chat.ts        # OpenAI streaming chat
      - conceptExtraction.ts  # Extract concepts from messages
      - sessionSummary.ts     # Generate AI session summaries
    /firebase          # Firebase config & helpers
    /hooks             # Custom React hooks
    /utils             # Utility functions
  /types               # TypeScript type definitions
/e2e                   # Playwright E2E tests
  - auth.spec.ts       # Authentication flows
  - chat.spec.ts       # Chat interface tests
  - session.spec.ts    # Session management tests
```

## 🎯 Key Features

### Chat Interface
- Real-time streaming AI responses
- Message history with persistence
- Example prompts for quick start
- Quick actions (follow-up questions)
- Character counter and input validation
- Mobile-responsive design
- Full accessibility (ARIA labels, keyboard navigation)

### Concept Tracking
- Automatic concept extraction from conversations
- Clickable concept tags with detail panels
- Category-coded tags (Programming, Algorithm, Data Structure, etc.)
- Mastery level tracking (Exploring → Comfortable → Expert)
- Related concepts linking

### Session Management
- Automatic session creation
- Session history and replay
- AI-generated session summaries with:
  - Key insights from conversation
  - Concepts covered
  - Suggested next steps
  - Progress level assessment

## 🛠️ Tech Stack

- **Frontend:** React 19 + Next.js 15 + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **Database:** Firebase Firestore + Firebase Auth
- **AI:** OpenAI GPT-4 with streaming
- **Testing:** Vitest + React Testing Library + Playwright
- **Deployment:** Vercel

## 📋 Development Roadmap

- [x] Pre-Sprint 0: Project setup (3 days)
- [x] Sprint 1: Foundation - Auth & Onboarding (2 weeks)
- [x] Sprint 2: Core Chat Experience (2 weeks)
- [ ] Sprint 3: Learning Intelligence (2 weeks)
- [ ] Sprint 4: Knowledge Visualization (2 weeks)
- [ ] Sprint 5: Polish & Launch Prep (1 week)

See [Sprint Planning](/_bmad-output/sprint-planning.md) for detailed breakdown.

## 🧪 Testing

Current test coverage: **84 unit tests passing**

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## 📝 License

Private project - All rights reserved
