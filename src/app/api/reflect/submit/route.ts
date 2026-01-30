/**
 * Reflection Submit API
 * POST /api/reflect/submit
 * 
 * Handles reflection submission, analysis, and mastery updates.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import {
  analyzeReflection,
  generateMasteryRecommendations,
} from "@/lib/ai/reflectionAnalyzer";
import { updateMasteryFromReflection } from "@/lib/reflection/updateMasteryFromReflection";
import type { ConceptNode, MasteryLevel } from "@/types";
import type { GeneratedPrompt } from "@/lib/ai/reflectionPrompt";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";

// ===================================
// Types
// ===================================

interface ReflectionSubmitRequest {
  userId: string;
  promptId: string;
  reflectionContent: string;
  sessionId?: string;
}

interface ReflectionSubmitResponse {
  success: boolean;
  reflectionId: string;
  analysis: {
    overallScore: number;
    strengths: string[];
    suggestions: string[];
    misconceptions: Array<{
      claim: string;
      correction: string;
      severity: "minor" | "significant";
    }>;
    encouragement: string;
  };
  masteryUpdates: Array<{
    conceptId: string;
    conceptName: string;
    previousLevel: MasteryLevel;
    newLevel: MasteryLevel;
    changed: boolean;
  }>;
  error?: string;
}

// ===================================
// POST - Submit reflection for analysis
// ===================================

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body: ReflectionSubmitRequest = await request.json();
    const { userId: requestedUserId, promptId, reflectionContent, sessionId } = body;

    assertSameUser(requestedUserId ?? null, authed.uid);
    const userId = authed.uid;

    // Validate input
    if (!userId || !promptId || !reflectionContent) {
      return NextResponse.json(
        { error: "userId, promptId, and reflectionContent are required" },
        { status: 400 }
      );
    }

    if (reflectionContent.trim().length < 20) {
      return NextResponse.json(
        { error: "Reflection is too short. Please write at least a few sentences." },
        { status: 400 }
      );
    }

    const db = await getAdminDb();

    // Fetch the prompt to get concept context
    const promptDoc = await db.collection("reflection_prompts").doc(promptId).get();

    if (!promptDoc.exists) {
      return NextResponse.json(
        { error: "Prompt not found" },
        { status: 404 }
      );
    }

    const promptData = promptDoc.data();

    // Verify ownership
    if (promptData?.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Fetch concept definitions
    const conceptIds: string[] = promptData?.focusConceptIds || [];
    const conceptDefinitions: Array<{
      conceptId: string;
      name: string;
      definition: string;
      currentMastery: MasteryLevel;
    }> = [];

    const conceptsMap = new Map<string, ConceptNode>();

    for (const conceptId of conceptIds) {
      const conceptDoc = await db.collection("concepts").doc(conceptId).get();
      if (conceptDoc.exists) {
        const conceptData = conceptDoc.data();
        const concept: ConceptNode = {
          conceptId: conceptDoc.id,
          ...conceptData,
        } as ConceptNode;
        
        conceptsMap.set(conceptId, concept);
        conceptDefinitions.push({
          conceptId,
          name: conceptData?.name || "Unknown",
          definition: conceptData?.definition || conceptData?.description || "",
          currentMastery: conceptData?.masteryLevel || "exploring",
        });
      }
    }

    // Create reflection document first
    const reflectionRef = await db.collection("reflections").add({
      userId,
      promptId,
      content: reflectionContent,
      sessionId: sessionId || null,
      conceptIds,
      status: "analyzing",
      createdAt: Timestamp.now(),
    });

    const reflectionId = reflectionRef.id;

    // Build prompt object for analysis
    const prompt: GeneratedPrompt = {
      promptId,
      sessionId: sessionId || "",
      promptText: promptData?.promptText || "",
      hints: promptData?.hints || [],
      conceptsToAddress: conceptIds,
      minWords: promptData?.minWords || 30,
      maxWords: promptData?.maxWords || 200,
    };

    // Analyze the reflection
    const analysisResult = await analyzeReflection({
      userId,
      reflectionId,
      reflectionContent,
      prompt,
      conceptDefinitions,
    });

    if (!analysisResult.success || !analysisResult.analysis) {
      // Update reflection status
      await reflectionRef.update({
        status: "failed",
        error: analysisResult.error,
      });

      return NextResponse.json(
        {
          success: false,
          reflectionId,
          error: analysisResult.error || "Failed to analyze reflection",
        },
        { status: 500 }
      );
    }

    const analysis = analysisResult.analysis;

    // Generate mastery recommendations
    const currentConcepts = Array.from(conceptsMap.values()).map((c) => ({
      conceptId: c.conceptId,
      masteryLevel: c.masteryLevel,
      confidence: c.confidence,
    }));

    const recommendations = generateMasteryRecommendations(
      analysis,
      currentConcepts
    );

    // Update mastery levels
    const updateResult = await updateMasteryFromReflection({
      userId,
      reflectionId,
      analysis,
      recommendations,
    });

    // Store analysis results
    await reflectionRef.update({
      status: "completed",
      analysis: {
        overallScore: analysis.overallScore,
        strengths: analysis.strengths,
        suggestions: analysis.suggestions,
        misconceptions: analysis.misconceptions,
        conceptAssessments: analysis.conceptAssessments,
        encouragement: analysis.encouragement,
      },
      masteryUpdates: updateResult.updatedConcepts,
      completedAt: Timestamp.now(),
    });

    // Update prompt status
    await promptDoc.ref.update({
      status: "completed",
      reflectionId,
      completedAt: Timestamp.now(),
    });

    // Build response
    const masteryUpdates = updateResult.updatedConcepts.map((update) => {
      const concept = conceptsMap.get(update.conceptId);
      return {
        conceptId: update.conceptId,
        conceptName: concept?.name || "Unknown",
        previousLevel: update.previousLevel,
        newLevel: update.newLevel,
        changed: update.changed,
      };
    });

    const response: ReflectionSubmitResponse = {
      success: true,
      reflectionId,
      analysis: {
        overallScore: analysis.overallScore,
        strengths: analysis.strengths,
        suggestions: analysis.suggestions,
        misconceptions: analysis.misconceptions.map((m) => ({
          claim: m.claim,
          correction: m.correction,
          severity: m.severity,
        })),
        encouragement: analysis.encouragement,
      },
      masteryUpdates,
    };

    return NextResponse.json(response);
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error processing reflection:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process reflection",
      },
      { status: 500 }
    );
  }
}

// ===================================
// GET - Fetch reflection history
// ===================================

export async function GET(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const requestedUserId = request.nextUrl.searchParams.get("userId");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10");

    assertSameUser(requestedUserId, authed.uid);
    const userId = authed.uid;

    const db = await getAdminDb();

    const reflectionsSnapshot = await db
      .collection("reflections")
      .where("userId", "==", userId)
      .where("status", "==", "completed")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const reflections = reflectionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        reflectionId: doc.id,
        promptId: data.promptId,
        content: data.content,
        overallScore: data.analysis?.overallScore,
        conceptCount: data.conceptIds?.length || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString(),
      };
    });

    return NextResponse.json({ reflections });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error fetching reflections:", error);
    return NextResponse.json(
      { error: "Failed to fetch reflections" },
      { status: 500 }
    );
  }
}
