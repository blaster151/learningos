/**
 * Mastery Update from Reflection
 * Updates concept mastery levels based on reflection analysis results.
 */

import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type { MasteryLevel, ConceptNode } from "@/types";
import type {
  AnalysisOutput,
  MasteryRecommendation,
} from "@/lib/ai/reflectionAnalyzer";

// ===================================
// Types
// ===================================

export interface MasteryUpdateInput {
  userId: string;
  reflectionId: string;
  analysis: AnalysisOutput;
  recommendations: MasteryRecommendation[];
}

export interface MasteryUpdateResult {
  conceptId: string;
  previousLevel: MasteryLevel;
  newLevel: MasteryLevel;
  previousConfidence: number;
  newConfidence: number;
  changed: boolean;
}

export interface UpdateSummary {
  success: boolean;
  updatedConcepts: MasteryUpdateResult[];
  totalProcessed: number;
  totalUpdated: number;
  error?: string;
}

// ===================================
// Constants
// ===================================

const MASTERY_ORDER: MasteryLevel[] = [
  "exploring",
  "learning",
  "practicing",
  "comfortable",
  "expert",
];

// Minimum score thresholds for mastery level changes
const MASTERY_THRESHOLDS = {
  exploring: 0,
  learning: 0.25,
  practicing: 0.45,
  comfortable: 0.7,
  expert: 0.9,
};

// Maximum confidence change per reflection
const MAX_CONFIDENCE_CHANGE = 0.2;

// Minimum accuracy score to consider for level-up
const MIN_ACCURACY_FOR_LEVEL_UP = 75;

// ===================================
// Main Function
// ===================================

/**
 * Update mastery levels for concepts based on reflection analysis.
 */
export async function updateMasteryFromReflection(
  input: MasteryUpdateInput
): Promise<UpdateSummary> {
  const { userId, reflectionId, analysis, recommendations } = input;

  const results: MasteryUpdateResult[] = [];
  let updatedCount = 0;

  try {
    const db = await getAdminDb();
    const batch = db.batch();

    for (const recommendation of recommendations) {
      // Fetch current concept state
      const conceptRef = db.collection("concepts").doc(recommendation.conceptId);
      const conceptDoc = await conceptRef.get();

      if (!conceptDoc.exists) {
        continue;
      }

      const conceptData = conceptDoc.data() as ConceptNode;

      // Verify ownership
      if (conceptData.userId !== userId) {
        continue;
      }

      // Calculate new values
      const previousLevel = conceptData.masteryLevel;
      const previousConfidence = conceptData.confidence;

      // Find assessment for this concept
      const assessment = analysis.conceptAssessments.find(
        (a) => a.conceptId === recommendation.conceptId
      );

      // Calculate new confidence with bounds
      let newConfidence = calculateNewConfidence(
        previousConfidence,
        recommendation.confidenceChange,
        assessment?.accuracyScore
      );

      // Determine new mastery level
      let newLevel = determineNewLevel(
        previousLevel,
        recommendation.recommendedLevel,
        newConfidence,
        assessment?.accuracyScore || 0
      );

      // Apply updates if there are changes
      const hasChanges =
        newLevel !== previousLevel ||
        Math.abs(newConfidence - previousConfidence) > 0.01;

      if (hasChanges) {
        batch.update(conceptRef, {
          masteryLevel: newLevel,
          confidence: newConfidence,
          lastReviewed: Timestamp.now(),
          lastReflectionId: reflectionId,
          updatedAt: Timestamp.now(),
        });
        updatedCount++;
      }

      results.push({
        conceptId: recommendation.conceptId,
        previousLevel,
        newLevel,
        previousConfidence,
        newConfidence,
        changed: hasChanges,
      });
    }

    // Commit all updates
    if (updatedCount > 0) {
      await batch.commit();
    }

    // Record the reflection outcome
    await recordReflectionOutcome(db, userId, reflectionId, analysis, results);

    return {
      success: true,
      updatedConcepts: results,
      totalProcessed: recommendations.length,
      totalUpdated: updatedCount,
    };
  } catch (error) {
    console.error("Error updating mastery from reflection:", error);
    return {
      success: false,
      updatedConcepts: results,
      totalProcessed: recommendations.length,
      totalUpdated: updatedCount,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ===================================
// Helper Functions
// ===================================

/**
 * Calculate new confidence value with smoothing and bounds.
 */
function calculateNewConfidence(
  currentConfidence: number,
  recommendedChange: number,
  accuracyScore?: number
): number {
  // Clamp recommended change
  const clampedChange = Math.max(
    -MAX_CONFIDENCE_CHANGE,
    Math.min(MAX_CONFIDENCE_CHANGE, recommendedChange)
  );

  // Weight by accuracy if available
  let effectiveChange = clampedChange;
  if (accuracyScore !== undefined) {
    // Scale positive changes by accuracy score
    if (clampedChange > 0) {
      effectiveChange = clampedChange * (accuracyScore / 100);
    }
  }

  // Apply smoothing - smaller changes have less effect on high confidence
  const smoothingFactor = currentConfidence > 0.7 ? 0.7 : 1.0;
  effectiveChange *= smoothingFactor;

  // Calculate and clamp final value
  const newConfidence = currentConfidence + effectiveChange;
  return Math.max(0, Math.min(1, newConfidence));
}

/**
 * Determine the appropriate new mastery level.
 */
function determineNewLevel(
  currentLevel: MasteryLevel,
  recommendedLevel: MasteryLevel,
  newConfidence: number,
  accuracyScore: number
): MasteryLevel {
  const currentIndex = MASTERY_ORDER.indexOf(currentLevel);
  const recommendedIndex = MASTERY_ORDER.indexOf(recommendedLevel);

  // Don't allow level-up without sufficient accuracy demonstration
  if (recommendedIndex > currentIndex && accuracyScore < MIN_ACCURACY_FOR_LEVEL_UP) {
    return currentLevel;
  }

  // Check if confidence supports the recommended level
  const targetThreshold = Object.entries(MASTERY_THRESHOLDS).find(
    ([level]) => level === recommendedLevel
  )?.[1];

  if (targetThreshold !== undefined && newConfidence < targetThreshold) {
    // Confidence doesn't support recommended level, find appropriate level
    for (let i = MASTERY_ORDER.length - 1; i >= 0; i--) {
      const levelName = MASTERY_ORDER[i];
      const threshold = MASTERY_THRESHOLDS[levelName as keyof typeof MASTERY_THRESHOLDS];
      if (newConfidence >= threshold) {
        // Don't go below current level based on single reflection
        return MASTERY_ORDER[Math.max(i, Math.max(0, currentIndex - 1))];
      }
    }
    return "exploring";
  }

  // Don't drop more than one level per reflection
  if (recommendedIndex < currentIndex - 1) {
    return MASTERY_ORDER[currentIndex - 1];
  }

  // Don't jump more than one level per reflection
  if (recommendedIndex > currentIndex + 1) {
    return MASTERY_ORDER[currentIndex + 1];
  }

  return recommendedLevel;
}

/**
 * Record the reflection outcome for analytics.
 */
async function recordReflectionOutcome(
  db: FirebaseFirestore.Firestore,
  userId: string,
  reflectionId: string,
  analysis: AnalysisOutput,
  results: MasteryUpdateResult[]
): Promise<void> {
  try {
    await db.collection("reflection_outcomes").add({
      userId,
      reflectionId,
      overallScore: analysis.overallScore,
      conceptCount: results.length,
      updatedCount: results.filter((r) => r.changed).length,
      levelUps: results.filter(
        (r) =>
          MASTERY_ORDER.indexOf(r.newLevel) >
          MASTERY_ORDER.indexOf(r.previousLevel)
      ).length,
      levelDowns: results.filter(
        (r) =>
          MASTERY_ORDER.indexOf(r.newLevel) <
          MASTERY_ORDER.indexOf(r.previousLevel)
      ).length,
      misconceptionCount: analysis.misconceptions.length,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    // Non-critical - just log
    console.error("Failed to record reflection outcome:", error);
  }
}

// ===================================
// Utility Functions
// ===================================

/**
 * Get mastery level from numeric score (0-100).
 */
export function getMasteryLevelFromScore(score: number): MasteryLevel {
  if (score >= 90) return "expert";
  if (score >= 70) return "comfortable";
  if (score >= 45) return "practicing";
  if (score >= 25) return "learning";
  return "exploring";
}

/**
 * Compare two mastery levels.
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareMasteryLevels(
  a: MasteryLevel,
  b: MasteryLevel
): -1 | 0 | 1 {
  const aIndex = MASTERY_ORDER.indexOf(a);
  const bIndex = MASTERY_ORDER.indexOf(b);
  if (aIndex < bIndex) return -1;
  if (aIndex > bIndex) return 1;
  return 0;
}

/**
 * Get the next mastery level (or same if already at max).
 */
export function getNextMasteryLevel(current: MasteryLevel): MasteryLevel {
  const index = MASTERY_ORDER.indexOf(current);
  if (index === -1 || index >= MASTERY_ORDER.length - 1) {
    return current;
  }
  return MASTERY_ORDER[index + 1];
}

/**
 * Get the previous mastery level (or same if already at min).
 */
export function getPreviousMasteryLevel(current: MasteryLevel): MasteryLevel {
  const index = MASTERY_ORDER.indexOf(current);
  if (index <= 0) {
    return current;
  }
  return MASTERY_ORDER[index - 1];
}
