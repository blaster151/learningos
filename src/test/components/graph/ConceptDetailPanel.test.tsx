/**
 * Tests for ConceptDetailPanel component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConceptDetailPanel from "@/components/graph/ConceptDetailPanel";

// Mock fetch
global.fetch = vi.fn();

describe("ConceptDetailPanel", () => {
  const mockConceptId = "concept-123";

  const mockConceptData = {
    concept: {
      id: "concept-123",
      name: "React Hooks",
      displayName: "React Hooks",
      domain: "Frontend",
      mastery: 0.7,
      description: "React Hooks are functions that let you use state and lifecycle features in functional components.",
    },
    stats: {
      sessionCount: 5,
      reflectionCount: 3,
      lastReviewed: { seconds: Date.now() / 1000 },
    },
    relatedConcepts: [
      {
        id: "concept-456",
        name: "useState",
        displayName: "useState",
        relation: "part-of",
      },
      {
        id: "concept-789",
        name: "useEffect",
        displayName: "useEffect",
        relation: "part-of",
      },
    ],
    recentSessions: [
      {
        sessionId: "session-1",
        startTime: { seconds: Date.now() / 1000 - 86400 },
        messageCount: 10,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockConceptData,
    });
  });

  it("renders nothing when conceptId is null", () => {
    const { container } = render(
      <ConceptDetailPanel conceptId={null} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows loading state initially", () => {
    render(<ConceptDetailPanel conceptId={mockConceptId} onClose={vi.fn()} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("fetches and displays concept details", async () => {
    render(<ConceptDetailPanel conceptId={mockConceptId} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("React Hooks")).toBeInTheDocument();
    });

    expect(screen.getByText(/Frontend/i)).toBeInTheDocument();
    expect(screen.getByText(/functions that let you use state/i)).toBeInTheDocument();
  });

  it("displays concept statistics", async () => {
    render(<ConceptDetailPanel conceptId={mockConceptId} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument(); // session count
      expect(screen.getByText("3")).toBeInTheDocument(); // reflection count
    });
  });

  it("displays related concepts", async () => {
    render(<ConceptDetailPanel conceptId={mockConceptId} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("useState")).toBeInTheDocument();
      expect(screen.getByText("useEffect")).toBeInTheDocument();
    });
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    
    render(<ConceptDetailPanel conceptId={mockConceptId} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText("React Hooks")).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    
    render(<ConceptDetailPanel conceptId={mockConceptId} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText("React Hooks")).toBeInTheDocument();
    });

    const backdrop = screen.getByTestId("backdrop");
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("handles fetch errors gracefully", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    render(<ConceptDetailPanel conceptId={mockConceptId} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it("handles API errors (non-ok response)", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    });

    render(<ConceptDetailPanel conceptId={mockConceptId} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it("refetches data when conceptId changes", async () => {
    const { rerender } = render(
      <ConceptDetailPanel conceptId={mockConceptId} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText("React Hooks")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Change conceptId
    rerender(
      <ConceptDetailPanel conceptId="concept-456" onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it("shows 'Create Learning Path' button", async () => {
    render(<ConceptDetailPanel conceptId={mockConceptId} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/create learning path/i)).toBeInTheDocument();
    });
  });
});
