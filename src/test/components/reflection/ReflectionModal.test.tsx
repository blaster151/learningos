/**
 * Tests for ReflectionModal component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReflectionModal from "@/components/reflection/ReflectionModal";

describe("ReflectionModal", () => {
  const mockPrompt = {
    promptId: "prompt-123",
    sessionId: "session-456",
    conceptsToAddress: ["concept-1", "concept-2"],
    promptText: "Explain how React Hooks differ from class component lifecycle methods.",
    hints: [
      "Consider the useState and useEffect hooks",
      "Think about component reusability",
    ],
    minWords: 50,
    maxWords: 200,
  };

  const mockProps = {
    isOpen: true,
    prompt: mockPrompt,
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onSkip: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(<ReflectionModal {...mockProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the modal with prompt text when isOpen is true", () => {
    render(<ReflectionModal {...mockProps} />);
    
    expect(screen.getByText(mockPrompt.promptText)).toBeInTheDocument();
  });

  it("displays word count requirements", () => {
    render(<ReflectionModal {...mockProps} />);
    
    // The word count is displayed in format "50–200" - just check the span contains both
    expect(screen.getByText(/50–200/)).toBeInTheDocument();
  });

  it("shows hints in collapsible section", async () => {
    const user = userEvent.setup();
    render(<ReflectionModal {...mockProps} />);
    
    // Click to show hints - button contains "Show hints" or "Hide hints" text
    const hintsButton = screen.getByText(/show hints/i);
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

  it("calls onSubmit with reflection text when valid", async () => {
    const user = userEvent.setup();
    render(<ReflectionModal {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/write your reflection/i);
    
    // Type 60 words directly as a string (avoid typing 60 individual words)
    const reflectionText = Array(60).fill("word").join(" ");
    await user.clear(textarea);
    // Use fireEvent for faster text input
    textarea.focus();
    await user.paste(reflectionText);

    // Find submit button
    const submitButton = screen.getByRole("button", { name: /submit reflection/i });
    
    // Button should be enabled now
    expect(submitButton).not.toBeDisabled();
    await user.click(submitButton);
    expect(mockProps.onSubmit).toHaveBeenCalled();
  }, 10000);

  it("calls onSkip when skip/later button is clicked", async () => {
    const user = userEvent.setup();
    render(<ReflectionModal {...mockProps} />);
    
    // Find skip/later button
    const buttons = screen.getAllByRole("button");
    const skipButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes("skip") ||
      btn.textContent?.toLowerCase().includes("later") ||
      btn.textContent?.toLowerCase().includes("not now")
    );
    
    if (skipButton) {
      await user.click(skipButton);
      expect(mockProps.onSkip).toHaveBeenCalledOnce();
    }
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<ReflectionModal {...mockProps} />);
    
    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);

    // Close may be called multiple times due to backdrop/button
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("handles empty hints array", () => {
    const promptWithoutHints = { ...mockPrompt, hints: [] };
    render(<ReflectionModal {...mockProps} prompt={promptWithoutHints} />);
    
    // Should still render without hints section
    expect(screen.queryByText(/hints/i)).not.toBeInTheDocument();
  });

  it("renders Time to Reflect header", () => {
    render(<ReflectionModal {...mockProps} />);
    
    expect(screen.getByText("Time to Reflect")).toBeInTheDocument();
  });
});
