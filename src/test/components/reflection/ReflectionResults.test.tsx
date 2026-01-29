/**
 * Tests for ReflectionResults component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReflectionResults from "@/components/reflection/ReflectionResults";
import type { ReflectionAnalysis } from "@/types";

describe("ReflectionResults", () => {
  const mockOnContinue = vi.fn();
  
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

  beforeEach(() => {
    mockOnContinue.mockClear();
  });

  it("renders the results component", () => {
    render(<ReflectionResults analysis={mockAnalysis} onContinue={mockOnContinue} />);
    
    expect(screen.getByText(/Reflection Complete/i)).toBeInTheDocument();
  });

  it("displays overall score", () => {
    render(<ReflectionResults analysis={mockAnalysis} onContinue={mockOnContinue} />);
    
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("displays score label based on score value", () => {
    render(<ReflectionResults analysis={mockAnalysis} onContinue={mockOnContinue} />);
    
    // 85 should show "Excellent" label
    expect(screen.getByText("Excellent")).toBeInTheDocument();
  });

  it("displays all strengths", () => {
    render(<ReflectionResults analysis={mockAnalysis} onContinue={mockOnContinue} />);
    
    expect(screen.getByText("Clear understanding of hooks fundamentals")).toBeInTheDocument();
    expect(screen.getByText("Good comparison with class components")).toBeInTheDocument();
    expect(screen.getByText("Practical examples provided")).toBeInTheDocument();
  });

  it("displays all suggestions", () => {
    render(<ReflectionResults analysis={mockAnalysis} onContinue={mockOnContinue} />);
    
    expect(screen.getByText("Consider discussing useCallback and useMemo")).toBeInTheDocument();
    expect(screen.getByText("Expand on custom hooks usage")).toBeInTheDocument();
  });

  it("displays all misconceptions with corrections", () => {
    render(<ReflectionResults analysis={mockAnalysis} onContinue={mockOnContinue} />);
    
    expect(screen.getByText("Hooks can only be used in functional components")).toBeInTheDocument();
    expect(screen.getByText(/While hooks are designed for functional components/)).toBeInTheDocument();
    
    expect(screen.getByText("useEffect always runs after every render")).toBeInTheDocument();
    expect(screen.getByText(/useEffect only runs after renders/)).toBeInTheDocument();
  });

  it("indicates misconception severity with different styling", () => {
    const { container } = render(<ReflectionResults analysis={mockAnalysis} onContinue={mockOnContinue} />);
    
    // Minor uses yellow styling, significant uses red styling
    const yellowBorder = container.querySelector(".border-yellow-200");
    const redBorder = container.querySelector(".border-red-200");
    
    expect(yellowBorder).toBeInTheDocument();
    expect(redBorder).toBeInTheDocument();
  });

  it("displays concept mastery updates", () => {
    render(<ReflectionResults analysis={mockAnalysis} onContinue={mockOnContinue} />);
    
    expect(screen.getByText("React Hooks")).toBeInTheDocument();
    expect(screen.getByText("useState")).toBeInTheDocument();
  });

  it("shows mastery level transitions", () => {
    render(<ReflectionResults analysis={mockAnalysis} onContinue={mockOnContinue} />);
    
    // Check that mastery levels are displayed using getAllByText for duplicates
    expect(screen.getByText("learning")).toBeInTheDocument();
    // "practicing" appears twice (once as prev, once as new), so use getAllByText
    expect(screen.getAllByText("practicing").length).toBeGreaterThan(0);
    expect(screen.getByText("proficient")).toBeInTheDocument();
  });

  it("displays encouragement message", () => {
    render(<ReflectionResults analysis={mockAnalysis} onContinue={mockOnContinue} />);
    
    expect(screen.getByText("Great progress! Keep practicing hooks in your projects.")).toBeInTheDocument();
  });

  it("handles empty strengths array", () => {
    const analysisWithoutStrengths = { ...mockAnalysis, strengths: [] };
    render(<ReflectionResults analysis={analysisWithoutStrengths} onContinue={mockOnContinue} />);
    
    // Should still render without crashing
    expect(screen.getByText(/Reflection Complete/i)).toBeInTheDocument();
  });

  it("handles empty suggestions array", () => {
    const analysisWithoutSuggestions = { ...mockAnalysis, suggestions: [] };
    render(<ReflectionResults analysis={analysisWithoutSuggestions} onContinue={mockOnContinue} />);
    
    // Should still render without crashing
    expect(screen.getByText(/Reflection Complete/i)).toBeInTheDocument();
  });

  it("handles empty misconceptions array", () => {
    const analysisWithoutMisconceptions = { ...mockAnalysis, misconceptions: [] };
    render(<ReflectionResults analysis={analysisWithoutMisconceptions} onContinue={mockOnContinue} />);
    
    // Should still render without crashing
    expect(screen.getByText(/Reflection Complete/i)).toBeInTheDocument();
  });

  it("handles missing encouragement message", () => {
    const analysisWithoutEncouragement = { ...mockAnalysis, encouragement: undefined };
    render(<ReflectionResults analysis={analysisWithoutEncouragement} onContinue={mockOnContinue} />);
    
    // Should still render without crashing
    expect(screen.getByText(/Reflection Complete/i)).toBeInTheDocument();
  });

  it("applies correct color scheme based on score", () => {
    const highScoreAnalysis = { ...mockAnalysis, overallScore: 95 };
    const { rerender } = render(<ReflectionResults analysis={highScoreAnalysis} onContinue={mockOnContinue} />);
    
    // High score (95) should show "Excellent"
    expect(screen.getByText("Excellent")).toBeInTheDocument();
    
    const lowScoreAnalysis = { ...mockAnalysis, overallScore: 35 };
    rerender(<ReflectionResults analysis={lowScoreAnalysis} onContinue={mockOnContinue} />);
    
    // Low score (35) should show "Needs Work"
    expect(screen.getByText("Needs Work")).toBeInTheDocument();
  });

  it("displays confidence delta for concept updates", () => {
    render(<ReflectionResults analysis={mockAnalysis} onContinue={mockOnContinue} />);
    
    // Should show +15% and +20% confidence increases
    expect(screen.getByText("+15%")).toBeInTheDocument();
    expect(screen.getByText("+20%")).toBeInTheDocument();
  });

  it("calls onContinue when continue button is clicked", () => {
    render(<ReflectionResults analysis={mockAnalysis} onContinue={mockOnContinue} />);
    
    const continueButton = screen.getByRole("button", { name: /continue learning/i });
    fireEvent.click(continueButton);
    
    expect(mockOnContinue).toHaveBeenCalledTimes(1);
  });
});
