// Token Usage Tracking Service
// Records OpenAI token usage per-user to Firestore for admin analytics

import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

// ===================================
// Types
// ===================================

export interface TokenUsageRecord {
  userId: string;
  endpoint: string; // e.g. "chat", "follow-ups", "concepts/extract"
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: FirebaseFirestore.Timestamp;
}

export interface UserTokenSummary {
  userId: string;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalRequests: number;
  lastUsed: string;
  byEndpoint: Record<string, { tokens: number; requests: number }>;
  byModel: Record<string, { tokens: number; requests: number }>;
}

// ===================================
// Track Token Usage
// ===================================

/**
 * Record token usage from an OpenAI API response.
 * This is fire-and-forget — errors are logged but never block the response.
 *
 * @param userId - The Firebase UID of the user
 * @param endpoint - A short label like "chat", "follow-ups", "assess-objectives"
 * @param model - Model name like "gpt-4" or "gpt-3.5-turbo"
 * @param usage - The usage object from the OpenAI response
 */
export async function trackTokenUsage(
  userId: string,
  endpoint: string,
  model: string,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null | undefined
): Promise<void> {
  if (!usage) return;

  try {
    const db = await getAdminDb();
    const now = Timestamp.now();

    const record: TokenUsageRecord = {
      userId,
      endpoint,
      model,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
      timestamp: now,
    };

    // Write individual usage record
    await db.collection("token_usage").add(record);

    // Update aggregated user totals (atomic increment)
    const userStatsRef = db.collection("token_usage_totals").doc(userId);
    const userStatsDoc = await userStatsRef.get();

    if (userStatsDoc.exists) {
      await userStatsRef.update({
        totalPromptTokens: FieldValue.increment(record.promptTokens),
        totalCompletionTokens: FieldValue.increment(record.completionTokens),
        totalTokens: FieldValue.increment(record.totalTokens),
        totalRequests: FieldValue.increment(1),
        lastUsed: now,
        [`byEndpoint.${endpoint}.tokens`]: FieldValue.increment(record.totalTokens),
        [`byEndpoint.${endpoint}.requests`]: FieldValue.increment(1),
        [`byModel.${model}.tokens`]: FieldValue.increment(record.totalTokens),
        [`byModel.${model}.requests`]: FieldValue.increment(1),
      });
    } else {
      await userStatsRef.set({
        userId,
        totalPromptTokens: record.promptTokens,
        totalCompletionTokens: record.completionTokens,
        totalTokens: record.totalTokens,
        totalRequests: 1,
        lastUsed: now,
        byEndpoint: {
          [endpoint]: { tokens: record.totalTokens, requests: 1 },
        },
        byModel: {
          [model]: { tokens: record.totalTokens, requests: 1 },
        },
      });
    }
  } catch (error) {
    // Never throw — token tracking is non-critical
    console.error("Failed to track token usage:", error);
  }
}

/**
 * Track token usage from a streaming response.
 * OpenAI streaming doesn't include usage in each chunk; we estimate from the
 * messages array (prompt) and the full response text (completion).
 *
 * Rough estimation: ~4 chars per token for English text.
 */
export async function trackStreamingUsage(
  userId: string,
  endpoint: string,
  model: string,
  promptMessages: Array<{ role: string; content: string }>,
  completionText: string
): Promise<void> {
  const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

  const promptText = promptMessages.map((m) => m.content).join(" ");
  const promptTokens = estimateTokens(promptText);
  const completionTokens = estimateTokens(completionText);

  await trackTokenUsage(userId, endpoint, model, {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
  });
}
