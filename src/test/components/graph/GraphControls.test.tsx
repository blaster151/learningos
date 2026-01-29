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
    onFitView: vi.fn(),
    onReset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all control buttons", () => {
    render(<GraphControls {...mockProps} />);
    
    expect(screen.getByTitle("Zoom In")).toBeInTheDocument();
    expect(screen.getByTitle("Zoom Out")).toBeInTheDocument();
    expect(screen.getByTitle("Fit to Screen")).toBeInTheDocument();
    expect(screen.getByTitle("Reset View")).toBeInTheDocument();
  });

  it("calls onZoomIn when zoom in button is clicked", async () => {
    const user = userEvent.setup();
    render(<GraphControls {...mockProps} />);

    const zoomInButton = screen.getByTitle("Zoom In");
    await user.click(zoomInButton);

    expect(mockProps.onZoomIn).toHaveBeenCalledOnce();
  });

  it("calls onZoomOut when zoom out button is clicked", async () => {
    const user = userEvent.setup();
    render(<GraphControls {...mockProps} />);

    const zoomOutButton = screen.getByTitle("Zoom Out");
    await user.click(zoomOutButton);

    expect(mockProps.onZoomOut).toHaveBeenCalledOnce();
  });

  it("calls onFitView when fit to screen button is clicked", async () => {
    const user = userEvent.setup();
    render(<GraphControls {...mockProps} />);

    const fitViewButton = screen.getByTitle("Fit to Screen");
    await user.click(fitViewButton);

    expect(mockProps.onFitView).toHaveBeenCalledOnce();
  });

  it("calls onReset when reset button is clicked", async () => {
    const user = userEvent.setup();
    render(<GraphControls {...mockProps} />);

    const resetButton = screen.getByTitle("Reset View");
    await user.click(resetButton);

    expect(mockProps.onReset).toHaveBeenCalledOnce();
  });

  it("supports multiple rapid clicks", async () => {
    const user = userEvent.setup();
    render(<GraphControls {...mockProps} />);

    const zoomInButton = screen.getByTitle("Zoom In");
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
