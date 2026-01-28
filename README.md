# LearningOS

AI-powered conversational learning platform that helps users master any topic through intelligent conversation and visual knowledge mapping.

## 📚 Project Status

**Phase:** Pre-Sprint 0 - Day 2: External Services Setup  
**Start Date:** January 27, 2026  
**Last Updated:** January 28, 2026

### ✅ Day 1 Complete:
- Next.js 15 + TypeScript + Tailwind CSS
- Project structure and dependencies
- VS Code workspace configuration

### 🔄 Day 2 In Progress:
- Firebase project setup
- OpenAI API configuration
- Service integration files created
- Awaiting credentials configuration

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
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
/src
  /app                 # Next.js App Router pages
    /api               # API routes
    /(auth)            # Auth-related pages
    /(dashboard)       # Protected dashboard pages
  /components
    /ui                # Base UI components (buttons, inputs, etc.)
    /features          # Feature-specific components
  /lib
    /ai                # AI service layer (OpenAI integration)
    /firebase          # Firebase config & helpers
    /hooks             # Custom React hooks
    /utils             # Utility functions
  /types               # TypeScript type definitions
  /styles              # Global styles
```

## 🛠️ Tech Stack

- **Frontend:** React 19 + Next.js 15 + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **Database:** Firebase Firestore + Firebase Auth
- **AI:** OpenAI GPT-4 / GPT-3.5 Turbo
- **Deployment:** Vercel

## 📋 Development Roadmap

- [x] Pre-Sprint 0: Project setup (3 days)
- [ ] Sprint 1: Foundation - Auth & Onboarding (2 weeks)
- [ ] Sprint 2: Core Chat Experience (2 weeks)
- [ ] Sprint 3: Learning Intelligence (2 weeks)
- [ ] Sprint 4: Knowledge Visualization (2 weeks)
- [ ] Sprint 5: Polish & Launch Prep (1 week)

See [Sprint Planning](/_bmad-output/sprint-planning.md) for detailed breakdown.

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## 📝 License

Private project - All rights reserved
