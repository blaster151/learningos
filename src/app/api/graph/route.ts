import { NextRequest, NextResponse } from "next/server";
import { conceptsService } from "@/lib/firebase/concepts";
import { relationsService } from "@/lib/firebase/conceptRelations";
import type { MasteryLevel } from "@/types";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";
import { transformGraphData } from "@/lib/graph/transformGraphData";

// ===================================
// GET - Get user's concept graph
// ===================================

export async function GET(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const domainsParam = searchParams.get("domains");
    const masteryLevelsParam = searchParams.get("masteryLevels");
    const searchQuery = searchParams.get("search");

    assertSameUser(requestedUserId, authed.uid);
    const userId = authed.uid;

    // Fetch ALL concepts and relations (filter in transformer)
    const concepts = await conceptsService.getUserConcepts(userId);
    const relations = await relationsService.getUserRelations(userId);

    // Build client-side filters for the transformer
    const graphFilters = {
      domains: domainsParam ? domainsParam.split(",").filter(Boolean) : [],
      masteryLevels: (masteryLevelsParam ? masteryLevelsParam.split(",").filter(Boolean) : []) as MasteryLevel[],
      searchQuery: searchQuery || "",
    };

    // Transform raw data into react-force-graph format with filters applied
    const graph = transformGraphData(concepts, relations, {
      clusterByDomain: true,
      filters: graphFilters,
    });

    // Calculate stats
    const totalConcepts = concepts.length;
    const totalRelations = relations.length;
    const masteredConcepts = concepts.filter(
      (c) => c.masteryLevel === "comfortable" || c.masteryLevel === "expert"
    ).length;
    
    const domains = [...new Set(concepts.map((c) => c.domain))].filter(Boolean);

    const inProgressConcepts = concepts.filter(
      (c) =>
        c.masteryLevel === "learning" ||
        c.masteryLevel === "practicing"
    ).length;

    // Build mastery distribution (normalize invalid/numeric values)
    const VALID_MASTERY_LEVELS = new Set(["exploring", "learning", "practicing", "comfortable", "expert"]);
    const masteryDistribution: Record<string, number> = {};
    for (const concept of concepts) {
      let level = concept.masteryLevel || "exploring";
      // Normalize numeric or invalid mastery values
      if (!VALID_MASTERY_LEVELS.has(level)) {
        level = "exploring" as any;
      }
      masteryDistribution[level] = (masteryDistribution[level] || 0) + 1;
    }

    // Build domain counts
    const domainCounts: Record<string, number> = {};
    for (const concept of concepts) {
      const d = concept.domain || "unknown";
      domainCounts[d] = (domainCounts[d] || 0) + 1;
    }

    return NextResponse.json({
      graph,
      availableDomains: domains,
      stats: {
        totalConcepts,
        totalRelations,
        masteredConcepts,
        inProgressConcepts,
        domains,
        masteryDistribution,
        domainCounts,
      },
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error fetching concept graph:", error);
    return NextResponse.json(
      { error: "Failed to fetch concept graph" },
      { status: 500 }
    );
  }
}
