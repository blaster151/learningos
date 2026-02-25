import { AI_CONFIG, getOpenAI } from "@/lib/ai/config";
import {
  getPrerequisiteChain,
  type PrerequisiteChainResult,
} from "@/lib/learning/prerequisiteChain";
import type {
  AssessedPrerequisite,
  GapTier,
  ScreeningChatMessage,
  ScreeningProgress,
  ScreeningResult,
  ScreeningUserAction,
} from "@/types";

export interface ScreeningTurnOutput {
  reply: string;
  done: boolean;
  screeningResult?: ScreeningResult;
  progress: ScreeningProgress;
}

const DEFAULT_PROGRESS: ScreeningProgress = {
  turnCount: 0,
  assessedCount: 0,
  pendingCount: 0,
  narrowedGoal: false,
  broadenedProbe: false,
};

function classifyGapTier(assessedPrerequisites: AssessedPrerequisite[]): GapTier {
  const missingCount = assessedPrerequisites.filter(
    (item) => item.status === "missing" || item.status === "unknown"
  ).length;

  if (missingCount >= 9) {
    return "large";
  }

  if (missingCount >= 4) {
    return "medium";
  }

  if (missingCount >= 1) {
    return "small";
  }

  return "none";
}

function sanitizeAssessedPrerequisites(
  raw: unknown,
  fallbackChain: PrerequisiteChainResult
): AssessedPrerequisite[] {
  if (!Array.isArray(raw)) {
    return fallbackChain.prerequisites.map((prereq) => ({
      conceptId: prereq.conceptId,
      conceptName: prereq.conceptName,
      status: prereq.readiness === "likely_known" ? "assessed_known" : "unknown",
      confidence: prereq.readiness === "likely_known" ? 0.75 : 0.4,
      evidence: prereq.readiness === "likely_known" ? "Graph readiness indicates likely-known." : "Needs direct assessment.",
    }));
  }

  return raw
    .filter((item) => item && typeof item === "object")
    .map((item) => item as Record<string, unknown>)
    .map((item) => ({
      conceptId: typeof item.conceptId === "string" ? item.conceptId : "unknown-concept",
      conceptName: typeof item.conceptName === "string" ? item.conceptName : "Unknown concept",
      status:
        item.status === "assessed_known" ||
        item.status === "assessed_familiar" ||
        item.status === "missing" ||
        item.status === "unknown"
          ? item.status
          : "unknown",
      confidence:
        typeof item.confidence === "number"
          ? Math.max(0, Math.min(1, item.confidence))
          : 0.5,
      evidence: typeof item.evidence === "string" ? item.evidence : undefined,
    }));
}

export async function checkAutoSkip(
  userId: string,
  goal: string,
  prerequisiteChain?: PrerequisiteChainResult
): Promise<{
  skipScreening: boolean;
  reason: string;
  prerequisiteChain: PrerequisiteChainResult;
}> {
  const chain = prerequisiteChain ?? (await getPrerequisiteChain(userId, goal));

  const allLikelyKnown =
    chain.prerequisites.length > 0 &&
    chain.prerequisites.every((prereq) => prereq.readiness === "likely_known");

  if (allLikelyKnown) {
    return {
      skipScreening: true,
      reason: "Based on your history, you're ready — generating now.",
      prerequisiteChain: chain,
    };
  }

  return {
    skipScreening: false,
    reason: "Screening required to calibrate prerequisite readiness.",
    prerequisiteChain: chain,
  };
}

export async function conductScreeningTurn(
  goal: string,
  messages: ScreeningChatMessage[],
  userAction: ScreeningUserAction,
  prerequisiteChain: PrerequisiteChainResult
): Promise<ScreeningTurnOutput> {
  const appendedMessages = [...messages];

  if (userAction.type === "message") {
    appendedMessages.push({ role: "user", content: userAction.content });
  } else if (userAction.type === "dont_know") {
    appendedMessages.push({
      role: "user",
      content: "I don't know enough to answer that.",
    });
  }

  if (userAction.type === "generate_now") {
    const assessedPrerequisites = sanitizeAssessedPrerequisites(
      undefined,
      prerequisiteChain
    );

    return {
      reply:
        "Got it — I'll generate your learning path now with a conservative prerequisite estimate.",
      done: true,
      screeningResult: {
        goal,
        narrowedGoal: goal,
        knownConcepts: assessedPrerequisites
          .filter((item) => item.status === "assessed_known")
          .map((item) => item.conceptName),
        familiarConcepts: assessedPrerequisites
          .filter((item) => item.status === "assessed_familiar")
          .map((item) => item.conceptName),
        assessedPrerequisites,
        gapTier: classifyGapTier(assessedPrerequisites),
      },
      progress: {
        turnCount: appendedMessages.length,
        assessedCount: assessedPrerequisites.length,
        pendingCount: assessedPrerequisites.filter((item) => item.status === "unknown").length,
        narrowedGoal: false,
        broadenedProbe: false,
      },
    };
  }

  const systemPrompt = `You run an adaptive prerequisite screening conversation.

You must:
1) Narrow broad goals when needed.
2) Assess prerequisite concepts for likely readiness.
3) If learner says they do not know, broaden to a more foundational probe.
4) When enough signal is present (or user asks to generate), mark done=true.
5) Produce a gap tier classification:
   - small: 1-3 missing/unknown
   - medium: 4-8 missing/unknown
   - large: 9+ missing/unknown

Return strict JSON with shape:
{
  "reply": "assistant response",
  "done": boolean,
  "progress": {
    "turnCount": number,
    "assessedCount": number,
    "pendingCount": number,
    "narrowedGoal": boolean,
    "broadenedProbe": boolean
  },
  "screeningResult": {
    "goal": "original goal",
    "narrowedGoal": "narrowed or original goal",
    "knownConcepts": ["..."],
    "familiarConcepts": ["..."],
    "assessedPrerequisites": [
      {
        "conceptId": "...",
        "conceptName": "...",
        "status": "assessed_known|assessed_familiar|missing|unknown",
        "confidence": 0.0,
        "evidence": "..."
      }
    ],
    "gapTier": "none|small|medium|large"
  }
}
Only include screeningResult when done=true.`;

  const chainSummary = prerequisiteChain.prerequisites
    .map(
      (item) =>
        `- ${item.conceptName} (${item.conceptId}) depth=${item.depth} readiness=${item.readiness}`
    )
    .join("\n");

  const actionContext =
    userAction.type === "dont_know"
      ? "The user explicitly clicked dont_know on the last probe. Broaden your next question."
      : "Proceed with normal adaptive questioning.";

  const response = await getOpenAI().chat.completions.create({
    model: AI_CONFIG.PRIMARY_MODEL,
    temperature: 0.3,
    max_tokens: 800,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Goal: ${goal}\n${actionContext}\nPrerequisite chain:\n${chainSummary || "- none"}`,
      },
      ...appendedMessages,
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {
      reply: "Could you share a little more about your starting point?",
      done: false,
      progress: {
        ...DEFAULT_PROGRESS,
        turnCount: appendedMessages.length,
        pendingCount: prerequisiteChain.prerequisites.length,
      },
    };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {
      reply: "Let's keep going — what parts of this topic have you used before?",
      done: false,
      progress: {
        ...DEFAULT_PROGRESS,
        turnCount: appendedMessages.length,
        pendingCount: prerequisiteChain.prerequisites.length,
      },
    };
  }

  const done = parsed.done === true;
  const progressObj =
    parsed.progress && typeof parsed.progress === "object"
      ? (parsed.progress as Record<string, unknown>)
      : null;

  const progress: ScreeningProgress = {
    turnCount:
      typeof progressObj?.turnCount === "number"
        ? progressObj.turnCount
        : appendedMessages.length,
    assessedCount:
      typeof progressObj?.assessedCount === "number" ? progressObj.assessedCount : 0,
    pendingCount:
      typeof progressObj?.pendingCount === "number"
        ? progressObj.pendingCount
        : prerequisiteChain.prerequisites.length,
    narrowedGoal: progressObj?.narrowedGoal === true,
    broadenedProbe: progressObj?.broadenedProbe === true,
  };

  const reply =
    typeof parsed.reply === "string" && parsed.reply.trim().length > 0
      ? parsed.reply.trim()
      : "Thanks — tell me what feels easiest versus hardest in this topic.";

  if (!done) {
    return {
      reply,
      done: false,
      progress,
    };
  }

  const resultObj =
    parsed.screeningResult && typeof parsed.screeningResult === "object"
      ? (parsed.screeningResult as Record<string, unknown>)
      : {};

  const assessedPrerequisites = sanitizeAssessedPrerequisites(
    resultObj.assessedPrerequisites,
    prerequisiteChain
  );

  const gapTier: GapTier =
    resultObj.gapTier === "none" ||
    resultObj.gapTier === "small" ||
    resultObj.gapTier === "medium" ||
    resultObj.gapTier === "large"
      ? resultObj.gapTier
      : classifyGapTier(assessedPrerequisites);

  const screeningResult: ScreeningResult = {
    goal,
    narrowedGoal:
      typeof resultObj.narrowedGoal === "string" && resultObj.narrowedGoal.trim()
        ? resultObj.narrowedGoal
        : goal,
    knownConcepts: Array.isArray(resultObj.knownConcepts)
      ? resultObj.knownConcepts.filter((item): item is string => typeof item === "string")
      : [],
    familiarConcepts: Array.isArray(resultObj.familiarConcepts)
      ? resultObj.familiarConcepts.filter((item): item is string => typeof item === "string")
      : [],
    assessedPrerequisites,
    gapTier,
  };

  return {
    reply,
    done: true,
    screeningResult,
    progress,
  };
}

export const __internal = {
  classifyGapTier,
};
