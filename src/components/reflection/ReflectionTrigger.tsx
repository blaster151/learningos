"use client";

interface ReflectionTriggerProps {
  onReflect: () => void;
  onDismiss: () => void;
}

export default function ReflectionTrigger({
  onReflect,
  onDismiss,
}: ReflectionTriggerProps) {
  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border-2 border-blue-500 p-4 z-40 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            Ready to reflect on what you learned?
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Take a moment to consolidate your understanding
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={onReflect}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reflect Now
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2 text-gray-700 text-sm hover:bg-gray-100 rounded-lg transition-colors"
        >
          Not Now
        </button>
      </div>
    </div>
  );
}
