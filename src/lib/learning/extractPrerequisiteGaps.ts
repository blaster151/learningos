/**
 * Prerequisite Gap Extraction Utility (E14-S5, Sub-task A)
 *
 * Extracts unresolved prerequisite gaps from learning path data.
 * Used by the Learn page to render gap cards alongside parent paths.
 *
 * Gap sources:
 *   1. `generatedFrom.assessedPrerequisites` where status === "missing"
 *   2. Milestones where `provenance?.reason === "prerequisite_gap"` and not completed
 */

import type { LearningPath, AssessedPrerequisite, PathMilestone } from "@/types";

export interface PrerequisiteGap {
  /** The concept name for this gap */
  conceptName: string;
  /** Optional concept ID if available */
  conceptId?: string;
  /** The path ID this gap belongs to */
  sourcePathId: string;
  /** The title of the path this gap belongs to */
  sourcePathTitle: string;
  /** How the gap was detected */
  source: "screening" | "milestone_provenance";
}

/**
 * Extract prerequisite gaps for a single path.
 *
 * Looks at two data sources:
 * 1. Assessed prerequisites from screening with status "missing"
 * 2. Milestones with provenance.reason "prerequisite_gap" that aren't completed
 *
 * Deduplicates by concept name within the path.
 */
export function extractGapsForPath(path: LearningPath): PrerequisiteGap[] {
  const seen = new Set<string>();
  const gaps: PrerequisiteGap[] = [];

  // Source 1: Assessed prerequisites from screening
  const assessed: AssessedPrerequisite[] =
    path.generatedFrom?.assessedPrerequisites ?? [];
  for (const ap of assessed) {
    if (ap.status === "missing") {
      const key = ap.conceptName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        gaps.push({
          conceptName: ap.conceptName,
          conceptId: ap.conceptId || undefined,
          sourcePathId: path.pathId,
          sourcePathTitle: path.title,
          source: "screening",
        });
      }
    }
  }

  // Source 2: Milestone provenance
  const milestones: PathMilestone[] = path.milestones ?? [];
  for (const m of milestones) {
    if (
      m.provenance?.reason === "prerequisite_gap" &&
      m.status !== "completed"
    ) {
      // Use milestone title as concept name (milestones inserted for gaps
      // are typically named after the concept)
      const key = m.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        gaps.push({
          conceptName: m.title,
          conceptId: m.conceptIds?.[0] || undefined,
          sourcePathId: path.pathId,
          sourcePathTitle: path.title,
          source: "milestone_provenance",
        });
      }
    }
  }

  return gaps;
}

/**
 * Extract all prerequisite gaps across a set of paths.
 *
 * Only considers paths with status "active" or "suggested".
 * Returns a Map keyed by pathId → array of gaps for that path.
 */
export function extractAllGaps(
  paths: LearningPath[]
): Map<string, PrerequisiteGap[]> {
  const result = new Map<string, PrerequisiteGap[]>();

  for (const path of paths) {
    if (path.status !== "active" && path.status !== "suggested") {
      continue;
    }

    const gaps = extractGapsForPath(path);
    if (gaps.length > 0) {
      result.set(path.pathId, gaps);
    }
  }

  return result;
}
