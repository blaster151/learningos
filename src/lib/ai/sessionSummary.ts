// Session Summary Generation Service
// Uses OpenAI to generate summaries of learning sessions

import { openai, AI_CONFIG } from "@/lib/ai/config";

// ===================================
// Types
// ===================================

export interface SessionSummaryResult {
  summary: string;
  keyInsights: string[];
  conceptsCovered: string[];
  suggestedNextSteps: string[];
  overallProgress: "exploring" | "learning" | "understanding" | "mastering";
}

interface Message {
  role: string;
  content: string;
}

// ===================================
// Summary Generation Prompt
// ===================================

const SUMMARY_PROMPT = `You are analyzing a learning conversation to generate a helpful summary for the learner.

Based on the conversation, provide:
1. summary: A 2-3 sentence overview of what was discussed and learned
2. keyInsights: 3-5 main takeaways or "aha moments" from the session (short bullet points)
3. conceptsCovered: List of specific concepts/topics that were discussed
4. suggestedNextSteps: 2-3 suggestions for what to learn or practice next
5. overallProgress: One of "exploring" (just starting), "learning" (actively engaging), "understanding" (grasping concepts), "mastering" (demonstrating proficiency)

Return JSON format:
{
  "summary": "...",
  "keyInsights": ["...", "..."],
  "conceptsCovered": ["...", "..."],
  "suggestedNextSteps": ["...", "..."],
  "overallProgress": "learning"
}

Focus on being encouraging and constructive. Highlight what went well.`;

// ===================================
// Generate Session Summary
// ===================================

export async function generateSessionSummary(
  messages: Message[]
): Promise<SessionSummaryResult> {
  try {
    // Need at least a few messages to summarize
    if (messages.length < 2) {
      return {
        summary: "This was a brief session. Continue learning to get a full summary!",
        keyInsights: [],
        conceptsCovered: [],
        suggestedNextSteps: ["Continue exploring this topic", "Ask follow-up questions"],
        overallProgress: "exploring",
      };
    }

    // Format conversation for analysis
    const conversationText = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => `${m.role === "user" ? "Learner" : "AI Tutor"}: ${m.content}`)
      .join("\n\n");

    // Truncate if too long (keep last ~4000 chars to fit in context)
    const truncatedConversation = conversationText.length > 4000
      ? "...[earlier conversation truncated]...\n\n" + conversationText.slice(-4000)
      : conversationText;

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.FALLBACK_MODEL, // Use cheaper model for summaries
      messages: [
        { role: "system", content: SUMMARY_PROMPT },
        { role: "user", content: `Generate a summary for this learning session:\n\n${truncatedConversation}` },
      ],
      temperature: 0.5,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(content) as SessionSummaryResult;

    // Validate and provide defaults
    return {
      summary: result.summary || "Great learning session!",
      keyInsights: Array.isArray(result.keyInsights) ? result.keyInsights.slice(0, 5) : [],
      conceptsCovered: Array.isArray(result.conceptsCovered) ? result.conceptsCovered.slice(0, 10) : [],
      suggestedNextSteps: Array.isArray(result.suggestedNextSteps) ? result.suggestedNextSteps.slice(0, 3) : [],
      overallProgress: ["exploring", "learning", "understanding", "mastering"].includes(result.overallProgress)
        ? result.overallProgress
        : "learning",
    };
  } catch (error) {
    console.error("Error generating session summary:", error);
    return {
      summary: "You completed a learning session. Keep up the great work!",
      keyInsights: [],
      conceptsCovered: [],
      suggestedNextSteps: ["Review what you learned", "Practice with examples"],
      overallProgress: "learning",
    };
  }
}
