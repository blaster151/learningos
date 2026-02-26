/**
 * Tests for PrerequisiteGapCard Component (E14-S5, Sub-task B)
 *
 * Tests rendering, modal interaction, accessibility, and purple styling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import PrerequisiteGapCard from "@/components/learning/PrerequisiteGapCard";
import type { PrerequisiteGap } from "@/lib/learning/extractPrerequisiteGaps";

const mockGap: PrerequisiteGap = {
  conceptName: "JavaScript Closures",
  conceptId: "concept-closures",
  sourcePathId: "path-react-hooks",
  sourcePathTitle: "Master React Hooks",
  source: "screening",
};

describe("PrerequisiteGapCard (E14-S5)", () => {
  let onCreatePath: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCreatePath = vi.fn();
  });

  it("renders the concept name and parent path reference", () => {
    render(<PrerequisiteGapCard gap={mockGap} onCreatePath={onCreatePath} />);

    expect(screen.getByText("JavaScript Closures")).toBeInTheDocument();
    expect(
      screen.getByText(/Gap in.*Master React Hooks/)
    ).toBeInTheDocument();
  });

  it("renders the prerequisite badge", () => {
    render(<PrerequisiteGapCard gap={mockGap} onCreatePath={onCreatePath} />);

    expect(screen.getByText("🟣 Prerequisite")).toBeInTheDocument();
  });

  it("has correct aria attributes on the card", () => {
    render(<PrerequisiteGapCard gap={mockGap} onCreatePath={onCreatePath} />);

    const card = screen.getByRole("complementary");
    expect(card).toHaveAttribute(
      "aria-label",
      "Prerequisite gap: JavaScript Closures for Master React Hooks"
    );
  });

  it("CTA button opens the confirmation modal", () => {
    render(<PrerequisiteGapCard gap={mockGap} onCreatePath={onCreatePath} />);

    // Modal should not be visible initially
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Click CTA
    fireEvent.click(screen.getByText("Create Learning Path"));

    // Modal should now be visible
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByText(/Create a focused path for/)
    ).toBeInTheDocument();
  });

  it("\"Create Path\" button calls onCreatePath with correct args and closes modal", () => {
    render(<PrerequisiteGapCard gap={mockGap} onCreatePath={onCreatePath} />);

    // Open modal
    fireEvent.click(screen.getByText("Create Learning Path"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Click "Create Path"
    fireEvent.click(screen.getByText("Create Path"));

    expect(onCreatePath).toHaveBeenCalledWith(
      "JavaScript Closures",
      "Master React Hooks"
    );
    // Modal should close
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("\"Not Now\" button closes the modal without calling onCreatePath", () => {
    render(<PrerequisiteGapCard gap={mockGap} onCreatePath={onCreatePath} />);

    // Open modal
    fireEvent.click(screen.getByText("Create Learning Path"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Click "Not Now"
    fireEvent.click(screen.getByText("Not Now"));

    expect(onCreatePath).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Escape key closes the modal", () => {
    render(<PrerequisiteGapCard gap={mockGap} onCreatePath={onCreatePath} />);

    // Open modal
    fireEvent.click(screen.getByText("Create Learning Path"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Press Escape on the backdrop
    const backdrop = screen.getByRole("dialog").parentElement!;
    fireEvent.keyDown(backdrop, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("CTA button has correct aria-label", () => {
    render(<PrerequisiteGapCard gap={mockGap} onCreatePath={onCreatePath} />);

    const cta = screen.getByText("Create Learning Path");
    expect(cta).toHaveAttribute(
      "aria-label",
      "Create a focused learning path for JavaScript Closures"
    );
  });

  it("applies purple styling to the card", () => {
    render(<PrerequisiteGapCard gap={mockGap} onCreatePath={onCreatePath} />);

    const card = screen.getByRole("complementary");
    expect(card.className).toContain("bg-purple-50");
    expect(card.className).toContain("border-purple-200");
  });
});
