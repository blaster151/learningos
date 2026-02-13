// Calibration Wave 2 — Targeted follow-up pills (E18-S4)
// Only fires when Wave 1 leaves key prerequisites ambiguous.
// Returns a small focused set (4-8 pills) OR an empty array if no Wave 2 is needed.

import { openai, AI_CONFIG } from "@/lib/ai/config";
import { logAICall } from "@/lib/ai/aiLogger";
import { trackTokenUsage } from "@/lib/ai/tokenTracker";
import type { CalibrationPill } from "@/types";

export interface Wave2Input {
  userId: string;
  goal: string;
  userLevel: "beginner" | "intermediate" | "advanced";
  /** All pills from Wave 1 */
  wave1Pills: CalibrationPill[];
  /** Concepts the user marked as "Known" */
  knownConcepts: string[];
  /** Concepts the user marked as "Somewhat familiar" */
  familiarConcepts: string[];
}

export interface Wave2Result {
  /** Whether a Wave 2 is needed */
  needed: boolean;
  /** Targeted pills for the uncertain cluster (empty when not needed) */
  pills: CalibrationPill[];
  /** Short explanation of the uncertain cluster */
  reason: string;
}

const WAVE2_PROMPT = `You decide whether a SECOND calibration wave is needed and, if so, produce targeted follow-up concept pills.

Context: The learner is creating a path. They already completed Wave 1 calibration (a broad set of concept pills). You now see the goal, the Wave 1 pills, and which ones the user marked "Known" or "Somewhat familiar".

Decision logic:
- If the user's selections leave KEY PREREQUISITE AREAS genuinely uncertain (e.g. they marked some advanced concepts known but skipped foundational ones that those depend on, OR they marked nothing at all for a critical sub-domain), a Wave 2 IS needed.
- If the topic is narrow, or the user's selections already paint a clear picture, Wave 2 is NOT needed.
- Err on the side of NOT needing Wave 2 — only trigger it when it will meaningfully change the path.

OUTPUT JSON (no extra keys):
{
  "needed": true | false,
  "reason": "1-2 sentences explaining the decision",
  "pills": [
    { "concept": "...", "reason": "..." }
  ]
}

Rules when needed=true:
- Return 4 to 8 pills focused on the UNCERTAIN CLUSTER only (not broad coverage).
- Pills should probe the specific gap — e.g. if the user knows React but didn't indicate JS fundamentals, probe closures, promises, etc.
- Concepts should be short (1-4 words).
- Reasons should be short (3-8 words).
- Do NOT repeat any concept already shown in Wave 1.

Rules when needed=false:
- Return an empty pills array.
- Reason should briefly explain why no follow-up is needed.`;

export async function getCalibrationWave2(
  input: Wave2Input
): Promise<Wave2Result> {
  const wave1Summary = input.wave1Pills.map((p) => p.concept).join(", ");
  const knownSummary = input.knownConcepts.length
    ? input.knownConcepts.join(", ")
    : "(none)";
  const familiarSummary = input.familiarConcepts.length
    ? input.familiarConcepts.join(", ")
    : "(none)";
  const unmarkedCount =
    input.wave1Pills.length -
    input.knownConcepts.length -
    input.familiarConcepts.length;

  const userPrompt = `GOAL: ${input.goal}
USER LEVEL: ${input.userLevel}

WAVE 1 PILLS: ${wave1Summary}
USER MARKED KNOWN: ${knownSummary}
USER MARKED SOMEWHAT: ${familiarSummary}
UNMARKED (not selected): ${unmarkedCount} concepts`;

  const response = await openai.chat.completions.create({
    model: AI_CONFIG.FALLBACK_MODEL,
    messages: [
      { role: "system", content: WAVE2_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;

  logAICall({
    endpoint: "calibration-wave-2",
    model: AI_CONFIG.FALLBACK_MODEL,
    messages: [
      { role: "system", content: WAVE2_PROMPT },
      { role: "user", content: userPrompt },
    ],
    callParams: {
      max_tokens: 500,
      temperature: 0.3,
      response_format: { type: "json_object" },
    },
    response: content || undefined,
    usage: response.usage,
  });

  trackTokenUsage(
    input.userId,
    "calibration-wave-2",
    AI_CONFIG.FALLBACK_MODEL,
    response.usage
  ).catch((err) => console.error("Token tracking failed:", err));

  if (!content) {
    return { needed: false, pills: [], reason: "No model response." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { needed: false, pills: [], reason: "Invalid JSON from model." };
  }

  const obj = parsed as {
    needed?: unknown;
    reason?: unknown;
    pills?: unknown;
  };

  const needed = obj.needed === true;
  const reason =
    typeof obj.reason === "string" ? obj.reason : "No reason provided.";

  if (!needed || !Array.isArray(obj.pills)) {
    return { needed: false, pills: [], reason };
  }

  const pills: CalibrationPill[] = obj.pills
    .filter((x) => x && typeof x === "object")
    .map((x) => x as { concept?: unknown; reason?: unknown })
    .map((x) => ({
      concept: typeof x.concept === "string" ? x.concept : "",
      reason: typeof x.reason === "string" ? x.reason : "",
    }))
    .filter((p) => p.concept.trim().length > 0)
    .slice(0, 8);

  return { needed: pills.length > 0, pills, reason };
}
