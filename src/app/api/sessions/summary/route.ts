import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { generateSessionSummary } from "@/lib/ai/sessionSummary";
import { Timestamp } from "firebase-admin/firestore";
import { authErrorResponse, requireAuthUser } from "@/lib/auth/serverAuth";

// ===================================
// Types
// ===================================

interface SummaryRequest {
  sessionId: string;
  userId?: string;
}

// ===================================
// POST - Generate summary for a session
// ===================================

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body: SummaryRequest = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const db = await getAdminDb();

    // Get the session
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();
    if (!sessionDoc.exists) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const sessionData = sessionDoc.data();

    // Always enforce ownership
    if (sessionData?.userId !== authed.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if we already have a cached summary
    if (sessionData?.summary && sessionData?.summaryGeneratedAt) {
      const summaryAge = Date.now() - sessionData.summaryGeneratedAt.toMillis();
      // Use cached summary if less than 5 minutes old
      if (summaryAge < 5 * 60 * 1000) {
        return NextResponse.json({
          ...sessionData.summary,
          cached: true,
        });
      }
    }

    // Get messages for this session
    const messagesSnapshot = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .orderBy("timestamp", "asc")
      .limit(50) // Limit to most recent 50 messages
      .get();

    const messages = messagesSnapshot.docs.map((doc) => ({
      role: doc.data().role as string,
      content: doc.data().content as string,
    }));

    if (messages.length === 0) {
      return NextResponse.json({
        summary: "No messages in this session yet.",
        keyInsights: [],
        conceptsCovered: [],
        suggestedNextSteps: ["Start a conversation to begin learning!"],
        overallProgress: "exploring",
      });
    }

    // Generate summary using AI
    const summary = await generateSessionSummary(messages);

    // Cache the summary in the session document
    await sessionDoc.ref.update({
      summary,
      summaryGeneratedAt: Timestamp.now(),
    });

    return NextResponse.json(summary);
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error generating session summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}

// ===================================
// GET - Get existing summary for a session
// ===================================

export async function GET(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const db = await getAdminDb();
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();

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

    if (!sessionData?.summary) {
      return NextResponse.json(
        { error: "No summary generated yet", needsGeneration: true },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...sessionData.summary,
      generatedAt: sessionData.summaryGeneratedAt?.toDate?.()?.toISOString(),
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error fetching session summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
