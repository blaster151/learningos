"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";

// ===================================
// Types
// ===================================

export interface ConceptData {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  category?: string;
  masteryLevel?: number;
}

interface ConceptTagProps {
  concept: ConceptData;
  onClick?: (concept: ConceptData) => void;
}

interface ConceptDetailPanelProps {
  concept: ConceptData;
  onClose: () => void;
}

// ===================================
// Concept Tag Component
// ===================================

export function ConceptTag({ concept, onClick }: ConceptTagProps) {
  // Get category color
  const getCategoryColor = (category?: string): string => {
    const colors: Record<string, string> = {
      programming: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      mathematics: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      science: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      language: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      history: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      art: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
      business: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
      technology: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
      other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
    return colors[category || "other"] || colors.other;
  };

  return (
    <button
      onClick={() => onClick?.(concept)}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full transition-all hover:scale-105 hover:shadow-sm ${getCategoryColor(concept.category)}`}
      title={concept.description || concept.name}
    >
      <span className="text-[10px]">💡</span>
      <span>{concept.displayName || concept.name}</span>
    </button>
  );
}

// ===================================
// Concept Detail Panel Component
// ===================================

export function ConceptDetailPanel({ concept, onClose }: ConceptDetailPanelProps) {
  // Get mastery level label
  const getMasteryLabel = (level?: number): { label: string; color: string } => {
    if (!level || level < 20) return { label: "Just Learning", color: "text-gray-500" };
    if (level < 40) return { label: "Getting Familiar", color: "text-yellow-500" };
    if (level < 60) return { label: "Understanding", color: "text-blue-500" };
    if (level < 80) return { label: "Confident", color: "text-green-500" };
    return { label: "Mastered", color: "text-purple-500" };
  };

  const mastery = getMasteryLabel(concept.masteryLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
      <Card className="w-full max-w-md shadow-xl animate-in zoom-in-95">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {concept.category || "Concept"}
              </p>
              <CardTitle className="text-xl">
                {concept.displayName || concept.name}
              </CardTitle>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description */}
          {concept.description && (
            <p className="text-gray-600 dark:text-gray-400">
              {concept.description}
            </p>
          )}

          {/* Mastery Level */}
          {concept.masteryLevel !== undefined && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">Your Mastery</span>
                <span className={`font-medium ${mastery.color}`}>
                  {mastery.label}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${concept.masteryLevel}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">
                {concept.masteryLevel}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                // TODO: Navigate to practice or chat about this concept
                onClose();
              }}
            >
              Practice This
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===================================
// Concept Tags List Component
// ===================================

interface ConceptTagsListProps {
  concepts: ConceptData[];
  onConceptClick?: (concept: ConceptData) => void;
}

export function ConceptTagsList({ concepts, onConceptClick }: ConceptTagsListProps) {
  const [selectedConcept, setSelectedConcept] = useState<ConceptData | null>(null);

  const handleClick = (concept: ConceptData) => {
    setSelectedConcept(concept);
    onConceptClick?.(concept);
  };

  if (concepts.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {concepts.map((concept) => (
          <ConceptTag
            key={concept.id}
            concept={concept}
            onClick={handleClick}
          />
        ))}
      </div>

      {/* Detail Panel */}
      {selectedConcept && (
        <ConceptDetailPanel
          concept={selectedConcept}
          onClose={() => setSelectedConcept(null)}
        />
      )}
    </>
  );
}

export default ConceptTag;
