// Concept Relations Firebase Service
// CRUD operations for concept relationship management

import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type { ConceptRelation, RelationType } from "@/types";

// ===================================
// Concept Relations Service
// ===================================

export const relationsService = {
  /**
   * Create a new relation between concepts
   */
  async createRelation(
    userId: string,
    relation: Omit<ConceptRelation, "relationId">
  ): Promise<string> {
    const db = await getAdminDb();
    
    // Check if relation already exists
    const exists = await this.relationExists(
      userId,
      relation.sourceConceptId,
      relation.targetConceptId
    );

    if (exists) {
      throw new Error("Relation already exists between these concepts");
    }

    const relationRef = await db.collection("concept_relations").add({
      ...relation,
      userId,
      discoveredAt: relation.discoveredAt || Timestamp.now(),
    });

    return relationRef.id;
  },

  /**
   * Get relations for a concept (incoming, outgoing, or both)
   */
  async getConceptRelations(
    userId: string,
    conceptId: string,
    direction: "incoming" | "outgoing" | "both" = "both"
  ): Promise<ConceptRelation[]> {
    const db = await getAdminDb();
    const relations: ConceptRelation[] = [];

    // Get outgoing relations (where this concept is the source)
    if (direction === "outgoing" || direction === "both") {
      const outgoingSnapshot = await db
        .collection("concept_relations")
        .where("userId", "==", userId)
        .where("sourceConceptId", "==", conceptId)
        .get();

      for (const doc of outgoingSnapshot.docs) {
        relations.push({
          relationId: doc.id,
          ...doc.data(),
        } as ConceptRelation);
      }
    }

    // Get incoming relations (where this concept is the target)
    if (direction === "incoming" || direction === "both") {
      const incomingSnapshot = await db
        .collection("concept_relations")
        .where("userId", "==", userId)
        .where("targetConceptId", "==", conceptId)
        .get();

      for (const doc of incomingSnapshot.docs) {
        relations.push({
          relationId: doc.id,
          ...doc.data(),
        } as ConceptRelation);
      }
    }

    return relations;
  },

  /**
   * Get all relations for a user
   */
  async getUserRelations(userId: string): Promise<ConceptRelation[]> {
    const db = await getAdminDb();
    const snapshot = await db
      .collection("concept_relations")
      .where("userId", "==", userId)
      .get();

    return snapshot.docs.map((doc) => ({
      relationId: doc.id,
      ...doc.data(),
    })) as ConceptRelation[];
  },

  /**
   * Update relation strength
   */
  async updateRelationStrength(
    relationId: string,
    strength: number
  ): Promise<void> {
    if (strength < 0 || strength > 1) {
      throw new Error("Strength must be between 0 and 1");
    }

    const db = await getAdminDb();
    await db.collection("concept_relations").doc(relationId).update({
      strength,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Delete a relation
   */
  async deleteRelation(relationId: string): Promise<void> {
    const db = await getAdminDb();
    const relationRef = db.collection("concept_relations").doc(relationId);
    const relationDoc = await relationRef.get();

    if (!relationDoc.exists) {
      throw new Error(`Relation ${relationId} not found`);
    }

    await relationRef.delete();
  },

  /**
   * Check if relation exists
   */
  async relationExists(
    userId: string,
    sourceId: string,
    targetId: string
  ): Promise<boolean> {
    const db = await getAdminDb();
    const snapshot = await db
      .collection("concept_relations")
      .where("userId", "==", userId)
      .where("sourceConceptId", "==", sourceId)
      .where("targetConceptId", "==", targetId)
      .limit(1)
      .get();

    return !snapshot.empty;
  },

  /**
   * Get relation by type between two concepts
   */
  async getRelationByType(
    userId: string,
    sourceId: string,
    targetId: string,
    relationType: RelationType
  ): Promise<ConceptRelation | null> {
    const db = await getAdminDb();
    const snapshot = await db
      .collection("concept_relations")
      .where("userId", "==", userId)
      .where("sourceConceptId", "==", sourceId)
      .where("targetConceptId", "==", targetId)
      .where("relationType", "==", relationType)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      relationId: doc.id,
      ...doc.data(),
    } as ConceptRelation;
  },

  /**
   * Get relations by type for a user
   */
  async getRelationsByType(
    userId: string,
    relationType: RelationType
  ): Promise<ConceptRelation[]> {
    const db = await getAdminDb();
    const snapshot = await db
      .collection("concept_relations")
      .where("userId", "==", userId)
      .where("relationType", "==", relationType)
      .get();

    return snapshot.docs.map((doc) => ({
      relationId: doc.id,
      ...doc.data(),
    })) as ConceptRelation[];
  },

  /**
   * Get emergent (user-discovered) relations
   */
  async getEmergentRelations(userId: string): Promise<ConceptRelation[]> {
    const db = await getAdminDb();
    const snapshot = await db
      .collection("concept_relations")
      .where("userId", "==", userId)
      .where("isEmergent", "==", true)
      .get();

    return snapshot.docs.map((doc) => ({
      relationId: doc.id,
      ...doc.data(),
    })) as ConceptRelation[];
  },
};
