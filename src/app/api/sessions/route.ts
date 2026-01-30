import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";

// ===================================
// Types
// ===================================

interface CreateSessionRequest {
  userId: string;
  topic?: string;
  goal?: string;
}

// ===================================
// POST - Create new learning session
// ===================================

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body: CreateSessionRequest = await request.json();

    assertSameUser(body.userId ?? null, authed.uid);
    const userId = authed.uid;
    const { topic, goal } = body;

    const db = await getAdminDb();
    const now = Timestamp.now();

    // Create new session
    const sessionData = {
      userId,
      topic: topic || "General Learning",
      goal: goal || null,
      startedAt: now,
      lastActivity: now,
      messageCount: 0,
      conceptsCovered: [],
      status: "active",
    };

    const sessionRef = await db.collection("sessions").add(sessionData);

    // Update user's total sessions
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const currentSessions = userDoc.data()?.totalSessions || 0;
      await userRef.update({
        totalSessions: currentSessions + 1,
        lastLoginAt: now,
      });
    }

    return NextResponse.json({
      sessionId: sessionRef.id,
      ...sessionData,
      startedAt: now.toDate().toISOString(),
      lastActivity: now.toDate().toISOString(),
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

// ===================================
// GET - Get session(s) for user
// ===================================

export async function GET(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    assertSameUser(requestedUserId, authed.uid);
    const userId = authed.uid;

    const db = await getAdminDb();

    // Get specific session
    if (sessionId) {
      const sessionDoc = await db.collection("sessions").doc(sessionId).get();
      
      if (!sessionDoc.exists) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      const data = sessionDoc.data();

      if (data?.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({
        session: {
          sessionId: sessionDoc.id,
          ...data,
          startedAt: data?.startedAt?.toDate?.()?.toISOString(),
          lastActivity: data?.lastActivity?.toDate?.()?.toISOString(),
          endedAt: data?.endedAt?.toDate?.()?.toISOString(),
        },
      });
    }

    // Get all sessions for user
    const sessionsSnapshot = await db
      .collection("sessions")
      .where("userId", "==", userId)
      .orderBy("lastActivity", "desc")
      .limit(20)
      .get();

    const sessions = sessionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        sessionId: doc.id,
        ...data,
        startedAt: data.startedAt?.toDate?.()?.toISOString(),
        lastActivity: data.lastActivity?.toDate?.()?.toISOString(),
        endedAt: data.endedAt?.toDate?.()?.toISOString(),
      };
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// ===================================
// PATCH - Update session (end, update topic, etc.)
// ===================================

export async function PATCH(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const body = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const db = await getAdminDb();
    const sessionRef = db.collection("sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const sessionData = sessionDoc.data();
    if (sessionData?.userId !== authed.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, unknown> = {
      lastActivity: Timestamp.now(),
    };

    if (body.topic) updates.topic = body.topic;
    if (body.goal) updates.goal = body.goal;
    if (body.status) {
      updates.status = body.status;
      if (body.status === "completed" || body.status === "abandoned") {
        updates.endedAt = Timestamp.now();
      }
    }
    if (body.conceptsCovered) updates.conceptsCovered = body.conceptsCovered;

    await sessionRef.update(updates);

    return NextResponse.json({
      message: "Session updated successfully",
      sessionId,
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
