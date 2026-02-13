"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { User } from "firebase/auth";
import { authFetch } from "@/lib/api/authFetch";

// ===================================
// Types
// ===================================

export interface Highlight {
  highlightId: string;
  userId: string;
  sessionId: string;
  messageId: string;
  text: string;
  startOffset: number;
  endOffset: number;
  note?: string;
  createdAt: { seconds: number; nanoseconds: number };
}

export interface HighlightPopupState {
  visible: boolean;
  x: number;
  y: number;
  text: string;
  messageId: string;
  startOffset: number;
  endOffset: number;
}

// ===================================
// useHighlights Hook
// ===================================

export function useHighlights(user: User | null, sessionId: string | undefined) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [popup, setPopup] = useState<HighlightPopupState>({
    visible: false,
    x: 0,
    y: 0,
    text: "",
    messageId: "",
    startOffset: 0,
    endOffset: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch existing highlights for this session
  const fetchHighlights = useCallback(async () => {
    if (!user || !sessionId) return;
    try {
      const response = await authFetch(
        user,
        `/api/highlights?userId=${user.uid}&sessionId=${sessionId}`
      );
      if (response.ok) {
        const data = await response.json();
        setHighlights(data.highlights || []);
      }
    } catch (error) {
      console.error("Failed to fetch highlights:", error);
    }
  }, [user, sessionId]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  // Handle text selection in a message bubble
  const handleTextSelection = useCallback(
    (messageId: string) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();

      if (!selectedText || selectedText.length < 3) {
        return;
      }

      // Find the message content container
      const messageEl = document.querySelector(
        `[data-message-id="${messageId}"] [data-message-content]`
      );
      if (!messageEl || !messageEl.contains(range.commonAncestorContainer)) {
        return;
      }

      // Calculate offset within the text content
      const preRange = document.createRange();
      preRange.selectNodeContents(messageEl);
      preRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preRange.toString().length;
      const endOffset = startOffset + selectedText.length;

      // Position the popup above the selection
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - (containerRect?.left || 0);
      const y = rect.top - (containerRect?.top || 0) - 10;

      setPopup({
        visible: true,
        x,
        y,
        text: selectedText,
        messageId,
        startOffset,
        endOffset,
      });
    },
    []
  );

  // Save a highlight
  const saveHighlight = useCallback(
    async (note?: string) => {
      if (!user || !sessionId || !popup.text) return;
      setIsSaving(true);
      try {
        const response = await authFetch(user, "/api/highlights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            messageId: popup.messageId,
            text: popup.text,
            startOffset: popup.startOffset,
            endOffset: popup.endOffset,
            note,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setHighlights((prev) => [data.highlight, ...prev]);
        }
      } catch (error) {
        console.error("Failed to save highlight:", error);
      } finally {
        setIsSaving(false);
        dismissPopup();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, sessionId, popup]
  );

  // Delete a highlight
  const deleteHighlight = useCallback(
    async (highlightId: string) => {
      if (!user) return;
      try {
        const response = await authFetch(
          user,
          `/api/highlights?highlightId=${highlightId}`,
          { method: "DELETE" }
        );
        if (response.ok) {
          setHighlights((prev) =>
            prev.filter((h) => h.highlightId !== highlightId)
          );
        }
      } catch (error) {
        console.error("Failed to delete highlight:", error);
      }
    },
    [user]
  );

  // Dismiss the popup
  const dismissPopup = useCallback(() => {
    setPopup((prev) => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
  }, []);

  return {
    highlights,
    popup,
    isSaving,
    containerRef,
    handleTextSelection,
    saveHighlight,
    deleteHighlight,
    dismissPopup,
    fetchHighlights,
  };
}
