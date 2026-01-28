# Development Guide

> Complete guide for local development, testing, and deployment

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Testing Guide](#testing-guide)
4. [Code Style](#code-style)
5. [Git Workflow](#git-workflow)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js 18+** with npm
- **Git** for version control
- **VS Code** (recommended) with extensions listed in `.vscode/extensions.json`
- **Firebase account** (see SETUP_DAY2.md)
- **OpenAI API key** (see SETUP_DAY2.md)

### Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd learningos

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials (see SETUP_DAY2.md)

# 4. Verify setup
npm run verify-setup

# 5. Start development server
npm run dev
```

Visit http://localhost:3000 to see the app.

---

## Development Workflow

### Project Structure

```
/src
  /app                    # Next.js App Router
    /api                  # API routes (serverless functions)
    /(auth)              # Authentication pages
    /(dashboard)         # Protected dashboard pages
    layout.tsx           # Root layout
    page.tsx             # Home page
  /components
    /ui                  # Base UI components
    /features            # Feature-specific components
  /lib
    /ai                  # OpenAI integration
    /firebase            # Firebase config & helpers
    /hooks               # Custom React hooks
    /utils               # Utility functions
  /types                 # TypeScript type definitions
  /test                  # Test utilities and mocks
  /styles               # Global styles
```

### Common Tasks

#### Creating a New Component

```bash
# 1. Create component file
touch src/components/ui/MyComponent.tsx

# 2. Write component
# 3. Create test file
touch src/components/ui/MyComponent.test.tsx

# 4. Write tests
# 5. Import and use in your page/component
```

#### Creating a New API Route

```bash
# 1. Create route file
mkdir -p src/app/api/my-endpoint
touch src/app/api/my-endpoint/route.ts

# 2. Implement GET/POST/etc handlers
# 3. Add types to src/types/index.ts
# 4. Test with curl or Postman
```

#### Adding a New Data Model

```bash
# 1. Define TypeScript interface in src/types/index.ts
# 2. Add Firestore security rules (if needed)
# 3. Create test mock in src/test/mockData.ts
# 4. Update technical-architecture.md documentation
```

---

## Testing Guide

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Writing Tests

**Component Test Example:**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Hello" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

**API Route Test Example:**

```typescript
import { describe, it, expect } from 'vitest'
import { GET } from './route'

describe('/api/my-endpoint', () => {
  it('should return success', async () => {
    const response = await GET()
    const data = await response.json()
    expect(data.status).toBe('success')
  })
})
```

### Using Mock Data

```typescript
import { mockUserProfile, mockLearningSession } from '@/test/mockData'

const user = mockUserProfile({ email: 'test@example.com' })
const session = mockLearningSession({ userId: user.userId })
```

### Using Mocks

```typescript
import { mockAuth, mockFirestore, mockOpenAI } from '@/test/mocks'

// Mock Firebase auth in your test
vi.mock('@/lib/firebase/config', () => ({
  auth: mockAuth,
  db: mockFirestore,
}))
```

---

## Code Style

### TypeScript

- ✅ Use explicit types for function parameters and return values
- ✅ Prefer interfaces over types for object shapes
- ✅ Use `const` by default, `let` when reassignment needed
- ✅ Avoid `any` - use `unknown` or proper types

### React

- ✅ Use functional components with hooks
- ✅ Extract custom hooks for reusable logic
- ✅ Keep components small and focused (< 200 lines)
- ✅ Use proper prop types with TypeScript

### Naming Conventions

```typescript
// Components: PascalCase
function UserProfileCard() { ... }

// Functions/variables: camelCase
const getUserData = () => { ... }

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3

// Types/Interfaces: PascalCase
interface UserProfile { ... }

// Files: kebab-case
user-profile-card.tsx
```

### Formatting

Code is automatically formatted with Prettier on save. Configuration in `.prettierrc.json`.

### Linting

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors (where possible)
npm run lint -- --fix
```

---

## Git Workflow

### Branch Strategy

```
main              # Production-ready code
develop           # Integration branch
feature/*         # New features
bugfix/*          # Bug fixes
hotfix/*          # Emergency production fixes
```

### Commit Messages

Follow conventional commits format:

```
type(scope): description

feat(auth): add Google OAuth login
fix(chat): resolve streaming message bug
docs(readme): update setup instructions
test(profile): add user profile tests
chore(deps): update dependencies
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch and create PR
4. Wait for CI checks to pass
5. Request review
6. Merge after approval

---

## Deployment

### Vercel (Recommended)

**First-time Setup:**

1. Install Vercel CLI: `npm install -g vercel`
2. Link project: `vercel link`
3. Add environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

**Automatic Deployments:**

- Push to `main` → Production deployment
- Push to `develop` → Preview deployment
- Pull requests → Preview deployments

### Environment Variables in Vercel

Add all variables from `.env.local` in Vercel dashboard:

- Project Settings → Environment Variables
- Add each variable for Production, Preview, and Development
- Redeploy after adding variables

---

## Troubleshooting

### Common Issues

**Problem: "Module not found" errors**
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules .next
npm install
```

**Problem: Type errors in IDE**
```bash
# Solution: Restart TypeScript server
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

**Problem: Firebase authentication not working**
```bash
# Solution: Check authorized domains
# Firebase Console → Authentication → Settings → Authorized domains
# Add localhost and your deployment domain
```

**Problem: OpenAI API rate limits**
```bash
# Solution: Implement retry logic or use fallback model
# Check usage: https://platform.openai.com/usage
```

**Problem: Test failures**
```bash
# Solution: Clear test cache
npx vitest --clearCache
npm test
```

### Getting Help

1. Check existing documentation in `_bmad-output/`
2. Review architecture docs for design decisions
3. Check GitHub issues for known problems
4. Ask in team chat/Slack

---

## Performance Tips

- Use `React.memo()` for expensive components
- Implement proper loading states
- Use dynamic imports for code splitting
- Optimize images with Next.js Image component
- Monitor bundle size with `npm run build`

---

## Security Best Practices

- ✅ Never commit `.env.local` or secrets
- ✅ Use environment variables for all API keys
- ✅ Validate user input on both client and server
- ✅ Implement proper Firestore security rules
- ✅ Use HTTPS in production
- ✅ Keep dependencies updated

---

*This guide is continuously updated. Last updated: January 28, 2026*
