/**
 * PrerequisiteGapCard Component (E14-S5, Sub-task B)
 *
 * A purple-tinted card that represents an unresolved prerequisite gap.
 * Rendered to the left of (or above on mobile) the parent path card on the Learn page.
 *
 * Features:
 * - Displays concept name and parent path reference
 * - "Create Learning Path" CTA opens a confirmation modal
 * - Accessible: role="complementary", WAI-ARIA dialog on modal
 *
 * UX Reference: ux-specifications.md §13
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { PrerequisiteGap } from "@/lib/learning/extractPrerequisiteGaps";

interface PrerequisiteGapCardProps {
  gap: PrerequisiteGap;
  onCreatePath: (conceptName: string, sourcePathTitle: string) => void;
}

export default function PrerequisiteGapCard({
  gap,
  onCreatePath,
}: PrerequisiteGapCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Focus trap: when modal opens, focus the first focusable element
  useEffect(() => {
    if (modalOpen && modalRef.current) {
      const focusable = modalRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [modalOpen]);

  // Close modal on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) {
        setModalOpen(false);
        triggerRef.current?.focus();
      }
    },
    [modalOpen]
  );

  const handleCreate = () => {
    setModalOpen(false);
    onCreatePath(gap.conceptName, gap.sourcePathTitle);
  };

  const handleDismiss = () => {
    setModalOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <div
        role="complementary"
        aria-label={`Prerequisite gap: ${gap.conceptName} for ${gap.sourcePathTitle}`}
        className="flex-shrink-0 w-52 sm:w-56 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 flex flex-col justify-between"
      >
        {/* Header badge */}
        <div>
          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 mb-2">
            🟣 Prerequisite
          </span>

          {/* Concept name */}
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 leading-snug">
            {gap.conceptName}
          </h4>

          {/* Parent path reference */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Gap in &ldquo;{gap.sourcePathTitle}&rdquo;
          </p>
        </div>

        {/* CTA */}
        <button
          ref={triggerRef}
          onClick={() => setModalOpen(true)}
          aria-label={`Create a focused learning path for ${gap.conceptName}`}
          className="w-full px-3 py-1.5 text-xs font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Create Learning Path
        </button>
      </div>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={handleDismiss}
          onKeyDown={handleKeyDown}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Create a focused path for ${gap.conceptName}`}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              📘 Create a focused path for &ldquo;{gap.conceptName}&rdquo;?
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              This prerequisite appeared as a gap in your &ldquo;
              {gap.sourcePathTitle}&rdquo; path.
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              A short focused path will help you build this foundation before
              continuing.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Not Now
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Create Path
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
