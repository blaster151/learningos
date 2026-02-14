"use client";

import { useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";
import type { GraphData, GraphNode, GraphLink } from "@/types";

// Dynamically import ForceGraph2D (client-side only)
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface ConceptGraphProps {
  data: GraphData;
  selectedNodeId?: string;
  onNodeClick: (nodeId: string) => void;
  onBackgroundClick: () => void;
  width?: number;
  height?: number;
}

export interface ConceptGraphHandle {
  zoom: (factor: number, duration?: number) => void;
  zoomToFit: (duration?: number, padding?: number) => void;
  centerAt: (x: number, y: number, duration?: number) => void;
}

const ConceptGraph = forwardRef<ConceptGraphHandle, ConceptGraphProps>(function ConceptGraph(
  {
    data,
    selectedNodeId,
    onNodeClick,
    onBackgroundClick,
    width = 800,
    height = 600,
  },
  ref
) {
  const graphRef = useRef<any>(null);

  // Expose graph control methods to parent via ref
  useImperativeHandle(ref, () => ({
    zoom: (factor: number, duration?: number) => {
      graphRef.current?.zoom(factor, duration);
    },
    zoomToFit: (duration?: number, padding?: number) => {
      graphRef.current?.zoomToFit(duration, padding);
    },
    centerAt: (x: number, y: number, duration?: number) => {
      graphRef.current?.centerAt(x, y, duration);
    },
  }));

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      onNodeClick(node.id);
      // Center on node with animation
      if (graphRef.current && node.x !== undefined && node.y !== undefined) {
        graphRef.current.centerAt(node.x, node.y, 500);
        graphRef.current.zoom(1.5, 500);
      }
    },
    [onNodeClick]
  );

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (!node.x || !node.y) return;

      const isSelected = node.id === selectedNodeId;
      const nodeSize = node.size || 5;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? "#3B82F6" : node.color;
      ctx.fill();

      // Draw selection ring
      if (isSelected) {
        ctx.strokeStyle = "#3B82F6";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw label (only if zoomed in enough)
      if (globalScale > 0.8) {
        const label = node.displayName || node.name || node.id;
        const fontSize = Math.max(10 / globalScale, 3);
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        // Use theme-aware color: dark text in light mode, light text in dark mode
        const isDark = document.documentElement.classList.contains('dark');
        ctx.fillStyle = isDark ? "#E5E7EB" : "#374151";
        ctx.fillText(label, node.x, node.y + nodeSize + 2);
      }
    },
    [selectedNodeId]
  );

  const nodePointerAreaPaint = useCallback((node: GraphNode, color: string, ctx: CanvasRenderingContext2D) => {
    if (!node.x || !node.y) return;
    const nodeSize = node.size || 5;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize + 2, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  // Center graph on mount
  useEffect(() => {
    if (graphRef.current && data.nodes.length > 0) {
      setTimeout(() => {
        graphRef.current?.zoomToFit(400, 50);
      }, 100);
    }
  }, [data.nodes.length]);

  // Force redraw when theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Theme class changed on html element, force canvas redraw
      if (graphRef.current) {
        graphRef.current.refresh();
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const RELATION_LABELS: Record<string, string> = {
    prerequisite: "is prerequisite for",
    builds_on: "builds on",
    similar_to: "is similar to",
    contrasts_with: "contrasts with",
    abstracts_to: "abstracts to",
    applies_to: "applies to",
    example_of: "is example of",
  };

  const formatLinkLabel = useCallback((link: any) => {
    const sourceNode = typeof link.source === "object" ? link.source : null;
    const targetNode = typeof link.target === "object" ? link.target : null;
    const sourceName = sourceNode?.displayName || sourceNode?.name || link.source;
    const targetName = targetNode?.displayName || targetNode?.name || link.target;
    const verb = RELATION_LABELS[link.type] || link.type?.replace(/_/g, " ") || "relates to";
    return `${sourceName} ${verb} ${targetName}`;
  }, []);

  // Link click handler (for touch users who can't hover)
  const [linkTooltip, setLinkTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const handleLinkClick = useCallback((link: any, event: MouseEvent) => {
    const label = formatLinkLabel(link);
    setLinkTooltip({ text: label, x: event.clientX, y: event.clientY });
    // Auto-dismiss after 3 seconds
    setTimeout(() => setLinkTooltip(null), 3000);
  }, [formatLinkLabel]);

  // Dismiss tooltip on background click
  const handleBackgroundClick = useCallback(() => {
    setLinkTooltip(null);
    onBackgroundClick();
  }, [onBackgroundClick]);

  return (
    <div className="relative w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
      {/* @ts-ignore - react-force-graph-2d has type mismatches with custom node types */}
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        nodeLabel={(node: any) => node.displayName || node.name || node.id}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        linkLabel={formatLinkLabel}
        linkColor={(link: any) => (link as GraphLink).color || "#CBD5E1"}
        linkWidth={(link: any) => link.__hover ? 4 : 2}
        onLinkHover={(link: any, prevLink: any) => {
          if (prevLink) prevLink.__hover = false;
          if (link) link.__hover = true;
        }}
        onLinkClick={handleLinkClick}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        width={width}
        height={height}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />

      {/* Link tooltip (for touch/click on links) */}
      {linkTooltip && (
        <div
          className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none max-w-xs"
          style={{
            left: Math.min(linkTooltip.x + 10, window.innerWidth - 250),
            top: linkTooltip.y - 40,
          }}
        >
          {linkTooltip.text}
        </div>
      )}
    </div>
  );
});

export default ConceptGraph;
