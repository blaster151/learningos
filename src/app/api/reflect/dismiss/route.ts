/**
 * Reflection Dismiss API
 * POST /api/reflect/dismiss
 * 
 * Records when user dismisses a reflection prompt (for cooldown tracking)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const db = await getAdminDb();

    // Record dismissal
    await db.collection("reflection_dismissals").add({
      userId,
      sessionId: sessionId || null,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording reflection dismissal:", error);
    return NextResponse.json(
      { error: "Failed to record dismissal" },
      { status: 500 }
    );
  }
}
