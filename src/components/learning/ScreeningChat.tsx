"use client";

import type { ScreeningChatMessage, ScreeningProgress } from "@/types";

interface ScreeningChatProps {
  messages: ScreeningChatMessage[];
  inputValue: string;
  progress: ScreeningProgress | null;
  loading?: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onDontKnow: () => void;
  onGenerateNow: () => void;
  onCancel: () => void;
}

export default function ScreeningChat({
  messages,
  inputValue,
  progress,
  loading = false,
  onInputChange,
  onSend,
  onDontKnow,
  onGenerateNow,
  onCancel,
}: ScreeningChatProps) {
  return (
    <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="font-medium text-indigo-900 dark:text-indigo-300">Adaptive screening chat</div>
          <div className="text-xs text-indigo-800 dark:text-indigo-400">
            Quick check to narrow your goal and assess prerequisites.
          </div>
        </div>
        {progress && (
          <div className="text-xs text-indigo-900 dark:text-indigo-300 text-right">
            <div>Turns: {progress.turnCount}</div>
            <div>Assessed: {progress.assessedCount}</div>
          </div>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto rounded-md border border-indigo-100 dark:border-indigo-900 bg-white dark:bg-gray-900 p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-500">Waiting for first screening message…</div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`text-sm px-3 py-2 rounded-lg ${
                message.role === "assistant"
                  ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-950 dark:text-indigo-200"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              }`}
            >
              {message.content}
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading && inputValue.trim()) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Type your answer..."
          className="flex-1 px-3 py-2 border border-indigo-200 dark:border-indigo-700 rounded-md bg-white dark:bg-gray-900"
          disabled={loading}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={loading || !inputValue.trim()}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-400"
        >
          Send
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDontKnow}
          disabled={loading}
          className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 text-indigo-900 dark:text-indigo-300 text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
        >
          I don&apos;t know enough to answer
        </button>
        <button
          type="button"
          onClick={onGenerateNow}
          disabled={loading}
          className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:bg-gray-400"
        >
          Generate my path
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
