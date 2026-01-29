/**
 * Reflection Trigger Logic
 * Determines when to prompt user for reflection based on session state,
 * learning patterns, and user preferences.
 */

import type { Timestamp } from "firebase/firestore";
import type { LearningSession } from "@/types";

// ===================================
// Types
// ===================================

export interface ReflectionTriggerContext {
  session: LearningSession;
  conceptsCoveredCount: number;
  messageCount: number;
  lastReflectionTime?: Timestamp | null;
  recentDismissalTime?: Timestamp | null; // When user clicked "Not now"
  userPreferences: {
    reflectionFrequency: "often" | "moderate" | "rarely";
    reflectionEnabled: boolean;
  };
}

export interface TriggerResult {
  shouldTrigger: boolean;
  reason?: string;
  cooldownRemaining?: number; // seconds until next eligible trigger
  nextCheckIn?: number; // suggested seconds until next check
}

// ===================================
// Constants
// ===================================

// Minimum thresholds for reflection
const MIN_CONCEPTS_COVERED = 3;
const MIN_MESSAGE_COUNT = 10;

// Cooldown periods (in milliseconds)
const REFLECTION_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes between reflections
const DISMISSAL_COOLDOWN_MS = 5 * 60 * 1000;   // 5 minutes after "Not now"

// Frequency multipliers for cooldown
const FREQUENCY_MULTIPLIERS: Record<string, number> = {
  often: 0.5,      // Half cooldown
  moderate: 1.0,   // Standard cooldown
  rarely: 2.0,     // Double cooldown
};

// ===================================
// Helper Functions
// ===================================

/**
 * Convert Timestamp to milliseconds.
 */
function timestampToMs(timestamp: Timestamp | null | undefined): number {
  if (!timestamp) return 0;
  
  // Handle both Firebase client and admin timestamps
  if ("toMillis" in timestamp && typeof timestamp.toMillis === "function") {
    return timestamp.toMillis();
  }
  if ("seconds" in timestamp) {
    return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000;
  }
  return 0;
}

/**
 * Get the effective cooldown based on user preference.
 */
function getEffectiveCooldown(
  baseCooldownMs: number,
  frequency: "often" | "moderate" | "rarely"
): number {
  const multiplier = FREQUENCY_MULTIPLIERS[frequency] || 1.0;
  return baseCooldownMs * multiplier;
}

/**
 * Calculate remaining cooldown in seconds.
 */
function calculateCooldownRemaining(
  lastEventTime: Timestamp | null | undefined,
  cooldownMs: number
): number {
  if (!lastEventTime) return 0;
  
  const lastTimeMs = timestampToMs(lastEventTime);
  const now = Date.now();
  const elapsed = now - lastTimeMs;
  const remaining = cooldownMs - elapsed;
  
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

// ===================================
// Main Functions
// ===================================

/**
 * Determine if a reflection should be triggered based on session state.
 */
export function shouldTriggerReflection(
  context: ReflectionTriggerContext
): TriggerResult {
  const {
    session,
    conceptsCoveredCount,
    messageCount,
    lastReflectionTime,
    recentDismissalTime,
    userPreferences,
  } = context;
  
  // Check if reflection is enabled
  if (!userPreferences.reflectionEnabled) {
    return {
      shouldTrigger: false,
      reason: "Reflection is disabled in user preferences",
    };
  }
  
  // Check if session is active
  if (session.status !== "active") {
    return {
      shouldTrigger: false,
      reason: "Session is not active",
    };
  }
  
  // Check minimum concepts covered
  if (conceptsCoveredCount < MIN_CONCEPTS_COVERED) {
    const conceptsNeeded = MIN_CONCEPTS_COVERED - conceptsCoveredCount;
    return {
      shouldTrigger: false,
      reason: `Need ${conceptsNeeded} more concept(s) before reflection`,
      nextCheckIn: 60, // Check again in 1 minute
    };
  }
  
  // Check minimum message count
  if (messageCount < MIN_MESSAGE_COUNT) {
    const messagesNeeded = MIN_MESSAGE_COUNT - messageCount;
    return {
      shouldTrigger: false,
      reason: `Need ${messagesNeeded} more message(s) before reflection`,
      nextCheckIn: 30, // Check again in 30 seconds
    };
  }
  
  // Get effective cooldowns based on user preference
  const effectiveReflectionCooldown = getEffectiveCooldown(
    REFLECTION_COOLDOWN_MS,
    userPreferences.reflectionFrequency
  );
  
  // Check cooldown from last reflection
  const reflectionCooldownRemaining = calculateCooldownRemaining(
    lastReflectionTime,
    effectiveReflectionCooldown
  );
  
  if (reflectionCooldownRemaining > 0) {
    return {
      shouldTrigger: false,
      reason: "Cooldown from last reflection",
      cooldownRemaining: reflectionCooldownRemaining,
      nextCheckIn: Math.min(reflectionCooldownRemaining, 60),
    };
  }
  
  // Check cooldown from recent dismissal
  const dismissalCooldownRemaining = calculateCooldownRemaining(
    recentDismissalTime,
    DISMISSAL_COOLDOWN_MS
  );
  
  if (dismissalCooldownRemaining > 0) {
    return {
      shouldTrigger: false,
      reason: "User recently dismissed reflection prompt",
      cooldownRemaining: dismissalCooldownRemaining,
      nextCheckIn: Math.min(dismissalCooldownRemaining, 60),
    };
  }
  
  // All conditions met - trigger reflection!
  return {
    shouldTrigger: true,
    reason: `${conceptsCoveredCount} concepts covered, ${messageCount} messages exchanged`,
  };
}

/**
 * Get the remaining cooldown time until next reflection is allowed.
 */
export function getReflectionCooldown(
  lastReflectionTime: Timestamp | null | undefined,
  frequency: "often" | "moderate" | "rarely" = "moderate"
): number {
  const effectiveCooldown = getEffectiveCooldown(
    REFLECTION_COOLDOWN_MS,
    frequency
  );
  return calculateCooldownRemaining(lastReflectionTime, effectiveCooldown);
}

/**
 * Calculate an urgency score for reflection (0-1).
 * Higher score = more urgent/beneficial to reflect.
 */
export function calculateReflectionUrgency(
  context: ReflectionTriggerContext
): number {
  const { conceptsCoveredCount, messageCount, lastReflectionTime } = context;
  
  // Base urgency from concepts (0-0.4)
  const conceptScore = Math.min(conceptsCoveredCount / 10, 1) * 0.4;
  
  // Message count contribution (0-0.3)
  const messageScore = Math.min(messageCount / 30, 1) * 0.3;
  
  // Time since last reflection contribution (0-0.3)
  let timeScore = 0;
  if (lastReflectionTime) {
    const timeSinceMs = Date.now() - timestampToMs(lastReflectionTime);
    const hoursSince = timeSinceMs / (1000 * 60 * 60);
    timeScore = Math.min(hoursSince / 2, 1) * 0.3; // Max at 2+ hours
  } else {
    // Never reflected = high urgency
    timeScore = 0.3;
  }
  
  return conceptScore + messageScore + timeScore;
}

/**
 * Get a human-readable explanation of why reflection is/isn't triggered.
 */
export function getReflectionStatusMessage(result: TriggerResult): string {
  if (result.shouldTrigger) {
    return "Ready to reflect on what you've learned!";
  }
  
  if (result.cooldownRemaining) {
    const minutes = Math.ceil(result.cooldownRemaining / 60);
    return `Reflection available in ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
  
  return result.reason || "Not ready for reflection yet";
}
