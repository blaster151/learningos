/**
 * Graph Data Transformer
 * Transforms raw concept/relation data into react-force-graph format
 * with intelligent layout hints and visual properties.
 */

import type { ConceptNode, ConceptRelation, MasteryLevel, RelationType } from "@/types";

// ===================================
// Types
// ===================================

export interface GraphNode {
  id: string;
  name: string;
  displayName: string;
  mastery: MasteryLevel;
  domain: string;
  size: number;
  color: string;
  val: number; // For force-graph node mass
  x?: number;
  y?: number;
  fx?: number; // Fixed x position
  fy?: number; // Fixed y position
}

export interface GraphLink {
  source: string;
  target: string;
  type: RelationType;
  strength: number;
  color: string;
  curvature?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphFilters {
  domains: string[];
  masteryLevels: MasteryLevel[];
  searchQuery: string;
}

export interface TransformOptions {
  maxNodes?: number;
  clusterByDomain?: boolean;
  highlightPath?: string[]; // Concept IDs to highlight
  filters?: GraphFilters;
}

// ===================================
// Constants
// ===================================

export const MASTERY_COLORS: Record<MasteryLevel, string> = {
  exploring: "#94A3B8",    // Slate - just started
  learning: "#60A5FA",     // Blue - building understanding
  practicing: "#A78BFA",   // Purple - applying knowledge
  comfortable: "#34D399",  // Green - solid understanding
  expert: "#FBBF24",       // Gold - fully mastered
};

export const RELATION_COLORS: Record<RelationType, string> = {
  prerequisite: "#EF4444",     // Red - strong dependency
  builds_on: "#F97316",        // Orange - extends
  similar_to: "#8B5CF6",       // Purple - related
  contrasts_with: "#EC4899",   // Pink - different
  abstracts_to: "#06B6D4",     // Cyan - generalization
  applies_to: "#10B981",       // Emerald - application
  example_of: "#6366F1",       // Indigo - instance
};

// Node size range (in pixels for canvas rendering)
const MIN_NODE_SIZE = 8;
const MAX_NODE_SIZE = 24;

// ===================================
// Helper Functions
// ===================================

/**
 * Calculate node size based on exposure count using logarithmic scale.
 * Prevents nodes with many exposures from dominating the graph.
 */
export function calculateNodeSize(exposureCount: number): number {
  if (exposureCount <= 0) return MIN_NODE_SIZE;
  
  // Logarithmic scale: size = min + (max - min) * log(count + 1) / log(maxExpectedCount)
  const maxExpectedCount = 50; // Assume 50 exposures is "very high"
  const logScale = Math.log(exposureCount + 1) / Math.log(maxExpectedCount + 1);
  const clampedScale = Math.min(1, Math.max(0, logScale));
  
  return MIN_NODE_SIZE + (MAX_NODE_SIZE - MIN_NODE_SIZE) * clampedScale;
}

/**
 * Get the color for a mastery level.
 */
export function getMasteryColor(level: MasteryLevel): string {
  return MASTERY_COLORS[level] || MASTERY_COLORS.exploring;
}

/**
 * Get the color for a relation type.
 */
export function getRelationColor(type: RelationType): string {
  return RELATION_COLORS[type] || "#CBD5E1"; // Default slate
}

/**
 * Calculate link curvature to prevent overlapping edges.
 * Returns a small offset for multiple links between same nodes.
 */
function calculateLinkCurvature(
  links: GraphLink[],
  source: string,
  target: string
): number {
  // Count existing links between these nodes
  const existingLinks = links.filter(
    (l) =>
      (l.source === source && l.target === target) ||
      (l.source === target && l.target === source)
  );
  
  if (existingLinks.length === 0) return 0;
  
  // Alternate curvature direction for multiple links
  const index = existingLinks.length;
  const direction = index % 2 === 0 ? 1 : -1;
  return direction * 0.2 * Math.ceil(index / 2);
}

/**
 * Get exposure count from a concept node.
 * Falls back to session count if exposureCount not present.
 */
function getExposureCount(concept: ConceptNode): number {
  // Try direct exposure count first
  if ("exposureCount" in concept && typeof (concept as any).exposureCount === "number") {
    return (concept as any).exposureCount;
  }
  // Fall back to session IDs length
  return concept.sessionIds?.length || 1;
}

/**
 * Check if a concept matches the given filters.
 */
function matchesFilters(concept: ConceptNode, filters?: GraphFilters): boolean {
  if (!filters) return true;
  
  // Domain filter
  if (filters.domains.length > 0 && !filters.domains.includes(concept.domain)) {
    return false;
  }
  
  // Mastery level filter
  if (
    filters.masteryLevels.length > 0 &&
    !filters.masteryLevels.includes(concept.masteryLevel)
  ) {
    return false;
  }
  
  // Search query filter
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    const matchesName = concept.name.toLowerCase().includes(query);
    const matchesDefinition = concept.definition?.toLowerCase().includes(query);
    if (!matchesName && !matchesDefinition) {
      return false;
    }
  }
  
  return true;
}

// ===================================
// Main Transform Function
// ===================================

/**
 * Transform raw concept and relation data into react-force-graph format.
 */
export function transformGraphData(
  concepts: ConceptNode[],
  relations: ConceptRelation[],
  options: TransformOptions = {}
): GraphData {
  const { maxNodes, clusterByDomain, highlightPath, filters } = options;
  
  // Filter concepts
  let filteredConcepts = concepts.filter((c) => matchesFilters(c, filters));
  
  // Sort by exposure (most exposed first) to keep important nodes when limiting
  filteredConcepts.sort((a, b) => getExposureCount(b) - getExposureCount(a));
  
  // Limit nodes if specified
  if (maxNodes && filteredConcepts.length > maxNodes) {
    filteredConcepts = filteredConcepts.slice(0, maxNodes);
  }
  
  // Create a set of included concept IDs for quick lookup
  const includedIds = new Set(filteredConcepts.map((c) => c.conceptId));
  
  // Transform concepts to graph nodes
  const nodes: GraphNode[] = filteredConcepts.map((concept) => {
    const exposureCount = getExposureCount(concept);
    const isHighlighted = highlightPath?.includes(concept.conceptId);
    
    return {
      id: concept.conceptId,
      name: concept.name || concept.conceptId,
      displayName: concept.name
        ? concept.name.charAt(0).toUpperCase() + concept.name.slice(1)
        : concept.conceptId,
      mastery: concept.masteryLevel,
      domain: concept.domain,
      size: calculateNodeSize(exposureCount),
      color: isHighlighted ? "#3B82F6" : getMasteryColor(concept.masteryLevel),
      val: exposureCount + 1, // Node mass for physics simulation
    };
  });
  
  // Filter relations to only include those between included nodes
  const filteredRelations = relations.filter(
    (r) => includedIds.has(r.sourceConceptId) && includedIds.has(r.targetConceptId)
  );
  
  // Transform relations to graph links
  const links: GraphLink[] = [];
  
  for (const relation of filteredRelations) {
    const link: GraphLink = {
      source: relation.sourceConceptId,
      target: relation.targetConceptId,
      type: relation.relationType,
      strength: relation.strength,
      color: getRelationColor(relation.relationType),
      curvature: calculateLinkCurvature(
        links,
        relation.sourceConceptId,
        relation.targetConceptId
      ),
    };
    links.push(link);
  }
  
  // If clustering by domain, add initial positions based on domain
  if (clusterByDomain) {
    const domains = [...new Set(nodes.map((n) => n.domain))];
    const domainAngles: Record<string, number> = {};
    
    domains.forEach((domain, index) => {
      domainAngles[domain] = (2 * Math.PI * index) / domains.length;
    });
    
    const clusterRadius = 200;
    nodes.forEach((node) => {
      const angle = domainAngles[node.domain] || 0;
      // Add some randomness within the cluster
      const jitter = Math.random() * 50 - 25;
      node.x = Math.cos(angle) * clusterRadius + jitter;
      node.y = Math.sin(angle) * clusterRadius + jitter;
    });
  }
  
  return { nodes, links };
}

// ===================================
// Statistics Helpers
// ===================================

export interface GraphStats {
  totalNodes: number;
  totalLinks: number;
  domainCounts: Record<string, number>;
  masteryCounts: Record<MasteryLevel, number>;
  relationTypeCounts: Record<RelationType, number>;
  averageConnections: number;
  isolatedNodes: number;
}

/**
 * Calculate statistics about the graph data.
 */
export function calculateGraphStats(data: GraphData): GraphStats {
  const domainCounts: Record<string, number> = {};
  const masteryCounts: Record<MasteryLevel, number> = {
    exploring: 0,
    learning: 0,
    practicing: 0,
    comfortable: 0,
    expert: 0,
  };
  const relationTypeCounts: Record<RelationType, number> = {
    prerequisite: 0,
    builds_on: 0,
    similar_to: 0,
    contrasts_with: 0,
    abstracts_to: 0,
    applies_to: 0,
    example_of: 0,
  };
  
  // Count domains and mastery levels
  for (const node of data.nodes) {
    domainCounts[node.domain] = (domainCounts[node.domain] || 0) + 1;
    masteryCounts[node.mastery] = (masteryCounts[node.mastery] || 0) + 1;
  }
  
  // Count relation types
  for (const link of data.links) {
    relationTypeCounts[link.type] = (relationTypeCounts[link.type] || 0) + 1;
  }
  
  // Calculate connection counts per node
  const connectionCounts: Record<string, number> = {};
  for (const link of data.links) {
    connectionCounts[link.source] = (connectionCounts[link.source] || 0) + 1;
    connectionCounts[link.target] = (connectionCounts[link.target] || 0) + 1;
  }
  
  // Calculate average and isolated nodes
  const totalConnections = Object.values(connectionCounts).reduce((a, b) => a + b, 0);
  const averageConnections = data.nodes.length > 0 
    ? totalConnections / data.nodes.length 
    : 0;
  
  const isolatedNodes = data.nodes.filter(
    (n) => !connectionCounts[n.id]
  ).length;
  
  return {
    totalNodes: data.nodes.length,
    totalLinks: data.links.length,
    domainCounts,
    masteryCounts,
    relationTypeCounts,
    averageConnections: Math.round(averageConnections * 10) / 10,
    isolatedNodes,
  };
}

/**
 * Get unique domains from graph data.
 */
export function getUniqueDomains(data: GraphData): string[] {
  return [...new Set(data.nodes.map((n) => n.domain))].sort();
}
