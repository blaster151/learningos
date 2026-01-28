import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

// ===================================
// Types
// ===================================

interface Concept {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  category?: string;
  masteryLevel: number; // 0-100
  exposureCount: number;
  lastPracticed?: string;
  relatedConcepts?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ===================================
// POST - Create or update a concept
// ===================================

export async function POST(request: NextRequest) {
  try {
    const body: Concept = await request.json();
    const { userId, name, description, category, masteryLevel = 0, relatedConcepts = [] } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "userId and name are required" },
        { status: 400 }
      );
    }

    const db = await getAdminDb();
    const now = Timestamp.now();

    // Check if concept already exists for this user
    const existingQuery = await db
      .collection("concepts")
      .where("userId", "==", userId)
      .where("name", "==", name.toLowerCase())
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      // Update existing concept - increment exposure and update mastery
      const existingDoc = existingQuery.docs[0];
      const existingData = existingDoc.data();
      
      await existingDoc.ref.update({
        exposureCount: (existingData.exposureCount || 0) + 1,
        masteryLevel: Math.min(100, (existingData.masteryLevel || 0) + 5), // Increase by 5 each exposure
        lastPracticed: now,
        updatedAt: now,
        ...(description && { description }),
        ...(category && { category }),
      });

      const updatedDoc = await existingDoc.ref.get();
      return NextResponse.json({
        id: existingDoc.id,
        ...updatedDoc.data(),
        lastPracticed: updatedDoc.data()?.lastPracticed?.toDate?.()?.toISOString(),
        createdAt: updatedDoc.data()?.createdAt?.toDate?.()?.toISOString(),
        updatedAt: updatedDoc.data()?.updatedAt?.toDate?.()?.toISOString(),
      });
    }

    // Create new concept
    const conceptData = {
      userId,
      name: name.toLowerCase(),
      displayName: name,
      description: description || "",
      category: category || "general",
      masteryLevel,
      exposureCount: 1,
      relatedConcepts,
      lastPracticed: now,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("concepts").add(conceptData);

    return NextResponse.json({
      id: docRef.id,
      ...conceptData,
      lastPracticed: now.toDate().toISOString(),
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating concept:", error);
    return NextResponse.json(
      { error: "Failed to create/update concept" },
      { status: 500 }
    );
  }
}

// ===================================
// GET - Get concepts for a user
// ===================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "masteryLevel"; // masteryLevel, lastPracticed, name

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const db = await getAdminDb();
    
    let query = db
      .collection("concepts")
      .where("userId", "==", userId);

    if (category) {
      query = query.where("category", "==", category);
    }

    // Apply sorting
    if (sortBy === "masteryLevel") {
      query = query.orderBy("masteryLevel", "desc");
    } else if (sortBy === "lastPracticed") {
      query = query.orderBy("lastPracticed", "desc");
    } else if (sortBy === "name") {
      query = query.orderBy("displayName", "asc");
    }

    query = query.limit(limit);

    const snapshot = await query.get();

    const concepts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.displayName || data.name,
        description: data.description,
        category: data.category,
        masteryLevel: data.masteryLevel,
        exposureCount: data.exposureCount,
        lastPracticed: data.lastPracticed?.toDate?.()?.toISOString(),
        relatedConcepts: data.relatedConcepts,
        createdAt: data.createdAt?.toDate?.()?.toISOString(),
      };
    });

    // Calculate summary stats
    const totalConcepts = concepts.length;
    const avgMastery = totalConcepts > 0 
      ? Math.round(concepts.reduce((sum, c) => sum + c.masteryLevel, 0) / totalConcepts)
      : 0;
    const masteredCount = concepts.filter(c => c.masteryLevel >= 80).length;
    const learningCount = concepts.filter(c => c.masteryLevel >= 30 && c.masteryLevel < 80).length;
    const newCount = concepts.filter(c => c.masteryLevel < 30).length;

    return NextResponse.json({
      concepts,
      stats: {
        total: totalConcepts,
        avgMastery,
        mastered: masteredCount,
        learning: learningCount,
        new: newCount,
      },
    });
  } catch (error) {
    console.error("Error fetching concepts:", error);
    return NextResponse.json(
      { error: "Failed to fetch concepts" },
      { status: 500 }
    );
  }
}
