"use client";

import { useState, useEffect } from "react";

interface GeneratedPrompt {
  promptId: string;
  sessionId: string;
  promptText: string;
  hints: string[];
  conceptsToAddress: string[];
  minWords: number;
  maxWords: number;
}

interface ReflectionModalProps {
  isOpen: boolean;
  prompt: GeneratedPrompt;
  onSubmit: (content: string) => Promise<void>;
  onSkip: () => void;
  onClose: () => void;
}

export default function ReflectionModal({
  isOpen,
  prompt,
  onSubmit,
  onSkip,
  onClose,
}: ReflectionModalProps) {
  const [content, setContent] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = wordCount >= prompt.minWords && wordCount <= prompt.maxWords;
  const progress = Math.min(100, (wordCount / prompt.minWords) * 100);

  useEffect(() => {
    if (!isOpen) {
      setContent("");
      setShowHints(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(content);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white dark:bg-gray-900 w-full h-full md:rounded-lg md:shadow-xl md:max-w-2xl md:w-full md:h-auto md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Time to Reflect
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Take a moment to think about what you've learned
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 py-4 space-y-4">
          {/* Prompt */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-gray-800 dark:text-gray-200">{prompt.promptText}</p>
          </div>

          {/* Hints (Collapsible) */}
          {prompt.hints.length > 0 && (
            <div>
              <button
                onClick={() => setShowHints(!showHints)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showHints ? "rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {showHints ? "Hide" : "Show"} hints
              </button>
              {showHints && (
                <ul className="mt-2 space-y-1 pl-6">
                  {prompt.hints.map((hint, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 list-disc">
                      {hint}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Input */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your reflection here..."
              className="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={submitting}
            />

            {/* Word Count Progress */}
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Word count: <span className="font-medium">{wordCount}</span> / {prompt.minWords}–{prompt.maxWords}
                </span>
                <span
                  className={`font-medium ${
                    canSubmit
                      ? "text-green-600 dark:text-green-400"
                      : wordCount > prompt.maxWords
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {canSubmit
                    ? "Ready to submit"
                    : wordCount > prompt.maxWords
                    ? "Too long"
                    : `${prompt.minWords - wordCount} more words needed`}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    canSubmit ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between sticky bottom-0 bg-white dark:bg-gray-900">
          <button
            onClick={onSkip}
            disabled={submitting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 min-h-[44px]"
          >
            Not now
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Analyzing...
              </span>
            ) : (
              "Submit Reflection"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
