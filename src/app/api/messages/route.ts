import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { authErrorResponse, requireAuthUser } from "@/lib/auth/serverAuth";

// ===================================
// GET - Get messages for a session
// ===================================

export async function GET(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const db = await getAdminDb();

    // Verify session ownership to prevent IDOR
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();
    if (!sessionDoc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (sessionDoc.data()?.userId !== authed.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const query = db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .limit(limit);

    const messagesSnapshot = await query.get();

    // Sort in JS to avoid needing a Firestore composite index
    const messages = messagesSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || null,
          conceptIds: data.conceptIds || [],
        };
      })
      .sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

    return NextResponse.json({
      messages,
      hasMore: messagesSnapshot.docs.length === limit,
      nextCursor: messagesSnapshot.docs.length > 0 
        ? messagesSnapshot.docs[messagesSnapshot.docs.length - 1].id 
        : null,
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
