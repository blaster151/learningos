/**
 * Tests for ConceptGraph component
 * 
 * Note: ConceptGraph uses react-force-graph-2d which renders to Canvas.
 * These tests verify the component's basic structure and props handling,
 * but full visual testing would require integration/E2E tests.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ConceptGraph from "@/components/graph/ConceptGraph";
import type { GraphData } from "@/types";

// Mock next/dynamic to return a simple component
vi.mock("next/dynamic", () => ({
  default: () => {
    // Return a mock component that just renders a container
    const MockForceGraph = ({ graphData, onNodeClick, onBackgroundClick }: any) => (
      <div data-testid="force-graph-mock">
        <span>Mock Graph with {graphData?.nodes?.length || 0} nodes</span>
      </div>
    );
    MockForceGraph.displayName = "MockForceGraph";
    return MockForceGraph;
  },
}));

describe("ConceptGraph", () => {
  const mockGraphData: GraphData = {
    nodes: [
      {
        id: "concept-1",
        name: "JavaScript",
        displayName: "JavaScript",
        mastery: "learning",
        domain: "Programming",
        size: 10,
        color: "#10b981",
      },
      {
        id: "concept-2",
        name: "React",
        displayName: "React",
        mastery: "exploring",
        domain: "Frontend",
        size: 8,
        color: "#3b82f6",
      },
    ],
    links: [
      {
        source: "concept-1",
        target: "concept-2",
        type: "prerequisite",
        strength: 0.8,
        color: "#6366f1",
      },
    ],
  };

  const mockProps = {
    data: mockGraphData,
    selectedNodeId: undefined,
    onNodeClick: vi.fn(),
    onBackgroundClick: vi.fn(),
    width: 800,
    height: 600,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the graph component wrapper", () => {
    render(<ConceptGraph {...mockProps} />);
    // The wrapper div should render with expected classes
    const wrapper = document.querySelector(".bg-gray-50");
    expect(wrapper).toBeInTheDocument();
  });

  it("handles empty graph data", () => {
    const emptyData: GraphData = { nodes: [], links: [] };
    const { container } = render(<ConceptGraph {...mockProps} data={emptyData} />);
    
    // Should still render the container
    expect(container.firstChild).toBeInTheDocument();
  });

  it("accepts custom dimensions", () => {
    const { container } = render(
      <ConceptGraph {...mockProps} width={1000} height={800} />
    );
    
    // The wrapper div should be present
    const wrapper = container.querySelector("div");
    expect(wrapper).toBeInTheDocument();
  });

  it("accepts selectedNodeId prop", () => {
    // Should not throw when selectedNodeId is provided
    expect(() =>
      render(<ConceptGraph {...mockProps} selectedNodeId="concept-1" />)
    ).not.toThrow();
  });

  it("provides callback props for node and background clicks", () => {
    // Should not throw when callbacks are provided
    expect(() =>
      render(
        <ConceptGraph
          {...mockProps}
          onNodeClick={vi.fn()}
          onBackgroundClick={vi.fn()}
        />
      )
    ).not.toThrow();
  });
});
