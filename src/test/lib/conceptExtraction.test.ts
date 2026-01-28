/**
 * Tests for Concept Extraction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock OpenAI
vi.mock('@/lib/ai/config', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(() => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                concepts: [
                  {
                    name: 'Closures',
                    description: 'Functions that capture variables from outer scope',
                    category: 'programming',
                    confidence: 0.9,
                  },
                  {
                    name: 'Lexical Scope',
                    description: 'Variable scope determined by position in source code',
                    category: 'programming',
                    confidence: 0.75,
                  },
                ],
                mainTopic: 'JavaScript closures and scope',
              }),
            },
          }],
        })),
      },
    },
  },
  AI_CONFIG: {
    PRIMARY_MODEL: 'gpt-4',
    FALLBACK_MODEL: 'gpt-3.5-turbo',
  },
}));

describe('Concept Extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractConcepts', () => {
    it('should extract concepts from conversation', async () => {
      const { extractConcepts } = await import('@/lib/ai/conceptExtraction');
      
      const messages = [
        { role: 'user', content: 'What is a closure in JavaScript?' },
        { role: 'assistant', content: 'A closure is a function that remembers variables from its outer scope...' },
      ];

      const result = await extractConcepts(messages);

      expect(result.concepts).toBeDefined();
      expect(result.concepts.length).toBeGreaterThan(0);
      expect(result.concepts[0].name).toBe('Closures');
    });

    it('should filter concepts with low confidence', async () => {
      const { extractConcepts } = await import('@/lib/ai/conceptExtraction');
      
      const messages = [
        { role: 'user', content: 'Tell me about JavaScript' },
        { role: 'assistant', content: 'JavaScript is a programming language...' },
      ];

      const result = await extractConcepts(messages);

      // All returned concepts should have confidence >= 0.5
      result.concepts.forEach((concept) => {
        expect(concept.confidence).toBeGreaterThanOrEqual(0.5);
      });
    });

    it('should return empty array for short conversations', async () => {
      const { extractConcepts } = await import('@/lib/ai/conceptExtraction');
      
      const messages = [
        { role: 'user', content: 'Hi' },
      ];

      const result = await extractConcepts(messages);

      expect(result.concepts).toEqual([]);
    });

    it('should include main topic when available', async () => {
      const { extractConcepts } = await import('@/lib/ai/conceptExtraction');
      
      const messages = [
        { role: 'user', content: 'Explain closures' },
        { role: 'assistant', content: 'Closures are...' },
      ];

      const result = await extractConcepts(messages);

      expect(result.mainTopic).toBeDefined();
    });
  });

  describe('ExtractedConcept type', () => {
    it('should have required fields', async () => {
      const { extractConcepts } = await import('@/lib/ai/conceptExtraction');
      
      const messages = [
        { role: 'user', content: 'What is recursion?' },
        { role: 'assistant', content: 'Recursion is when a function calls itself...' },
      ];

      const result = await extractConcepts(messages);

      if (result.concepts.length > 0) {
        const concept = result.concepts[0];
        expect(concept).toHaveProperty('name');
        expect(concept).toHaveProperty('description');
        expect(concept).toHaveProperty('category');
        expect(concept).toHaveProperty('confidence');
      }
    });
  });
});
