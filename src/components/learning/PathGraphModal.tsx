"use client";

import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { useGraph } from "@/lib/hooks/useGraph";
import { ConceptGraph, GraphLegend } from "@/components/graph";
import type { ConceptGraphHandle } from "@/components/graph/ConceptGraph";
import type { User } from "firebase/auth";
import type { LearningPath } from "@/types";

interface PathGraphModalProps {
  path: LearningPath;
  user: User;
  onClose: () => void;
}

export default function PathGraphModal({ path, user, onClose }: PathGraphModalProps) {
  const graphRef = useRef<ConceptGraphHandle>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });

  // Collect all unique concept IDs from the path's milestones
  const pathConceptIds = useMemo(() => {
    const ids = new Set<string>();
    for (const milestone of path.milestones) {
      if (milestone.conceptIds) {
        for (const id of milestone.conceptIds) {
          ids.add(id);
        }
      }
    }
    return Array.from(ids);
  }, [path.milestones]);

  const { graphData, loading, error, stats } = useGraph({
    user,
    conceptIds: pathConceptIds,
  });

  const handleNodeClick = useCallback(() => {
    // Could open concept detail — for now just center on it
  }, []);

  const handleBackgroundClick = useCallback(() => {}, []);

  // Measure the graph container and update dimensions on resize
  useEffect(() => {
    const container = graphContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setGraphDimensions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      }
    };

    // Initial measurement
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Build a milestone → concept mapping for the legend
  const milestoneConcepts = useMemo(() => {
    return path.milestones.map((ms, idx) => ({
      title: `${idx + 1}. ${ms.title}`,
      status: ms.status,
      conceptNames: ms.conceptNames || [],
    }));
  }, [path.milestones]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 sm:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Knowledge Map: {path.title}
            </h2>
            {stats && (
              <p className="text-sm text-gray-600 mt-0.5">
                {stats.totalConcepts} concepts · {stats.totalRelations} connections
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => graphRef.current?.zoomToFit(400, 50)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-white transition-colors"
              title="Fit to screen"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Graph area */}
          <div ref={graphContainerRef} className="flex-1 relative min-h-0">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Loading knowledge map...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center text-red-600">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {graphData && graphData.nodes.length > 0 && (
              <ConceptGraph
                ref={graphRef}
                data={graphData}
                onNodeClick={handleNodeClick}
                onBackgroundClick={handleBackgroundClick}
                width={graphDimensions.width}
                height={graphDimensions.height}
              />
            )}

            {graphData && graphData.nodes.length === 0 && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-gray-600 font-medium">No concepts mapped yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start learning with AI to build your knowledge map
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — milestone breakdown */}
          <div className="hidden lg:block w-72 border-l border-gray-200 overflow-y-auto bg-gray-50 p-4 space-y-4">
            {/* Milestone breakdown */}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Milestones</h3>
              <div className="space-y-3">
                {milestoneConcepts.map((ms, idx) => {
                  const statusIcon = ms.status === "completed" ? "✅" 
                    : ms.status === "in_progress" ? "▶️" 
                    : ms.status === "available" ? "⚡"
                    : "⏳";
                  return (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start gap-2">
                        <span className="text-xs mt-0.5">{statusIcon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 leading-tight">
                            {ms.title}
                          </p>
                          {ms.conceptNames.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {ms.conceptNames.map((name, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 rounded"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <GraphLegend />
          </div>
        </div>
      </div>
    </>
  );
}
