// Learning Path Generation Service
// Uses GPT-4 to create personalized learning paths based on user goals and existing knowledge

import { openai, AI_CONFIG } from "@/lib/ai/config";
import { trackTokenUsage } from "@/lib/ai/tokenTracker";
import { logAICall } from "@/lib/ai/aiLogger";
import type { 
  ConceptNode, 
  PathGenerationInput, 
  GeneratedPath,
  MasteryLevel 
} from "@/types";

// ===================================
// Types
// ===================================

interface PathGenerationResult {
  success: boolean;
  path?: GeneratedPath;
  error?: string;
}

// ===================================
// Path Generation Prompt
// ===================================

const PATH_GENERATION_PROMPT = `You are an expert learning path designer with deep knowledge of pedagogy and curriculum design. Your task is to create a personalized learning path.

IMPORTANT PRINCIPLES:
1. **Prerequisites First**: Always sequence concepts so prerequisites come before dependent topics
2. **Build on Known**: Reference and connect to concepts the user already knows
3. **Appropriate Depth**: Match complexity to user's current level
4. **Achievable Milestones**: Each milestone should feel accomplishable (30-60 minutes of focused learning)
5. **Clear Objectives**: Every milestone should have specific, measurable learning objectives
6. **Logical Flow**: Create a narrative that builds understanding progressively

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "title": "A motivating, descriptive title for the learning path",
  "description": "2-3 sentences describing what the user will achieve",
  "milestones": [
    {
      "title": "Milestone title",
      "description": "What this milestone covers and why it matters",
      "concepts": ["concept1", "concept2"], // 2-4 key concepts to learn
      "objectives": ["By the end, you will be able to...", "You will understand..."], // 2-3 specific objectives
      "estimatedMinutes": 45, // Realistic estimate
      "prerequisites": [] // Indices of milestones that must come first (0-indexed)
    }
  ],
  "estimatedMinutes": 180 // Total time
}

RULES:
- Create 3-5 milestones for a well-structured path
- Each milestone should have 2-4 concepts (not too many!)
- Concepts should be specific and learnable (e.g., "recursion basics" not just "programming")
- Prerequisites array contains INDICES (numbers) of prior milestones, not names
- First milestone should have empty prerequisites: []
- Total estimated time should be realistic (typically 2-6 hours for a focused path)
- Don't include concepts the user already knows well (comfort level or higher) or self-reported as known
- If "SKIPPED CALIBRATION" is present, the user did NOT self-report any knowledge. Be conservative: include prerequisite foundations rather than skipping them. Place a brief diagnostic objective as the FIRST objective in the first milestone (e.g., "Demonstrate your current understanding of [key prerequisite]") so the system can gauge the user's real level early. After that diagnostic objective, note in the milestone description that if the user already knows the basics, follow-on milestones can be streamlined.`;

// ===================================
// Generate Learning Path
// ===================================

export async function generateLearningPath(
  input: PathGenerationInput
): Promise<PathGenerationResult> {
  try {
    // Build context about what user already knows
    const knownConceptsSummary = summarizeKnownConcepts(input.knownConcepts);
    
    // Build the prompt with user context
    const userPrompt = buildUserPrompt(input, knownConceptsSummary);

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.PRIMARY_MODEL, // Use GPT-4 for quality path generation
      messages: [
        { role: "system", content: PATH_GENERATION_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7, // Some creativity but mostly focused
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;

    // Log the AI call
    logAICall({
      endpoint: "path-generation",
      model: AI_CONFIG.PRIMARY_MODEL,
      messages: [
        { role: "system", content: PATH_GENERATION_PROMPT },
        { role: "user", content: userPrompt },
      ],
      callParams: { max_tokens: 2000, temperature: 0.7, response_format: { type: "json_object" } },
      response: content || undefined,
      usage: response.usage,
    });

    // Track token usage (fire-and-forget)
    trackTokenUsage(input.userId, "path-generation", AI_CONFIG.PRIMARY_MODEL, response.usage)
      .catch((err) => console.error("Token tracking failed:", err));

    if (!content) {
      return { success: false, error: "No response from AI" };
    }

    const parsed = JSON.parse(content) as GeneratedPath;
    
    // Validate the generated path
    const validation = validateGeneratedPath(parsed);
    if (!validation.valid) {
      console.error("Path validation failed:", validation.errors);
      return { success: false, error: `Invalid path structure: ${validation.errors.join(", ")}` };
    }

    return { success: true, path: parsed };
  } catch (error) {
    console.error("Error generating learning path:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// ===================================
// Helper Functions
// ===================================

function summarizeKnownConcepts(concepts: ConceptNode[]): string {
  if (concepts.length === 0) {
    return "The user is a complete beginner with no prior concepts learned in this system.";
  }

  // Group by mastery level
  const byMastery: Record<MasteryLevel, ConceptNode[]> = {
    exploring: [],
    learning: [],
    practicing: [],
    comfortable: [],
    expert: [],
  };

  for (const concept of concepts) {
    if (concept.masteryLevel && byMastery[concept.masteryLevel]) {
      byMastery[concept.masteryLevel].push(concept);
    }
  }

  const parts: string[] = [];

  if (byMastery.expert.length > 0) {
    parts.push(`Expert in: ${byMastery.expert.map(c => c.name).join(", ")}`);
  }
  if (byMastery.comfortable.length > 0) {
    parts.push(`Comfortable with: ${byMastery.comfortable.map(c => c.name).join(", ")}`);
  }
  if (byMastery.practicing.length > 0) {
    parts.push(`Practicing: ${byMastery.practicing.map(c => c.name).join(", ")}`);
  }
  if (byMastery.learning.length > 0) {
    parts.push(`Currently learning: ${byMastery.learning.map(c => c.name).join(", ")}`);
  }
  if (byMastery.exploring.length > 0) {
    parts.push(`Just exploring: ${byMastery.exploring.map(c => c.name).join(", ")}`);
  }

  return parts.join("\n") || "The user has some concepts tracked but no clear mastery levels yet.";
}

function buildUserPrompt(
  input: PathGenerationInput, 
  knownConceptsSummary: string
): string {
  const depthGuidance = getDepthGuidance(input.preferredDepth);
  const styleGuidance = getStyleGuidance(input.learningStyle);
  const timeConstraint = input.timeAvailableMinutes 
    ? `\nTIME CONSTRAINT: User has approximately ${input.timeAvailableMinutes} minutes available. Design the path to fit within this time.`
    : "";

  const declaredKnown = (input.declaredKnownConcepts || []).filter(Boolean);
  const declaredFamiliar = (input.declaredFamiliarConcepts || []).filter(Boolean);
  const declaredBlock =
    declaredKnown.length || declaredFamiliar.length
      ? `\nSELF-REPORTED CALIBRATION:\n${
          declaredKnown.length
            ? `- Known: ${declaredKnown.join(", ")}`
            : "- Known: (none)"
        }\n${
          declaredFamiliar.length
            ? `- Somewhat familiar: ${declaredFamiliar.join(", ")}`
            : "- Somewhat familiar: (none)"
        }\n(Prefer not to re-teach items in Known; you may briefly connect to Somewhat-familiar items.)`
      : "";

  const skippedCalibrationBlock = input.skippedCalibration
    ? `\nSKIPPED CALIBRATION: The user skipped the knowledge self-assessment. You have NO self-reported data on what they already know. Use conservative defaults: include all prerequisite foundations (do not assume prior knowledge). Make the FIRST objective of the FIRST milestone a quick diagnostic checkpoint (e.g., "Demonstrate your current understanding of [key prerequisite]") so the system can validate the user's starting level early and adapt.`
    : "";

  const overviewBlock = input.isOverview
    ? `\nOVERVIEW MODE: The user chose a high-level overview of a broad topic. Cover the most important sub-areas at a survey level rather than going deep. Explicitly note in the description that mastery of individual sub-areas will require follow-on paths.`
    : "";

  const originalGoalBlock = input.originalGoal && input.originalGoal !== input.goal
    ? `\nORIGINAL REQUEST: The user originally asked about "${input.originalGoal}" and then narrowed to the goal above.`
    : "";

  const screeningResultBlock = input.screeningResult
    ? `\nSCREENING RESULT (higher-confidence than self-report):
- Narrowed goal: ${input.screeningResult.narrowedGoal}
- Assessed known concepts: ${
        input.screeningResult.knownConcepts.length
          ? input.screeningResult.knownConcepts.join(", ")
          : "(none)"
      }
- Assessed familiar concepts: ${
        input.screeningResult.familiarConcepts.length
          ? input.screeningResult.familiarConcepts.join(", ")
          : "(none)"
      }
- Gap tier: ${input.screeningResult.gapTier}
- Assessed prerequisites:
${input.screeningResult.assessedPrerequisites
  .map(
    (item) =>
      `  - ${item.conceptName} [${item.status}] confidence=${item.confidence}`
  )
  .join("\n") || "  - (none)"}

Prioritize these assessed prerequisite signals over generic assumptions.`
    : "";

  const screeningConversationBlock =
    input.screeningConversation && input.screeningConversation.length
      ? `\nSCREENING CONVERSATION EXCERPT:
${input.screeningConversation
  .slice(-8)
  .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
  .join("\n")}`
      : "";

  return `Create a learning path for this user:

LEARNING GOAL: ${input.goal}

USER LEVEL: ${input.userLevel}

EXISTING KNOWLEDGE:
${knownConceptsSummary}
${declaredBlock}
${skippedCalibrationBlock}
${overviewBlock}
${originalGoalBlock}
${screeningResultBlock}
${screeningConversationBlock}
${depthGuidance}
${styleGuidance}
${timeConstraint}

Please generate a personalized learning path that builds on their existing knowledge and helps them achieve their goal.`;
}

function getDepthGuidance(depth?: "quick" | "thorough" | "deep"): string {
  switch (depth) {
    case "quick":
      return "\nDEPTH PREFERENCE: User wants a quick overview. Focus on essential concepts only, 2-3 milestones max.";
    case "deep":
      return "\nDEPTH PREFERENCE: User wants deep understanding. Include more detail, advanced concepts, and 4-5 milestones.";
    case "thorough":
    default:
      return "\nDEPTH PREFERENCE: User wants thorough coverage. Balance breadth and depth, 3-4 milestones.";
  }
}

function getStyleGuidance(style?: string): string {
  if (!style) return "";
  
  return `\nLEARNING STYLE: User prefers "${style}" style learning. Tailor the milestone descriptions and objectives accordingly.`;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateGeneratedPath(path: GeneratedPath): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!path.title || path.title.length < 5) {
    errors.push("Title is missing or too short");
  }
  if (!path.description || path.description.length < 20) {
    errors.push("Description is missing or too short");
  }
  if (!Array.isArray(path.milestones)) {
    errors.push("Milestones must be an array");
    return { valid: false, errors };
  }
  if (path.milestones.length < 2 || path.milestones.length > 7) {
    errors.push(`Should have 2-7 milestones, got ${path.milestones.length}`);
  }

  // Validate each milestone
  for (let i = 0; i < path.milestones.length; i++) {
    const milestone = path.milestones[i];
    const prefix = `Milestone ${i + 1}`;

    if (!milestone.title) {
      errors.push(`${prefix}: Missing title`);
    }
    if (!milestone.description) {
      errors.push(`${prefix}: Missing description`);
    }
    if (!Array.isArray(milestone.concepts) || milestone.concepts.length === 0) {
      errors.push(`${prefix}: Must have at least one concept`);
    }
    if (milestone.concepts && milestone.concepts.length > 6) {
      errors.push(`${prefix}: Too many concepts (${milestone.concepts.length}), max 6`);
    }
    if (!Array.isArray(milestone.objectives) || milestone.objectives.length === 0) {
      errors.push(`${prefix}: Must have at least one objective`);
    }
    if (typeof milestone.estimatedMinutes !== "number" || milestone.estimatedMinutes < 5) {
      errors.push(`${prefix}: Invalid estimated time`);
    }

    // Validate prerequisites reference valid indices
    if (Array.isArray(milestone.prerequisites)) {
      for (const prereq of milestone.prerequisites) {
        if (typeof prereq !== "number" || prereq < 0 || prereq >= i) {
          errors.push(`${prefix}: Invalid prerequisite index ${prereq}`);
        }
      }
    }
  }

  // Validate total time
  if (typeof path.estimatedMinutes !== "number" || path.estimatedMinutes < 10) {
    errors.push("Invalid total estimated time");
  }

  return { valid: errors.length === 0, errors };
}

// ===================================
// Generate Quick Path (for simpler use cases)
// ===================================

export async function generateQuickPath(
  userId: string,
  goal: string,
  userLevel: "beginner" | "intermediate" | "advanced" = "beginner"
): Promise<PathGenerationResult> {
  return generateLearningPath({
    userId,
    goal,
    knownConcepts: [],
    userLevel,
    preferredDepth: "quick",
  });
}

// ===================================
// Regenerate Path with Adjustments
// ===================================

export async function regeneratePath(
  input: PathGenerationInput,
  feedback: string
): Promise<PathGenerationResult> {
  try {
    const knownConceptsSummary = summarizeKnownConcepts(input.knownConcepts);
    const basePrompt = buildUserPrompt(input, knownConceptsSummary);

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.PRIMARY_MODEL,
      messages: [
        { role: "system", content: PATH_GENERATION_PROMPT },
        { role: "user", content: basePrompt },
        { 
          role: "user", 
          content: `The previous path wasn't quite right. Please regenerate with this feedback in mind:\n\n${feedback}` 
        },
      ],
      temperature: 0.8, // Slightly more creative for regeneration
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;

    // Log the AI call
    logAICall({
      endpoint: "path-regeneration",
      model: AI_CONFIG.PRIMARY_MODEL,
      messages: [
        { role: "system", content: PATH_GENERATION_PROMPT },
        { role: "user", content: basePrompt },
        { role: "user", content: `The previous path wasn't quite right. Please regenerate with this feedback in mind:\n\n${feedback}` },
      ],
      callParams: { max_tokens: 2000, temperature: 0.8, response_format: { type: "json_object" } },
      response: content || undefined,
      usage: response.usage,
    });

    // Track token usage (fire-and-forget)
    trackTokenUsage(input.userId, "path-regeneration", AI_CONFIG.PRIMARY_MODEL, response.usage)
      .catch((err) => console.error("Token tracking failed:", err));

    if (!content) {
      return { success: false, error: "No response from AI" };
    }

    const parsed = JSON.parse(content) as GeneratedPath;
    const validation = validateGeneratedPath(parsed);
    
    if (!validation.valid) {
      return { success: false, error: `Invalid path: ${validation.errors.join(", ")}` };
    }

    return { success: true, path: parsed };
  } catch (error) {
    console.error("Error regenerating path:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
