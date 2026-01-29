import { NextRequest, NextResponse } from "next/server";
import { pathsService } from "@/lib/firebase/learningPaths";
import type { PathStatus } from "@/types";

// ===================================
// GET - Get all paths for a user
// ===================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const statusParam = searchParams.get("status");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    let status: PathStatus | undefined;
    if (statusParam) {
      if (
        statusParam === "suggested" ||
        statusParam === "active" ||
        statusParam === "completed" ||
        statusParam === "abandoned"
      ) {
        status = statusParam;
      } else {
        return NextResponse.json(
          { error: "Invalid status. Must be: suggested, active, completed, or abandoned" },
          { status: 400 }
        );
      }
    }

    const paths = await pathsService.getUserPaths(userId, status);

    return NextResponse.json({ paths });
  } catch (error) {
    console.error("Error fetching paths:", error);
    return NextResponse.json(
      { error: "Failed to fetch paths" },
      { status: 500 }
    );
  }
}
