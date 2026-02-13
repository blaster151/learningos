import { NextRequest, NextResponse } from "next/server";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";
import { conceptsService } from "@/lib/firebase/concepts";
import { getCalibrationWave2 } from "@/lib/ai/calibrationWave2";
import { inferUserLevel } from "@/lib/utils/userLevel";
import type { CalibrationPill } from "@/types";

interface Wave2Request {
  userId?: string;
  goal: string;
  wave1Pills: CalibrationPill[];
  knownConcepts: string[];
  familiarConcepts: string[];
}

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body: Wave2Request = await request.json();
    const {
      userId: requestedUserId,
      goal,
      wave1Pills,
      knownConcepts,
      familiarConcepts,
    } = body;

    assertSameUser(requestedUserId ?? null, authed.uid);
    const userId = authed.uid;

    if (!goal || goal.trim().length < 5) {
      return NextResponse.json(
        { error: "goal is required and must be at least 5 characters" },
        { status: 400 }
      );
    }

    if (!Array.isArray(wave1Pills) || wave1Pills.length === 0) {
      return NextResponse.json(
        { error: "wave1Pills array is required and must not be empty" },
        { status: 400 }
      );
    }

    const userConcepts = await conceptsService.getUserConcepts(userId);
    const userLevel = inferUserLevel(userConcepts.length);

    const result = await getCalibrationWave2({
      userId,
      goal,
      userLevel,
      wave1Pills,
      knownConcepts: knownConcepts || [],
      familiarConcepts: familiarConcepts || [],
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;

    console.error("Error generating calibration wave 2:", error);
    return NextResponse.json(
      {
        error: "Failed to generate calibration wave 2",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
