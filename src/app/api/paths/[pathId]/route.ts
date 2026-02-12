import { NextRequest, NextResponse } from "next/server";
import { pathsService } from "@/lib/firebase/learningPaths";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";

// ===================================
// GET - Get path details
// ===================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pathId: string }> }
) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const { pathId } = await params;

    assertSameUser(requestedUserId, authed.uid);
    const userId = authed.uid;

    const path = await pathsService.getPath(userId, pathId);

    if (!path) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 });
    }

    return NextResponse.json({ path });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
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
  { params }: { params: Promise<{ pathId: string }> }
) {
  try {
    const authed = await requireAuthUser(request);
    const body = await request.json();
    const { userId: requestedUserId, action } = body;
    const { pathId } = await params;

    assertSameUser(requestedUserId ?? null, authed.uid);
    const userId = authed.uid;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    switch (action) {
      case "accept":
        await pathsService.acceptPath(userId, pathId);
        break;

      case "abandon":
        await pathsService.abandonPath(userId, pathId);
        break;

      case "start_milestone": {
        const { milestoneId } = body;
        if (!milestoneId) {
          return NextResponse.json(
            { error: "milestoneId is required for start_milestone" },
            { status: 400 }
          );
        }
        await pathsService.updateMilestone(userId, pathId, milestoneId, {
          status: "in_progress",
        });
        // Also update currentMilestoneIndex
        const pathForStart = await pathsService.getPath(userId, pathId);
        if (pathForStart) {
          const idx = pathForStart.milestones.findIndex(
            (m) => m.milestoneId === milestoneId
          );
          if (idx !== -1) {
            await pathsService.updatePathProgress(userId, pathId, {
              currentMilestoneIndex: idx,
            });
          }
        }
        break;
      }

      case "complete_milestone": {
        const { milestoneId: completeMilestoneId } = body;
        if (!completeMilestoneId) {
          return NextResponse.json(
            { error: "milestoneId is required for complete_milestone" },
            { status: 400 }
          );
        }
        await pathsService.completeMilestone(userId, pathId, completeMilestoneId);

        // Auto-unlock and advance to next milestone
        const pathAfterComplete = await pathsService.getPath(userId, pathId);
        if (pathAfterComplete && pathAfterComplete.status !== "completed") {
          const completedIdx = pathAfterComplete.milestones.findIndex(
            (m) => m.milestoneId === completeMilestoneId
          );
          const nextIdx = completedIdx + 1;
          if (nextIdx < pathAfterComplete.milestones.length) {
            const nextMilestone = pathAfterComplete.milestones[nextIdx];
            if (
              nextMilestone.status === "locked" ||
              nextMilestone.status === "not_started"
            ) {
              await pathsService.updateMilestone(
                userId,
                pathId,
                nextMilestone.milestoneId,
                { status: "available" }
              );
            }
            await pathsService.updatePathProgress(userId, pathId, {
              currentMilestoneIndex: nextIdx,
            });
          }
        }
        break;
      }

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Must be: accept, abandon, start_milestone, or complete_milestone",
          },
          { status: 400 }
        );
    }

    // Fetch updated path
    const updatedPath = await pathsService.getPath(userId, pathId);

    return NextResponse.json({ path: updatedPath });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
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
