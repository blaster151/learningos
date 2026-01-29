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
    onFiltersChange: vi.fn(),
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
    
    expect(screen.getByLabelText(/novice/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/learning/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/practicing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/proficient/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expert/i)).toBeInTheDocument();
  });

  it("updates search query when typing", async () => {
    const user = userEvent.setup();
    render(<GraphFilters {...mockProps} />);

    const searchInput = screen.getByPlaceholderText(/search concepts/i);
    await user.type(searchInput, "React");

    expect(mockProps.onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        searchQuery: "React",
      })
    );
  });

  it("toggles domain selection", async () => {
    const user = userEvent.setup();
    render(<GraphFilters {...mockProps} />);

    const backendCheckbox = screen.getByLabelText("Backend");
    await user.click(backendCheckbox);

    expect(mockProps.onFiltersChange).toHaveBeenCalledWith(
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

    expect(mockProps.onFiltersChange).toHaveBeenCalledWith(
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

    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      domains: [],
      masteryLevels: [],
      searchQuery: "",
    });
  });

  it("shows active filter count", () => {
    render(<GraphFilters {...mockProps} />);
    
    // 2 domains + 2 mastery levels = 4 active filters
    expect(screen.getByText(/4 active/i)).toBeInTheDocument();
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
