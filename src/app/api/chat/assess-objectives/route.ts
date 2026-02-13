import { NextRequest } from "next/server";
import { openai, AI_CONFIG } from "@/lib/ai/config";
import { trackTokenUsage } from "@/lib/ai/tokenTracker";
import { logAICall } from "@/lib/ai/aiLogger";
import { requireAuthUser, authErrorResponse } from "@/lib/auth/serverAuth";

// ===================================
// POST - Assess which milestone objectives the learner has demonstrated mastery of
// ===================================

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);

    const body = await request.json();
    const {
      objectives,
      conversationExcerpt,
    }: {
      objectives: string[];
      conversationExcerpt: Array<{ role: string; content: string }>;
    } = body;

    if (!objectives?.length || !conversationExcerpt?.length) {
      return new Response(
        JSON.stringify({ error: "objectives and conversationExcerpt are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build a numbered list of objectives for the prompt
    const objectivesList = objectives
      .map((obj, i) => `${i}: ${obj}`)
      .join("\n");

    // Trim conversation to a reasonable size — last ~10 exchanges
    const recentMessages = conversationExcerpt.slice(-20);
    const conversationText = recentMessages
      .map((m) => `${m.role === "user" ? "LEARNER" : "TUTOR"}: ${m.content}`)
      .join("\n\n");

    const aiMessages: Array<{ role: "system" | "user"; content: string }> = [
      {
        role: "system",
        content: `You are an educational assessment system. Given a conversation between a learner and their AI tutor, determine which learning objectives have been sufficiently COVERED in conversation — meaning the learner has been exposed to the material and could now be quizzed on it.

An objective is "covered" when:
- The tutor has explained the key concepts of the objective
- The learner has engaged with the material (asked questions, discussed it)
- There is enough conversational context that a quiz could fairly test the objective

This does NOT mean the learner has mastered the objective — that requires passing a separate quiz. You are just identifying which objectives have been discussed enough to be quiz-ready.

Be reasonably generous — if the topic was meaningfully discussed, mark it as covered. Don't require the learner to have demonstrated mastery, just engagement with the material.

Respond with ONLY a JSON object in this format:
{"mastered": [0, 2], "reasoning": {"0": "brief reason", "2": "brief reason"}}

Where "mastered" is an array of objective indices (0-based) that have been covered in conversation.
If no objectives are covered yet, respond: {"mastered": [], "reasoning": {}}`,
      },
      {
        role: "user",
        content: `LEARNING OBJECTIVES:
${objectivesList}

CONVERSATION:
${conversationText}

Which objectives has the LEARNER demonstrated mastery of?`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.FALLBACK_MODEL, // Use cheaper model for assessment
      messages: aiMessages,
      max_tokens: 400,
      temperature: 0.3, // Low temperature for more consistent assessment
    });

    const raw = response.choices[0]?.message?.content?.trim() || "{}";

    // Log the AI call
    logAICall({
      endpoint: "assess-objectives",
      model: AI_CONFIG.FALLBACK_MODEL,
      messages: aiMessages,
      callParams: { max_tokens: 400, temperature: 0.3 },
      response: raw,
      usage: response.usage,
    });

    // Track token usage (fire-and-forget)
    trackTokenUsage(authed.uid, "assess-objectives", AI_CONFIG.FALLBACK_MODEL, response.usage)
      .catch((err) => console.error("Token tracking failed:", err));

    let result: { mastered: number[]; reasoning: Record<string, string> };
    try {
      const cleaned = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      result = JSON.parse(cleaned);
      if (!Array.isArray(result.mastered)) {
        result = { mastered: [], reasoning: {} };
      }
      // Filter to valid indices only
      result.mastered = result.mastered.filter(
        (i) => typeof i === "number" && i >= 0 && i < objectives.length
      );
    } catch {
      result = { mastered: [], reasoning: {} };
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Assess objectives API error:", error);
    return new Response(
      JSON.stringify({ mastered: [], reasoning: {} }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
