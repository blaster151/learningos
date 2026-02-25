import { Timestamp } from "firebase-admin/firestore";
import { conceptsService } from "@/lib/firebase/concepts";
import { relationsService } from "@/lib/firebase/conceptRelations";
import {
  getPrerequisiteChain,
  type PrerequisiteConcept,
} from "@/lib/learning/prerequisiteChain";
import type { ConceptNode } from "@/types";

export interface PrerequisiteGapAlert {
  detected: boolean;
  prerequisiteConceptId?: string;
  prerequisiteConceptName?: string;
  targetConceptId?: string;
  reason?: string;
  createdAt?: string;
}

const CONFUSION_PATTERNS = [
  /i\s+don'?t\s+understand/i,
  /i\s*'?m\s+confused/i,
  /this\s+doesn'?t\s+make\s+sense/i,
  /i\s+am\s+lost/i,
  /why\s+does\s+this\s+work/i,
  /what\s+am\s+i\s+missing/i,
];

export async function detectPrerequisiteGap(params: {
  userId: string;
  userMessage: string;
  assistantResponse: string;
  targetConceptId?: string;
}): Promise<PrerequisiteGapAlert> {
  const { userId, userMessage, assistantResponse, targetConceptId } = params;

  if (!targetConceptId) {
    return { detected: false };
  }

  const showsConfusion = CONFUSION_PATTERNS.some((pattern) =>
    pattern.test(userMessage)
  );

  // Also check assistant response language for confusion signals if user signal is weak.
  const assistantSignalsConfusion =
    /let'?s\s+step\s+back|prerequisite|foundation/i.test(assistantResponse);

  if (!showsConfusion && !assistantSignalsConfusion) {
    return { detected: false };
  }

  const chain = await getPrerequisiteChain(userId, targetConceptId);
  const candidate = chain.prerequisites.find(
    (p) => p.readiness === "needs_assessment"
  );

  if (!candidate) {
    return { detected: false };
  }

  const ensuredPrereq = await ensurePrerequisiteConcept(userId, candidate);
  await ensurePrerequisiteRelation(
    userId,
    ensuredPrereq.conceptId,
    targetConceptId
  );

  return {
    detected: true,
    prerequisiteConceptId: ensuredPrereq.conceptId,
    prerequisiteConceptName: ensuredPrereq.name,
    targetConceptId,
    reason: `Potential gap detected in prerequisite knowledge for ${ensuredPrereq.name}.`,
    createdAt: Timestamp.now().toDate().toISOString(),
  };
}

async function ensurePrerequisiteConcept(
  userId: string,
  prerequisite: PrerequisiteConcept
): Promise<ConceptNode> {
  if (!prerequisite.conceptId.startsWith("inferred:")) {
    const existing = await conceptsService.getConcept(
      userId,
      prerequisite.conceptId
    );
    if (existing) {
      return existing;
    }
  }

  const byName = await conceptsService.findConceptByName(
    userId,
    prerequisite.conceptName
  );
  if (byName) {
    return byName;
  }

  const now = Timestamp.now();
  const conceptId = await conceptsService.createConcept(userId, {
    userId,
    name: prerequisite.conceptName.toLowerCase(),
    definition: `Foundational concept related to ${prerequisite.conceptName}.`,
    domain: "other",
    confidence: 0.2,
    understanding: 0.2,
    masteryLevel: "exploring",
    firstEncountered: now as unknown as any,
    lastReviewed: now as unknown as any,
    sessionIds: [],
    definitionHistory: [
      {
        definition: `Foundational concept related to ${prerequisite.conceptName}.`,
        source: "path",
        timestamp: now as unknown as any,
      },
    ],
    isEmergent: false,
    discoveredBy: "system",
  });

  const created = await conceptsService.getConcept(userId, conceptId);
  if (!created) {
    throw new Error("Failed to create inferred prerequisite concept");
  }

  return created;
}

async function ensurePrerequisiteRelation(
  userId: string,
  prerequisiteConceptId: string,
  targetConceptId: string
): Promise<void> {
  const existing = await relationsService.getRelationByType(
    userId,
    prerequisiteConceptId,
    targetConceptId,
    "prerequisite"
  );

  if (existing) {
    return;
  }

  await relationsService.createRelation(userId, {
    userId,
    sourceConceptId: prerequisiteConceptId,
    targetConceptId,
    relationType: "prerequisite",
    strength: 0.7,
    discoveredAt: Timestamp.now() as unknown as any,
    isEmergent: true,
    discoveredBy: "system",
    discoveryInsight: "Detected during dynamic prerequisite gap monitoring.",
  });
}
