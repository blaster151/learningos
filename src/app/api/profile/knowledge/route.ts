import { NextRequest, NextResponse } from "next/server";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";
import { knowledgeProfileService } from "@/lib/firebase/knowledgeProfile";

// ===================================
// GET - Retrieve user's global knowledge profile
// ===================================

export async function GET(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const url = new URL(request.url);
    const requestedUserId = url.searchParams.get("userId");

    assertSameUser(requestedUserId, authed.uid);
    const userId = authed.uid;

    const entries = await knowledgeProfileService.getProfile(userId);

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;

    console.error("Error fetching knowledge profile:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch knowledge profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ===================================
// POST - Upsert knowledge profile entries from calibration pills
// ===================================

interface KnowledgeProfilePostBody {
  userId?: string;
  entries: Array<{ concept: string; confidence: number }>;
}

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body: KnowledgeProfilePostBody = await request.json();
    const { userId: requestedUserId, entries } = body;

    assertSameUser(requestedUserId ?? null, authed.uid);
    const userId = authed.uid;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "entries array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate each entry
    for (const entry of entries) {
      if (!entry.concept || typeof entry.concept !== "string") {
        return NextResponse.json(
          { error: "Each entry must have a string 'concept'" },
          { status: 400 }
        );
      }
      if (typeof entry.confidence !== "number" || entry.confidence < 0 || entry.confidence > 1) {
        return NextResponse.json(
          { error: "Each entry must have a 'confidence' number between 0 and 1" },
          { status: 400 }
        );
      }
    }

    await knowledgeProfileService.upsertEntries(userId, entries);

    // Return the updated profile
    const updatedEntries = await knowledgeProfileService.getProfile(userId);

    return NextResponse.json({ entries: updatedEntries }, { status: 200 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;

    console.error("Error updating knowledge profile:", error);
    return NextResponse.json(
      {
        error: "Failed to update knowledge profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
