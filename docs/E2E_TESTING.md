# E2E Testing Guide — LearningOS

> How to run Playwright end-to-end tests against Firebase emulators.

---

## Architecture Overview

```
┌──────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│  Playwright   │─────▶│  Next.js Dev     │─────▶│  Firebase Emulators │
│  (test runner)│      │  Server (:3001)  │      │  Auth    (:9099)    │
│              │      │                  │      │  Firestore (:8080)  │
│  browser     │      │  Client SDK ───────────▶│  Emulator UI (:4000)│
└──────────────┘      └──────────────────┘      └─────────────────────┘
```

**Key relationships:**

| Layer | Connects to emulator via | Config location |
|-------|--------------------------|-----------------|
| Client SDK (browser) | `connectAuthEmulator()` / `connectFirestoreEmulator()` | `src/lib/firebase/config.ts` — enabled when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` |
| Admin SDK (API routes) | `FIREBASE_AUTH_EMULATOR_HOST` / `FIRESTORE_EMULATOR_HOST` env vars | `playwright.config.ts` → `webServer.env` |
| Playwright test code | Direct HTTP to emulator REST API | `e2e/helpers/auth.ts` |

---

## Prerequisites

1. **Firebase CLI** installed globally: `npm install -g firebase-tools`
2. **Java Runtime** — required by the Firestore emulator (Auth emulator doesn't need it)
3. **Playwright browsers** installed: `npx playwright install`

---

## Running E2E Tests

### Step 1: Start Firebase Emulators

```bash
# In a separate terminal — leave this running
npm run dev:emulators
# or equivalently:
npx firebase emulators:start
```

This starts:
- **Auth emulator** on `http://localhost:9099`
- **Firestore emulator** on `http://localhost:8080`
- **Emulator UI** on `http://localhost:4000` (useful for debugging)

Verify they're running:
```bash
# Windows PowerShell
netstat -ano | findstr ":9099 :8080"

# Or just open http://localhost:4000 in a browser
```

### Step 2: Run the tests

```bash
# Runs all e2e tests (Playwright auto-starts the dev server on :3001)
npm run test:e2e

# Run a specific test file
npx playwright test e2e/prerequisite-intelligence.spec.ts

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with verbose list output
npx playwright test --reporter=list
```

Playwright will automatically:
- Start a Next.js dev server on port 3001 (unless one is already running)
- Pass the emulator env vars to the dev server (configured in `playwright.config.ts`)
- Run tests in headless Chromium

### Step 3: View results

```bash
# Open the HTML report
npx playwright show-report
```

---

## Authentication in E2E Tests

### The Problem

All `/dashboard/*` pages are wrapped in `<ProtectedRoute>` (see `src/app/dashboard/layout.tsx`), which checks `useAuth()` and redirects unauthenticated users to `/login`. E2E tests that navigate to dashboard pages will hit the login wall.

### The Solution: `e2e/helpers/auth.ts`

A shared helper that:

1. **Creates a test user** in the Firebase Auth emulator via its REST API
2. **Logs in through the UI** on the `/login` page (fills email + password, clicks Sign In)
3. **Waits for redirect** to `/dashboard` (or handles `/onboarding` if triggered)

```typescript
import { loginAsTestUser } from './helpers/auth';

test.describe('My Dashboard Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);   // ← handles auth
    await page.goto('/dashboard/learn');
  });

  test('should see the learn page', async ({ page }) => {
    await expect(page.getByPlaceholder(/what do you want to learn/i)).toBeVisible();
  });
});
```

**Test user credentials** (only exist in the emulator, reset on each emulator restart):

| Field | Value |
|-------|-------|
| Email | `e2e-test@learningos.test` |
| Password | `TestPassword123!` |

### How the Auth Emulator REST API Works

The helper calls the Identity Toolkit endpoint directly — no SDK needed:

```
POST http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key
Content-Type: application/json

{ "email": "...", "password": "...", "returnSecureToken": true }
```

- The `key=fake-api-key` param can be any string — the emulator doesn't validate API keys.
- If the user already exists, the emulator returns `400 EMAIL_EXISTS`, which the helper silently ignores.
- The created user has no Firestore profile doc — the dashboard pages handle this gracefully (empty paths, etc.).

---

## Playwright Config Details

**File:** `playwright.config.ts`

Key settings for LearningOS:

```typescript
{
  timeout: 120_000,         // 2 min per test — needed for AI calls
  navigationTimeout: 30000, // 30s for page loads (login + dashboard)

  webServer: {
    command: 'npm run dev -- -p 3001',
    env: {
      // Client SDK → connects to emulators in src/lib/firebase/config.ts
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR: 'true',

      // Admin SDK → verifyIdToken() trusts emulator tokens
      FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',

      // Admin SDK → reads/writes go to emulator Firestore
      FIRESTORE_EMULATOR_HOST: 'localhost:8080',
    },
  },
}
```

**Why both client AND admin env vars are needed:**

- `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` → tells the **client-side** Firebase SDK (running in the browser) to call `connectAuthEmulator()` and `connectFirestoreEmulator()`.
- `FIREBASE_AUTH_EMULATOR_HOST` → tells the **server-side** Firebase Admin SDK (running in API routes) to verify tokens against the emulator instead of Google's production servers. Without this, `verifyIdToken()` rejects emulator-issued tokens.
- `FIRESTORE_EMULATOR_HOST` → tells the Admin SDK to read/write Firestore data from the emulator.

---

## Writing New E2E Tests

### Template for authenticated dashboard tests

```typescript
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard/your-page');
  });

  test('should do something', async ({ page }) => {
    // Your test here
  });
});
```

### Template for tests with AI/LLM calls

Tests that trigger OpenAI calls (screening, path generation, etc.) are **non-deterministic**. Use conditional assertions:

```typescript
test('should handle screening result', async ({ page }) => {
  // Trigger the AI flow
  await page.getByPlaceholder(/what do you want to learn/i).fill('Learn Rust');
  await page.getByRole('button', { name: /generate path/i }).click();

  // AI might auto-skip screening or show the chat — handle both
  const screeningPanel = page.getByText(/adaptive screening chat/i);
  const autoSkip = page.locator('.bg-emerald-50');

  await expect(screeningPanel.or(autoSkip)).toBeVisible({ timeout: 15000 });

  if (await screeningPanel.isVisible()) {
    // Test screening-specific UI
  } else {
    // Test auto-skip flow
  }
});
```

### Key patterns

| Pattern | When to use | Example |
|---------|-------------|---------|
| `element.or(otherElement)` | AI can produce two different outcomes | Screening chat OR auto-skip |
| `.isVisible().catch(() => false)` | Element may or may not exist | Prerequisite badges |
| `await page.waitForTimeout(ms)` | Need to wait for async state update | After AI response |
| Generous `timeout` values | Any AI-dependent assertion | `{ timeout: 30000 }` |
| Early `return` on no-match | Graceful skip when AI doesn't produce expected output | `if (!hasScreening) return;` |

---

## Existing E2E Test Files

| File | Tests | What it covers |
|------|-------|----------------|
| `e2e/auth.spec.ts` | Auth flow | Login, signup, protected route redirects |
| `e2e/chat.spec.ts` | Chat page | Sending messages, chat history |
| `e2e/session.spec.ts` | Sessions | Session creation and management |
| `e2e/learning-paths.spec.ts` | Paths | Path generation and management |
| `e2e/graph-visualization.spec.ts` | Knowledge graph | Graph rendering |
| `e2e/reflection-system.spec.ts` | Reflections | Reflection prompts and responses |
| `e2e/chat-enhancements.spec.ts` | Chat UX | Enhanced chat features |
| `e2e/prerequisite-intelligence.spec.ts` | **Epic 14** | Screening chat, gap tiers, badges, gap cards |

> **Note:** Most existing test files (chat, session, etc.) were written before the auth helper existed and contain a comment like `"assume you're logged in"`. They will also fail on auth redirects until updated to use `loginAsTestUser()`.

---

## Troubleshooting

### All tests fail with timeout on `/dashboard/*` pages

**Symptom:** Tests time out waiting for dashboard elements; error context shows the login page ("Sign in to your account") rendered instead.

**Cause:** Firebase emulators are not running, OR the dev server wasn't started with emulator env vars.

**Fix:**
1. Ensure emulators are running: `npm run dev:emulators`
2. Ensure Playwright starts the dev server (don't start it manually without the env vars)
3. If you _do_ start the dev server manually, pass the env vars:
   ```bash
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 FIRESTORE_EMULATOR_HOST=localhost:8080 npm run dev -- -p 3001
   ```

### Admin SDK rejects tokens (`verifyIdToken` fails)

**Symptom:** API routes return 401 even though the user logged in successfully in the browser.

**Cause:** `FIREBASE_AUTH_EMULATOR_HOST` is not set for the server process. The Admin SDK tries to verify the emulator token against Google's production servers, which rejects it.

**Fix:** Ensure `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` is in the `webServer.env` in `playwright.config.ts`.

### Emulator user disappears between test runs

**Expected:** The Firebase Auth emulator is **ephemeral** — all data is wiped when the emulator stops. The `loginAsTestUser()` helper re-creates the test user on every call, so this is handled automatically.

### Tests are slow (~30-40s each)

**Why:** Each test logs in through the real UI (page load → form fill → submit → redirect → page load). AI-dependent tests also wait for OpenAI responses.

**Future optimization:** Use Playwright's `storageState` to save the auth cookies/tokens after one login and reuse them across tests without re-logging in. See [Playwright auth docs](https://playwright.dev/docs/auth).

### Screening chat buttons are disabled (test can't interact)

**Why:** After the screening starts, the first AI question is being loaded. All buttons are disabled during `screeningBusy` state.

**Fix:** Wait for the button to become enabled before clicking:
```typescript
const sendBtn = page.getByRole('button', { name: /send/i });
await expect(sendBtn).toBeEnabled({ timeout: 30000 });
```

### User messages don't appear in screening chat

**Expected behavior:** The screening chat only renders **assistant** messages. User input is sent as a `userAction` to the API and is not added to the visible message list. Don't assert on user message text appearing in the chat area.

---

## File Reference

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Test runner config, timeouts, emulator env vars |
| `e2e/helpers/auth.ts` | Shared login helper for all authenticated e2e tests |
| `firebase.json` | Emulator port config (Auth: 9099, Firestore: 8080, UI: 4000) |
| `src/lib/firebase/config.ts` | Client SDK emulator connection (`connectAuthEmulator`, etc.) |
| `src/lib/firebase/admin.ts` | Admin SDK init (reads `FIREBASE_AUTH_EMULATOR_HOST` automatically) |
| `src/components/auth/ProtectedRoute.tsx` | Dashboard auth guard that redirects to `/login` |
