import { NextRequest } from "next/server";
import { openai, AI_CONFIG } from "@/lib/ai/config";
import { trackTokenUsage } from "@/lib/ai/tokenTracker";
import { requireAuthUser, authErrorResponse } from "@/lib/auth/serverAuth";

// ===================================
// POST - Generate context-aware follow-up suggestions
// ===================================

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);

    const body = await request.json();
    const {
      sessionTopic,
      lastUserMessage,
      lastAssistantMessage,
    }: {
      sessionTopic?: string;
      lastUserMessage: string;
      lastAssistantMessage: string;
    } = body;

    if (!lastAssistantMessage) {
      return new Response(
        JSON.stringify({ error: "Assistant message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const topicContext = sessionTopic
      ? `The session topic is: "${sessionTopic}".`
      : "This is a general learning session.";

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.FALLBACK_MODEL, // Use cheaper model for quick suggestions
      messages: [
        {
          role: "system",
          content: `You generate follow-up questions for a learning chat.
${topicContext}
Given the recent exchange, suggest exactly 3 short follow-up questions the learner might want to ask next.
Each question should be:
- Directly relevant to the conversation and topic at hand
- Concise (under 60 characters if possible)
- Progressive — moving the learner deeper into the subject
Respond with ONLY a JSON array of 3 strings, no other text.
Example: ["What is X used for?","How does X differ from Y?","Can you show me an example?"]`,
        },
        {
          role: "user",
          content: `User asked: "${lastUserMessage || "(session just started)"}"

AI responded: "${lastAssistantMessage.slice(0, 800)}"

Generate 3 follow-up questions:`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    // Track token usage (fire-and-forget)
    trackTokenUsage(authed.uid, "follow-ups", AI_CONFIG.FALLBACK_MODEL, response.usage)
      .catch((err) => console.error("Token tracking failed:", err));

    const raw = response.choices[0]?.message?.content?.trim() || "[]";

    // Parse the JSON array — handle potential markdown wrapping
    let suggestions: string[];
    try {
      const cleaned = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      suggestions = JSON.parse(cleaned);
      if (!Array.isArray(suggestions)) throw new Error("Not an array");
      suggestions = suggestions.filter((s) => typeof s === "string").slice(0, 3);
    } catch {
      // Fallback if parsing fails
      suggestions = [
        "Tell me more about this topic",
        "Can you give me an example?",
        "How does this connect to other concepts?",
      ];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Follow-ups API error:", error);
    return new Response(
      JSON.stringify({
        suggestions: [
          "Tell me more about this topic",
          "Can you give me an example?",
          "How does this connect to other concepts?",
        ],
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
