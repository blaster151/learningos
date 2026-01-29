/**
 * Tests for ReflectionModal component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReflectionModal from "@/components/reflection/ReflectionModal";
import type { ReflectionPrompt } from "@/types";
import { Timestamp } from "firebase-admin/firestore";

describe("ReflectionModal", () => {
  const mockPrompt: ReflectionPrompt = {
    promptId: "prompt-123",
    sessionId: "session-456",
    conceptIds: ["concept-1", "concept-2"],
    promptText: "Explain how React Hooks differ from class component lifecycle methods.",
    hints: [
      "Consider the useState and useEffect hooks",
      "Think about component reusability",
    ],
    minWords: 50,
    maxWords: 200,
    createdAt: Timestamp.now(),
  };

  const mockProps = {
    prompt: mockPrompt,
    onSubmit: vi.fn(),
    onSkip: vi.fn(),
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the modal with prompt text", () => {
    render(<ReflectionModal {...mockProps} />);
    
    expect(screen.getByText(mockPrompt.promptText)).toBeInTheDocument();
  });

  it("displays word count requirements", () => {
    render(<ReflectionModal {...mockProps} />);
    
    expect(screen.getByText(/50-200 words/i)).toBeInTheDocument();
  });

  it("shows hints in collapsible section", async () => {
    const user = userEvent.setup();
    render(<ReflectionModal {...mockProps} />);
    
    // Hints should be collapsed initially (or expandable)
    const hintsButton = screen.getByRole("button", { name: /hints/i });
    await user.click(hintsButton);

    expect(screen.getByText("Consider the useState and useEffect hooks")).toBeInTheDocument();
    expect(screen.getByText("Think about component reusability")).toBeInTheDocument();
  });

  it("updates word count as user types", async () => {
    const user = userEvent.setup();
    render(<ReflectionModal {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/write your reflection/i);
    await user.type(textarea, "This is a test reflection with multiple words.");

    // Should show word count (8 words)
    expect(screen.getByText(/8/)).toBeInTheDocument();
  });

  it("disables submit button when below minimum words", async () => {
    const user = userEvent.setup();
    render(<ReflectionModal {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/write your reflection/i);
    await user.type(textarea, "Too short");

    const submitButton = screen.getByRole("button", { name: /submit reflection/i });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when within word range", async () => {
    const user = userEvent.setup();
    render(<ReflectionModal {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/write your reflection/i);
    
    // Type 50+ words
    const longText = "word ".repeat(60);
    await user.type(textarea, longText);

    const submitButton = screen.getByRole("button", { name: /submit reflection/i });
    expect(submitButton).not.toBeDisabled();
  });

  it("warns when exceeding maximum words", async () => {
    const user = userEvent.setup();
    render(<ReflectionModal {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/write your reflection/i);
    
    // Type 200+ words
    const longText = "word ".repeat(250);
    await user.type(textarea, longText);

    // Should show warning (red text or warning message)
    expect(screen.getByText(/too many words/i)).toBeInTheDocument();
  });

  it("calls onSubmit with reflection text", async () => {
    const user = userEvent.setup();
    render(<ReflectionModal {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/write your reflection/i);
    const reflectionText = "word ".repeat(60);
    await user.type(textarea, reflectionText);

    const submitButton = screen.getByRole("button", { name: /submit reflection/i });
    await user.click(submitButton);

    expect(mockProps.onSubmit).toHaveBeenCalledWith(
      expect.stringContaining("word")
    );
  });

  it("calls onSkip when skip button is clicked", async () => {
    const user = userEvent.setup();
    render(<ReflectionModal {...mockProps} />);
    
    const skipButton = screen.getByRole("button", { name: /not now/i });
    await user.click(skipButton);

    expect(mockProps.onSkip).toHaveBeenCalledOnce();
  });

  it("disables buttons during submission", () => {
    render(<ReflectionModal {...mockProps} isSubmitting={true} />);
    
    const submitButton = screen.getByRole("button", { name: /submitting/i });
    const skipButton = screen.getByRole("button", { name: /not now/i });

    expect(submitButton).toBeDisabled();
    expect(skipButton).toBeDisabled();
  });

  it("shows progress bar based on word count", async () => {
    const user = userEvent.setup();
    render(<ReflectionModal {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/write your reflection/i);
    
    // Type 25 words (50% of minimum 50)
    await user.type(textarea, "word ".repeat(25));

    // Progress bar should be visible
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
  });

  it("trims whitespace from reflection text", async () => {
    const user = userEvent.setup();
    render(<ReflectionModal {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/write your reflection/i);
    const reflectionText = "   " + "word ".repeat(60) + "   ";
    await user.type(textarea, reflectionText);

    const submitButton = screen.getByRole("button", { name: /submit reflection/i });
    await user.click(submitButton);

    expect(mockProps.onSubmit).toHaveBeenCalledWith(
      expect.not.stringMatching(/^\s+|\s+$/)
    );
  });

  it("handles empty hints array", () => {
    const promptWithoutHints = { ...mockPrompt, hints: [] };
    render(<ReflectionModal {...mockProps} prompt={promptWithoutHints} />);
    
    // Should still render without hints section or with disabled hints button
    expect(screen.queryByRole("button", { name: /hints/i })).not.toBeInTheDocument();
  });
});
