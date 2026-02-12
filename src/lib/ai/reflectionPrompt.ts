/**
 * AI Reflection Prompt Generator
 * Generates personalized reflection prompts based on concepts covered in session.
 */

import { openai, AI_CONFIG } from "@/lib/ai/config";
import { trackTokenUsage } from "@/lib/ai/tokenTracker";
import type { ConceptNode } from "@/types";
import type { Timestamp } from "firebase/firestore";

// ===================================
// Types
// ===================================

export interface PromptGenerationInput {
  userId: string;
  sessionId: string;
  sessionTopic: string;
  conceptsCovered: ConceptNode[];
  userLevel: "beginner" | "intermediate" | "advanced";
  previousReflectionCount?: number;
}

export interface GeneratedPrompt {
  promptId: string;
  sessionId: string;
  promptText: string;
  hints: string[];
  conceptsToAddress: string[]; // Concept IDs
  minWords: number;
  maxWords: number;
}

export interface PromptGenerationResult {
  success: boolean;
  prompt?: GeneratedPrompt;
  error?: string;
}

// ===================================
// Constants
// ===================================

const WORD_LIMITS = {
  beginner: { min: 30, max: 100 },
  intermediate: { min: 50, max: 200 },
  advanced: { min: 75, max: 300 },
};

// ===================================
// Main Function
// ===================================

/**
 * Generate a personalized reflection prompt based on session concepts.
 */
export async function generateReflectionPrompt(
  input: PromptGenerationInput
): Promise<PromptGenerationResult> {
  const {
    userId,
    sessionId,
    sessionTopic,
    conceptsCovered,
    userLevel,
    previousReflectionCount = 0,
  } = input;

  // Validate input
  if (!conceptsCovered || conceptsCovered.length === 0) {
    return {
      success: false,
      error: "No concepts covered in session",
    };
  }

  try {
    // Prepare concept information for the prompt
    const conceptSummaries = conceptsCovered
      .slice(0, 5) // Limit to 5 most relevant concepts
      .map((c) => ({
        name: c.name,
        definition: c.definition || "Definition not yet established",
        mastery: c.masteryLevel,
      }));

    const conceptList = conceptSummaries
      .map((c) => `- ${c.name}: ${c.definition} (current level: ${c.mastery})`)
      .join("\n");

    // Adjust prompt style based on previous reflections
    const promptStyle =
      previousReflectionCount === 0
        ? "This is their first reflection, so be encouraging and gentle."
        : previousReflectionCount < 5
        ? "They've done a few reflections, encourage deeper thinking."
        : "They're experienced with reflections, challenge them to make connections.";

    // Build the system prompt
    const systemPrompt = `You are a supportive learning coach helping a ${userLevel} learner reflect on what they just learned.

${promptStyle}

Your goal is to:
1. Generate a reflection prompt that asks them to explain key concepts in their own words
2. Encourage connecting concepts to each other
3. Be encouraging and curious, not testing or judgmental
4. Make the prompt feel conversational, not like an exam

Return your response as JSON with this exact structure:
{
  "promptText": "The main reflection question/prompt",
  "hints": ["Hint 1", "Hint 2", "Hint 3"]
}

The hints should gently guide what to include without giving away the answer.`;

    // Build the user message
    const userMessage = `Session topic: ${sessionTopic}

Concepts covered in this session:
${conceptList}

User level: ${userLevel}

Generate a reflection prompt that will help this learner consolidate their understanding of these concepts.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.PRIMARY_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;

    // Track token usage (fire-and-forget)
    trackTokenUsage(userId, "reflection-prompt", AI_CONFIG.PRIMARY_MODEL, completion.usage)
      .catch((err) => console.error("Token tracking failed:", err));

    if (!responseContent) {
      return {
        success: false,
        error: "No response from AI",
      };
    }

    // Parse the response
    let parsedResponse: { promptText: string; hints: string[] };
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseContent);
      return {
        success: false,
        error: "Failed to parse AI response",
      };
    }

    // Validate the response structure
    if (!parsedResponse.promptText || !Array.isArray(parsedResponse.hints)) {
      return {
        success: false,
        error: "Invalid response structure from AI",
      };
    }

    // Get word limits based on user level
    const wordLimits = WORD_LIMITS[userLevel];

    // Generate a unique prompt ID
    const promptId = `prompt_${sessionId}_${Date.now()}`;

    // Build the final prompt
    const prompt: GeneratedPrompt = {
      promptId,
      sessionId,
      promptText: parsedResponse.promptText,
      hints: parsedResponse.hints.slice(0, 3), // Limit to 3 hints
      conceptsToAddress: conceptsCovered.map((c) => c.conceptId),
      minWords: wordLimits.min,
      maxWords: wordLimits.max,
    };

    return {
      success: true,
      prompt,
    };
  } catch (error) {
    console.error("Error generating reflection prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ===================================
// Fallback Prompts
// ===================================

/**
 * Get a fallback prompt if AI generation fails.
 */
export function getFallbackPrompt(
  sessionId: string,
  conceptsCovered: ConceptNode[],
  userLevel: "beginner" | "intermediate" | "advanced"
): GeneratedPrompt {
  const conceptNames = conceptsCovered.slice(0, 3).map((c) => c.name);
  const wordLimits = WORD_LIMITS[userLevel];

  const fallbackPrompts = {
    beginner: {
      promptText: `In your own words, can you explain what you learned about ${conceptNames.join(" and ")}? Don't worry about being perfect - just share your understanding!`,
      hints: [
        "Start with what you found most interesting",
        "Try to explain it like you would to a friend",
        "It's okay to say what you're still unsure about",
      ],
    },
    intermediate: {
      promptText: `How would you explain ${conceptNames.join(", ")} to someone just starting to learn this topic? What connections do you see between these concepts?`,
      hints: [
        "Think about how these concepts relate to each other",
        "Consider a real-world example where these apply",
        "What was the most surprising thing you learned?",
      ],
    },
    advanced: {
      promptText: `Reflect on your understanding of ${conceptNames.join(", ")}. How do these concepts connect to what you already knew? What new insights did you gain?`,
      hints: [
        "Explore the relationships between these concepts",
        "Consider edge cases or exceptions",
        "How might you apply this knowledge differently now?",
      ],
    },
  };

  const fallback = fallbackPrompts[userLevel];

  return {
    promptId: `fallback_${sessionId}_${Date.now()}`,
    sessionId,
    promptText: fallback.promptText,
    hints: fallback.hints,
    conceptsToAddress: conceptsCovered.map((c) => c.conceptId),
    minWords: wordLimits.min,
    maxWords: wordLimits.max,
  };
}
