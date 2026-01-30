import { NextRequest, NextResponse } from "next/server";
import { pathsService } from "@/lib/firebase/learningPaths";
import type { PathStatus } from "@/types";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";

// ===================================
// GET - Get all paths for a user
// ===================================

export async function GET(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const statusParam = searchParams.get("status");

    assertSameUser(requestedUserId, authed.uid);
    const userId = authed.uid;

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
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error fetching paths:", error);
    return NextResponse.json(
      { error: "Failed to fetch paths" },
      { status: 500 }
    );
  }
}
