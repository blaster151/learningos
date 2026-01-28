// Concept Extraction Service
// Uses OpenAI to identify learning concepts from conversations

import { openai, AI_CONFIG } from "@/lib/ai/config";

// ===================================
// Types
// ===================================

export interface ExtractedConcept {
  name: string;
  description: string;
  category: string;
  confidence: number; // 0-1
}

interface ConceptExtractionResult {
  concepts: ExtractedConcept[];
  mainTopic?: string;
}

// ===================================
// Concept Extraction Prompt
// ===================================

const EXTRACTION_PROMPT = `You are a learning concept extractor. Analyze the conversation and identify key learning concepts that were discussed or taught.

For each concept, provide:
1. name: A concise name (2-5 words)
2. description: A brief description of the concept
3. category: One of: programming, mathematics, science, language, history, art, business, technology, other
4. confidence: How confident you are the user learned about this (0.0-1.0)

Focus on:
- Actual learning concepts, not conversational elements
- Concepts the user seemed to genuinely engage with
- Technical terms, principles, or skills that were explained

Return JSON format:
{
  "concepts": [
    { "name": "...", "description": "...", "category": "...", "confidence": 0.8 }
  ],
  "mainTopic": "Brief description of main learning topic"
}

If no clear learning concepts were discussed, return an empty concepts array.`;

// ===================================
// Extract Concepts from Messages
// ===================================

export async function extractConcepts(
  messages: Array<{ role: string; content: string }>
): Promise<ConceptExtractionResult> {
  try {
    // Only process if there are meaningful messages
    if (messages.length < 2) {
      return { concepts: [] };
    }

    // Format conversation for analysis
    const conversationText = messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    // Use a faster model for extraction to save costs
    const response = await openai.chat.completions.create({
      model: AI_CONFIG.FALLBACK_MODEL, // Use cheaper model for extraction
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        { role: "user", content: `Analyze this learning conversation:\n\n${conversationText}` },
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { concepts: [] };
    }

    const result = JSON.parse(content) as ConceptExtractionResult;
    
    // Validate and filter concepts
    const validConcepts = (result.concepts || []).filter(
      (c) =>
        c.name &&
        c.name.length > 1 &&
        c.name.length < 100 &&
        c.confidence >= 0.5 // Only keep concepts with reasonable confidence
    );

    return {
      concepts: validConcepts,
      mainTopic: result.mainTopic,
    };
  } catch (error) {
    console.error("Error extracting concepts:", error);
    return { concepts: [] };
  }
}

// ===================================
// Save Extracted Concepts
// ===================================

export async function saveConceptsForUser(
  userId: string,
  concepts: ExtractedConcept[],
  baseUrl: string
): Promise<void> {
  // Save each concept via the API
  const savePromises = concepts.map((concept) =>
    fetch(`${baseUrl}/api/concepts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        name: concept.name,
        description: concept.description,
        category: concept.category,
        masteryLevel: Math.round(concept.confidence * 30), // Initial mastery based on confidence
      }),
    }).catch((err) => {
      console.error(`Failed to save concept ${concept.name}:`, err);
    })
  );

  await Promise.allSettled(savePromises);
}
