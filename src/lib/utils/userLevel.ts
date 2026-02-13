/**
 * Infer a coarse user level from the number of concepts they have tracked.
 * Centralised so every route that needs this heuristic stays in sync.
 */
export type UserLevel = "beginner" | "intermediate" | "advanced";

export function inferUserLevel(knownConceptCount: number): UserLevel {
  if (knownConceptCount >= 20) return "advanced";
  if (knownConceptCount >= 5) return "intermediate";
  return "beginner";
}
