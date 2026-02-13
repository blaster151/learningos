import { openai, AI_CONFIG } from "@/lib/ai/config";
import { logAICall } from "@/lib/ai/aiLogger";
import { trackTokenUsage } from "@/lib/ai/tokenTracker";
import type { PathScopeTier, TopicScopeAnalysis } from "@/types";

interface AnalyzeTopicScopeInput {
  userId: string;
  goal: string;
  userLevel: "beginner" | "intermediate" | "advanced";
  knownConceptCount: number;
}

const SCOPE_ANALYSIS_PROMPT = `You classify the scope of a learner's request so the system can generate an appropriately-scoped learning path.

Classify into one of:
- micro: a specific sub-question or narrow mechanic that fits in 1-3 objectives
- focused: a single topic that fits in one path (roughly 2-6 hours total)
- domain: a larger domain that likely needs multiple paths (days/weeks)
- field: a huge field that needs a long curriculum (months)

OUTPUT JSON (no extra keys):
{
  "scopeTier": "micro|focused|domain|field",
  "confidence": 0.0,
  "rationale": "1-2 sentences",
  "recommendedMode": "overview|narrow",
  "suggestedNarrowTopics": [
    { "title": "...", "description": "...", "order": 1 }
  ]
}

Rules:
- If scopeTier is micro or focused, recommendedMode should be "overview".
- If scopeTier is domain or field, recommendedMode should be "narrow".
- Only include suggestedNarrowTopics when recommendedMode is "narrow" (3-7 items). Otherwise return an empty array.
- Keep descriptions short and actionable.`;

const VALID_TIERS: ReadonlyArray<PathScopeTier> = ["micro", "focused", "domain", "field"] as const;

function isValidTier(value: unknown): value is PathScopeTier {
  return typeof value === "string" && (VALID_TIERS as readonly string[]).includes(value);
}

export async function analyzeTopicScope(
  input: AnalyzeTopicScopeInput
): Promise<TopicScopeAnalysis> {
  const userPrompt = `TOPIC/GOAL: ${input.goal}
USER LEVEL (rough heuristic): ${input.userLevel}
KNOWN CONCEPT COUNT: ${input.knownConceptCount}`;

  const response = await openai.chat.completions.create({
    model: AI_CONFIG.FALLBACK_MODEL,
    messages: [
      { role: "system", content: SCOPE_ANALYSIS_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 350,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;

  logAICall({
    endpoint: "scope-analyze",
    model: AI_CONFIG.FALLBACK_MODEL,
    messages: [
      { role: "system", content: SCOPE_ANALYSIS_PROMPT },
      { role: "user", content: userPrompt },
    ],
    callParams: { max_tokens: 350, temperature: 0.2, response_format: { type: "json_object" } },
    response: content || undefined,
    usage: response.usage,
  });

  trackTokenUsage(input.userId, "scope-analyze", AI_CONFIG.FALLBACK_MODEL, response.usage).catch(
    (err) => console.error("Token tracking failed:", err)
  );

  if (!content) {
    return {
      scopeTier: "focused",
      confidence: 0.3,
      rationale: "No model response; defaulting to a focused topic.",
      recommendedMode: "overview",
      suggestedNarrowTopics: [],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      scopeTier: "focused",
      confidence: 0.3,
      rationale: "Invalid JSON from model; defaulting to a focused topic.",
      recommendedMode: "overview",
      suggestedNarrowTopics: [],
    };
  }

  const obj = parsed as Partial<TopicScopeAnalysis>;

  const scopeTier: PathScopeTier = isValidTier(obj.scopeTier) ? obj.scopeTier : "focused";
  const confidenceRaw = typeof obj.confidence === "number" ? obj.confidence : 0.4;
  const confidence = Math.max(0, Math.min(1, confidenceRaw));
  const rationale = typeof obj.rationale === "string" && obj.rationale.trim()
    ? obj.rationale.trim()
    : "Defaulted due to missing rationale.";

  const recommendedMode = obj.recommendedMode === "narrow" ? "narrow" : "overview";

  const suggestedNarrowTopics = Array.isArray(obj.suggestedNarrowTopics)
    ? obj.suggestedNarrowTopics
        .filter((x) => x && typeof x === "object")
        .map((x) => x as { title?: unknown; description?: unknown; order?: unknown })
        .map((x, index) => ({
          title: typeof x.title === "string" ? x.title : `Option ${index + 1}`,
          description: typeof x.description === "string" ? x.description : "",
          order: typeof x.order === "number" ? x.order : index + 1,
        }))
    : [];

  return {
    scopeTier,
    confidence,
    rationale,
    recommendedMode,
    suggestedNarrowTopics: recommendedMode === "narrow" ? suggestedNarrowTopics.slice(0, 7) : [],
  };
}
