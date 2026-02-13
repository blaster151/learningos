import { NextRequest } from "next/server";
import { openai, AI_CONFIG } from "@/lib/ai/config";
import { trackTokenUsage } from "@/lib/ai/tokenTracker";
import { logAICall } from "@/lib/ai/aiLogger";
import { requireAuthUser, authErrorResponse } from "@/lib/auth/serverAuth";

// ===================================
// POST - Grade a short-answer (essay) quiz question using AI
// ===================================
// This is called once per quiz, for question #4 (the short answer).
// Returns: correct (boolean), feedback (string), score (0-1)

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);

    const body = await request.json();
    const {
      objective,
      question,
      modelAnswer,
      userAnswer,
    }: {
      objective: string;
      question: string;
      modelAnswer: string;
      userAnswer: string;
    } = body;

    if (!objective || !question || !modelAnswer || !userAnswer) {
      return new Response(
        JSON.stringify({ error: "objective, question, modelAnswer, and userAnswer are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Reject very short answers (less than ~10 words)
    const wordCount = userAnswer.trim().split(/\s+/).length;
    if (wordCount < 5) {
      return new Response(
        JSON.stringify({
          correct: false,
          score: 0,
          feedback: "Your answer is too brief. Try explaining in more detail — at least a couple of sentences showing your understanding.",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const aiMessages: Array<{ role: "system" | "user"; content: string }> = [
      {
        role: "system",
        content: `You are a gentle but rigorous educational assessor. A learner has answered a short-answer question as part of a quiz on a learning objective. Your job is to assess whether their answer demonstrates genuine understanding.

Grading criteria:
- Does the answer show understanding of the core concept, not just surface-level repetition?
- Does the answer cover the key points from the model answer?
- Is the explanation accurate (no misconceptions)?
- Minor phrasing differences or missing edge cases are fine — focus on conceptual understanding.

Be encouraging but honest. If they got it mostly right, say so. If they missed key points or have misconceptions, explain what was missing.

Respond with ONLY valid JSON:
{
  "correct": true/false,
  "score": 0.0 to 1.0,
  "feedback": "2-3 sentences of specific feedback"
}

A score of 0.6 or above counts as correct (passing).
A score below 0.6 means the learner needs to review and try again.`,
      },
      {
        role: "user",
        content: `LEARNING OBJECTIVE: ${objective}

QUESTION: ${question}

MODEL ANSWER (what a good answer should cover):
${modelAnswer}

LEARNER'S ANSWER:
${userAnswer}

Assess the learner's answer.`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.PRIMARY_MODEL, // Primary model for quality grading
      messages: aiMessages,
      max_tokens: 300,
      temperature: 0.3, // Low temperature for consistent grading
    });

    const raw = response.choices[0]?.message?.content?.trim() || "{}";

    // Log the AI call
    logAICall({
      endpoint: "quiz/grade-essay",
      model: AI_CONFIG.PRIMARY_MODEL,
      messages: aiMessages,
      callParams: { max_tokens: 300, temperature: 0.3 },
      response: raw,
      usage: response.usage,
    });

    // Track token usage
    trackTokenUsage(authed.uid, "quiz-grade-essay", AI_CONFIG.PRIMARY_MODEL, response.usage)
      .catch((err) => console.error("Token tracking failed:", err));

    // Parse the response
    let result: { correct: boolean; score: number; feedback: string };
    try {
      const cleaned = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      result = JSON.parse(cleaned);

      // Normalize
      if (typeof result.score !== "number") result.score = result.correct ? 0.8 : 0.3;
      if (typeof result.correct !== "boolean") result.correct = result.score >= 0.6;
      if (!result.feedback) result.feedback = result.correct
        ? "Good explanation! You've demonstrated understanding of this concept."
        : "Your answer needs more depth. Try reviewing the concept and explaining the key ideas.";

      // Ensure correct aligns with score threshold
      result.correct = result.score >= 0.6;
    } catch {
      // Default to lenient on parse failure
      result = {
        correct: false,
        score: 0.4,
        feedback: "I had trouble evaluating your answer. Please try explaining in more detail.",
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Quiz grade-essay API error:", error);
    return new Response(
      JSON.stringify({
        correct: false,
        score: 0,
        feedback: "An error occurred while grading. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
