import { openai, AI_CONFIG } from "@/lib/ai/config";
import { logAICall } from "@/lib/ai/aiLogger";
import { trackTokenUsage } from "@/lib/ai/tokenTracker";

export interface NarrowTopicSuggestion {
  title: string;
  description: string;
  order: number;
}

interface SuggestNarrowTopicsInput {
  userId: string;
  goal: string;
  userLevel: "beginner" | "intermediate" | "advanced";
  knownConceptCount: number;
}

const NARROW_SUGGEST_PROMPT = `You take a learner's broad topic request and propose narrower, path-sized topics.

Output JSON (no extra keys):
{
  "suggestions": [
    { "title": "...", "description": "...", "order": 1 }
  ]
}

Rules:
- Produce 3 to 7 suggestions.
- Each suggestion must be a realistic single learning path (2-6 hours total).
- Titles should be short and specific.
- Descriptions should be 1 sentence.
- Order should reflect a recommended learning order for this learner (not necessarily easiest-first, but coherent).

If the topic is already narrow enough for one path, still return 3 suggestions that are adjacent subtopics or alternative angles.`;

export async function suggestNarrowTopics(
  input: SuggestNarrowTopicsInput
): Promise<NarrowTopicSuggestion[]> {
  const userPrompt = `TOPIC/GOAL: ${input.goal}
USER LEVEL (rough heuristic): ${input.userLevel}
KNOWN CONCEPT COUNT: ${input.knownConceptCount}`;

  const response = await openai.chat.completions.create({
    model: AI_CONFIG.FALLBACK_MODEL,
    messages: [
      { role: "system", content: NARROW_SUGGEST_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;

  logAICall({
    endpoint: "narrow-suggest",
    model: AI_CONFIG.FALLBACK_MODEL,
    messages: [
      { role: "system", content: NARROW_SUGGEST_PROMPT },
      { role: "user", content: userPrompt },
    ],
    callParams: { max_tokens: 500, temperature: 0.4, response_format: { type: "json_object" } },
    response: content || undefined,
    usage: response.usage,
  });

  trackTokenUsage(input.userId, "narrow-suggest", AI_CONFIG.FALLBACK_MODEL, response.usage).catch(
    (err) => console.error("Token tracking failed:", err)
  );

  if (!content) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }

  const obj = parsed as { suggestions?: unknown };
  if (!Array.isArray(obj.suggestions)) return [];

  const suggestions = obj.suggestions
    .filter((x) => x && typeof x === "object")
    .map((x) => x as { title?: unknown; description?: unknown; order?: unknown })
    .map((x, index) => ({
      title: typeof x.title === "string" ? x.title : `Option ${index + 1}`,
      description: typeof x.description === "string" ? x.description : "",
      order: typeof x.order === "number" ? x.order : index + 1,
    }))
    .sort((a, b) => a.order - b.order)
    .slice(0, 7);

  return suggestions;
}
