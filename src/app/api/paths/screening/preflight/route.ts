import { NextRequest, NextResponse } from "next/server";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";
import { checkAutoSkip } from "@/lib/ai/prerequisiteScreening";

interface ScreeningPreflightRequest {
  userId?: string;
  goal?: string;
}

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body: ScreeningPreflightRequest = await request.json();

    assertSameUser(body.userId ?? null, authed.uid);

    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    if (!goal) {
      return NextResponse.json({ error: "goal is required" }, { status: 400 });
    }

    const result = await checkAutoSkip(authed.uid, goal);

    return NextResponse.json(
      {
        skipScreening: result.skipScreening,
        reason: result.reason,
      },
      { status: 200 }
    );
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;

    console.error("Error running screening preflight:", error);
    return NextResponse.json(
      {
        error: "Failed to run screening preflight",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
