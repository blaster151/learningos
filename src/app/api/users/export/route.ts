import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  requireAuthUser,
  authErrorResponse,
} from "@/lib/auth/serverAuth";

// ===================================
// Types
// ===================================

interface ExportData {
  exportedAt: string;
  userId: string;
  profile: Record<string, unknown> | null;
  sessions: Array<{
    session: Record<string, unknown>;
    messages: Record<string, unknown>[];
  }>;
  concepts: Record<string, unknown>[];
  conceptRelations: Record<string, unknown>[];
  reflections: Record<string, unknown>[];
  learningPaths: Record<string, unknown>[];
}

// ===================================
// GET - Export all user data (GDPR)
// ===================================

export async function GET(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");

    // Only allow self-export
    if (requestedUserId && requestedUserId !== authed.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = authed.uid;
    const db = await getAdminDb();

    // 1. Get user profile
    const userDoc = await db.collection("users").doc(userId).get();
    const profile = userDoc.exists ? userDoc.data() ?? null : null;

    // 2. Get sessions with messages
    const sessionsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("sessions")
      .orderBy("startedAt", "desc")
      .get();

    const sessions = await Promise.all(
      sessionsSnap.docs.map(async (sessionDoc) => {
        const messagesSnap = await sessionDoc.ref
          .collection("messages")
          .orderBy("timestamp", "asc")
          .get();

        return {
          session: { id: sessionDoc.id, ...sessionDoc.data() },
          messages: messagesSnap.docs.map((msg) => ({
            id: msg.id,
            ...msg.data(),
          })),
        };
      })
    );

    // 3. Get concepts
    const conceptsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("userConcepts")
      .get();
    const concepts = conceptsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 4. Get concept relations
    const relationsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("conceptRelations")
      .get();
    const conceptRelations = relationsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 5. Get reflections
    const reflectionsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("reflections")
      .get();
    const reflections = reflectionsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 6. Get learning paths
    const pathsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("learningPaths")
      .get();
    const learningPaths = pathsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Build export
    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      userId,
      profile,
      sessions,
      concepts,
      conceptRelations,
      reflections,
      learningPaths,
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="learningos-export-${userId}-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error exporting user data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
