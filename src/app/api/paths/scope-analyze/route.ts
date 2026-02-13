import { NextRequest, NextResponse } from "next/server";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";
import { conceptsService } from "@/lib/firebase/concepts";
import { analyzeTopicScope } from "@/lib/ai/scopeAnalysis";
import { inferUserLevel } from "@/lib/utils/userLevel";

interface ScopeAnalyzeRequest {
  userId?: string;
  goal: string;
}

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body: ScopeAnalyzeRequest = await request.json();
    const { userId: requestedUserId, goal } = body;

    assertSameUser(requestedUserId ?? null, authed.uid);
    const userId = authed.uid;

    if (!goal || goal.trim().length < 5) {
      return NextResponse.json(
        { error: "goal is required and must be at least 5 characters" },
        { status: 400 }
      );
    }

    const knownConcepts = await conceptsService.getUserConcepts(userId);
    const userLevel = inferUserLevel(knownConcepts.length);

    const analysis = await analyzeTopicScope({
      userId,
      goal,
      userLevel,
      knownConceptCount: knownConcepts.length,
    });

    return NextResponse.json({ analysis }, { status: 200 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;

    console.error("Error analyzing scope:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze scope",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
