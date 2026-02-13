import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";

// ===================================
// GET - List highlights for a user
// ===================================

export async function GET(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");
    const search = searchParams.get("search");

    assertSameUser(requestedUserId, authed.uid);
    const userId = authed.uid;

    const db = await getAdminDb();
    let query = db
      .collection("highlights")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc");

    if (sessionId) {
      query = query.where("sessionId", "==", sessionId);
    }

    const snapshot = await query.get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let highlights: Record<string, any>[] = snapshot.docs.map((doc) => ({
      highlightId: doc.id,
      ...doc.data(),
    }));

    // Client-side text search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      highlights = highlights.filter(
        (h) =>
          h.text?.toLowerCase().includes(lowerSearch) ||
          h.note?.toLowerCase().includes(lowerSearch)
      );
    }

    return NextResponse.json({ highlights });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error fetching highlights:", error);
    return NextResponse.json(
      { error: "Failed to fetch highlights" },
      { status: 500 }
    );
  }
}

// ===================================
// POST - Create a new highlight
// ===================================

interface CreateHighlightRequest {
  sessionId: string;
  messageId: string;
  text: string;
  startOffset: number;
  endOffset: number;
  note?: string;
}

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body: CreateHighlightRequest = await request.json();
    const { sessionId, messageId, text, startOffset, endOffset, note } = body;

    if (!sessionId || !messageId || !text || startOffset === undefined || endOffset === undefined) {
      return NextResponse.json(
        { error: "sessionId, messageId, text, startOffset, and endOffset are required" },
        { status: 400 }
      );
    }

    const userId = authed.uid;
    const db = await getAdminDb();

    const highlightData = {
      userId,
      sessionId,
      messageId,
      text,
      startOffset,
      endOffset,
      note: note || null,
      createdAt: Timestamp.now(),
    };

    const docRef = await db.collection("highlights").add(highlightData);

    return NextResponse.json({
      highlight: {
        highlightId: docRef.id,
        ...highlightData,
      },
    }, { status: 201 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error creating highlight:", error);
    return NextResponse.json(
      { error: "Failed to create highlight" },
      { status: 500 }
    );
  }
}

// ===================================
// DELETE - Remove a highlight
// ===================================

export async function DELETE(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const highlightId = searchParams.get("highlightId");

    if (!highlightId) {
      return NextResponse.json(
        { error: "highlightId is required" },
        { status: 400 }
      );
    }

    const userId = authed.uid;
    const db = await getAdminDb();
    const docRef = db.collection("highlights").doc(highlightId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Highlight not found" },
        { status: 404 }
      );
    }

    // Ensure the highlight belongs to this user
    if (doc.data()?.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    await docRef.delete();

    return NextResponse.json({ message: "Highlight deleted" });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error deleting highlight:", error);
    return NextResponse.json(
      { error: "Failed to delete highlight" },
      { status: 500 }
    );
  }
}
