// Concepts Firebase Service
// CRUD operations for concept management

import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type { ConceptNode, MasteryLevel } from "@/types";

// ===================================
// Concepts Service
// ===================================

export const conceptsService = {
  /**
   * Create a new concept for a user
   */
  async createConcept(
    userId: string,
    concept: Omit<ConceptNode, "conceptId">
  ): Promise<string> {
    const db = await getAdminDb();
    const conceptRef = await db.collection("concepts").add({
      ...concept,
      userId,
      createdAt: Timestamp.now(),
    });
    return conceptRef.id;
  },

  /**
   * Get a single concept by ID
   */
  async getConcept(
    userId: string,
    conceptId: string
  ): Promise<ConceptNode | null> {
    const db = await getAdminDb();
    const conceptDoc = await db.collection("concepts").doc(conceptId).get();

    if (!conceptDoc.exists) {
      return null;
    }

    const data = conceptDoc.data();
    
    // Verify ownership
    if (data?.userId !== userId) {
      return null;
    }

    return {
      conceptId: conceptDoc.id,
      ...data,
    } as ConceptNode;
  },

  /**
   * Get all concepts for a user with optional filters
   */
  async getUserConcepts(
    userId: string,
    filters?: {
      domain?: string;
      masteryLevel?: MasteryLevel;
      limit?: number;
    }
  ): Promise<ConceptNode[]> {
    const db = await getAdminDb();
    let query: FirebaseFirestore.Query = db
      .collection("concepts")
      .where("userId", "==", userId);

    if (filters?.domain) {
      query = query.where("domain", "==", filters.domain);
    }

    if (filters?.masteryLevel) {
      query = query.where("masteryLevel", "==", filters.masteryLevel);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      conceptId: doc.id,
      ...doc.data(),
    })) as ConceptNode[];
  },

  /**
   * Update concept fields
   */
  async updateConcept(
    userId: string,
    conceptId: string,
    updates: Partial<ConceptNode>
  ): Promise<void> {
    const db = await getAdminDb();
    const conceptRef = db.collection("concepts").doc(conceptId);
    const conceptDoc = await conceptRef.get();

    if (!conceptDoc.exists) {
      throw new Error(`Concept ${conceptId} not found`);
    }

    // Verify ownership
    const data = conceptDoc.data();
    if (data?.userId !== userId) {
      throw new Error("Unauthorized: Concept belongs to different user");
    }

    // Remove conceptId from updates if present (shouldn't be updated)
    const { conceptId: _, ...safeUpdates } = updates as any;

    await conceptRef.update({
      ...safeUpdates,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Delete a concept
   */
  async deleteConcept(userId: string, conceptId: string): Promise<void> {
    const db = await getAdminDb();
    const conceptRef = db.collection("concepts").doc(conceptId);
    const conceptDoc = await conceptRef.get();

    if (!conceptDoc.exists) {
      throw new Error(`Concept ${conceptId} not found`);
    }

    // Verify ownership
    const data = conceptDoc.data();
    if (data?.userId !== userId) {
      throw new Error("Unauthorized: Concept belongs to different user");
    }

    await conceptRef.delete();
  },

  /**
   * Get concepts by name (for deduplication)
   */
  async findConceptByName(
    userId: string,
    name: string
  ): Promise<ConceptNode | null> {
    const db = await getAdminDb();
    const normalizedName = name.toLowerCase().trim();

    const snapshot = await db
      .collection("concepts")
      .where("userId", "==", userId)
      .where("name", "==", normalizedName)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      conceptId: doc.id,
      ...doc.data(),
    } as ConceptNode;
  },

  /**
   * Get concepts by IDs (batch fetch)
   */
  async getConceptsByIds(
    userId: string,
    conceptIds: string[]
  ): Promise<ConceptNode[]> {
    if (conceptIds.length === 0) return [];

    const db = await getAdminDb();
    const concepts: ConceptNode[] = [];

    // Firestore 'in' queries limited to 30 items
    const batches: string[][] = [];
    for (let i = 0; i < conceptIds.length; i += 30) {
      batches.push(conceptIds.slice(i, i + 30));
    }

    for (const batch of batches) {
      const snapshot = await db
        .collection("concepts")
        .where("userId", "==", userId)
        .where("conceptId", "in", batch)
        .get();

      for (const doc of snapshot.docs) {
        concepts.push({
          conceptId: doc.id,
          ...doc.data(),
        } as ConceptNode);
      }
    }

    return concepts;
  },

  /**
   * Search concepts by partial name match
   */
  async searchConcepts(
    userId: string,
    searchTerm: string,
    limit: number = 10
  ): Promise<ConceptNode[]> {
    const db = await getAdminDb();
    const normalizedSearch = searchTerm.toLowerCase().trim();

    // Get all user concepts and filter in memory (Firestore doesn't support full-text search)
    const snapshot = await db
      .collection("concepts")
      .where("userId", "==", userId)
      .get();

    const allConcepts = snapshot.docs.map((doc) => ({
      conceptId: doc.id,
      ...doc.data(),
    })) as ConceptNode[];

    const matches = allConcepts
      .filter((concept) => concept.name.toLowerCase().includes(normalizedSearch))
      .slice(0, limit);

    return matches;
  },
};
