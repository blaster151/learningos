// Concept Graph Updater Service
// Automatically updates the user's concept graph based on chat conversations
// Handles: extraction, deduplication, relation creation, mastery updates

import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { extractConceptsEnhanced, type EnhancedExtractedConcept } from "./conceptExtractionEnhanced";
import type { ConceptNode, ConceptRelation, RelationType, MasteryLevel } from "@/types";

// ===================================
// Types
// ===================================

export interface GraphUpdateResult {
  newConcepts: Array<{ id: string; name: string }>;
  updatedConcepts: Array<{ id: string; name: string; field: string }>;
  newRelations: Array<{ id: string; from: string; to: string; type: RelationType }>;
  errors: string[];
}

interface ExistingConceptMatch {
  conceptId: string;
  name: string;
  similarity: number; // 0-1
  exact: boolean;
}

// ===================================
// Main Update Function
// ===================================

/**
 * Update the concept graph based on a chat message
 * Called asynchronously after each message exchange
 */
export async function updateGraphFromMessage(
  userId: string,
  sessionId: string,
  message: string,
  messageRole: "user" | "assistant",
  sessionTopic?: string
): Promise<GraphUpdateResult> {
  const result: GraphUpdateResult = {
    newConcepts: [],
    updatedConcepts: [],
    newRelations: [],
    errors: [],
  };

  try {
    const db = await getAdminDb();

    // 1. Get existing concepts for this user
    const existingConcepts = await getUserConcepts(db, userId);
    const existingNames = existingConcepts.map(c => c.name.toLowerCase());

    // 2. Extract concepts from the message
    const extracted = await extractConceptsEnhanced(message, {
      existingConcepts: existingNames,
      sessionTopic,
      messageRole,
    });

    if (extracted.concepts.length === 0) {
      return result; // Nothing to update
    }

    // 3. FIRST PASS: Create/update all concepts, building a complete ID map
    // Maps normalized concept name -> conceptId (includes both existing and newly created)
    const conceptIdMap = new Map<string, string>();
    
    // Pre-populate with existing concepts
    for (const existing of existingConcepts) {
      conceptIdMap.set(existing.name.toLowerCase(), existing.conceptId);
    }

    // Track which concepts were extracted in this message (for co-occurrence relations)
    const extractedConceptIds: Array<{ id: string; name: string }> = [];

    for (const concept of extracted.concepts) {
      try {
        // Check for existing concept (exact or similar match)
        const match = findExistingConcept(concept.name, existingConcepts);

        if (match?.exact || (match && match.similarity > 0.8)) {
          // Update existing concept
          const updates = await updateExistingConcept(
            db, userId, match.conceptId, concept, sessionId, messageRole
          );
          if (updates.length > 0) {
            result.updatedConcepts.push({
              id: match.conceptId,
              name: match.name,
              field: updates.join(", "),
            });
          }
          extractedConceptIds.push({ id: match.conceptId, name: match.name });
        } else {
          // New concept - create it
          const newId = await createNewConcept(db, userId, concept, sessionId, messageRole);
          result.newConcepts.push({ id: newId, name: concept.name });
          
          // Add to the ID map so subsequent concepts can reference it
          conceptIdMap.set(concept.name.toLowerCase(), newId);
          extractedConceptIds.push({ id: newId, name: concept.name });
        }
      } catch (err) {
        const errorMsg = `Error processing concept "${concept.name}": ${err}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    // 4. SECOND PASS: Process relations for ALL extracted concepts (new and existing)
    //    Now that all concepts from this message are created, we can link them
    //    Track linked pairs by ID so co-occurrence can skip them
    const linkedPairIds = new Set<string>();

    for (const concept of extracted.concepts) {
      if (!concept.potentialRelations || concept.potentialRelations.length === 0) continue;

      // Find the source concept's ID
      const sourceId = conceptIdMap.get(concept.name.toLowerCase());
      if (!sourceId) continue;

      for (const rel of concept.potentialRelations) {
        try {
          // Look up target in our complete map first (catches same-message concepts)
          let targetId = conceptIdMap.get(rel.relatedTo.toLowerCase());
          
          // If not in map, try fuzzy match against existing concepts
          if (!targetId) {
            const targetMatch = findExistingConcept(rel.relatedTo, existingConcepts);
            if (targetMatch) {
              targetId = targetMatch.conceptId;
            }
          }

          if (targetId && targetId !== sourceId) {
            const relationId = await createRelation(
              db, userId, sourceId, targetId, rel.relationType, sessionId
            );
            result.newRelations.push({
              id: relationId,
              from: concept.name,
              to: rel.relatedTo,
              type: rel.relationType,
            });
            // Track this pair so co-occurrence doesn't create a weaker duplicate
            const pairKey = [sourceId, targetId].sort().join("|");
            linkedPairIds.add(pairKey);
          }
        } catch (err) {
          console.warn(`Failed to create relation ${concept.name} -> ${rel.relatedTo}:`, err);
        }
      }
    }

    // 5. AUTO-RELATE: Create co-occurrence relations between concepts from the same message
    //    If multiple concepts are discussed in the same message, they're contextually related
    if (extractedConceptIds.length >= 2) {
      await createCoOccurrenceRelations(
        db, userId, sessionId, extractedConceptIds, linkedPairIds, result
      );
    }

    // 6. Update session with covered concepts
    await updateSessionConcepts(db, sessionId, result.newConcepts.map(c => c.id));

    return result;
  } catch (error) {
    console.error("Error updating graph from message:", error);
    result.errors.push(`Graph update failed: ${error}`);
    return result;
  }
}

// ===================================
// Helper Functions
// ===================================

async function getUserConcepts(
  db: FirebaseFirestore.Firestore,
  userId: string
): Promise<ConceptNode[]> {
  const snapshot = await db
    .collection("concepts")
    .where("userId", "==", userId)
    .get();

  return snapshot.docs.map(doc => ({
    conceptId: doc.id,
    ...doc.data(),
  })) as ConceptNode[];
}

function findExistingConcept(
  name: string,
  existingConcepts: ConceptNode[]
): ExistingConceptMatch | null {
  const normalizedName = name.toLowerCase().trim();

  // First, check for exact match
  for (const concept of existingConcepts) {
    if (concept.name.toLowerCase() === normalizedName) {
      return {
        conceptId: concept.conceptId,
        name: concept.name,
        similarity: 1.0,
        exact: true,
      };
    }
  }

  // Check for similar matches
  let bestMatch: ExistingConceptMatch | null = null;
  
  for (const concept of existingConcepts) {
    const similarity = calculateSimilarity(normalizedName, concept.name.toLowerCase());
    if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = {
        conceptId: concept.conceptId,
        name: concept.name,
        similarity,
        exact: false,
      };
    }
  }

  return bestMatch;
}

/**
 * Simple string similarity using Levenshtein-based approach
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1.0;
  
  // Check if one contains the other
  if (longer.includes(shorter) || shorter.includes(longer)) {
    return shorter.length / longer.length * 0.9 + 0.1; // At least 0.1, scaled by length ratio
  }
  
  // Simple word overlap for multi-word concepts
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  
  if (union.size > 0) {
    return intersection.length / union.size;
  }
  
  return 0;
}

async function createNewConcept(
  db: FirebaseFirestore.Firestore,
  userId: string,
  concept: EnhancedExtractedConcept,
  sessionId: string,
  messageRole: "user" | "assistant"
): Promise<string> {
  const now = Timestamp.now();
  
  const conceptData: Record<string, unknown> = {
    name: concept.name.toLowerCase(),
    definition: concept.definition,
    domain: concept.domain,
    userId,
    confidence: concept.confidence * 0.5, // Start conservative
    understanding: messageRole === "assistant" ? 0.3 : 0.2, // AI explanations give slight boost
    masteryLevel: "exploring" as MasteryLevel,
    firstEncountered: now,
    lastReviewed: now,
    learnedFrom: sessionId,
    sessionIds: [sessionId],
    definitionHistory: [{
      definition: concept.definition,
      source: "chat",
      timestamp: now,
    }],
    isEmergent: messageRole === "user", // User-mentioned concepts are emergent
    discoveredBy: messageRole === "user" ? "user" : "system",
  };

  // Only include category if defined (Firestore rejects undefined values)
  if (concept.category) {
    conceptData.category = concept.category;
  }

  const ref = await db.collection("concepts").add(conceptData);
  return ref.id;
}

async function updateExistingConcept(
  db: FirebaseFirestore.Firestore,
  userId: string,
  conceptId: string,
  newData: EnhancedExtractedConcept,
  sessionId: string,
  messageRole: "user" | "assistant"
): Promise<string[]> {
  const updates: Record<string, unknown> = {};
  const updatedFields: string[] = [];

  // Update last reviewed
  updates.lastReviewed = Timestamp.now();
  
  // Add session to list if not already present
  updates.sessionIds = FieldValue.arrayUnion(sessionId);

  // Get current concept to calculate mastery update
  const conceptDoc = await db.collection("concepts").doc(conceptId).get();
  const current = conceptDoc.data() as ConceptNode | undefined;

  if (current) {
    // Increase understanding slightly for each review
    const understandingBoost = messageRole === "assistant" ? 0.05 : 0.03;
    const newUnderstanding = Math.min(1.0, (current.understanding || 0) + understandingBoost);
    
    if (newUnderstanding !== current.understanding) {
      updates.understanding = newUnderstanding;
      updatedFields.push("understanding");
    }

    // Update mastery level if understanding crosses thresholds
    const newMasteryLevel = calculateMasteryLevel(newUnderstanding, current.confidence || 0.5);
    if (newMasteryLevel !== current.masteryLevel) {
      updates.masteryLevel = newMasteryLevel;
      updatedFields.push("masteryLevel");
    }

    // Add to definition history if significantly different
    if (newData.definition && newData.definition.length > 20) {
      const isDifferent = !current.definitionHistory?.some(
        h => h.definition.toLowerCase() === newData.definition.toLowerCase()
      );
      if (isDifferent) {
        updates.definitionHistory = FieldValue.arrayUnion({
          definition: newData.definition,
          source: "chat",
          timestamp: Timestamp.now(),
        });
        updatedFields.push("definitionHistory");
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    await db.collection("concepts").doc(conceptId).update(updates);
  }

  return updatedFields;
}

function calculateMasteryLevel(understanding: number, confidence: number): MasteryLevel {
  const combined = (understanding + confidence) / 2;
  
  if (combined >= 0.9) return "expert";
  if (combined >= 0.75) return "comfortable";
  if (combined >= 0.5) return "practicing";
  if (combined >= 0.25) return "learning";
  return "exploring";
}

async function createRelation(
  db: FirebaseFirestore.Firestore,
  userId: string,
  sourceConceptId: string,
  targetConceptId: string,
  relationType: RelationType,
  sessionId: string
): Promise<string> {
  // Check if relation already exists in either direction
  const [existingForward, existingReverse] = await Promise.all([
    db.collection("concept_relations")
      .where("userId", "==", userId)
      .where("sourceConceptId", "==", sourceConceptId)
      .where("targetConceptId", "==", targetConceptId)
      .limit(1)
      .get(),
    db.collection("concept_relations")
      .where("userId", "==", userId)
      .where("sourceConceptId", "==", targetConceptId)
      .where("targetConceptId", "==", sourceConceptId)
      .limit(1)
      .get(),
  ]);

  const existingDoc = !existingForward.empty
    ? existingForward.docs[0]
    : !existingReverse.empty
      ? existingReverse.docs[0]
      : null;

  if (existingDoc) {
    // Strengthen existing relation
    const currentStrength = existingDoc.data().strength || 0.5;
    await existingDoc.ref.update({
      strength: Math.min(1.0, currentStrength + 0.1),
    });
    return existingDoc.id;
  }

  // Create new relation
  const relationData: Omit<ConceptRelation, "relationId"> = {
    userId,
    sourceConceptId,
    targetConceptId,
    relationType,
    strength: 0.5,
    discoveredAt: Timestamp.now(),
    isEmergent: false,
    discoveredBy: "system",
    sessionId,
  };

  const ref = await db.collection("concept_relations").add(relationData);
  return ref.id;
}

async function createCoOccurrenceRelations(
  db: FirebaseFirestore.Firestore,
  userId: string,
  sessionId: string,
  concepts: Array<{ id: string; name: string }>,
  linkedPairIds: Set<string>,
  result: GraphUpdateResult
): Promise<void> {
  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      const a = concepts[i];
      const b = concepts[j];

      // Skip if AI already created a specific relation for this pair
      const pairKey = [a.id, b.id].sort().join("|");
      if (linkedPairIds.has(pairKey)) {
        continue;
      }

      try {
        // Check if a relation already exists in Firestore (in either direction)
        // createRelation already checks both directions, so just call it
        // It will strengthen if exists, create if not
        const relationId = await createRelation(
          db, userId, a.id, b.id, "similar_to", sessionId
        );

        // Only add to results if it's truly new (not just strengthened)
        // We can tell by checking if the ID is already in an existing doc
        result.newRelations.push({
          id: relationId,
          from: a.name,
          to: b.name,
          type: "similar_to",
        });
      } catch (err) {
        console.warn(`Failed to create co-occurrence relation ${a.name} <-> ${b.name}:`, err);
      }
    }
  }
}

async function updateSessionConcepts(
  db: FirebaseFirestore.Firestore,
  sessionId: string,
  newConceptIds: string[]
): Promise<void> {
  if (newConceptIds.length === 0) return;

  await db.collection("sessions").doc(sessionId).update({
    conceptsCovered: FieldValue.arrayUnion(...newConceptIds),
    conceptsLearned: FieldValue.arrayUnion(...newConceptIds),
  });
}

// ===================================
// Batch Update for Session Summary
// ===================================

/**
 * Process all messages in a session to update the graph
 * Used when generating session summary or on session end
 */
export async function updateGraphFromSession(
  userId: string,
  sessionId: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  sessionTopic?: string
): Promise<GraphUpdateResult> {
  const combinedResult: GraphUpdateResult = {
    newConcepts: [],
    updatedConcepts: [],
    newRelations: [],
    errors: [],
  };

  // Process messages in pairs (user + assistant) for better context
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const result = await updateGraphFromMessage(
      userId,
      sessionId,
      msg.content,
      msg.role,
      sessionTopic
    );

    combinedResult.newConcepts.push(...result.newConcepts);
    combinedResult.updatedConcepts.push(...result.updatedConcepts);
    combinedResult.newRelations.push(...result.newRelations);
    combinedResult.errors.push(...result.errors);
  }

  // Deduplicate results
  combinedResult.newConcepts = deduplicateById(combinedResult.newConcepts);
  combinedResult.updatedConcepts = deduplicateById(combinedResult.updatedConcepts);
  combinedResult.newRelations = deduplicateById(combinedResult.newRelations);

  return combinedResult;
}

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
