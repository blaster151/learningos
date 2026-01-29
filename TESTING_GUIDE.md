# Testing Guide for LearningOS

> **Goal:** Ensure every sprint includes proper test coverage as part of "Definition of Done"

---

## Test Stack Overview

| Type | Tool | Location | Run Command |
|------|------|----------|-------------|
| Unit Tests | Vitest + RTL | `src/test/` | `npm test` |
| Component Tests | Vitest + RTL | `src/test/components/` | `npm run test:unit` |
| API Tests | Vitest | `src/test/api/` | `npm run test:api` |
| E2E Tests | Playwright | `e2e/` | `npm run test:e2e` |
| All Tests | Both | - | `npm run test:all` |

---

## When to Write Which Tests

### Component Tests (Vitest + RTL)
Write when you create or modify:
- UI components (`src/components/`)
- Reusable form elements
- Interactive widgets

**Template:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/ui/MyComponent';

describe('MyComponent', () => {
  it('should render with default props', () => {
    render(<MyComponent>Content</MyComponent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick}>Click me</MyComponent>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### API Route Tests (Vitest)
Write when you create or modify:
- API routes (`src/app/api/`)
- Server actions

**Template:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { createMockRequest } from '@/test/apiTestUtils';

// Mock Firebase
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => Promise.resolve({
    collection: vi.fn(() => ({
      // ... mock Firestore methods
    })),
  })),
}));

describe('MyAPI', () => {
  it('should return 400 if required field is missing', async () => {
    const { POST } = await import('@/app/api/myroute/route');
    const request = createMockRequest('/api/myroute', {
      method: 'POST',
      body: { /* missing required field */ },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

### Utility/Hook Tests (Vitest)
Write when you create or modify:
- Utility functions (`src/lib/`)
- Custom hooks
- API client functions

**Template:**
```typescript
import { describe, it, expect, vi } from 'vitest';

describe('myUtility', () => {
  it('should transform data correctly', () => {
    const input = { foo: 'bar' };
    const result = myUtility(input);
    expect(result).toEqual({ transformed: 'bar' });
  });
});
```

### E2E Tests (Playwright)
Write when you complete:
- A full user flow (login → action → result)
- Critical path features
- Integration between multiple pages

**Template:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Flow: Feature Name', () => {
  test('should complete the happy path', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Start")');
    await expect(page.locator('h1')).toContainText('Success');
  });
});
```

---

## Test File Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Component | `ComponentName.test.tsx` | `Button.test.tsx` |
| API Route | `routename.test.ts` | `sessions.test.ts` |
| Utility | `utilityName.test.ts` | `conceptExtraction.test.ts` |
| E2E | `feature.spec.ts` | `auth.spec.ts` |

---

## Sprint Testing Checklist

When finishing a story, verify:

```markdown
### Testing Checklist for Story [STORY-ID]

**New Components Created:**
- [ ] `ComponentA.test.tsx` - X tests
- [ ] `ComponentB.test.tsx` - X tests

**New API Routes Created:**
- [ ] `/api/newroute` - validation tests
- [ ] `/api/newroute` - success path tests

**New Utilities Created:**
- [ ] `newUtility.test.ts` - X tests

**E2E Impact:**
- [ ] Update `e2e/feature.spec.ts` if user flow changed
- [ ] Add new E2E test if new user journey added

**Run & Verify:**
- [ ] `npm test` - all passing
- [ ] `npm run test:coverage` - coverage maintained
```

---

## Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run only component tests
npm run test:unit

# Run only API tests
npm run test:api

# Run E2E tests (requires dev server or uses built-in)
npm run test:e2e

# Run everything
npm run test:all
```

---

## Mocking Patterns

### Mock Firebase Admin
```typescript
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => Promise.resolve({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
        set: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve()),
      })),
    })),
  })),
}));
```

### Mock fetch (for API clients)
```typescript
const mockFetch = vi.fn();
global.fetch = mockFetch;

mockFetch.mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve({ data: 'test' }),
});
```

### Mock Next.js Router
```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/current-path',
}));
```

---

## Troubleshooting

### Tests timing out
- Increase timeout: `it('test', async () => {}, 15000)`
- Check for unresolved promises
- Ensure mocks are set up correctly

### "Cannot find module" errors
- Check path aliases in `vitest.config.ts`
- Ensure file exists at expected location

### Firebase mock not working
- Use `vi.resetModules()` between tests if needed
- Dynamic imports (`await import()`) may need special handling

---

## CI Integration

Tests run automatically on:
- Every push to `main`
- Every pull request

See `.github/workflows/ci.yml` for configuration.
