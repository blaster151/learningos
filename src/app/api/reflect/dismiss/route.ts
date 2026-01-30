/**
 * Reflection Dismiss API
 * POST /api/reflect/dismiss
 * 
 * Records when user dismisses a reflection prompt (for cooldown tracking)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body = await request.json();
    const { userId: requestedUserId, sessionId } = body;

    assertSameUser(requestedUserId ?? null, authed.uid);
    const userId = authed.uid;

    const db = await getAdminDb();

    // Record dismissal
    await db.collection("reflection_dismissals").add({
      userId,
      sessionId: sessionId || null,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error recording reflection dismissal:", error);
    return NextResponse.json(
      { error: "Failed to record dismissal" },
      { status: 500 }
    );
  }
}
