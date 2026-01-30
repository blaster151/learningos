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
    const before = searchParams.get("before"); // For pagination

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
    
    let query = db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .orderBy("timestamp", "desc")
      .limit(limit);

    // Add pagination if "before" cursor provided
    if (before) {
      const beforeDoc = await db.collection("messages").doc(before).get();
      if (beforeDoc.exists) {
        query = query.startAfter(beforeDoc);
      }
    }

    const messagesSnapshot = await query.get();

    // Reverse to get chronological order
    const messages = messagesSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate?.()?.toISOString(),
          conceptIds: data.conceptIds || [],
        };
      })
      .reverse();

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
