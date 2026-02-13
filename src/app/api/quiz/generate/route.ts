import { NextRequest } from "next/server";
import { openai, AI_CONFIG } from "@/lib/ai/config";
import { trackTokenUsage } from "@/lib/ai/tokenTracker";
import { logAICall } from "@/lib/ai/aiLogger";
import { requireAuthUser, authErrorResponse } from "@/lib/auth/serverAuth";

// ===================================
// POST - Generate a 4-question quiz for a specific learning objective
// ===================================
// Quiz structure (fixed):
//   Q1: Multiple choice — recognition / recall
//   Q2: True/False — misconception check
//   Q3: Multiple choice — deeper application
//   Q4: Short answer (essay) — "teach it back" / explain in own words
//
// Q1-Q3 are auto-graded client-side via the answer key.
// Q4 is graded by a separate AI call (/api/quiz/grade-essay).

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);

    const body = await request.json();
    const {
      objective,
      conversationContext,
      milestoneTitle,
    }: {
      objective: string;
      conversationContext: string;
      milestoneTitle?: string;
    } = body;

    if (!objective || !conversationContext) {
      return new Response(
        JSON.stringify({ error: "objective and conversationContext are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const aiMessages: Array<{ role: "system" | "user"; content: string }> = [
      {
        role: "system",
        content: `You are an educational assessment designer. Generate a 4-question quiz to test whether a learner has truly understood a specific learning objective.

The quiz MUST follow this exact structure:
1. **Multiple Choice** (4 options, one correct) — test basic recognition/recall of the concept
2. **True/False** — test a common misconception about this concept
3. **Multiple Choice** (4 options, one correct) — test deeper understanding or application
4. **Short Answer** — ask the learner to explain the concept in their own words, as if teaching someone else. This should test genuine understanding, not just memorization.

Guidelines:
- Questions should be based on what was discussed in the conversation
- MC distractors should be plausible but clearly wrong to someone who understands
- The T/F question should target a real misconception, not a trivially obvious statement
- The short answer should invite explanation, not just a definition dump
- Difficulty should be fair — testing understanding, not trick questions

Respond with ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": 0
    },
    {
      "type": "true_false",
      "question": "...",
      "options": ["True", "False"],
      "correctAnswer": 1
    },
    {
      "type": "multiple_choice",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": 2
    },
    {
      "type": "short_answer",
      "question": "...",
      "modelAnswer": "A good answer would cover: ..."
    }
  ]
}

"correctAnswer" is the 0-based index of the correct option.
"modelAnswer" is the ideal answer for the short-answer question (used for AI grading).`,
      },
      {
        role: "user",
        content: `${milestoneTitle ? `MILESTONE: ${milestoneTitle}\n` : ""}LEARNING OBJECTIVE: ${objective}

CONVERSATION CONTEXT (what was discussed):
${conversationContext}

Generate a 4-question quiz for this objective.`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.PRIMARY_MODEL, // Use primary model for quality quiz generation
      messages: aiMessages,
      max_tokens: 1200,
      temperature: 0.6,
    });

    const raw = response.choices[0]?.message?.content?.trim() || "{}";

    // Log the AI call
    logAICall({
      endpoint: "quiz/generate",
      model: AI_CONFIG.PRIMARY_MODEL,
      messages: aiMessages,
      callParams: { max_tokens: 1200, temperature: 0.6 },
      response: raw,
      usage: response.usage,
    });

    // Track token usage
    trackTokenUsage(authed.uid, "quiz-generate", AI_CONFIG.PRIMARY_MODEL, response.usage)
      .catch((err) => console.error("Token tracking failed:", err));

    // Parse the response
    let result: { questions: Array<{
      type: string;
      question: string;
      options?: string[];
      correctAnswer?: number;
      modelAnswer?: string;
    }> };

    try {
      const cleaned = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      result = JSON.parse(cleaned);

      // Validate structure
      if (!Array.isArray(result.questions) || result.questions.length !== 4) {
        throw new Error("Expected exactly 4 questions");
      }

      // Validate each question
      const expectedTypes = ["multiple_choice", "true_false", "multiple_choice", "short_answer"];
      result.questions.forEach((q, i) => {
        if (q.type !== expectedTypes[i]) {
          q.type = expectedTypes[i]; // Fix type if wrong
        }
        // Ensure MC/TF have valid correctAnswer
        if (q.type === "multiple_choice" || q.type === "true_false") {
          if (typeof q.correctAnswer !== "number") {
            q.correctAnswer = 0;
          }
        }
        // Ensure short_answer has modelAnswer
        if (q.type === "short_answer" && !q.modelAnswer) {
          q.modelAnswer = "A comprehensive explanation of the concept.";
        }
      });
    } catch (parseError) {
      console.error("Failed to parse quiz response:", parseError, raw);
      return new Response(
        JSON.stringify({ error: "Failed to generate quiz. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Quiz generate API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate quiz" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
