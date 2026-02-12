// Enhanced Concept Extraction Service
// Extracts concepts with domain, relations, and richer metadata

import { openai, AI_CONFIG } from "@/lib/ai/config";
import { trackTokenUsage } from "@/lib/ai/tokenTracker";
import type { RelationType } from "@/types";

// ===================================
// Types
// ===================================

export interface EnhancedExtractedConcept {
  name: string;
  definition: string;
  domain: string;
  category?: string;
  confidence: number; // 0-1
  contextInMessage: string; // Where in message this was mentioned
  potentialRelations?: Array<{
    relatedTo: string;
    relationType: RelationType;
  }>;
}

interface ExtractionContext {
  existingConcepts: string[]; // Names of user's existing concepts
  sessionTopic?: string;
  messageRole: "user" | "assistant";
}

interface ExtractionResult {
  concepts: EnhancedExtractedConcept[];
  mainTopic?: string;
}

// ===================================
// Extraction Prompt
// ===================================

const ENHANCED_EXTRACTION_PROMPT = `You are a learning concept extractor for an educational platform. Analyze the message and identify key learning concepts.

For each concept, extract:
1. name: Concise name (2-5 words, use standard terminology)
2. definition: Clear, educational definition (1-2 sentences)
3. domain: Primary domain (programming, mathematics, science, algorithms, data_structures, web_development, databases, machine_learning, networking, security, other)
4. category: Subcategory within domain (optional)
5. confidence: How clearly this concept was discussed (0.0-1.0)
6. contextInMessage: Brief quote showing where concept was discussed
7. potentialRelations: Array of potential connections to other concepts mentioned

Relation types to use:
- "prerequisite": Concept A must be understood before B
- "builds_on": Concept B extends A
- "similar_to": Concepts are related/comparable  
- "contrasts_with": Concepts differ in important ways
- "example_of": A is an instance of B
- "applies_to": A is used in context of B

RULES:
- Only extract actual learning concepts (not conversational phrases)
- Focus on technical/educational concepts that can be learned
- If user asks about something, that topic IS a concept they're learning
- If AI explains something, those explanations contain concepts
- Be specific: "Python variables" not just "variables" if context is Python
- Maximum 5 concepts per message to avoid noise
- Minimum confidence 0.5 to include

Return JSON:
{
  "concepts": [...],
  "mainTopic": "Brief summary of what's being discussed"
}`;

// ===================================
// Main Extraction Function  
// ===================================

export async function extractConceptsEnhanced(
  message: string,
  context: ExtractionContext
): Promise<ExtractionResult> {
  try {
    // Skip very short messages
    if (message.length < 20) {
      return { concepts: [] };
    }

    // Build context-aware prompt
    const contextInfo = buildContextInfo(context);

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.FALLBACK_MODEL, // Use cheaper model for extraction
      messages: [
        { role: "system", content: ENHANCED_EXTRACTION_PROMPT },
        { 
          role: "user", 
          content: `${contextInfo}\n\nMESSAGE TO ANALYZE (from ${context.messageRole}):\n${message}` 
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { concepts: [] };
    }

    const parsed = JSON.parse(content) as ExtractionResult;

    // Validate and filter
    const validConcepts = (parsed.concepts || []).filter(c => 
      c.name && 
      c.name.length >= 2 && 
      c.name.length <= 50 &&
      c.definition &&
      c.confidence >= 0.5
    );

    // Normalize concept names
    const normalizedConcepts = validConcepts.map(c => ({
      ...c,
      name: normalizeName(c.name),
      domain: normalizeDomain(c.domain),
    }));

    return {
      concepts: normalizedConcepts,
      mainTopic: parsed.mainTopic,
    };
  } catch (error) {
    console.error("Error in enhanced concept extraction:", error);
    return { concepts: [] };
  }
}

// ===================================
// Helper Functions
// ===================================

function buildContextInfo(context: ExtractionContext): string {
  const parts: string[] = [];

  if (context.sessionTopic) {
    parts.push(`SESSION TOPIC: ${context.sessionTopic}`);
  }

  if (context.existingConcepts.length > 0) {
    // Provide some existing concepts for relation detection
    const sample = context.existingConcepts.slice(0, 15).join(", ");
    parts.push(`USER'S KNOWN CONCEPTS (sample): ${sample}`);
    parts.push("Look for potential relations to these existing concepts.");
  }

  return parts.join("\n");
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")  // Normalize whitespace
    .replace(/['"]/g, ""); // Remove quotes
}

function normalizeDomain(domain: string): string {
  const domainMap: Record<string, string> = {
    "programming": "programming",
    "coding": "programming",
    "software": "programming",
    "math": "mathematics",
    "maths": "mathematics", 
    "mathematics": "mathematics",
    "algo": "algorithms",
    "algorithm": "algorithms",
    "algorithms": "algorithms",
    "data structure": "data_structures",
    "data structures": "data_structures",
    "data_structures": "data_structures",
    "web": "web_development",
    "web dev": "web_development",
    "web_development": "web_development",
    "frontend": "web_development",
    "backend": "web_development",
    "database": "databases",
    "databases": "databases",
    "sql": "databases",
    "ml": "machine_learning",
    "ai": "machine_learning",
    "machine learning": "machine_learning",
    "machine_learning": "machine_learning",
    "network": "networking",
    "networking": "networking",
    "security": "security",
    "cybersecurity": "security",
    "science": "science",
    "physics": "science",
    "chemistry": "science",
    "biology": "science",
  };

  const normalized = domain.toLowerCase().trim();
  return domainMap[normalized] || "other";
}

// ===================================
// Batch Extraction for Multiple Messages
// ===================================

export async function extractConceptsFromConversation(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  existingConcepts: string[] = [],
  sessionTopic?: string
): Promise<ExtractionResult> {
  // Combine messages for context
  const allConcepts: EnhancedExtractedConcept[] = [];
  const seenNames = new Set<string>();

  for (const msg of messages) {
    const result = await extractConceptsEnhanced(msg.content, {
      existingConcepts,
      sessionTopic,
      messageRole: msg.role,
    });

    for (const concept of result.concepts) {
      const normalizedName = concept.name.toLowerCase();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        allConcepts.push(concept);
      }
    }

    // Add newly found concepts to context for subsequent messages
    existingConcepts = [...existingConcepts, ...result.concepts.map(c => c.name)];
  }

  return { concepts: allConcepts };
}
