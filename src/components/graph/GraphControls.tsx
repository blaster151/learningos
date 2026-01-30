"use client";

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onResetView: () => void;
}

export default function GraphControls({
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onResetView,
}: GraphControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
      <button
        onClick={onZoomIn}
        className="p-3 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        title="Zoom In (+ key)"
        aria-label="Zoom in"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>

      <button
        onClick={onZoomOut}
        className="p-3 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        title="Zoom Out (- key)"
        aria-label="Zoom out"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </button>

      <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

      <button
        onClick={onFitToScreen}
        className="p-3 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        title="Fit to Screen"
        aria-label="Fit to screen"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
      </button>

      <button
        onClick={onResetView}
        className="p-3 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        title="Reset View"
        aria-label="Reset view"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      <div className="hidden md:block text-xs text-gray-500 dark:text-gray-400 px-2 py-1 text-center border-t border-gray-200 dark:border-gray-700 mt-1">
        <div>+/- Zoom</div>
        <div>Drag to pan</div>
      </div>
    </div>
  );
}
