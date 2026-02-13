/**
 * AI Reflection Analyzer
 * Analyzes user's reflection submission and provides detailed feedback.
 */

import { openai, AI_CONFIG } from "@/lib/ai/config";
import { trackTokenUsage } from "@/lib/ai/tokenTracker";
import { logAICall } from "@/lib/ai/aiLogger";
import type { ConceptNode, MasteryLevel } from "@/types";
import type { GeneratedPrompt } from "./reflectionPrompt";

// ===================================
// Types
// ===================================

export interface AnalysisInput {
  userId: string;
  reflectionId: string;
  reflectionContent: string;
  prompt: GeneratedPrompt;
  conceptDefinitions: Array<{
    conceptId: string;
    name: string;
    definition: string;
    currentMastery: MasteryLevel;
  }>;
}

export interface ConceptAssessment {
  conceptId: string;
  conceptName: string;
  mentioned: boolean;
  accuracyScore: number; // 0-100
  suggestedDefinition?: string;
  feedback?: string;
}

export interface Misconception {
  claim: string;
  correction: string;
  severity: "minor" | "significant";
  relatedConceptId?: string;
}

export interface AnalysisOutput {
  overallScore: number; // 0-100
  strengths: string[];
  suggestions: string[];
  misconceptions: Misconception[];
  conceptAssessments: ConceptAssessment[];
  encouragement: string;
}

export interface AnalysisResult {
  success: boolean;
  analysis?: AnalysisOutput;
  error?: string;
}

// ===================================
// Main Function
// ===================================

/**
 * Analyze a user's reflection submission.
 */
export async function analyzeReflection(
  input: AnalysisInput
): Promise<AnalysisResult> {
  const { userId, reflectionId, reflectionContent, prompt, conceptDefinitions } =
    input;

  // Validate input
  if (!reflectionContent || reflectionContent.trim().length < 10) {
    return {
      success: false,
      error: "Reflection content is too short to analyze",
    };
  }

  if (conceptDefinitions.length === 0) {
    return {
      success: false,
      error: "No concept definitions provided for analysis",
    };
  }

  try {
    // Build concept reference for AI
    const conceptReference = conceptDefinitions
      .map(
        (c) =>
          `- ${c.name} (ID: ${c.conceptId}): ${c.definition || "No definition yet"}`
      )
      .join("\n");

    // Build the system prompt
    const systemPrompt = `You are an educational assessment AI that evaluates learner reflections.

Your role is to:
1. Analyze how well the learner explained each concept
2. Identify what they got right (strengths)
3. Spot any misconceptions gently
4. Suggest areas for improvement
5. Be encouraging and constructive

IMPORTANT GUIDELINES:
- Be supportive, not judgmental
- Frame misconceptions as learning opportunities
- Acknowledge partial understanding
- Look for evidence of genuine comprehension vs memorization
- Consider connections the learner makes between concepts

Return your analysis as JSON with this exact structure:
{
  "conceptAssessments": [
    {
      "conceptId": "the concept ID",
      "conceptName": "concept name",
      "mentioned": true/false,
      "accuracyScore": 0-100,
      "suggestedDefinition": "optional improved definition if helpful",
      "feedback": "brief feedback on their explanation"
    }
  ],
  "strengths": ["What they did well - 2-4 items"],
  "suggestions": ["How to improve - 2-3 items"],
  "misconceptions": [
    {
      "claim": "What they said that was incorrect",
      "correction": "Gentle correction",
      "severity": "minor" or "significant",
      "relatedConceptId": "optional concept ID"
    }
  ],
  "encouragement": "A brief encouraging closing message"
}`;

    // Build the user message
    const userMessage = `REFLECTION PROMPT GIVEN:
"${prompt.promptText}"

CONCEPTS THEY SHOULD ADDRESS:
${conceptReference}

LEARNER'S REFLECTION:
"${reflectionContent}"

Analyze this reflection. For each concept:
- Did they mention/explain it?
- How accurate was their explanation (0-100)?
- Any misconceptions?

Provide constructive feedback.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.PRIMARY_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3, // Lower temperature for more consistent evaluation
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;

    // Log the AI call
    logAICall({
      endpoint: "reflection-analysis",
      model: AI_CONFIG.PRIMARY_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      callParams: { max_tokens: 1500, temperature: 0.3, response_format: { type: "json_object" } },
      response: responseContent || undefined,
      usage: completion.usage,
    });

    // Track token usage (fire-and-forget)
    trackTokenUsage(userId, "reflection-analysis", AI_CONFIG.PRIMARY_MODEL, completion.usage)
      .catch((err) => console.error("Token tracking failed:", err));

    if (!responseContent) {
      return {
        success: false,
        error: "No response from AI",
      };
    }

    // Parse the response
    let parsedResponse: {
      conceptAssessments: ConceptAssessment[];
      strengths: string[];
      suggestions: string[];
      misconceptions: Misconception[];
      encouragement: string;
    };

    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      console.error("Failed to parse AI analysis:", responseContent);
      return {
        success: false,
        error: "Failed to parse AI analysis",
      };
    }

    // Validate and clean up response
    const conceptAssessments = validateConceptAssessments(
      parsedResponse.conceptAssessments,
      conceptDefinitions
    );

    // Calculate overall score from concept assessments
    const overallScore = calculateOverallScore(conceptAssessments);

    // Build final analysis
    const analysis: AnalysisOutput = {
      overallScore,
      strengths: (parsedResponse.strengths || []).slice(0, 4),
      suggestions: (parsedResponse.suggestions || []).slice(0, 3),
      misconceptions: validateMisconceptions(parsedResponse.misconceptions || []),
      conceptAssessments,
      encouragement:
        parsedResponse.encouragement ||
        "Keep exploring and reflecting - you're making great progress!",
    };

    return {
      success: true,
      analysis,
    };
  } catch (error) {
    console.error("Error analyzing reflection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ===================================
// Helper Functions
// ===================================

/**
 * Validate and clean up concept assessments.
 */
function validateConceptAssessments(
  assessments: ConceptAssessment[],
  expectedConcepts: Array<{ conceptId: string; name: string }>
): ConceptAssessment[] {
  if (!Array.isArray(assessments)) {
    // Return default assessments if AI didn't provide proper array
    return expectedConcepts.map((c) => ({
      conceptId: c.conceptId,
      conceptName: c.name,
      mentioned: false,
      accuracyScore: 0,
    }));
  }

  // Ensure all expected concepts are covered
  const assessedIds = new Set(assessments.map((a) => a.conceptId));

  const validated: ConceptAssessment[] = [];

  // Add provided assessments with validation
  for (const assessment of assessments) {
    validated.push({
      conceptId: assessment.conceptId || "",
      conceptName: assessment.conceptName || "",
      mentioned: Boolean(assessment.mentioned),
      accuracyScore: Math.min(100, Math.max(0, assessment.accuracyScore || 0)),
      suggestedDefinition: assessment.suggestedDefinition,
      feedback: assessment.feedback,
    });
  }

  // Add missing concepts
  for (const expected of expectedConcepts) {
    if (!assessedIds.has(expected.conceptId)) {
      validated.push({
        conceptId: expected.conceptId,
        conceptName: expected.name,
        mentioned: false,
        accuracyScore: 0,
      });
    }
  }

  return validated;
}

/**
 * Validate misconceptions array.
 */
function validateMisconceptions(misconceptions: Misconception[]): Misconception[] {
  if (!Array.isArray(misconceptions)) return [];

  return misconceptions
    .filter((m) => m.claim && m.correction)
    .map((m) => ({
      claim: m.claim,
      correction: m.correction,
      severity: m.severity === "significant" ? "significant" : "minor",
      relatedConceptId: m.relatedConceptId,
    }));
}

/**
 * Calculate overall score from concept assessments.
 */
function calculateOverallScore(assessments: ConceptAssessment[]): number {
  if (assessments.length === 0) return 0;

  // Weight mentioned concepts higher
  let totalWeight = 0;
  let weightedSum = 0;

  for (const assessment of assessments) {
    const weight = assessment.mentioned ? 1 : 0.3; // Unmentioned concepts count less
    totalWeight += weight;
    weightedSum += assessment.accuracyScore * weight;
  }

  if (totalWeight === 0) return 0;

  return Math.round(weightedSum / totalWeight);
}

// ===================================
// Mastery Recommendations
// ===================================

export interface MasteryRecommendation {
  conceptId: string;
  currentLevel: MasteryLevel;
  recommendedLevel: MasteryLevel;
  confidenceChange: number; // -1 to 1
  reason: string;
}

/**
 * Generate mastery level recommendations based on analysis.
 */
export function generateMasteryRecommendations(
  analysis: AnalysisOutput,
  currentConcepts: Array<{
    conceptId: string;
    masteryLevel: MasteryLevel;
    confidence: number;
  }>
): MasteryRecommendation[] {
  const recommendations: MasteryRecommendation[] = [];

  const masteryOrder: MasteryLevel[] = [
    "exploring",
    "learning",
    "practicing",
    "comfortable",
    "expert",
  ];

  for (const assessment of analysis.conceptAssessments) {
    const current = currentConcepts.find((c) => c.conceptId === assessment.conceptId);
    if (!current) continue;

    const currentIndex = masteryOrder.indexOf(current.masteryLevel);
    let recommendedIndex = currentIndex;
    let confidenceChange = 0;
    let reason = "";

    if (assessment.mentioned && assessment.accuracyScore >= 80) {
      // Strong understanding - consider level up
      if (currentIndex < masteryOrder.length - 1) {
        recommendedIndex = currentIndex + 1;
        reason = "Excellent explanation demonstrated";
      }
      confidenceChange = 0.15;
    } else if (assessment.mentioned && assessment.accuracyScore >= 60) {
      // Good understanding - boost confidence
      confidenceChange = 0.1;
      reason = "Solid understanding shown";
    } else if (assessment.mentioned && assessment.accuracyScore >= 40) {
      // Partial understanding - small boost
      confidenceChange = 0.05;
      reason = "Partial understanding - keep practicing";
    } else if (assessment.mentioned && assessment.accuracyScore < 40) {
      // Struggled - may need to review
      confidenceChange = -0.1;
      reason = "Needs more practice with this concept";
    } else if (!assessment.mentioned) {
      // Didn't mention - slight confidence decrease
      confidenceChange = -0.05;
      reason = "Concept not addressed in reflection";
    }

    // Check for misconceptions affecting this concept
    const relatedMisconception = analysis.misconceptions.find(
      (m) => m.relatedConceptId === assessment.conceptId
    );
    if (relatedMisconception) {
      if (relatedMisconception.severity === "significant") {
        confidenceChange -= 0.15;
        reason = "Significant misconception detected";
      } else {
        confidenceChange -= 0.05;
        reason = "Minor misconception detected";
      }
    }

    recommendations.push({
      conceptId: assessment.conceptId,
      currentLevel: current.masteryLevel,
      recommendedLevel: masteryOrder[recommendedIndex],
      confidenceChange: Math.max(-0.3, Math.min(0.3, confidenceChange)),
      reason,
    });
  }

  return recommendations;
}
