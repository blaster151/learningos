/**
 * Tests for ReflectionResults component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReflectionResults from "@/components/reflection/ReflectionResults";
import type { ReflectionAnalysis } from "@/types";

describe("ReflectionResults", () => {
  const mockAnalysis: ReflectionAnalysis = {
    reflectionId: "reflection-123",
    overallScore: 85,
    strengths: [
      "Clear understanding of hooks fundamentals",
      "Good comparison with class components",
      "Practical examples provided",
    ],
    suggestions: [
      "Consider discussing useCallback and useMemo",
      "Expand on custom hooks usage",
    ],
    misconceptions: [
      {
        claim: "Hooks can only be used in functional components",
        correction: "While hooks are designed for functional components, they follow specific rules that apply to all React components.",
        severity: "minor",
      },
      {
        claim: "useEffect always runs after every render",
        correction: "useEffect only runs after renders when its dependencies change. You can control this with the dependency array.",
        severity: "significant",
      },
    ],
    conceptUpdates: [
      {
        conceptId: "concept-1",
        conceptName: "React Hooks",
        previousMastery: "learning",
        newMastery: "practicing",
        confidenceDelta: 0.15,
      },
      {
        conceptId: "concept-2",
        conceptName: "useState",
        previousMastery: "practicing",
        newMastery: "proficient",
        confidenceDelta: 0.20,
      },
    ],
    encouragement: "Great progress! Keep practicing hooks in your projects.",
  };

  it("renders the results component", () => {
    render(<ReflectionResults analysis={mockAnalysis} />);
    
    expect(screen.getByText(/reflection analysis/i)).toBeInTheDocument();
  });

  it("displays overall score", () => {
    render(<ReflectionResults analysis={mockAnalysis} />);
    
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("displays all strengths", () => {
    render(<ReflectionResults analysis={mockAnalysis} />);
    
    expect(screen.getByText("Clear understanding of hooks fundamentals")).toBeInTheDocument();
    expect(screen.getByText("Good comparison with class components")).toBeInTheDocument();
    expect(screen.getByText("Practical examples provided")).toBeInTheDocument();
  });

  it("displays all suggestions", () => {
    render(<ReflectionResults analysis={mockAnalysis} />);
    
    expect(screen.getByText("Consider discussing useCallback and useMemo")).toBeInTheDocument();
    expect(screen.getByText("Expand on custom hooks usage")).toBeInTheDocument();
  });

  it("displays all misconceptions with corrections", () => {
    render(<ReflectionResults analysis={mockAnalysis} />);
    
    expect(screen.getByText("Hooks can only be used in functional components")).toBeInTheDocument();
    expect(screen.getByText(/While hooks are designed for functional components/)).toBeInTheDocument();
    
    expect(screen.getByText("useEffect always runs after every render")).toBeInTheDocument();
    expect(screen.getByText(/useEffect only runs after renders/)).toBeInTheDocument();
  });

  it("distinguishes misconception severity visually", () => {
    const { container } = render(<ReflectionResults analysis={mockAnalysis} />);
    
    // Minor misconceptions should have different styling than significant ones
    const misconceptionElements = container.querySelectorAll("[data-severity]");
    expect(misconceptionElements.length).toBeGreaterThan(0);
  });

  it("displays concept mastery updates", () => {
    render(<ReflectionResults analysis={mockAnalysis} />);
    
    expect(screen.getByText("React Hooks")).toBeInTheDocument();
    expect(screen.getByText("useState")).toBeInTheDocument();
    
    // Should show mastery progression
    expect(screen.getByText(/learning → practicing/i)).toBeInTheDocument();
    expect(screen.getByText(/practicing → proficient/i)).toBeInTheDocument();
  });

  it("displays encouragement message", () => {
    render(<ReflectionResults analysis={mockAnalysis} />);
    
    expect(screen.getByText("Great progress! Keep practicing hooks in your projects.")).toBeInTheDocument();
  });

  it("handles empty strengths array", () => {
    const analysisWithoutStrengths = { ...mockAnalysis, strengths: [] };
    render(<ReflectionResults analysis={analysisWithoutStrengths} />);
    
    // Should still render without crashing
    expect(screen.getByText(/reflection analysis/i)).toBeInTheDocument();
  });

  it("handles empty suggestions array", () => {
    const analysisWithoutSuggestions = { ...mockAnalysis, suggestions: [] };
    render(<ReflectionResults analysis={analysisWithoutSuggestions} />);
    
    // Should still render without crashing
    expect(screen.getByText(/reflection analysis/i)).toBeInTheDocument();
  });

  it("handles empty misconceptions array", () => {
    const analysisWithoutMisconceptions = { ...mockAnalysis, misconceptions: [] };
    render(<ReflectionResults analysis={analysisWithoutMisconceptions} />);
    
    // Should still render without crashing
    expect(screen.getByText(/reflection analysis/i)).toBeInTheDocument();
  });

  it("handles missing encouragement message", () => {
    const analysisWithoutEncouragement = { ...mockAnalysis, encouragement: undefined };
    render(<ReflectionResults analysis={analysisWithoutEncouragement} />);
    
    // Should still render without crashing
    expect(screen.getByText(/reflection analysis/i)).toBeInTheDocument();
  });

  it("shows score with visual indicator (ring/circle)", () => {
    const { container } = render(<ReflectionResults analysis={mockAnalysis} />);
    
    // Should have an SVG circle or similar visual indicator
    const scoreIndicator = container.querySelector("svg circle");
    expect(scoreIndicator).toBeInTheDocument();
  });

  it("applies correct color scheme based on score", () => {
    const highScoreAnalysis = { ...mockAnalysis, overallScore: 95 };
    const { container: highContainer } = render(<ReflectionResults analysis={highScoreAnalysis} />);
    
    const lowScoreAnalysis = { ...mockAnalysis, overallScore: 50 };
    const { container: lowContainer } = render(<ReflectionResults analysis={lowScoreAnalysis} />);
    
    // High and low scores should have different visual indicators
    expect(highContainer.innerHTML).not.toEqual(lowContainer.innerHTML);
  });

  it("displays confidence delta for concept updates", () => {
    render(<ReflectionResults analysis={mockAnalysis} />);
    
    // Should show +15% and +20% confidence increases
    expect(screen.getByText(/\+15%/i)).toBeInTheDocument();
    expect(screen.getByText(/\+20%/i)).toBeInTheDocument();
  });
});
