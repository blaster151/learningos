import { NextRequest } from "next/server";
import { openai, AI_CONFIG } from "@/lib/ai/config";
import { requireAuthUser, authErrorResponse } from "@/lib/auth/serverAuth";

// ===================================
// POST - Assess which milestone objectives the learner has demonstrated mastery of
// ===================================

export async function POST(request: NextRequest) {
  try {
    await requireAuthUser(request);

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

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.FALLBACK_MODEL, // Use cheaper model for assessment
      messages: [
        {
          role: "system",
          content: `You are an educational assessment system. Given a conversation between a learner and their AI tutor, determine which learning objectives the learner has demonstrated understanding of.

A learner has mastered an objective when they:
- Correctly explain the concept in their own words
- Apply the concept correctly in examples or reasoning
- Answer questions about the concept accurately
- Show they can relate the concept to other ideas

Be conservative — only mark an objective as mastered if there is clear evidence in the conversation. Do NOT mark objectives as mastered just because the tutor explained them; the LEARNER must demonstrate understanding.

Respond with ONLY a JSON object in this format:
{"mastered": [0, 2], "reasoning": {"0": "brief reason", "2": "brief reason"}}

Where "mastered" is an array of objective indices (0-based) that the learner has demonstrated mastery of.
If no objectives are mastered yet, respond: {"mastered": [], "reasoning": {}}`,
        },
        {
          role: "user",
          content: `LEARNING OBJECTIVES:
${objectivesList}

CONVERSATION:
${conversationText}

Which objectives has the LEARNER demonstrated mastery of?`,
        },
      ],
      max_tokens: 400,
      temperature: 0.3, // Low temperature for more consistent assessment
    });

    const raw = response.choices[0]?.message?.content?.trim() || "{}";

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
