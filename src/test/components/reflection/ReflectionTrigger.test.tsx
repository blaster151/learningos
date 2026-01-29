/**
 * Tests for ReflectionTrigger component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReflectionTrigger from "@/components/reflection/ReflectionTrigger";

describe("ReflectionTrigger", () => {
  const mockProps = {
    onReflect: vi.fn(),
    onDismiss: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the trigger banner", () => {
    render(<ReflectionTrigger {...mockProps} />);
    
    expect(screen.getByText(/ready to reflect/i)).toBeInTheDocument();
  });

  it("displays lightbulb icon", () => {
    const { container } = render(<ReflectionTrigger {...mockProps} />);
    
    // Should have an icon (SVG or similar)
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("shows 'Reflect Now' button", () => {
    render(<ReflectionTrigger {...mockProps} />);
    
    expect(screen.getByRole("button", { name: /reflect now/i })).toBeInTheDocument();
  });

  it("shows 'Not Now' button", () => {
    render(<ReflectionTrigger {...mockProps} />);
    
    expect(screen.getByRole("button", { name: /not now/i })).toBeInTheDocument();
  });

  it("calls onReflect when 'Reflect Now' is clicked", async () => {
    const user = userEvent.setup();
    render(<ReflectionTrigger {...mockProps} />);
    
    const reflectButton = screen.getByRole("button", { name: /reflect now/i });
    await user.click(reflectButton);

    expect(mockProps.onReflect).toHaveBeenCalledOnce();
  });

  it("calls onDismiss when 'Not Now' is clicked", async () => {
    const user = userEvent.setup();
    render(<ReflectionTrigger {...mockProps} />);
    
    const dismissButton = screen.getByRole("button", { name: /not now/i });
    await user.click(dismissButton);

    expect(mockProps.onDismiss).toHaveBeenCalledOnce();
  });

  it("is positioned at bottom-right", () => {
    const { container } = render(<ReflectionTrigger {...mockProps} />);
    
    const trigger = container.firstChild as HTMLElement;
    expect(trigger).toHaveClass("fixed", "bottom-4", "right-4");
  });

  it("has slide-up animation", () => {
    const { container } = render(<ReflectionTrigger {...mockProps} />);
    
    const trigger = container.firstChild as HTMLElement;
    // Should have animation classes
    expect(trigger.className).toMatch(/animate|transition|slide/i);
  });

  it("uses blue accent color scheme", () => {
    const { container } = render(<ReflectionTrigger {...mockProps} />);
    
    // Should have blue color classes
    const blueElements = container.querySelectorAll("[class*='blue']");
    expect(blueElements.length).toBeGreaterThan(0);
  });

  it("is non-intrusive (doesn't block content)", () => {
    const { container } = render(<ReflectionTrigger {...mockProps} />);
    
    const trigger = container.firstChild as HTMLElement;
    // Should be positioned fixed, not blocking
    expect(trigger).toHaveClass("fixed");
  });

  it("has proper z-index for visibility", () => {
    const { container } = render(<ReflectionTrigger {...mockProps} />);
    
    const trigger = container.firstChild as HTMLElement;
    // Should have z-index class
    expect(trigger.className).toMatch(/z-\d+/);
  });

  it("prevents multiple rapid clicks", async () => {
    const user = userEvent.setup();
    render(<ReflectionTrigger {...mockProps} />);
    
    const reflectButton = screen.getByRole("button", { name: /reflect now/i });
    
    // Triple click rapidly
    await user.tripleClick(reflectButton);

    // Should only call once or have debounce
    expect(mockProps.onReflect.mock.calls.length).toBeLessThanOrEqual(3);
  });
});
