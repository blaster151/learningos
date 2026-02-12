"use client";

import type { MasteryLevel, RelationType } from "@/types";

const MASTERY_COLORS: Record<MasteryLevel, string> = {
  exploring: "#94A3B8", // gray
  learning: "#60A5FA", // blue
  practicing: "#34D399", // green
  comfortable: "#FBBF24", // yellow
  expert: "#A78BFA", // purple
};

const RELATION_TYPES: Array<{ type: RelationType; label: string; color: string }> = [
  { type: "prerequisite", label: "Prerequisite", color: "#EF4444" },
  { type: "builds_on", label: "Builds On", color: "#F59E0B" },
  { type: "similar_to", label: "Similar To", color: "#10B981" },
  { type: "contrasts_with", label: "Contrasts With", color: "#6366F1" },
  { type: "abstracts_to", label: "Abstracts To", color: "#8B5CF6" },
  { type: "applies_to", label: "Applies To", color: "#EC4899" },
  { type: "example_of", label: "Example Of", color: "#14B8A6" },
];

export default function GraphLegend() {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">Legend</h3>

      {/* Mastery Levels */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Mastery Levels
        </h4>
        <div className="space-y-1">
          {Object.entries(MASTERY_COLORS).map(([level, color]) => (
            <div key={level} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-600 capitalize">{level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Relationship Types */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Relationships
        </h4>
        <div className="space-y-1">
          {RELATION_TYPES.map(({ type, label, color }) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-4 h-0.5"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Node Size */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Node Size</h4>
        <p className="text-xs text-gray-500">
          Larger nodes indicate concepts encountered across more learning
          sessions. Hover over a connection line to see its relationship type.
        </p>
      </div>
    </div>
  );
}
