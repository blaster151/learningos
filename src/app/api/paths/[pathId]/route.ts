import { NextRequest, NextResponse } from "next/server";
import { pathsService } from "@/lib/firebase/learningPaths";

// ===================================
// GET - Get path details
// ===================================

export async function GET(
  request: NextRequest,
  { params }: { params: { pathId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const path = await pathsService.getPath(userId, params.pathId);

    if (!path) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 });
    }

    return NextResponse.json({ path });
  } catch (error) {
    console.error("Error fetching path:", error);
    return NextResponse.json(
      { error: "Failed to fetch path" },
      { status: 500 }
    );
  }
}

// ===================================
// PATCH - Update path (accept, abandon, etc.)
// ===================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { pathId: string } }
) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    switch (action) {
      case "accept":
        await pathsService.acceptPath(userId, params.pathId);
        break;

      case "abandon":
        await pathsService.abandonPath(userId, params.pathId);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Must be: accept or abandon" },
          { status: 400 }
        );
    }

    // Fetch updated path
    const updatedPath = await pathsService.getPath(userId, params.pathId);

    return NextResponse.json({ path: updatedPath });
  } catch (error) {
    console.error("Error updating path:", error);
    return NextResponse.json(
      {
        error: "Failed to update path",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
