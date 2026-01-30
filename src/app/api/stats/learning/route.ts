import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { graphDataService } from "@/lib/firebase/graphData";
import { reflectionsService } from "@/lib/firebase/reflections";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";

export async function GET(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    assertSameUser(requestedUserId, authed.uid);
    const userId = authed.uid;

    // Fetch data from multiple sources in parallel
    const [graphStats, reflectionStats, userData] = await Promise.all([
      graphDataService.getGraphStats(userId).catch(() => null),
      reflectionsService.getReflectionStats(userId).catch(() => null),
      getUserData(userId).catch(() => null),
    ]);

    const response = {
      concepts: {
        total: graphStats?.totalConcepts ?? 0,
        byMastery: graphStats?.masteryDistribution ?? {},
        byDomain: graphStats?.domainCounts ?? {},
      },
      reflections: {
        total: reflectionStats?.totalReflections ?? 0,
        totalSkipped: reflectionStats?.totalSkipped ?? 0,
        averageScore: reflectionStats?.averageScore ?? 0,
        levelUps: reflectionStats?.levelUpsFromReflections ?? 0,
      },
      activity: {
        totalSessions: userData?.totalSessions ?? 0,
        totalMessages: userData?.totalMessages ?? 0,
        streak: userData?.streak ?? 0,
        lastActive: userData?.lastLoginAt ?? null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error fetching learning stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning stats" },
      { status: 500 }
    );
  }
}

async function getUserData(userId: string) {
  const db = await getAdminDb();
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    return null;
  }
  const data = userDoc.data();
  return {
    totalSessions: data?.totalSessions ?? 0,
    totalMessages: data?.totalMessages ?? 0,
    streak: data?.streak ?? 0,
    lastLoginAt: data?.lastLoginAt?.toDate?.()?.toISOString() ?? null,
  };
}
