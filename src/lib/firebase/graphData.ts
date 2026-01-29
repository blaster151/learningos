// Graph Data Firebase Service
// Fetches and prepares data for graph visualization

import { getAdminDb } from "@/lib/firebase/admin";
import type { ConceptNode, ConceptRelation, GraphData, GraphFilters } from "@/types";
import { transformGraphData } from "@/lib/graph/transformGraphData";

// ===================================
// Graph Data Service
// ===================================

export const graphDataService = {
  /**
   * Get full graph data for a user
   */
  async getUserGraph(userId: string, filters?: GraphFilters): Promise<GraphData> {
    const db = await getAdminDb();

    // Fetch concepts
    let conceptsQuery = db
      .collection("concepts")
      .where("userId", "==", userId);

    // Apply filters
    if (filters?.domains && filters.domains.length > 0) {
      conceptsQuery = conceptsQuery.where("domain", "in", filters.domains);
    }

    if (filters?.masteryLevels && filters.masteryLevels.length > 0) {
      conceptsQuery = conceptsQuery.where(
        "masteryLevel",
        "in",
        filters.masteryLevels
      );
    }

    const conceptsSnapshot = await conceptsQuery.get();
    let concepts = conceptsSnapshot.docs.map((doc) => ({
      conceptId: doc.id,
      ...(doc.data() as Omit<ConceptNode, "conceptId">),
    })) as ConceptNode[];

    // Apply search filter
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      concepts = concepts.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.definition?.toLowerCase().includes(query)
      );
    }

    // Fetch relations for these concepts
    const conceptIds = concepts.map((c) => c.conceptId);
    const relationsSnapshot = await db
      .collection("concept_relations")
      .where("userId", "==", userId)
      .get();

    const relations = relationsSnapshot.docs
      .map((doc) => ({
        relationId: doc.id,
        ...(doc.data() as Omit<ConceptRelation, "relationId">),
      }))
      .filter(
        (r) =>
          conceptIds.includes(r.sourceConceptId) &&
          conceptIds.includes(r.targetConceptId)
      ) as ConceptRelation[];

    // Transform to graph format
    return transformGraphData(concepts, relations);
  },

  /**
   * Get available domains for filtering
   */
  async getAvailableDomains(userId: string): Promise<string[]> {
    const db = await getAdminDb();
    const snapshot = await db
      .collection("concepts")
      .where("userId", "==", userId)
      .get();

    const domains = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const domain = doc.data().domain;
      if (domain) domains.add(domain);
    });

    return Array.from(domains).sort();
  },

  /**
   * Get graph statistics
   */
  async getGraphStats(userId: string): Promise<{
    totalConcepts: number;
    totalRelations: number;
    domainCounts: Record<string, number>;
    masteryDistribution: Record<string, number>;
  }> {
    const db = await getAdminDb();

    // Get concepts
    const conceptsSnapshot = await db
      .collection("concepts")
      .where("userId", "==", userId)
      .get();

    // Get relations
    const relationsSnapshot = await db
      .collection("concept_relations")
      .where("userId", "==", userId)
      .get();

    const domainCounts: Record<string, number> = {};
    const masteryDistribution: Record<string, number> = {
      exploring: 0,
      learning: 0,
      practicing: 0,
      comfortable: 0,
      expert: 0,
    };

    conceptsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      
      // Count by domain
      const domain = data.domain || "other";
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;

      // Count by mastery
      const mastery = data.masteryLevel || "exploring";
      masteryDistribution[mastery] = (masteryDistribution[mastery] || 0) + 1;
    });

    return {
      totalConcepts: conceptsSnapshot.size,
      totalRelations: relationsSnapshot.size,
      domainCounts,
      masteryDistribution,
    };
  },

  /**
   * Get concept with its immediate neighbors
   */
  async getConceptNeighborhood(
    userId: string,
    conceptId: string
  ): Promise<GraphData> {
    const db = await getAdminDb();

    // Get the concept
    const conceptDoc = await db.collection("concepts").doc(conceptId).get();
    if (!conceptDoc.exists) {
      return { nodes: [], links: [] };
    }

    const concept = {
      conceptId: conceptDoc.id,
      ...(conceptDoc.data() as Omit<ConceptNode, "conceptId">),
    } as ConceptNode;

    // Get relations involving this concept
    const outgoingSnapshot = await db
      .collection("concept_relations")
      .where("userId", "==", userId)
      .where("sourceConceptId", "==", conceptId)
      .get();

    const incomingSnapshot = await db
      .collection("concept_relations")
      .where("userId", "==", userId)
      .where("targetConceptId", "==", conceptId)
      .get();

    // Collect neighbor concept IDs
    const neighborIds = new Set<string>();
    const relations: ConceptRelation[] = [];

    outgoingSnapshot.docs.forEach((doc) => {
      const data = doc.data() as Omit<ConceptRelation, "relationId">;
      neighborIds.add(data.targetConceptId);
      relations.push({
        relationId: doc.id,
        ...data,
      } as ConceptRelation);
    });

    incomingSnapshot.docs.forEach((doc) => {
      const data = doc.data() as Omit<ConceptRelation, "relationId">;
      neighborIds.add(data.sourceConceptId);
      relations.push({
        relationId: doc.id,
        ...data,
      } as ConceptRelation);
    });

    // Fetch neighbor concepts
    const neighbors: ConceptNode[] = [];
    for (const neighborId of neighborIds) {
      const neighborDoc = await db.collection("concepts").doc(neighborId).get();
      if (neighborDoc.exists) {
        neighbors.push({
          conceptId: neighborDoc.id,
          ...(neighborDoc.data() as Omit<ConceptNode, "conceptId">),
        } as ConceptNode);
      }
    }

    // Transform to graph format
    return transformGraphData([concept, ...neighbors], relations);
  },
};
