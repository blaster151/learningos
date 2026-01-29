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

    // 3. Process each extracted concept
    for (const concept of extracted.concepts) {
      try {
        // Check for existing concept (exact or similar match)
        const match = findExistingConcept(concept.name, existingConcepts);

        if (match?.exact) {
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
        } else if (match && match.similarity > 0.8) {
          // High similarity - treat as same concept, update
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
        } else {
          // New concept - create it
          const newId = await createNewConcept(db, userId, concept, sessionId, messageRole);
          result.newConcepts.push({ id: newId, name: concept.name });

          // Create relations to existing concepts if suggested
          if (concept.potentialRelations && concept.potentialRelations.length > 0) {
            for (const rel of concept.potentialRelations) {
              const targetConcept = findExistingConcept(rel.relatedTo, existingConcepts);
              if (targetConcept) {
                const relationId = await createRelation(
                  db, userId, newId, targetConcept.conceptId, rel.relationType, sessionId
                );
                result.newRelations.push({
                  id: relationId,
                  from: concept.name,
                  to: targetConcept.name,
                  type: rel.relationType,
                });
              }
            }
          }
        }
      } catch (err) {
        const errorMsg = `Error processing concept "${concept.name}": ${err}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    // 4. Update session with covered concepts
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
  
  const conceptData: Omit<ConceptNode, "conceptId"> = {
    name: concept.name.toLowerCase(),
    definition: concept.definition,
    domain: concept.domain,
    category: concept.category,
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
  // Check if relation already exists
  const existing = await db
    .collection("concept_relations")
    .where("userId", "==", userId)
    .where("sourceConceptId", "==", sourceConceptId)
    .where("targetConceptId", "==", targetConceptId)
    .limit(1)
    .get();

  if (!existing.empty) {
    // Update strength of existing relation
    const existingDoc = existing.docs[0];
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
