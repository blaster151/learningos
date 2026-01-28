// Mock Firebase services for testing
import { vi } from 'vitest'

// Mock Firebase Auth
export const mockAuth = {
  currentUser: {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
  },
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}

// Mock Firestore
export const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      onSnapshot: vi.fn(),
    })),
    where: vi.fn(() => ({
      get: vi.fn(),
    })),
    orderBy: vi.fn(() => ({
      get: vi.fn(),
    })),
    limit: vi.fn(() => ({
      get: vi.fn(),
    })),
    add: vi.fn(),
    get: vi.fn(),
  })),
  doc: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    onSnapshot: vi.fn(),
  })),
}

// Mock OpenAI
export const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn(() =>
        Promise.resolve({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'This is a test response',
              },
            },
          ],
        })
      ),
    },
  },
}

// Helper to reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks()
}
