"use client";

import { useState } from "react";
import { HighlighterIcon } from "@/components/icons";

// ===================================
// Highlight Popup
// Shows when user selects text in a chat message
// ===================================

interface HighlightPopupProps {
  x: number;
  y: number;
  text: string;
  isSaving: boolean;
  onSave: (note?: string) => void;
  onDismiss: () => void;
}

export function HighlightPopup({
  x,
  y,
  text,
  isSaving,
  onSave,
  onDismiss,
}: HighlightPopupProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");

  const handleSave = () => {
    onSave(note || undefined);
    setNote("");
    setShowNoteInput(false);
  };

  const handleQuickSave = () => {
    onSave();
  };

  return (
    <>
      {/* Backdrop to catch clicks outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Popup */}
      <div
        className="absolute z-50 transform -translate-x-1/2 -translate-y-full"
        style={{ left: x, top: y }}
        role="dialog"
        aria-label="Highlight text"
      >
        <div className="bg-gray-900 dark:bg-gray-100 rounded-lg shadow-xl p-2 min-w-[180px] max-w-[300px]">
          {!showNoteInput ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleQuickSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 rounded transition-colors"
                title="Save highlight"
              >
                <HighlighterIcon className="w-4 h-4" />
                <span>{isSaving ? "Saving…" : "Highlight"}</span>
              </button>
              <div className="w-px h-5 bg-gray-700 dark:bg-gray-300" />
              <button
                onClick={() => setShowNoteInput(true)}
                disabled={isSaving}
                className="px-2 py-1.5 text-sm text-gray-300 dark:text-gray-600 hover:text-white dark:hover:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 rounded transition-colors"
                title="Add a note"
              >
                + Note
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate px-1">
                &ldquo;{text.length > 40 ? text.slice(0, 40) + "…" : text}&rdquo;
              </p>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") onDismiss();
                }}
                placeholder="Add a note…"
                className="w-full px-2 py-1 text-sm bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded border border-gray-700 dark:border-gray-300 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                autoFocus
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={onDismiss}
                  className="px-2 py-1 text-xs text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-900 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-500 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "…" : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Arrow pointing down */}
        <div className="flex justify-center">
          <div className="w-2.5 h-2.5 bg-gray-900 dark:bg-gray-100 transform rotate-45 -mt-1.5" />
        </div>
      </div>
    </>
  );
}
