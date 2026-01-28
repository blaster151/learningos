import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

// ===================================
// GET - Get messages for a session
// ===================================

export async function GET(request: NextRequest) {
  try {
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
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
