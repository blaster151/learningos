/**
 * Graph Concept Detail API
 * GET /api/graph/concepts/[conceptId]
 * 
 * Returns detailed concept information for graph visualization,
 * including related concepts, learning sessions, and mastery history.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import type { ConceptNode, ConceptRelation, MasteryLevel } from "@/types";

// ===================================
// Types
// ===================================

interface RelatedConceptInfo {
  conceptId: string;
  name: string;
  domain?: string;
  masteryLevel: MasteryLevel;
  relationType: string;
  direction: "incoming" | "outgoing";
  strength: number;
}

interface SessionReference {
  sessionId: string;
  title: string;
  messageCount: number;
  timestamp: string;
}

interface MasteryHistoryPoint {
  level: MasteryLevel;
  confidence: number;
  timestamp: string;
  source: "session" | "reflection" | "manual";
}

interface ConceptDetailResponse {
  concept: ConceptNode;
  relatedConcepts: RelatedConceptInfo[];
  recentSessions: SessionReference[];
  masteryHistory: MasteryHistoryPoint[];
  statistics: {
    totalSessions: number;
    totalReflections: number;
    daysSinceLastReview: number;
    averageSessionTime: number;
  };
}

// ===================================
// GET - Fetch concept details for graph
// ===================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conceptId: string }> }
) {
  try {
    const { conceptId } = await params;

    // Get userId from query params or auth (simplified for now)
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!conceptId) {
      return NextResponse.json(
        { error: "conceptId is required" },
        { status: 400 }
      );
    }

    const db = await getAdminDb();

    // Fetch the concept
    const conceptDoc = await db.collection("concepts").doc(conceptId).get();

    if (!conceptDoc.exists) {
      return NextResponse.json(
        { error: "Concept not found" },
        { status: 404 }
      );
    }

    const conceptData = conceptDoc.data();

    // Verify ownership
    if (conceptData?.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const concept: ConceptNode = {
      conceptId: conceptDoc.id,
      ...(conceptData as Omit<ConceptNode, "conceptId">),
    };

    // Fetch related concepts via relations
    const relatedConcepts = await fetchRelatedConcepts(db, userId, conceptId);

    // Fetch recent sessions where this concept was discussed
    const recentSessions = await fetchRecentSessions(db, userId, conceptId);

    // Fetch mastery history
    const masteryHistory = await fetchMasteryHistory(db, userId, conceptId);

    // Calculate statistics
    const statistics = await calculateStatistics(
      db,
      userId,
      conceptId,
      concept
    );

    const response: ConceptDetailResponse = {
      concept,
      relatedConcepts,
      recentSessions,
      masteryHistory,
      statistics,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching concept details:", error);
    return NextResponse.json(
      { error: "Failed to fetch concept details" },
      { status: 500 }
    );
  }
}

// ===================================
// Helper Functions
// ===================================

async function fetchRelatedConcepts(
  db: FirebaseFirestore.Firestore,
  userId: string,
  conceptId: string
): Promise<RelatedConceptInfo[]> {
  const relatedConcepts: RelatedConceptInfo[] = [];

  // Get outgoing relations
  const outgoingSnapshot = await db
    .collection("concept_relations")
    .where("userId", "==", userId)
    .where("sourceConceptId", "==", conceptId)
    .get();

  // Get incoming relations
  const incomingSnapshot = await db
    .collection("concept_relations")
    .where("userId", "==", userId)
    .where("targetConceptId", "==", conceptId)
    .get();

  // Collect all related concept IDs
  const relatedConceptIds = new Set<string>();
  const relationMap = new Map<string, { relationType: string; direction: "incoming" | "outgoing"; strength: number }>();

  for (const doc of outgoingSnapshot.docs) {
    const data = doc.data() as ConceptRelation;
    relatedConceptIds.add(data.targetConceptId);
    relationMap.set(data.targetConceptId, {
      relationType: data.relationType,
      direction: "outgoing",
      strength: data.strength,
    });
  }

  for (const doc of incomingSnapshot.docs) {
    const data = doc.data() as ConceptRelation;
    relatedConceptIds.add(data.sourceConceptId);
    // Don't overwrite if we already have an outgoing relation
    if (!relationMap.has(data.sourceConceptId)) {
      relationMap.set(data.sourceConceptId, {
        relationType: data.relationType,
        direction: "incoming",
        strength: data.strength,
      });
    }
  }

  // Fetch concept details for all related concepts
  for (const relatedId of relatedConceptIds) {
    const relatedDoc = await db.collection("concepts").doc(relatedId).get();
    if (relatedDoc.exists) {
      const relatedData = relatedDoc.data();
      const relationInfo = relationMap.get(relatedId)!;
      
      relatedConcepts.push({
        conceptId: relatedId,
        name: relatedData?.name || "Unknown",
        domain: relatedData?.domain,
        masteryLevel: relatedData?.masteryLevel || "exploring",
        relationType: relationInfo.relationType,
        direction: relationInfo.direction,
        strength: relationInfo.strength,
      });
    }
  }

  return relatedConcepts;
}

async function fetchRecentSessions(
  db: FirebaseFirestore.Firestore,
  userId: string,
  conceptId: string
): Promise<SessionReference[]> {
  // Query session_concepts junction to find sessions with this concept
  const sessionConceptsSnapshot = await db
    .collection("session_concepts")
    .where("userId", "==", userId)
    .where("conceptId", "==", conceptId)
    .orderBy("timestamp", "desc")
    .limit(10)
    .get();

  const sessions: SessionReference[] = [];
  const seenSessionIds = new Set<string>();

  for (const doc of sessionConceptsSnapshot.docs) {
    const data = doc.data();
    const sessionId = data.sessionId;

    if (seenSessionIds.has(sessionId)) continue;
    seenSessionIds.add(sessionId);

    // Fetch session details
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();
    if (sessionDoc.exists) {
      const sessionData = sessionDoc.data();
      sessions.push({
        sessionId,
        title: sessionData?.title || "Untitled Session",
        messageCount: sessionData?.messageCount || 0,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    }
  }

  return sessions;
}

async function fetchMasteryHistory(
  db: FirebaseFirestore.Firestore,
  userId: string,
  conceptId: string
): Promise<MasteryHistoryPoint[]> {
  // Query mastery_history collection
  const historySnapshot = await db
    .collection("mastery_history")
    .where("userId", "==", userId)
    .where("conceptId", "==", conceptId)
    .orderBy("timestamp", "desc")
    .limit(20)
    .get();

  return historySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      level: data.level || "exploring",
      confidence: data.confidence || 0,
      timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
      source: data.source || "session",
    };
  });
}

async function calculateStatistics(
  db: FirebaseFirestore.Firestore,
  userId: string,
  conceptId: string,
  concept: ConceptNode
): Promise<ConceptDetailResponse["statistics"]> {
  // Count sessions
  const sessionsSnapshot = await db
    .collection("session_concepts")
    .where("userId", "==", userId)
    .where("conceptId", "==", conceptId)
    .get();

  const totalSessions = new Set(
    sessionsSnapshot.docs.map((doc) => doc.data().sessionId)
  ).size;

  // Count reflections
  const reflectionsSnapshot = await db
    .collection("reflections")
    .where("userId", "==", userId)
    .where("conceptIds", "array-contains", conceptId)
    .get();

  const totalReflections = reflectionsSnapshot.size;

  // Calculate days since last review
  let daysSinceLastReview = 0;
  if (concept.lastReviewed) {
    // Handle both Timestamp and Date objects
    let lastReviewDate: Date;
    if (typeof concept.lastReviewed === "object" && "toDate" in concept.lastReviewed) {
      lastReviewDate = (concept.lastReviewed as any).toDate();
    } else {
      lastReviewDate = new Date(concept.lastReviewed as unknown as string);
    }
    const now = new Date();
    daysSinceLastReview = Math.floor(
      (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Average session time (simplified - would need actual session duration tracking)
  const averageSessionTime = 15; // Default 15 minutes

  return {
    totalSessions,
    totalReflections,
    daysSinceLastReview,
    averageSessionTime,
  };
}
