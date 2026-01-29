import { NextRequest, NextResponse } from "next/server";
import { conceptsService } from "@/lib/firebase/concepts";
import { relationsService } from "@/lib/firebase/conceptRelations";
import type { MasteryLevel } from "@/types";

// ===================================
// GET - Get user's concept graph
// ===================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const domain = searchParams.get("domain");
    const minMastery = searchParams.get("minMastery") as MasteryLevel | null;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Build filters
    const filters: Parameters<typeof conceptsService.getUserConcepts>[1] = {};
    if (domain) {
      filters.domain = domain;
    }
    if (minMastery) {
      filters.masteryLevel = minMastery;
    }

    // Get concepts (nodes)
    const nodes = await conceptsService.getUserConcepts(userId, filters);

    // Get relations (edges)
    const edges = await relationsService.getUserRelations(userId);

    // Calculate stats
    const totalConcepts = nodes.length;
    const masteredConcepts = nodes.filter(
      (c) => c.masteryLevel === "comfortable" || c.masteryLevel === "expert"
    ).length;
    
    const domains = [...new Set(nodes.map((c) => c.domain))].filter(Boolean);

    const inProgressConcepts = nodes.filter(
      (c) =>
        c.masteryLevel === "learning" ||
        c.masteryLevel === "practicing"
    ).length;

    return NextResponse.json({
      nodes,
      edges,
      stats: {
        totalConcepts,
        masteredConcepts,
        inProgressConcepts,
        domains,
      },
    });
  } catch (error) {
    console.error("Error fetching concept graph:", error);
    return NextResponse.json(
      { error: "Failed to fetch concept graph" },
      { status: 500 }
    );
  }
}
