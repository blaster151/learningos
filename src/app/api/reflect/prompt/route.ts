/**
 * Reflection Prompt API
 * GET /api/reflect/prompt
 * 
 * Checks if reflection should be triggered and generates a personalized prompt.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { shouldTriggerReflection } from "@/lib/reflection/shouldTriggerReflection";
import { generateReflectionPrompt, type GeneratedPrompt } from "@/lib/ai/reflectionPrompt";
import type { ConceptNode, LearningSession } from "@/types";

// ===================================
// Types
// ===================================

interface ReflectionPromptResponse {
  shouldReflect: boolean;
  reason?: string;
  prompt?: GeneratedPrompt;
}

// ===================================
// GET - Check if reflection needed and get prompt
// ===================================

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const db = await getAdminDb();

    // Get user preferences
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const reflectionFrequency = userData?.preferences?.reflectionFrequency || "moderate";
    const reflectionEnabled = userData?.preferences?.reflectionEnabled !== false;

    // Get session data
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();
    if (!sessionDoc.exists) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const sessionData = sessionDoc.data();
    const session: LearningSession = {
      sessionId: sessionDoc.id,
      userId: sessionData?.userId,
      startedAt: sessionData?.startedAt || sessionData?.createdAt,
      lastActivity: sessionData?.lastActivity || sessionData?.updatedAt || Timestamp.now(),
      topic: sessionData?.topic || "",
      messageCount: sessionData?.messageCount || 0,
      conceptsCovered: sessionData?.conceptsCovered || [],
      conceptsLearned: sessionData?.conceptsLearned || [],
      conceptsReviewed: sessionData?.conceptsReviewed || [],
      status: sessionData?.status || "active",
    } as LearningSession;

    // Get concepts from this session
    const conceptsSnapshot = await db
      .collection("session_concepts")
      .where("sessionId", "==", sessionId)
      .get();
    
    const sessionConceptIds = conceptsSnapshot.docs.map((doc) => doc.data().conceptId);

    // Get last reflection time
    const lastReflectionSnapshot = await db
      .collection("reflections")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    const lastReflectionTime = lastReflectionSnapshot.empty
      ? null
      : lastReflectionSnapshot.docs[0].data().createdAt;

    // Get last dismissal time
    const lastDismissalSnapshot = await db
      .collection("reflection_dismissals")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    const recentDismissalTime = lastDismissalSnapshot.empty
      ? null
      : lastDismissalSnapshot.docs[0].data().createdAt;

    // Check if we should trigger reflection
    const triggerResult = shouldTriggerReflection({
      session,
      conceptsCoveredCount: sessionConceptIds.length || session.conceptsCovered?.length || 0,
      messageCount: session.messageCount,
      lastReflectionTime,
      recentDismissalTime,
      userPreferences: {
        reflectionFrequency: reflectionFrequency as "often" | "moderate" | "rarely",
        reflectionEnabled,
      },
    });

    if (!triggerResult.shouldTrigger) {
      const response: ReflectionPromptResponse = {
        shouldReflect: false,
        reason: triggerResult.reason,
      };
      return NextResponse.json(response);
    }

    // Get concepts for reflection (prioritize recent and low-confidence)
    const conceptsForReflection = await getConceptsForReflection(
      db,
      userId,
      sessionConceptIds
    );

    if (conceptsForReflection.length === 0) {
      const response: ReflectionPromptResponse = {
        shouldReflect: false,
        reason: "No concepts available for reflection",
      };
      return NextResponse.json(response);
    }

    // Determine user level from concepts
    const avgConfidence = conceptsForReflection.reduce((sum, c) => sum + (c.confidence || 0.5), 0) / conceptsForReflection.length;
    const userLevel: "beginner" | "intermediate" | "advanced" = 
      avgConfidence < 0.4 ? "beginner" : avgConfidence < 0.7 ? "intermediate" : "advanced";

    // Count previous reflections
    const reflectionCountSnapshot = await db
      .collection("reflections")
      .where("userId", "==", userId)
      .count()
      .get();
    const previousReflectionCount = reflectionCountSnapshot.data().count;

    // Generate personalized prompt
    const promptResult = await generateReflectionPrompt({
      userId,
      sessionId,
      sessionTopic: session.topic,
      conceptsCovered: conceptsForReflection,
      userLevel,
      previousReflectionCount,
    });

    if (!promptResult.success || !promptResult.prompt) {
      // Use fallback prompt
      const fallbackPrompt: GeneratedPrompt = {
        promptId: `prompt_${Date.now()}`,
        sessionId,
        promptText: `Take a moment to reflect on what you've learned. How would you explain ${conceptsForReflection[0].name} to a friend?`,
        hints: ["Think about the key points", "Consider how concepts connect"],
        conceptsToAddress: conceptsForReflection.map((c) => c.conceptId),
        minWords: 30,
        maxWords: 100,
      };

      // Store the prompt
      await storePrompt(db, userId, fallbackPrompt, conceptsForReflection);

      const response: ReflectionPromptResponse = {
        shouldReflect: true,
        prompt: fallbackPrompt,
      };
      return NextResponse.json(response);
    }

    // Store the prompt for later reference
    await storePrompt(db, userId, promptResult.prompt, conceptsForReflection);

    const response: ReflectionPromptResponse = {
      shouldReflect: true,
      prompt: promptResult.prompt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating reflection prompt:", error);
    return NextResponse.json(
      { error: "Failed to generate reflection prompt" },
      { status: 500 }
    );
  }
}

// ===================================
// Helper Functions
// ===================================

async function getConceptsForReflection(
  db: FirebaseFirestore.Firestore,
  userId: string,
  priorityConceptIds: string[]
): Promise<ConceptNode[]> {
  const concepts: ConceptNode[] = [];
  const maxConcepts = 5;

  // First, add priority concepts (from current session)
  for (const conceptId of priorityConceptIds.slice(0, 3)) {
    const conceptDoc = await db.collection("concepts").doc(conceptId).get();
    if (conceptDoc.exists) {
      const data = conceptDoc.data();
      concepts.push({
        conceptId: conceptDoc.id,
        ...(data as Omit<ConceptNode, "conceptId">),
      });
    }
  }

  // Add recent concepts that haven't been reflected on much
  if (concepts.length < maxConcepts) {
    const recentConceptsSnapshot = await db
      .collection("concepts")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    for (const doc of recentConceptsSnapshot.docs) {
      if (concepts.length >= maxConcepts) break;
      if (concepts.some((c) => c.conceptId === doc.id)) continue;

      const data = doc.data();
      // Prioritize lower mastery concepts
      if (
        data.masteryLevel === "exploring" ||
        data.masteryLevel === "learning"
      ) {
        concepts.push({
          conceptId: doc.id,
          ...(data as Omit<ConceptNode, "conceptId">),
        });
      }
    }
  }

  return concepts;
}

async function storePrompt(
  db: FirebaseFirestore.Firestore,
  userId: string,
  prompt: GeneratedPrompt,
  concepts: ConceptNode[]
): Promise<void> {
  try {
    await db.collection("reflection_prompts").doc(prompt.promptId).set({
      userId,
      sessionId: prompt.sessionId,
      promptText: prompt.promptText,
      hints: prompt.hints,
      conceptsToAddress: prompt.conceptsToAddress,
      minWords: prompt.minWords,
      maxWords: prompt.maxWords,
      conceptNames: concepts.map((c) => c.name),
      status: "pending",
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Failed to store prompt:", error);
    // Non-critical error - continue
  }
}
