/**
 * API Route Test Utilities
 * Helpers for testing Next.js API routes
 */

import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options;

  // Build URL with search params
  const urlObj = new URL(url, 'http://localhost:3000');
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(urlObj, requestInit as any);
}

/**
 * Parse JSON response from API route
 */
export async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Failed to parse response: ${text}`);
  }
}

/**
 * Mock Firebase Admin for testing
 */
export const mockFirebaseAdmin = {
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
      add: vi.fn(),
      where: vi.fn(() => ({
        get: vi.fn(),
        orderBy: vi.fn(() => ({
          get: vi.fn(),
          limit: vi.fn(() => ({
            get: vi.fn(),
          })),
        })),
        limit: vi.fn(() => ({
          get: vi.fn(),
        })),
        count: vi.fn(() => ({
          get: vi.fn(() => ({ data: () => ({ count: 0 }) })),
        })),
      })),
    })),
  },
};

import { vi } from 'vitest';
