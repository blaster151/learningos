import { openai, AI_CONFIG } from "@/lib/ai/config";
import { logAICall } from "@/lib/ai/aiLogger";
import { trackTokenUsage } from "@/lib/ai/tokenTracker";
import type { CalibrationPill } from "@/types";

export type { CalibrationPill };

interface GetCalibrationWave1Input {
  userId: string;
  goal: string;
  userLevel: "beginner" | "intermediate" | "advanced";
}

const WAVE1_PROMPT = `You generate a fast concept checklist for a learner to indicate what they already know before a learning path is created.

Output JSON (no extra keys):
{
  "pills": [
    { "concept": "...", "reason": "..." }
  ]
}

Rules:
- Return 10 to 18 pills.
- Each concept should be short (1-4 words).
- Concepts should be likely prerequisites or foundational terms for the goal.
- Reasons should be very short (3-8 words) and explain why it matters.
- Avoid duplicates and overly generic items like "Basics".
- If the goal is extremely broad, prioritize foundational building blocks.`;

export async function getCalibrationWave1(
  input: GetCalibrationWave1Input
): Promise<CalibrationPill[]> {
  const userPrompt = `GOAL: ${input.goal}
USER LEVEL (rough heuristic): ${input.userLevel}`;

  const response = await openai.chat.completions.create({
    model: AI_CONFIG.FALLBACK_MODEL,
    messages: [
      { role: "system", content: WAVE1_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 650,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;

  logAICall({
    endpoint: "calibration-wave-1",
    model: AI_CONFIG.FALLBACK_MODEL,
    messages: [
      { role: "system", content: WAVE1_PROMPT },
      { role: "user", content: userPrompt },
    ],
    callParams: { max_tokens: 650, temperature: 0.3, response_format: { type: "json_object" } },
    response: content || undefined,
    usage: response.usage,
  });

  trackTokenUsage(input.userId, "calibration-wave-1", AI_CONFIG.FALLBACK_MODEL, response.usage).catch(
    (err) => console.error("Token tracking failed:", err)
  );

  if (!content) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }

  const obj = parsed as { pills?: unknown };
  if (!Array.isArray(obj.pills)) return [];

  return obj.pills
    .filter((x) => x && typeof x === "object")
    .map((x) => x as { concept?: unknown; reason?: unknown })
    .map((x) => ({
      concept: typeof x.concept === "string" ? x.concept : "",
      reason: typeof x.reason === "string" ? x.reason : "",
    }))
    .filter((p) => p.concept.trim().length > 0)
    .slice(0, 18);
}
