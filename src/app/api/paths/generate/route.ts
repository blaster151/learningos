import { NextRequest, NextResponse } from "next/server";
import { generateLearningPath } from "@/lib/ai/pathGeneration";
import { pathsService } from "@/lib/firebase/learningPaths";
import { conceptsService } from "@/lib/firebase/concepts";
import { Timestamp } from "firebase-admin/firestore";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";
import { inferUserLevel } from "@/lib/utils/userLevel";
import { knowledgeProfileService } from "@/lib/firebase/knowledgeProfile";

// ===================================
// Types
// ===================================

interface GeneratePathRequest {
  userId?: string;
  goal: string;
  originalGoal?: string;
  isOverview?: boolean;
  skippedCalibration?: boolean;
  timeAvailableMinutes?: number;
  preferredDepth?: "quick" | "thorough" | "deep";
  declaredKnownConcepts?: string[];
  declaredFamiliarConcepts?: string[];
}

// ===================================
// POST - Generate new learning path
// ===================================

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body: GeneratePathRequest = await request.json();
    const {
      userId: requestedUserId,
      goal,
      originalGoal,
      isOverview,
      skippedCalibration,
      timeAvailableMinutes,
      preferredDepth,
      declaredKnownConcepts,
      declaredFamiliarConcepts,
    } = body;

    assertSameUser(requestedUserId ?? null, authed.uid);
    const userId = authed.uid;

    if (!goal || goal.trim().length < 5) {
      return NextResponse.json(
        { error: "goal is required and must be at least 5 characters" },
        { status: 400 }
      );
    }

    // Get user's existing concepts
    const knownConcepts = await conceptsService.getUserConcepts(userId);

    // Determine user level based on concepts
    const userLevel = inferUserLevel(knownConcepts.length);

    // E18-S6: Load global knowledge profile and merge with declared concepts
    const globalProfile = await knowledgeProfileService.getProfile(userId);
    const profileKnown = globalProfile
      .filter((e) => e.confidence >= 1.0)
      .map((e) => e.concept);
    const profileFamiliar = globalProfile
      .filter((e) => e.confidence >= 0.5 && e.confidence < 1.0)
      .map((e) => e.concept);

    // Merge: explicit pill selections take priority, then fill from global profile
    const mergedKnown = Array.from(
      new Set([...(declaredKnownConcepts || []).filter(Boolean), ...profileKnown])
    );
    const mergedFamiliar = Array.from(
      new Set([...(declaredFamiliarConcepts || []).filter(Boolean), ...profileFamiliar])
    );

    // Generate learning path using AI
    const result = await generateLearningPath({
      userId,
      goal,
      originalGoal,
      isOverview,
      skippedCalibration,
      knownConcepts,
      userLevel,
      declaredKnownConcepts: mergedKnown.length ? mergedKnown : undefined,
      declaredFamiliarConcepts: mergedFamiliar.length ? mergedFamiliar : undefined,
      timeAvailableMinutes,
      preferredDepth: preferredDepth || "thorough",
    });

    if (!result.success || !result.path) {
      return NextResponse.json(
        { error: result.error || "Failed to generate learning path" },
        { status: 500 }
      );
    }

    const generatedPath = result.path;

    // Convert generated path to LearningPath format and resolve concepts
    const milestones = await Promise.all(
      generatedPath.milestones.map(async (milestone, index) => {
        // Find or create concepts for this milestone
        const conceptIds: string[] = [];
        const conceptNames: string[] = [];

        for (const conceptName of milestone.concepts) {
          // Try to find existing concept
          let existingConcept = await conceptsService.findConceptByName(
            userId,
            conceptName
          );

          let conceptId: string;
          if (existingConcept) {
            conceptId = existingConcept.conceptId;
          } else {
            // Create new concept placeholder
            conceptId = await conceptsService.createConcept(userId, {
              name: conceptName.toLowerCase(),
              definition: "", // Will be filled in during learning
              domain: "general", // Will be updated during learning
              userId,
              confidence: 0,
              understanding: 0,
              masteryLevel: "exploring",
              firstEncountered: Timestamp.now(),
              lastReviewed: Timestamp.now(),
              sessionIds: [],
              definitionHistory: [],
              isEmergent: false,
              discoveredBy: "path",
            });
          }

          conceptIds.push(conceptId);
          conceptNames.push(conceptName);
        }

        return {
          milestoneId: `milestone_${Date.now()}_${index}`,
          order: index,
          title: milestone.title,
          description: milestone.description,
          conceptIds,
          conceptNames,
          estimatedMinutes: milestone.estimatedMinutes,
          objectives: milestone.objectives,
          status: "not_started" as const,
          progress: 0,
          prerequisiteMilestoneIds: milestone.prerequisites.map(
            (prereqIndex) => `milestone_${Date.now()}_${prereqIndex}`
          ),
        };
      })
    );

    // Create the learning path
    const pathId = await pathsService.createPath(userId, {
      userId,
      title: generatedPath.title,
      description: generatedPath.description,
      goal,
      milestones,
      estimatedMinutes: generatedPath.estimatedMinutes,
      status: "suggested",
      progress: 0,
      currentMilestoneIndex: 0,
      generatedFrom: {
        userGoal: goal,
        knownConceptIds: knownConcepts.map((c) => c.conceptId),
        userLevel,
        ...(originalGoal ? { originalGoal } : {}),
        ...(isOverview ? { isOverview } : {}),
        ...(skippedCalibration ? { skippedCalibration } : {}),
        ...(declaredKnownConcepts?.length
          ? { declaredKnownConcepts: declaredKnownConcepts.filter(Boolean) }
          : {}),
        ...(declaredFamiliarConcepts?.length
          ? { declaredFamiliarConcepts: declaredFamiliarConcepts.filter(Boolean) }
          : {}),
        ...(globalProfile.length
          ? {
              knowledgeProfileSnapshot: globalProfile.map((e) => ({
                concept: e.concept,
                confidence: e.confidence,
              })),
            }
          : {}),
      },
      createdAt: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
    });

    // Fetch the created path to return
    const createdPath = await pathsService.getPath(userId, pathId);

    return NextResponse.json({
      pathId,
      path: createdPath,
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error generating learning path:", error);
    return NextResponse.json(
      {
        error: "Failed to generate learning path",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
