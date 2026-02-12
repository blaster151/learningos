import { NextRequest, NextResponse } from "next/server";
import { extractConcepts } from "@/lib/ai/conceptExtraction";
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

interface ExtractRequest {
  userId: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  sessionId?: string;
}

// ===================================
// POST - Extract concepts from messages
// ===================================

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body: ExtractRequest = await request.json();
    const { userId: requestedUserId, messages, sessionId } = body;

    assertSameUser(requestedUserId ?? null, authed.uid);
    const userId = authed.uid;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "messages are required" },
        { status: 400 }
      );
    }

    // Extract concepts using AI
    const result = await extractConcepts(messages);

    if (result.concepts.length === 0) {
      return NextResponse.json({ concepts: [], mainTopic: result.mainTopic });
    }

    const db = await getAdminDb();
    const now = Timestamp.now();

    // Save concepts to Firestore and collect full data
    const savedConcepts = await Promise.all(
      result.concepts.map(async (concept) => {
        try {
          // Check if concept exists for this user
          const existing = await db
            .collection("concepts")
            .where("userId", "==", userId)
            .where("name", "==", concept.name.toLowerCase())
            .limit(1)
            .get();

          if (!existing.empty) {
            // Update existing concept
            const doc = existing.docs[0];
            const data = doc.data();
            await doc.ref.update({
              exposureCount: (data.exposureCount || 0) + 1,
              masteryLevel: Math.min(100, (data.masteryLevel || 0) + 3),
              lastPracticed: now,
              updatedAt: now,
              ...(sessionId && {
                sessionIds: [...(data.sessionIds || []), sessionId].slice(-10),
              }),
            });

            return {
              id: doc.id,
              name: data.name,
              displayName: data.displayName || concept.name,
              description: data.description || concept.description,
              category: data.category || concept.category,
              masteryLevel: Math.min(100, (data.masteryLevel || 0) + 3),
            };
          } else {
            // Create new concept (filter out undefined values for Firestore)
            const newConceptData: Record<string, unknown> = {
              userId,
              name: concept.name.toLowerCase(),
              displayName: concept.name,
              description: concept.description || "",
              masteryLevel: Math.round(concept.confidence * 20),
              exposureCount: 1,
              sessionIds: sessionId ? [sessionId] : [],
              lastPracticed: now,
              createdAt: now,
              updatedAt: now,
            };

            if (concept.category) {
              newConceptData.category = concept.category;
            }

            const docRef = await db.collection("concepts").add(newConceptData);

            return {
              id: docRef.id,
              name: newConceptData.name as string,
              displayName: newConceptData.displayName as string,
              description: newConceptData.description as string,
              category: (newConceptData.category as string) || concept.category || "other",
              masteryLevel: newConceptData.masteryLevel as number,
            };
          }
        } catch (err) {
          console.error(`Failed to save concept ${concept.name}:`, err);
          // Return the concept data even if save failed
          return {
            id: `temp-${concept.name}`,
            name: concept.name.toLowerCase(),
            displayName: concept.name,
            description: concept.description,
            category: concept.category,
            masteryLevel: Math.round(concept.confidence * 20),
          };
        }
      })
    );

    return NextResponse.json({
      concepts: savedConcepts,
      mainTopic: result.mainTopic,
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error extracting concepts:", error);
    return NextResponse.json(
      { error: "Failed to extract concepts" },
      { status: 500 }
    );
  }
}
