/**
 * Tests for GraphLegend component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GraphLegend from "@/components/graph/GraphLegend";

describe("GraphLegend", () => {
  it("renders the legend component", () => {
    render(<GraphLegend />);
    
    expect(screen.getByText("Mastery Levels")).toBeInTheDocument();
    expect(screen.getByText("Relationships")).toBeInTheDocument();
  });

  it("displays all mastery levels", () => {
    render(<GraphLegend />);
    
    expect(screen.getByText("exploring")).toBeInTheDocument();
    expect(screen.getByText("learning")).toBeInTheDocument();
    expect(screen.getByText("practicing")).toBeInTheDocument();
    expect(screen.getByText("comfortable")).toBeInTheDocument();
    expect(screen.getByText("expert")).toBeInTheDocument();
  });

  it("displays all relation types", () => {
    render(<GraphLegend />);
    
    expect(screen.getByText("Prerequisite")).toBeInTheDocument();
    expect(screen.getByText("Builds On")).toBeInTheDocument();
    expect(screen.getByText("Similar To")).toBeInTheDocument();
    expect(screen.getByText("Contrasts With")).toBeInTheDocument();
    expect(screen.getByText("Abstracts To")).toBeInTheDocument();
    expect(screen.getByText("Applies To")).toBeInTheDocument();
    expect(screen.getByText("Example Of")).toBeInTheDocument();
  });

  it("shows mastery level color indicators", () => {
    const { container } = render(<GraphLegend />);
    
    // Check for color indicators (colored divs with inline background color)
    const colorIndicators = container.querySelectorAll(".rounded-full");
    expect(colorIndicators.length).toBe(5); // 5 mastery levels
  });

  it("shows relation type color indicators", () => {
    const { container } = render(<GraphLegend />);
    
    // Relation type indicators should be present (lines with inline background color)
    const relationIndicators = container.querySelectorAll(".h-0\\.5");
    expect(relationIndicators.length).toBe(7); // 7 relation types
  });

  it("includes node size explanation", () => {
    render(<GraphLegend />);
    
    expect(screen.getByText("Node Size")).toBeInTheDocument();
    expect(screen.getByText(/size indicates/i)).toBeInTheDocument();
  });

  it("renders with proper styling", () => {
    const { container } = render(<GraphLegend />);
    
    // Should have proper container classes
    const legendContainer = container.firstChild;
    expect(legendContainer).toHaveClass("space-y-4");
  });

  it("organizes content in sections", () => {
    render(<GraphLegend />);
    
    // Should have the Legend header and sections
    expect(screen.getByText("Legend")).toBeInTheDocument();
    expect(screen.getByText("Mastery Levels")).toBeInTheDocument();
    expect(screen.getByText("Relationships")).toBeInTheDocument();
    expect(screen.getByText("Node Size")).toBeInTheDocument();
  });
});
