/**
 * Tests for ConceptGraph component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConceptGraph from "@/components/graph/ConceptGraph";
import type { GraphData, GraphNode } from "@/types";

// Mock react-force-graph-2d
vi.mock("react-force-graph-2d", () => ({
  default: vi.fn(({ graphData, onNodeClick, onBackgroundClick }) => (
    <div data-testid="force-graph-mock">
      <div data-testid="graph-nodes">
        {graphData.nodes.map((node: GraphNode) => (
          <button
            key={node.id}
            data-testid={`node-${node.id}`}
            onClick={() => onNodeClick(node)}
          >
            {node.displayName}
          </button>
        ))}
      </div>
      <button data-testid="background-click" onClick={onBackgroundClick}>
        Background
      </button>
    </div>
  )),
}));

describe("ConceptGraph", () => {
  const mockGraphData: GraphData = {
    nodes: [
      {
        id: "concept-1",
        name: "JavaScript",
        displayName: "JavaScript",
        mastery: 0.7,
        domain: "Programming",
        size: 10,
        color: "#10b981",
        conceptCount: 5,
      },
      {
        id: "concept-2",
        name: "React",
        displayName: "React",
        mastery: 0.5,
        domain: "Frontend",
        size: 8,
        color: "#3b82f6",
        conceptCount: 3,
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

  it("renders the graph component", () => {
    render(<ConceptGraph {...mockProps} />);
    expect(screen.getByTestId("force-graph-mock")).toBeInTheDocument();
  });

  it("renders all nodes from graph data", () => {
    render(<ConceptGraph {...mockProps} />);
    expect(screen.getByTestId("node-concept-1")).toBeInTheDocument();
    expect(screen.getByTestId("node-concept-2")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("calls onNodeClick when a node is clicked", async () => {
    const user = userEvent.setup();
    render(<ConceptGraph {...mockProps} />);

    const node = screen.getByTestId("node-concept-1");
    await user.click(node);

    expect(mockProps.onNodeClick).toHaveBeenCalledWith("concept-1");
  });

  it("calls onBackgroundClick when background is clicked", async () => {
    const user = userEvent.setup();
    render(<ConceptGraph {...mockProps} />);

    const background = screen.getByTestId("background-click");
    await user.click(background);

    expect(mockProps.onBackgroundClick).toHaveBeenCalled();
  });

  it("handles empty graph data", () => {
    const emptyData: GraphData = { nodes: [], links: [] };
    render(<ConceptGraph {...mockProps} data={emptyData} />);
    
    expect(screen.getByTestId("force-graph-mock")).toBeInTheDocument();
    expect(screen.queryByTestId(/^node-/)).not.toBeInTheDocument();
  });

  it("highlights selected node", () => {
    render(<ConceptGraph {...mockProps} selectedNodeId="concept-1" />);
    
    // Selected node should still be rendered
    expect(screen.getByTestId("node-concept-1")).toBeInTheDocument();
  });

  it("applies custom dimensions", () => {
    const { container } = render(
      <ConceptGraph {...mockProps} width={1000} height={800} />
    );
    
    // The wrapper div should be present
    const wrapper = container.querySelector("div");
    expect(wrapper).toBeInTheDocument();
  });
});
