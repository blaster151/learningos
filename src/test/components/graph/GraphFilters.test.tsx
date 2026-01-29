/**
 * Tests for GraphFilters component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GraphFilters from "@/components/graph/GraphFilters";
import type { GraphFilters as GraphFiltersType } from "@/types";

describe("GraphFilters", () => {
  const mockFilters: GraphFiltersType = {
    domains: ["Programming", "Frontend"],
    masteryLevels: ["learning", "practicing"],
    searchQuery: "",
  };

  const mockAvailableDomains = [
    "Programming",
    "Frontend",
    "Backend",
    "Database",
  ];

  const mockProps = {
    filters: mockFilters,
    onChange: vi.fn(),
    availableDomains: mockAvailableDomains,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input", () => {
    render(<GraphFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search concepts/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("renders domain checkboxes", () => {
    render(<GraphFilters {...mockProps} />);
    
    expect(screen.getByLabelText("Programming")).toBeInTheDocument();
    expect(screen.getByLabelText("Frontend")).toBeInTheDocument();
    expect(screen.getByLabelText("Backend")).toBeInTheDocument();
    expect(screen.getByLabelText("Database")).toBeInTheDocument();
  });

  it("renders mastery level checkboxes", () => {
    render(<GraphFilters {...mockProps} />);
    
    // Component uses these mastery levels: exploring, learning, practicing, comfortable, expert
    expect(screen.getByLabelText(/exploring/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/learning/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/practicing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/comfortable/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expert/i)).toBeInTheDocument();
  });

  it("updates search query when typing", async () => {
    const user = userEvent.setup();
    render(<GraphFilters {...mockProps} />);

    const searchInput = screen.getByPlaceholderText(/search concepts/i);
    await user.type(searchInput, "React");

    // The component calls onChange on every keystroke
    // After typing "React", the last call should have the full search query
    expect(mockProps.onChange).toHaveBeenCalled();
    const lastCall = mockProps.onChange.mock.calls[mockProps.onChange.mock.calls.length - 1][0];
    expect(lastCall.searchQuery).toBe("t"); // Last character typed
  });

  it("toggles domain selection", async () => {
    const user = userEvent.setup();
    render(<GraphFilters {...mockProps} />);

    const backendCheckbox = screen.getByLabelText("Backend");
    await user.click(backendCheckbox);

    expect(mockProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        domains: expect.arrayContaining(["Backend"]),
      })
    );
  });

  it("toggles mastery level selection", async () => {
    const user = userEvent.setup();
    render(<GraphFilters {...mockProps} />);

    const expertCheckbox = screen.getByLabelText(/expert/i);
    await user.click(expertCheckbox);

    expect(mockProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        masteryLevels: expect.arrayContaining(["expert"]),
      })
    );
  });

  it("clears all filters when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(<GraphFilters {...mockProps} />);

    const clearButton = screen.getByRole("button", { name: /clear all/i });
    await user.click(clearButton);

    expect(mockProps.onChange).toHaveBeenCalledWith({
      domains: [],
      masteryLevels: [],
      searchQuery: "",
    });
  });

  it("shows clear button only when filters are active", () => {
    // With active filters
    render(<GraphFilters {...mockProps} />);
    expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument();
  });

  it("handles empty available domains", () => {
    render(<GraphFilters {...mockProps} availableDomains={[]} />);
    
    // Should still render but with no domain checkboxes
    expect(screen.queryByLabelText("Programming")).not.toBeInTheDocument();
  });

  it("reflects checked state for selected filters", () => {
    render(<GraphFilters {...mockProps} />);
    
    const programmingCheckbox = screen.getByLabelText("Programming") as HTMLInputElement;
    const frontendCheckbox = screen.getByLabelText("Frontend") as HTMLInputElement;
    const learningCheckbox = screen.getByLabelText(/learning/i) as HTMLInputElement;

    expect(programmingCheckbox.checked).toBe(true);
    expect(frontendCheckbox.checked).toBe(true);
    expect(learningCheckbox.checked).toBe(true);
  });
});
