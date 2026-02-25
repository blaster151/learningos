import { NextRequest, NextResponse } from "next/server";
import { pathsService } from "@/lib/firebase/learningPaths";
import { conceptsService } from "@/lib/firebase/concepts";
import { Timestamp } from "firebase-admin/firestore";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";
import { serializeDoc } from "@/lib/firebase/serialize";

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

    return NextResponse.json({ path: serializeDoc(path) });
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
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "accept":
        await pathsService.acceptPath(userId, pathId);
        break;

      case "abandon":
        await pathsService.abandonPath(userId, pathId);
        break;

      case "pause":
        await pathsService.pausePath(userId, pathId);
        break;

      case "resume":
        await pathsService.resumePath(userId, pathId);
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
        await pathsService.completeMilestone(
          userId,
          pathId,
          completeMilestoneId
        );

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

      case "insert_milestone": {
        const {
          title,
          description,
          conceptId,
          conceptName,
          objectives,
          estimatedMinutes,
          beforeMilestoneId,
          milestoneId,
          provenance,
        } = body;

        if (!title || !description || !conceptName) {
          return NextResponse.json(
            {
              error:
                "title, description, and conceptName are required for insert_milestone",
            },
            { status: 400 }
          );
        }

        const pathForInsert = await pathsService.getPath(userId, pathId);
        if (!pathForInsert) {
          return NextResponse.json(
            { error: "Path not found" },
            { status: 404 }
          );
        }

        // Guard: path must be active
        if (pathForInsert.status !== "active") {
          return NextResponse.json(
            { error: "Cannot insert milestones into a non-active path" },
            { status: 409 }
          );
        }

        // Guard: max 5 prerequisite insertions per path
        const existingPrereqCount = pathForInsert.milestones.filter(
          (m) => m.milestoneId.startsWith("prereq_") || (m as any).provenance?.reason === "prerequisite_gap"
        ).length;
        if (existingPrereqCount >= 5) {
          return NextResponse.json(
            { error: "Maximum of 5 prerequisite milestone insertions reached for this path" },
            { status: 400 }
          );
        }

        const targetMilestoneId =
          beforeMilestoneId ||
          pathForInsert.milestones[pathForInsert.currentMilestoneIndex]
            ?.milestoneId;

        const insertIndex = targetMilestoneId
          ? pathForInsert.milestones.findIndex(
              (m) => m.milestoneId === targetMilestoneId
            )
          : pathForInsert.currentMilestoneIndex;

        const safeInsertIndex =
          insertIndex === -1
            ? pathForInsert.currentMilestoneIndex
            : insertIndex;

        const newMilestoneId = milestoneId || `prereq_${Date.now()}`;
        const createdMilestone: any = {
          milestoneId: newMilestoneId,
          order: safeInsertIndex,
          title,
          description,
          conceptIds: conceptId ? [conceptId] : [],
          conceptNames: [conceptName],
          estimatedMinutes: estimatedMinutes ?? 30,
          objectives:
            Array.isArray(objectives) && objectives.length > 0
              ? objectives
              : [`Build foundational understanding of ${conceptName}`],
          completedObjectives: [],
          status: "available" as const,
          progress: 0,
          prerequisiteMilestoneIds: [],
        };

        // Store provenance for audit trail if provided
        if (provenance && typeof provenance === "object") {
          createdMilestone.provenance = {
            reason: provenance.reason ?? "prerequisite_gap",
            detectedInMilestoneId: provenance.detectedInMilestoneId,
            detectedInSessionId: provenance.detectedInSessionId,
            userChoice: provenance.userChoice,
            insertedAt: new Date().toISOString(),
          };
        }

        await pathsService.insertMilestone(
          userId,
          pathId,
          createdMilestone,
          safeInsertIndex
        );
        break;
      }

      case "self_assess_prerequisite_known": {
        const { conceptId, confidence = 0.85 } = body;
        if (!conceptId) {
          return NextResponse.json(
            {
              error: "conceptId is required for self_assess_prerequisite_known",
            },
            { status: 400 }
          );
        }

        const concept = await conceptsService.getConcept(userId, conceptId);
        if (!concept) {
          return NextResponse.json(
            { error: "Concept not found" },
            { status: 404 }
          );
        }

        await conceptsService.updateConcept(userId, conceptId, {
          confidence: Math.max(0, Math.min(1, confidence)),
          understanding: Math.max(
            concept.understanding,
            Math.max(0, Math.min(1, confidence))
          ),
          lastReviewed: Timestamp.now(),
        });
        break;
      }

      case "update_objectives": {
        const { milestoneId: objMilestoneId, completedObjectives } = body;
        if (!objMilestoneId || !Array.isArray(completedObjectives)) {
          return NextResponse.json(
            {
              error:
                "milestoneId and completedObjectives[] are required for update_objectives",
            },
            { status: 400 }
          );
        }
        // Store the completed objective indices and update milestone progress
        const pathForObj = await pathsService.getPath(userId, pathId);
        if (pathForObj) {
          const ms = pathForObj.milestones.find(
            (m) => m.milestoneId === objMilestoneId
          );
          if (ms) {
            const totalObj = ms.objectives?.length || 1;
            const msProgress = Math.min(
              completedObjectives.length / totalObj,
              1.0
            );
            await pathsService.updateMilestone(userId, pathId, objMilestoneId, {
              progress: msProgress,
              completedObjectives,
            });

            // Recalculate path-level progress from all milestones
            const updatedPath = await pathsService.getPath(userId, pathId);
            if (updatedPath) {
              const pathProgress =
                updatedPath.milestones.reduce(
                  (sum, m) => sum + (m.progress || 0),
                  0
                ) / updatedPath.milestones.length;
              await pathsService.updatePathProgress(userId, pathId, {
                progress: pathProgress,
              });
            }
          }
        }
        break;
      }

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Must be: accept, abandon, pause, resume, start_milestone, complete_milestone, update_objectives, insert_milestone, or self_assess_prerequisite_known",
          },
          { status: 400 }
        );
    }

    // Fetch updated path
    const updatedPath = await pathsService.getPath(userId, pathId);

    return NextResponse.json({ path: serializeDoc(updatedPath) });
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
