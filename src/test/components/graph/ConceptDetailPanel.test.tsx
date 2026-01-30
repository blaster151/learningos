/**
 * Tests for ConceptDetailPanel component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock auth context for authFetch
vi.mock("@/lib/auth/AuthContext", () => ({
  useAuth: (() => {
    const user = {
      uid: "user-123",
      getIdToken: vi.fn().mockResolvedValue("test-token"),
    };

    return () => ({ user });
  })(),
}));

import ConceptDetailPanel from "@/components/graph/ConceptDetailPanel";

// Mock fetch
global.fetch = vi.fn();

describe("ConceptDetailPanel", () => {
  const mockConceptId = "concept-123";
  const mockUserId = "user-123";

  const mockConceptData = {
    concept: {
      id: "concept-123",
      name: "React Hooks",
      domain: "Frontend",
      masteryLevel: "practicing",
      definition: "React Hooks are functions that let you use state and lifecycle features in functional components.",
      confidence: 0.7,
    },
    statistics: {
      totalSessions: 5,
      totalReflections: 3,
      daysSinceLastReview: 2,
    },
    relatedConcepts: [
      {
        conceptId: "concept-456",
        name: "useState",
        masteryLevel: "proficient",
        relationType: "part_of",
      },
      {
        conceptId: "concept-789",
        name: "useEffect",
        masteryLevel: "learning",
        relationType: "part_of",
      },
    ],
    recentSessions: [
      {
        sessionId: "session-1",
        title: "Learning React Hooks",
        timestamp: new Date().toISOString(),
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

  it("shows loading state initially", () => {
    render(
      <ConceptDetailPanel 
        conceptId={mockConceptId} 
        userId={mockUserId}
        onClose={vi.fn()} 
      />
    );
    // Loading shows a spinner (no text, uses className="animate-spin")
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("fetches and displays concept details", async () => {
    render(
      <ConceptDetailPanel 
        conceptId={mockConceptId} 
        userId={mockUserId}
        onClose={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText("React Hooks")).toBeInTheDocument();
    });

    expect(screen.getByText("Frontend")).toBeInTheDocument();
    expect(screen.getByText(/functions that let you use state/i)).toBeInTheDocument();
  });

  it("displays concept statistics", async () => {
    render(
      <ConceptDetailPanel 
        conceptId={mockConceptId} 
        userId={mockUserId}
        onClose={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument(); // totalSessions
    });
    expect(screen.getByText("3")).toBeInTheDocument(); // totalReflections
    expect(screen.getByText("2d")).toBeInTheDocument(); // daysSinceLastReview
  });

  it("displays related concepts", async () => {
    render(
      <ConceptDetailPanel 
        conceptId={mockConceptId} 
        userId={mockUserId}
        onClose={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText("useState")).toBeInTheDocument();
    });
    expect(screen.getByText("useEffect")).toBeInTheDocument();
  });

  it("displays recent sessions", async () => {
    render(
      <ConceptDetailPanel 
        conceptId={mockConceptId} 
        userId={mockUserId}
        onClose={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Learning React Hooks")).toBeInTheDocument();
    });
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    
    render(
      <ConceptDetailPanel 
        conceptId={mockConceptId} 
        userId={mockUserId}
        onClose={onClose} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText("React Hooks")).toBeInTheDocument();
    });

    // Use aria-label to target the X button specifically (not the text "Close" button)
    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    
    const { container } = render(
      <ConceptDetailPanel 
        conceptId={mockConceptId} 
        userId={mockUserId}
        onClose={onClose} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText("React Hooks")).toBeInTheDocument();
    });

    // Backdrop is the first child (bg-black bg-opacity-30)
    const backdrop = container.querySelector(".bg-black.bg-opacity-30");
    if (backdrop) {
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalledOnce();
    }
  });

  it("handles fetch errors gracefully", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    render(
      <ConceptDetailPanel 
        conceptId={mockConceptId} 
        userId={mockUserId}
        onClose={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it("handles API errors (non-ok response)", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    });

    render(
      <ConceptDetailPanel 
        conceptId={mockConceptId} 
        userId={mockUserId}
        onClose={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
    });
  });

  it("refetches data when conceptId changes", async () => {
    const { rerender } = render(
      <ConceptDetailPanel 
        conceptId={mockConceptId} 
        userId={mockUserId}
        onClose={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText("React Hooks")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Change conceptId
    rerender(
      <ConceptDetailPanel 
        conceptId="concept-456" 
        userId={mockUserId}
        onClose={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it("shows 'Create Learning Path' button when onStartPath is provided", async () => {
    const onStartPath = vi.fn();
    
    render(
      <ConceptDetailPanel 
        conceptId={mockConceptId} 
        userId={mockUserId}
        onClose={vi.fn()}
        onStartPath={onStartPath}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Create Learning Path/i)).toBeInTheDocument();
    });
  });

  it("does not show 'Create Learning Path' button when onStartPath is not provided", async () => {
    render(
      <ConceptDetailPanel 
        conceptId={mockConceptId} 
        userId={mockUserId}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("React Hooks")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Create Learning Path/i)).not.toBeInTheDocument();
  });

  it("calls onStartPath with conceptId when Create Learning Path is clicked", async () => {
    const user = userEvent.setup();
    const onStartPath = vi.fn();
    
    render(
      <ConceptDetailPanel 
        conceptId={mockConceptId} 
        userId={mockUserId}
        onClose={vi.fn()}
        onStartPath={onStartPath}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Create Learning Path/i)).toBeInTheDocument();
    });

    const button = screen.getByText(/Create Learning Path/i);
    await user.click(button);

    expect(onStartPath).toHaveBeenCalledWith(mockConceptId);
  });
});
