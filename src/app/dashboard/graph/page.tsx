"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGraph } from "@/lib/hooks/useGraph";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  ConceptGraph,
  GraphControls,
  GraphFilters,
  GraphLegend,
  ConceptDetailPanel,
  SkeletonGraph,
} from "@/components/graph";
import type { ConceptGraphHandle } from "@/components/graph/ConceptGraph";

export default function GraphPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const graphRef = useRef<ConceptGraphHandle>(null);

  const { graphData, filters, setFilters, availableDomains, loading, error, stats } =
    useGraph({ user });

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoom(1.2, 200);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoom(0.8, 200);
    }
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
      setSelectedNodeId(null);
    }
  }, []);

  const handleAskAbout = useCallback(
    (conceptName: string, conceptId: string) => {
      router.push(
        `/dashboard/chat?concept=${encodeURIComponent(conceptName)}&conceptId=${encodeURIComponent(conceptId)}`
      );
    },
    [router]
  );

  return (
    <div className="h-full flex flex-col -m-4 lg:-m-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Knowledge Graph</h1>
          {stats && (
            <p className="text-sm text-gray-600 mt-1">
              {stats.totalConcepts} concepts · {stats.totalRelations} connections
            </p>
          )}
        </div>
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="lg:hidden p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          aria-label={showSidebar ? "Hide filters" : "Show filters"}
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm4 4a1 1 0 011-1h8a1 1 0 010 2H8a1 1 0 01-1-1zm2 4a1 1 0 011-1h4a1 1 0 010 2h-4a1 1 0 01-1-1z" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar — hidden on mobile, shown via toggle */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
        <div
          className={`
            fixed top-0 left-0 z-40 h-full w-72 sm:w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4 space-y-4
            transform transition-transform duration-200 ease-in-out
            lg:static lg:translate-x-0 lg:z-auto lg:w-80 lg:min-w-[320px] lg:flex-shrink-0
            ${showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <GraphFilters
            filters={filters}
            availableDomains={availableDomains}
            onChange={setFilters}
          />
          <GraphLegend />
          
          {stats && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Mastery Distribution
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.masteryDistribution || {}).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{level}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Graph */}
        <div className="flex-1 relative">
          {loading && <SkeletonGraph />}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="max-w-md mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Error Loading Graph
                  </h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && graphData && graphData.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Concepts Yet
                </h3>
                <p className="text-gray-600">
                  Start learning to build your knowledge graph! Concepts will
                  appear here as you progress through sessions.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && graphData && graphData.nodes.length > 0 && (
            <>
              <ConceptGraph
                ref={graphRef}
                data={graphData}
                selectedNodeId={selectedNodeId || undefined}
                onNodeClick={handleNodeClick}
                onBackgroundClick={handleBackgroundClick}
                width={typeof window !== "undefined" ? (window.innerWidth >= 1024 ? window.innerWidth - 320 : window.innerWidth) : 800}
                height={typeof window !== "undefined" ? window.innerHeight - 140 : 600}
              />
              <GraphControls
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFitToScreen={handleFitToScreen}
                onResetView={handleResetView}
              />
            </>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedNodeId && (
        <ConceptDetailPanel
          conceptId={selectedNodeId}
          userId={user?.uid || ""}
          onClose={handleCloseDetail}
          onAskAbout={handleAskAbout}
        />
      )}
    </div>
  );
}
