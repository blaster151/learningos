"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface SkeletonGraphProps {
  className?: string;
}

/**
 * Skeleton placeholder for the graph visualization.
 * Shows animated circles connected by lines to suggest the graph structure.
 */
export function SkeletonGraph({ className }: SkeletonGraphProps) {
  // Predefined positions for a natural-looking skeleton graph
  const nodes = [
    { x: 50, y: 40, size: 48 },
    { x: 25, y: 65, size: 36 },
    { x: 75, y: 60, size: 40 },
    { x: 40, y: 80, size: 32 },
    { x: 65, y: 85, size: 28 },
    { x: 15, y: 35, size: 24 },
    { x: 85, y: 30, size: 28 },
  ];

  const edges = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 1, to: 3 },
    { from: 2, to: 4 },
    { from: 0, to: 5 },
    { from: 0, to: 6 },
    { from: 2, to: 6 },
  ];

  return (
    <div
      className={cn(
        "relative w-full h-full min-h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Animated background pulse */}
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" />

      {/* SVG for edges */}
      <svg className="absolute inset-0 w-full h-full opacity-30">
        {edges.map((edge, i) => (
          <line
            key={i}
            x1={`${nodes[edge.from].x}%`}
            y1={`${nodes[edge.from].y}%`}
            x2={`${nodes[edge.to].x}%`}
            y2={`${nodes[edge.to].y}%`}
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-300 dark:text-gray-600"
          />
        ))}
      </svg>

      {/* Skeleton nodes */}
      {nodes.map((node, i) => (
        <div
          key={i}
          className="absolute animate-pulse"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="rounded-full bg-gray-300 dark:bg-gray-600"
            style={{
              width: node.size,
              height: node.size,
            }}
          />
        </div>
      ))}

      {/* Loading text */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-500 dark:text-gray-400">
        Loading knowledge graph...
      </div>
    </div>
  );
}

export default SkeletonGraph;
