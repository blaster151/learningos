import { NextRequest } from "next/server";
import { openai, AI_CONFIG } from "@/lib/ai/config";
import { trackTokenUsage } from "@/lib/ai/tokenTracker";
import { logAICall } from "@/lib/ai/aiLogger";
import { requireAuthUser, authErrorResponse } from "@/lib/auth/serverAuth";

// ===================================
// POST - Break a dense AI response into 2-3 expanded, digestible chunks
// ===================================
// "Unpack this" = the opposite of simplify.
// Instead of compressing, it EXPANDS each idea into its own mini-explanation
// with more detail, examples, and breathing room.

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);

    const body = await request.json();
    const {
      content,
      sessionTopic,
    }: {
      content: string;
      sessionTopic?: string;
    } = body;

    if (!content?.trim()) {
      return new Response(
        JSON.stringify({ error: "content is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const topicContext = sessionTopic
      ? `The learning topic is: "${sessionTopic}".`
      : "";

    const aiMessages: Array<{ role: "system" | "user"; content: string }> = [
      {
        role: "system",
        content: `You are a learning content expander. A learner found a paragraph of explanation too dense or information-heavy. Your job is to "unpack" it — break it into 2-3 smaller, self-contained chunks, where each chunk:

1. Focuses on ONE key idea from the original
2. Explains that idea more thoroughly with examples, analogies, or step-by-step reasoning
3. Is conversational and digestible on its own
4. Uses **bold** for domain-relevant terms (every occurrence)

${topicContext}

Guidelines:
- 2 chunks for moderately dense content, 3 chunks for very dense content
- Each chunk should be 2-4 sentences — more than the original compressed version, but not overwhelming
- Add concrete examples or analogies the original skipped
- The chunks should flow logically — reading them in order should cover everything from the original
- Do NOT add preamble like "Let's break this down" — just give the chunks directly
- Do NOT repeat content between chunks — each should cover new ground

Respond with ONLY valid JSON:
{
  "chunks": [
    "First chunk text here...",
    "Second chunk text here...",
    "Third chunk text here (if needed)..."
  ]
}`,
      },
      {
        role: "user",
        content: `Please unpack this explanation into digestible chunks:\n\n${content}`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.PRIMARY_MODEL,
      messages: aiMessages,
      max_tokens: 1500,
      temperature: 0.6,
    });

    const raw = response.choices[0]?.message?.content?.trim() || "{}";

    // Log the AI call
    logAICall({
      endpoint: "chat/unpack",
      model: AI_CONFIG.PRIMARY_MODEL,
      messages: aiMessages,
      callParams: { max_tokens: 1500, temperature: 0.6 },
      response: raw,
      usage: response.usage,
    });

    // Track token usage
    trackTokenUsage(authed.uid, "chat-unpack", AI_CONFIG.PRIMARY_MODEL, response.usage)
      .catch((err) => console.error("Token tracking failed:", err));

    // Parse
    let result: { chunks: string[] };
    try {
      const cleaned = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      result = JSON.parse(cleaned);
      if (!Array.isArray(result.chunks) || result.chunks.length < 2) {
        throw new Error("Expected at least 2 chunks");
      }
      // Cap at 3 chunks
      result.chunks = result.chunks.slice(0, 3).filter((c) => typeof c === "string" && c.trim());
    } catch (parseError) {
      console.error("Failed to parse unpack response:", parseError, raw);
      return new Response(
        JSON.stringify({ error: "Failed to unpack content. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Unpack API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to unpack content" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
