import { NextRequest } from "next/server";
import { openai, AI_CONFIG } from "@/lib/ai/config";
import { trackStreamingUsage } from "@/lib/ai/tokenTracker";
import { logAIStreamingCall } from "@/lib/ai/aiLogger";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { extractConcepts } from "@/lib/ai/conceptExtraction";
import { updateGraphFromMessage } from "@/lib/ai/conceptGraphUpdater";
import { progressTracker } from "@/lib/learning/progressTracker";
import { conceptsService } from "@/lib/firebase/concepts";
import { detectPrerequisiteGap } from "@/lib/learning/prerequisiteGapMonitor";
import { pathsService } from "@/lib/firebase/learningPaths";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";

// ===================================
// Types
// ===================================

interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  history?: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
}

// ===================================
// System Prompt
// ===================================

const SYSTEM_PROMPT = `You are LearningOS, an AI-powered learning companion designed to help users deeply understand concepts through conversation.

Your teaching approach:
1. **Socratic Method**: Ask thoughtful questions to guide understanding rather than just providing answers
2. **Adaptive Explanations**: Adjust complexity based on the user's responses and understanding level
3. **Concept Connections**: Help users see how new concepts relate to things they already know
4. **Active Recall**: Periodically check understanding by asking users to explain concepts back
5. **Encouragement**: Celebrate progress and normalize confusion as part of learning

Guidelines:
- Keep responses concise but thorough (aim for 2-4 paragraphs unless more detail is requested)
- Use analogies and real-world examples to make abstract concepts concrete
- When explaining code, break it down step by step
- If a user seems stuck, offer hints rather than full solutions
- Ask follow-up questions to deepen understanding
- Use markdown formatting for code blocks and lists when helpful
- **Bold ALL domain-relevant terms** using **double asterisks** — every technical term, named concept, principle, theory, named entity, or domain-specific vocabulary should be bolded **every time it appears**, not just on first mention. Examples: **Schrödinger's cat**, **closure**, **polymorphism**, **event loop**, **recursion**, **quantum superposition**.
  - Be generous: if a term is something a learner might want to explore further or add to their knowledge graph, bold it.
  - Aim for at least 3–8 bolded terms per response. It is better to bold too many than too few.
  - Bold on EVERY occurrence in the response, not just the first mention.
  - Bold terms the learner has already encountered in previous messages — consistency matters.
  - Do NOT bold common English words, conversational filler, or non-domain terms.

Remember: Your goal is not just to answer questions, but to help users truly understand and retain knowledge.

Prerequisite monitoring:
- If the learner shows confusion that likely comes from missing prerequisite knowledge, briefly call that out and propose a foundational concept to review.
- Keep this supportive and non-blocking: offer a short "fill the gap first" suggestion while still helping with the current question.`;

// ===================================
// POST - Send message and get streaming response
// ===================================

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body: ChatRequest = await request.json();
    const { message, sessionId, userId: requestedUserId, history = [] } = body;

    assertSameUser(requestedUserId, authed.uid);
    const userId = authed.uid;

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (message.length > 8000) {
      return new Response(JSON.stringify({ error: "Message too long" }), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch user's known concepts to inject into system prompt for consistent bolding
    let systemPrompt = SYSTEM_PROMPT;
    try {
      const knownConcepts = await conceptsService.getUserConcepts(userId, {
        limit: 50,
      });
      if (knownConcepts.length > 0) {
        const conceptNames = knownConcepts.map((c) => c.name);
        systemPrompt += `\n\nThe learner's knowledge graph already contains these concepts — always bold them when they appear: ${conceptNames.join(", ")}.`;
      }
    } catch (err) {
      console.error("Failed to fetch known concepts for bolding:", err);
      // Continue without concept list — bolding will still work from the base instruction
    }

    // Build conversation history for context
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [{ role: "system", content: systemPrompt }];

    // Add conversation history (last 10 messages for context)
    for (const msg of history.slice(-10)) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current message
    messages.push({ role: "user", content: message });

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: AI_CONFIG.PRIMARY_MODEL,
      messages,
      stream: true,
      max_tokens: 1000,
      temperature: 0.7,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const streamStartTime = Date.now();
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }

          // Log the AI call
          logAIStreamingCall({
            endpoint: "chat",
            model: AI_CONFIG.PRIMARY_MODEL,
            messages,
            callParams: { max_tokens: 1000, temperature: 0.7 },
            fullResponse,
            durationMs: Date.now() - streamStartTime,
          });

          // Track estimated token usage (fire-and-forget)
          trackStreamingUsage(
            userId,
            "chat",
            AI_CONFIG.PRIMARY_MODEL,
            messages,
            fullResponse
          ).catch((err) => console.error("Token tracking failed:", err));

          // Save messages to Firestore after streaming completes
          if (sessionId) {
            try {
              const db = await getAdminDb();
              const now = Timestamp.now();

              // Verify session ownership before writing
              const sessionDoc = await db
                .collection("sessions")
                .doc(sessionId)
                .get();
              if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
                controller.close();
                return;
              }

              // Save user message
              await db.collection("messages").add({
                sessionId,
                userId,
                role: "user",
                content: message,
                timestamp: now,
              });

              // Save assistant response
              await db.collection("messages").add({
                sessionId,
                userId,
                role: "assistant",
                content: fullResponse,
                timestamp: Timestamp.fromMillis(now.toMillis() + 1),
              });

              // Update session stats
              await db
                .collection("sessions")
                .doc(sessionId)
                .update({
                  lastActivity: now,
                  messageCount: (
                    await db
                      .collection("messages")
                      .where("sessionId", "==", sessionId)
                      .count()
                      .get()
                  ).data().count,
                });

              // Get session for topic context
              const sessionData = sessionDoc.data();
              const sessionTopic = sessionData?.topic;

              // Update concept graph from messages (async, don't block response)
              updateGraphFromMessage(
                userId,
                sessionId,
                message,
                "user",
                sessionTopic
              ).catch((err) =>
                console.error("Graph update failed for user message:", err)
              );

              updateGraphFromMessage(
                userId,
                sessionId,
                fullResponse,
                "assistant",
                sessionTopic
              ).catch((err) =>
                console.error("Graph update failed for assistant message:", err)
              );

              // Dynamic prerequisite-gap detection for milestone learning
              if (sessionData?.pathId) {
                const path = await pathsService.getPath(
                  userId,
                  sessionData.pathId
                );
                const targetMilestone =
                  path?.milestones.find(
                    (m) =>
                      m.milestoneId ===
                      (sessionData.milestoneId ||
                        sessionData.currentMilestoneId)
                  ) ?? path?.milestones[path?.currentMilestoneIndex || 0];
                const targetConceptId = targetMilestone?.conceptIds?.[0];

                if (targetConceptId) {
                  detectPrerequisiteGap({
                    userId,
                    userMessage: message,
                    assistantResponse: fullResponse,
                    targetConceptId,
                  })
                    .then(async (gapAlert) => {
                      if (!gapAlert.detected) return;
                      await db.collection("sessions").doc(sessionId).update({
                        prerequisiteGapAlert: gapAlert,
                        lastActivity: Timestamp.now(),
                      });
                    })
                    .catch((err) =>
                      console.error("Prerequisite gap detection failed:", err)
                    );
                }
              }

              // Update path progress if session is following a path (async)
              if (sessionData?.pathId) {
                progressTracker
                  .updateProgressFromSession(userId, sessionId)
                  .then((result) => {
                    if (result?.celebrationMessage) {
                      console.log(
                        "Progress update:",
                        result.celebrationMessage
                      );
                      // TODO: Send celebration message to client via WebSocket or similar
                    }
                  })
                  .catch((err) =>
                    console.error("Progress tracking failed:", err)
                  );
              }
            } catch (dbError) {
              console.error("Failed to save messages to Firestore:", dbError);
              // Don't fail the response if DB save fails
            }
          }

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
