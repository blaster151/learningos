"use client";

import { useRef, useCallback, useEffect } from "react";
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

export default function ConceptGraph({
  data,
  selectedNodeId,
  onNodeClick,
  onBackgroundClick,
  width = 800,
  height = 600,
}: ConceptGraphProps) {
  const graphRef = useRef<any>(null);

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
      if (globalScale > 1.5) {
        ctx.font = `${10 / globalScale}px Sans-Serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#374151";
        ctx.fillText(node.displayName, node.x, node.y + nodeSize + 2);
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

  return (
    <div className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden">
      {/* @ts-ignore - react-force-graph-2d has type mismatches with custom node types */}
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        onNodeClick={handleNodeClick}
        onBackgroundClick={onBackgroundClick}
        linkColor={(link: any) => (link as GraphLink).color || "#CBD5E1"}
        linkWidth={2}
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
    </div>
  );
}
