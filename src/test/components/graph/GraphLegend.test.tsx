/**
 * Tests for GraphLegend component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GraphLegend from "@/components/graph/GraphLegend";

describe("GraphLegend", () => {
  it("renders the legend component", () => {
    render(<GraphLegend />);
    
    expect(screen.getByText(/mastery levels/i)).toBeInTheDocument();
    expect(screen.getByText(/relation types/i)).toBeInTheDocument();
  });

  it("displays all mastery levels", () => {
    render(<GraphLegend />);
    
    expect(screen.getByText("Novice")).toBeInTheDocument();
    expect(screen.getByText("Learning")).toBeInTheDocument();
    expect(screen.getByText("Practicing")).toBeInTheDocument();
    expect(screen.getByText("Proficient")).toBeInTheDocument();
    expect(screen.getByText("Expert")).toBeInTheDocument();
  });

  it("displays all relation types", () => {
    render(<GraphLegend />);
    
    expect(screen.getByText("Prerequisite")).toBeInTheDocument();
    expect(screen.getByText("Related")).toBeInTheDocument();
    expect(screen.getByText("Similar")).toBeInTheDocument();
    expect(screen.getByText("Extends")).toBeInTheDocument();
    expect(screen.getByText("Applies To")).toBeInTheDocument();
    expect(screen.getByText("Part Of")).toBeInTheDocument();
    expect(screen.getByText("Example Of")).toBeInTheDocument();
  });

  it("shows mastery level color indicators", () => {
    const { container } = render(<GraphLegend />);
    
    // Check for color indicators (colored divs/spans)
    const colorIndicators = container.querySelectorAll("[class*='bg-']");
    expect(colorIndicators.length).toBeGreaterThan(0);
  });

  it("shows relation type color indicators", () => {
    const { container } = render(<GraphLegend />);
    
    // Relation type indicators should be present
    const relationIndicators = container.querySelectorAll("[class*='border-']");
    expect(relationIndicators.length).toBeGreaterThan(0);
  });

  it("includes node size explanation", () => {
    render(<GraphLegend />);
    
    // Should explain that larger nodes = more connected concepts
    expect(screen.getByText(/node size/i)).toBeInTheDocument();
  });

  it("renders with proper styling", () => {
    const { container } = render(<GraphLegend />);
    
    // Should have proper container classes
    const legendContainer = container.firstChild;
    expect(legendContainer).toHaveClass("space-y-4");
  });

  it("organizes content in sections", () => {
    const { container } = render(<GraphLegend />);
    
    // Should have multiple sections
    const sections = container.querySelectorAll("div > div");
    expect(sections.length).toBeGreaterThan(1);
  });
});
