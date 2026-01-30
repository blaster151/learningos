import { NextRequest } from "next/server";
import { openai, AI_CONFIG } from "@/lib/ai/config";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { extractConcepts } from "@/lib/ai/conceptExtraction";
import { updateGraphFromMessage } from "@/lib/ai/conceptGraphUpdater";
import { progressTracker } from "@/lib/learning/progressTracker";
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

Remember: Your goal is not just to answer questions, but to help users truly understand and retain knowledge.`;

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

    // Build conversation history for context
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

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

          // Save messages to Firestore after streaming completes
          if (sessionId) {
            try {
              const db = await getAdminDb();
              const now = Timestamp.now();

              // Verify session ownership before writing
              const sessionDoc = await db.collection("sessions").doc(sessionId).get();
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
              await db.collection("sessions").doc(sessionId).update({
                lastActivity: now,
                messageCount: (await db.collection("messages")
                  .where("sessionId", "==", sessionId)
                  .count()
                  .get()).data().count,
              });

              // Get session for topic context
              const sessionData = sessionDoc.data();
              const sessionTopic = sessionData?.topic;

              // Update concept graph from messages (async, don't block response)
              updateGraphFromMessage(userId, sessionId, message, "user", sessionTopic)
                .catch((err) => console.error("Graph update failed for user message:", err));

              updateGraphFromMessage(userId, sessionId, fullResponse, "assistant", sessionTopic)
                .catch((err) => console.error("Graph update failed for assistant message:", err));

              // Update path progress if session is following a path (async)
              if (sessionData?.pathId) {
                progressTracker
                  .updateProgressFromSession(userId, sessionId)
                  .then((result) => {
                    if (result?.celebrationMessage) {
                      console.log("Progress update:", result.celebrationMessage);
                      // TODO: Send celebration message to client via WebSocket or similar
                    }
                  })
                  .catch((err) => console.error("Progress tracking failed:", err));
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
