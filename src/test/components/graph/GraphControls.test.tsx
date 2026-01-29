/**
 * Tests for GraphControls component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GraphControls from "@/components/graph/GraphControls";

describe("GraphControls", () => {
  const mockProps = {
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onFitToScreen: vi.fn(),
    onResetView: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all control buttons", () => {
    render(<GraphControls {...mockProps} />);
    
    // The component includes keyboard hints in titles
    expect(screen.getByTitle("Zoom In (+ key)")).toBeInTheDocument();
    expect(screen.getByTitle("Zoom Out (- key)")).toBeInTheDocument();
    expect(screen.getByTitle("Fit to Screen")).toBeInTheDocument();
    expect(screen.getByTitle("Reset View")).toBeInTheDocument();
  });

  it("calls onZoomIn when zoom in button is clicked", async () => {
    const user = userEvent.setup();
    render(<GraphControls {...mockProps} />);

    const zoomInButton = screen.getByLabelText("Zoom in");
    await user.click(zoomInButton);

    expect(mockProps.onZoomIn).toHaveBeenCalledOnce();
  });

  it("calls onZoomOut when zoom out button is clicked", async () => {
    const user = userEvent.setup();
    render(<GraphControls {...mockProps} />);

    const zoomOutButton = screen.getByLabelText("Zoom out");
    await user.click(zoomOutButton);

    expect(mockProps.onZoomOut).toHaveBeenCalledOnce();
  });

  it("calls onFitToScreen when fit to screen button is clicked", async () => {
    const user = userEvent.setup();
    render(<GraphControls {...mockProps} />);

    const fitViewButton = screen.getByLabelText("Fit to screen");
    await user.click(fitViewButton);

    expect(mockProps.onFitToScreen).toHaveBeenCalledOnce();
  });

  it("calls onResetView when reset button is clicked", async () => {
    const user = userEvent.setup();
    render(<GraphControls {...mockProps} />);

    const resetButton = screen.getByLabelText("Reset view");
    await user.click(resetButton);

    expect(mockProps.onResetView).toHaveBeenCalledOnce();
  });

  it("supports multiple rapid clicks", async () => {
    const user = userEvent.setup();
    render(<GraphControls {...mockProps} />);

    const zoomInButton = screen.getByLabelText("Zoom in");
    await user.tripleClick(zoomInButton);

    expect(mockProps.onZoomIn).toHaveBeenCalledTimes(3);
  });

  it("renders with proper styling classes", () => {
    const { container } = render(<GraphControls {...mockProps} />);
    
    // Should have a container with proper classes
    const controlsContainer = container.firstChild;
    expect(controlsContainer).toHaveClass("absolute", "bottom-4", "right-4");
  });
});
