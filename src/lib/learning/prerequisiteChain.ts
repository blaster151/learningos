import { getOpenAI, AI_CONFIG } from "@/lib/ai/config";
import { getAdminDb } from "@/lib/firebase/admin";
import type { ConceptNode, ConceptRelation } from "@/types";

export type PrerequisiteReadiness =
  | "likely_known"
  | "needs_assessment"
  | "reinforce";

export interface PrerequisiteConcept {
  conceptId: string;
  conceptName: string;
  depth: number;
  mastery: number | null;
  readiness: PrerequisiteReadiness;
  source: "graph" | "inferred";
}

export interface PrerequisiteChainResult {
  targetConceptId: string;
  prerequisites: PrerequisiteConcept[];
  cycleDetected: boolean;
  usedInferredPrerequisites: boolean;
}

const HIGH_MASTERY_THRESHOLD = 0.8;
const LOW_MASTERY_THRESHOLD = 0.3;

export async function getPrerequisiteChain(
  userId: string,
  targetConceptId: string
): Promise<PrerequisiteChainResult> {
  const db = await getAdminDb();

  const [targetDoc, relationsSnapshot] = await Promise.all([
    db.collection("concepts").doc(targetConceptId).get(),
    db
      .collection("concept_relations")
      .where("userId", "==", userId)
      .where("relationType", "==", "prerequisite")
      .get(),
  ]);

  const relations = relationsSnapshot.docs.map((doc) => ({
    relationId: doc.id,
    ...(doc.data() as Omit<ConceptRelation, "relationId">),
  })) as ConceptRelation[];

  const incomingPrerequisites = new Map<string, Set<string>>();
  for (const relation of relations) {
    const prereqs =
      incomingPrerequisites.get(relation.targetConceptId) ?? new Set<string>();
    prereqs.add(relation.sourceConceptId);
    incomingPrerequisites.set(relation.targetConceptId, prereqs);
  }

  const traversalDepth = new Map<string, number>();
  const visiting = new Set<string>();
  let cycleDetected = false;

  function walk(conceptId: string, depthFromTarget: number): void {
    const prerequisites = incomingPrerequisites.get(conceptId);
    if (!prerequisites || prerequisites.size === 0) {
      return;
    }

    for (const prerequisiteId of prerequisites) {
      const existingDepth = traversalDepth.get(prerequisiteId);
      if (existingDepth === undefined || depthFromTarget > existingDepth) {
        traversalDepth.set(prerequisiteId, depthFromTarget);
      }

      if (visiting.has(prerequisiteId)) {
        cycleDetected = true;
        continue;
      }

      visiting.add(prerequisiteId);
      walk(prerequisiteId, depthFromTarget + 1);
      visiting.delete(prerequisiteId);
    }
  }

  visiting.add(targetConceptId);
  walk(targetConceptId, 1);
  visiting.delete(targetConceptId);

  const hasGraphPrerequisites = traversalDepth.size > 0;
  if (!hasGraphPrerequisites) {
    const targetConcept = targetDoc.exists
      ? ({
          conceptId: targetDoc.id,
          ...(targetDoc.data() as Omit<ConceptNode, "conceptId">),
        } as ConceptNode)
      : null;

    const inferred = await inferPrerequisitesFromDomainKnowledge(targetConcept);
    return {
      targetConceptId,
      prerequisites: inferred,
      cycleDetected,
      usedInferredPrerequisites: true,
    };
  }

  const conceptIds = Array.from(traversalDepth.keys());
  const conceptSnapshots = await Promise.all(
    conceptIds.map((conceptId) =>
      db.collection("concepts").doc(conceptId).get()
    )
  );

  const conceptById = new Map<string, ConceptNode>();
  for (const conceptSnapshot of conceptSnapshots) {
    if (!conceptSnapshot.exists) {
      continue;
    }

    conceptById.set(conceptSnapshot.id, {
      conceptId: conceptSnapshot.id,
      ...(conceptSnapshot.data() as Omit<ConceptNode, "conceptId">),
    } as ConceptNode);
  }

  const prerequisites = conceptIds
    .map((conceptId) => {
      const concept = conceptById.get(conceptId);
      const mastery = concept ? getMasteryScore(concept) : null;

      return {
        conceptId,
        conceptName: concept?.name ?? conceptId,
        depth: traversalDepth.get(conceptId) ?? 1,
        mastery,
        readiness: getReadinessFromMastery(mastery),
        source: "graph" as const,
      };
    })
    .sort(
      (a, b) => b.depth - a.depth || a.conceptName.localeCompare(b.conceptName)
    );

  return {
    targetConceptId,
    prerequisites,
    cycleDetected,
    usedInferredPrerequisites: false,
  };
}

function getMasteryScore(concept: ConceptNode): number {
  const score = concept.understanding ?? concept.confidence ?? 0;
  return Math.max(0, Math.min(1, score));
}

function getReadinessFromMastery(
  mastery: number | null
): PrerequisiteReadiness {
  if (mastery === null || mastery < LOW_MASTERY_THRESHOLD) {
    return "needs_assessment";
  }

  if (mastery >= HIGH_MASTERY_THRESHOLD) {
    return "likely_known";
  }

  return "reinforce";
}

async function inferPrerequisitesFromDomainKnowledge(
  targetConcept: ConceptNode | null
): Promise<PrerequisiteConcept[]> {
  const conceptName = targetConcept?.name ?? "the target concept";
  const conceptDomain = targetConcept?.domain ?? "general learning";

  const response = await getOpenAI().chat.completions.create({
    model: AI_CONFIG.FALLBACK_MODEL,
    temperature: 0.2,
    max_tokens: 250,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You suggest foundational prerequisites for a learning concept. Return compact JSON with array field prereqs, each item including name and reason.",
      },
      {
        role: "user",
        content: `Concept: ${conceptName}\nDomain: ${conceptDomain}\nList 2-5 likely prerequisite concepts.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return [];
  }

  const parsed = JSON.parse(content) as {
    prereqs?: Array<{ name?: string }>;
  };

  const inferred: PrerequisiteConcept[] = [];

  (parsed.prereqs ?? []).forEach((entry, index) => {
    const name = (entry.name ?? "").trim();
    if (!name) {
      return;
    }

    const conceptId = `inferred:${name.toLowerCase().replace(/\s+/g, "-")}:${index}`;
    inferred.push({
      conceptId,
      conceptName: name,
      depth: 1,
      mastery: null,
      readiness: "needs_assessment" as const,
      source: "inferred" as const,
    });
  });

  return inferred;
}
