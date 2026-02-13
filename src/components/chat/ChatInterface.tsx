"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { authFetch } from "@/lib/api/authFetch";
import { Button, Card } from "@/components/ui";
import { BrainIcon, UserIcon } from "@/components/icons";
import { ConceptTagsList, type ConceptData } from "./ConceptTag";
import { ObjectiveQuizComponent } from "./ObjectiveQuiz";
import type { ObjectiveQuiz, QuizQuestion } from "@/types";

// ===================================
// Types
// ===================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  concepts?: ConceptData[];
}

interface ChatInterfaceProps {
  sessionId?: string;
  initialMessages?: ChatMessage[];
  onSessionCreate?: (sessionId: string) => void;
  onSessionEnd?: () => void;
  sessionTopic?: string;
  /** Milestone objectives for AI-driven mastery assessment */
  milestoneObjectives?: string[];
  /** Path ID for persisting objective mastery */
  pathId?: string;
  /** Milestone ID for persisting objective mastery */
  milestoneId?: string;
  /** Previously mastered objective indices (restored from Firestore) */
  initialCompletedObjectives?: number[];
}

// ===================================
// Send Icon Component
// ===================================

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

// ===================================
// Message Bubble Component
// ===================================

interface MessageBubbleProps {
  message: ChatMessage;
  userPhotoURL?: string | null;
  onTermClick?: (term: string) => void;
  isSimplifying?: boolean;
  isFading?: boolean;
  isSimplified?: boolean;
  onUndoSimplify?: () => void;
}

/**
 * Parse message content and render **bold terms** as clickable buttons (for AI messages).
 * Other text is rendered as plain spans preserving whitespace.
 */
function renderMessageContent(
  content: string,
  isUser: boolean,
  onTermClick?: (term: string) => void
) {
  if (isUser || !onTermClick) {
    return <span className="whitespace-pre-wrap break-words leading-relaxed">{content}</span>;
  }

  // Split on **bold** markers, keeping the delimiters for reconstruction
  const parts = content.split(/(\*\*[^*]+\*\*)/g);

  return (
    <span className="whitespace-pre-wrap break-words leading-relaxed">
      {parts.map((part, i) => {
        const boldMatch = part.match(/^\*\*(.+)\*\*$/);
        if (boldMatch) {
          const term = boldMatch[1];
          return (
            <button
              key={i}
              onClick={() => onTermClick(term)}
              className="font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:underline cursor-pointer bg-transparent border-none p-0 m-0 inline text-inherit transition-colors"
              title={`Ask about "${term}"`}
              aria-label={`Learn more about ${term}`}
            >
              {term}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function MessageBubble({ message, userPhotoURL, onTermClick, isSimplifying, isFading, isSimplified, onUndoSimplify }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-2 sm:gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      role="article"
      aria-label={`${isUser ? "Your" : "AI"} message`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-blue-600"
            : "bg-gradient-to-br from-purple-500 to-indigo-600"
        }`}
        aria-hidden="true"
      >
        {isUser ? (
          userPhotoURL ? (
            <img
              src={userPhotoURL}
              alt="Your avatar"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
            />
          ) : (
            <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          )
        ) : (
          <BrainIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[85%] sm:max-w-[80%] ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base relative ${
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-700"
          }`}
        >
          {/* Simplifying spinner overlay */}
          {isSimplifying && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-800/60 rounded-2xl z-10">
              <span className="animate-spin text-lg" aria-label="Simplifying">🎯</span>
            </div>
          )}
          {/* Content with crossfade transition */}
          <div
            className={`transition-opacity ease-in-out ${isFading ? "opacity-0" : "opacity-100"}`}
            style={{ transitionDuration: isFading ? "750ms" : "750ms" }}
          >
            {renderMessageContent(message.content, isUser, onTermClick)}
          </div>
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-3.5 ml-1 bg-current animate-pulse rounded-sm" aria-label="Typing" />
          )}
        </div>
        
        {/* Simplified indicator with undo */}
        {isSimplified && !isUser && onUndoSimplify && (
          <div className="mt-1 ml-1">
            <button
              onClick={onUndoSimplify}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Show original version"
            >
              🎯 Simplified · <span className="underline">show original</span>
            </button>
          </div>
        )}

        {/* Concept Tags - only show for assistant messages with concepts */}
        {!isUser && !message.isStreaming && message.concepts && message.concepts.length > 0 && (
          <ConceptTagsList concepts={message.concepts} />
        )}
      </div>
    </div>
  );
}

// ===================================
// Typing Indicator Component
// ===================================

function TypingIndicator() {
  return (
    <div className="flex gap-2 sm:gap-3" role="status" aria-label="AI is typing">
      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center" aria-hidden="true">
        <BrainIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-3 py-2 sm:px-4 sm:py-3 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// ===================================
// Quick Actions Component
// ===================================

interface QuickActionsProps {
  onAction: (action: string) => void;
  simplifying?: boolean;
  hasMilestone?: boolean;
}

function QuickActions({ onAction, simplifying, hasMilestone }: QuickActionsProps) {
  const actions = [
    { id: "explain", label: "Explain more", icon: "💡" },
    { id: "example", label: "Give me an example", icon: "📝" },
    { id: "quiz", label: "Quiz me", icon: "❓" },
    { id: "simplify", label: simplifying ? "Simplifying…" : "Simplify this", icon: simplifying ? "⏳" : "🎯" },
    ...(hasMilestone ? [{ id: "continue_milestone", label: "Continue milestone", icon: "📍" }] : []),
  ];

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 ml-9 sm:ml-12" role="group" aria-label="Quick actions">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          disabled={action.id === "simplify" && simplifying}
          className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all shadow-sm hover:shadow ${
            action.id === "simplify" && simplifying ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-label={action.label}
        >
          <span aria-hidden="true">{action.icon}</span>
          <span className="hidden sm:inline">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

// ===================================
// Context-Aware Suggestions Component
// ===================================

interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  isLoading?: boolean;
}

function FollowUpSuggestions({ suggestions, onSelect, isLoading }: FollowUpSuggestionsProps) {
  if (!isLoading && suggestions.length === 0) return null;

  return (
    <div className="mt-2 ml-9 sm:ml-12 space-y-1.5" role="group" aria-label="Follow-up suggestions">
      <p className="text-xs text-gray-500 dark:text-gray-400">Follow up:</p>
      {isLoading ? (
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-7 w-32 bg-blue-50 dark:bg-blue-900/20 rounded-full animate-pulse border border-blue-200 dark:border-blue-800"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSelect(suggestion)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-all"
            >
              <span aria-hidden="true">→</span>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Static fallback follow-ups — used only if the AI call fails or isn't triggered. */
function generateFallbackFollowUps(): string[] {
  return [
    "Tell me more about this topic",
    "Can you give me an example?",
    "How does this connect to other concepts?",
  ];
}

// ===================================
// Chat Interface Component
// ===================================

export function ChatInterface({
  sessionId,
  initialMessages = [],
  onSessionCreate,
  onSessionEnd,
  sessionTopic,
  milestoneObjectives,
  pathId,
  milestoneId,
  initialCompletedObjectives,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [greetingSent, setGreetingSent] = useState(false);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [isLoadingFollowUps, setIsLoadingFollowUps] = useState(false);
  const [masteredObjectives, setMasteredObjectives] = useState<Set<number>>(
    new Set(initialCompletedObjectives || [])
  );
  const [readyToQuizObjectives, setReadyToQuizObjectives] = useState<Set<number>>(new Set());
  const [activeQuiz, setActiveQuiz] = useState<ObjectiveQuiz | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [assessmentNotice, setAssessmentNotice] = useState<string | null>(null);
  // Simplify-in-place state
  const [simplifyingMessageId, setSimplifyingMessageId] = useState<string | null>(null);
  const [originalContents, setOriginalContents] = useState<Record<string, string>>({});
  const [fadingMessageId, setFadingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Expose onSessionEnd in case we need to use it later
  // Currently unused but available for session management
  void onSessionEnd;

  // Fetch concepts for a message after streaming completes
  const fetchConceptsForMessage = async (
    messageId: string,
    userMessage: string,
    assistantMessage: string
  ) => {
    if (!user) return;
    try {
      // Call the concept extraction API
      const response = await authFetch(user, "/api/concepts/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: userMessage },
            { role: "assistant", content: assistantMessage },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.concepts && data.concepts.length > 0) {
          // Update the message with extracted concepts
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, concepts: data.concepts }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch concepts:", error);
      // Don't show error to user, concepts are optional enhancement
    }
  };

  // Fetch AI-generated follow-up suggestions after each assistant response
  const fetchFollowUps = async (
    lastUserMessage: string,
    lastAssistantMessage: string
  ) => {
    if (!user) return;
    setIsLoadingFollowUps(true);
    setFollowUpSuggestions([]);
    try {
      const response = await authFetch(user, "/api/chat/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTopic,
          lastUserMessage,
          lastAssistantMessage,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setFollowUpSuggestions(data.suggestions || generateFallbackFollowUps());
      } else {
        setFollowUpSuggestions(generateFallbackFollowUps());
      }
    } catch (error) {
      console.error("Failed to fetch follow-ups:", error);
      setFollowUpSuggestions(generateFallbackFollowUps());
    } finally {
      setIsLoadingFollowUps(false);
    }
  };

  // Handle clicking a bolded term in an AI response
  const handleTermClick = (term: string) => {
    const prompt = `Tell me about ${term}`;
    setInput(prompt);
    // Auto-send after a brief delay
    setTimeout(() => {
      const sendBtn = document.querySelector('[aria-label="Send message"]') as HTMLButtonElement;
      sendBtn?.click();
    }, 100);
  };

  // Assess whether the learner has covered enough of an objective to be quizzed
  // This marks objectives as "ready to quiz" (🧪) — NOT auto-completed
  const assessObjectives = async (allMessages: ChatMessage[]) => {
    if (!user || !milestoneObjectives?.length || !pathId || !milestoneId) return;

    // Need at least 2 user messages to start assessing
    const userMsgCount = allMessages.filter((m) => m.role === "user").length;
    if (userMsgCount < 2) return;

    try {
      const conversationExcerpt = allMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await authFetch(user, "/api/chat/assess-objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectives: milestoneObjectives,
          conversationExcerpt,
        }),
      });

      if (!response.ok) return;

      const data: { mastered: number[]; reasoning: Record<string, string> } =
        await response.json();

      if (data.mastered.length > 0) {
        // Mark objectives as ready to quiz (not auto-completed)
        const newlyReady = data.mastered.filter(
          (i) => !readyToQuizObjectives.has(i) && !masteredObjectives.has(i)
        );

        if (newlyReady.length > 0) {
          setReadyToQuizObjectives((prev) => {
            const updated = new Set(prev);
            newlyReady.forEach((i) => updated.add(i));
            return updated;
          });

          const names = newlyReady
            .map((i) => milestoneObjectives[i])
            .join(", ");
          setAssessmentNotice(
            `🧪 Ready to quiz: ${names}`
          );
          setTimeout(() => setAssessmentNotice(null), 6000);
        }
      }
    } catch (error) {
      console.error("Failed to assess objectives:", error);
    }
  };

  // Generate and start a quiz for a specific objective
  const startQuiz = async (objectiveIndex: number) => {
    if (!user || !milestoneObjectives || isGeneratingQuiz || activeQuiz) return;

    const objectiveText = milestoneObjectives[objectiveIndex];
    setIsGeneratingQuiz(true);
    setAssessmentNotice(`📝 Generating quiz for: ${objectiveText.length > 40 ? objectiveText.slice(0, 40) + "…" : objectiveText}`);

    try {
      // Build conversation context from recent messages
      const conversationContext = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-20)
        .map((m) => `${m.role === "user" ? "LEARNER" : "TUTOR"}: ${m.content}`)
        .join("\n\n");

      const response = await authFetch(user, "/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective: objectiveText,
          conversationContext,
          milestoneTitle: sessionTopic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }

      const data = await response.json();
      const questions: QuizQuestion[] = data.questions.map((q: QuizQuestion, i: number) => ({
        ...q,
        index: i,
      }));

      const quiz: ObjectiveQuiz = {
        objectiveIndex,
        objectiveText,
        questions,
        currentQuestionIndex: 0,
        status: "in_progress",
        score: 0,
        passed: false,
      };

      setActiveQuiz(quiz);
      setAssessmentNotice(null);
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      setAssessmentNotice("❌ Failed to generate quiz. Please try again.");
      setTimeout(() => setAssessmentNotice(null), 4000);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Handle quiz completion
  const handleQuizComplete = (completedQuiz: ObjectiveQuiz) => {
    if (completedQuiz.passed && user && pathId && milestoneId && milestoneObjectives) {
      const objIdx = completedQuiz.objectiveIndex;

      // Add to mastered set
      setMasteredObjectives((prev) => {
        const updated = new Set(prev);
        updated.add(objIdx);
        return updated;
      });

      // Remove from ready-to-quiz set
      setReadyToQuizObjectives((prev) => {
        const updated = new Set(prev);
        updated.delete(objIdx);
        return updated;
      });

      // Persist to the path API
      const allMastered = [...masteredObjectives, objIdx];
      authFetch(user, `/api/paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_objectives",
          milestoneId,
          completedObjectives: allMastered,
        }),
      }).catch((err) =>
        console.error("Failed to persist objective mastery:", err)
      );
    }
  };

  // Cancel/dismiss the active quiz
  const handleQuizCancel = () => {
    setActiveQuiz(null);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Auto-generate AI greeting for topic-scoped sessions
  useEffect(() => {
    if (greetingSent || !sessionTopic || !user || !sessionId || messages.length > 0 || isLoading) return;
    setGreetingSent(true);

    // Extract the actual topic from "Learning about: X" format
    const topicText = sessionTopic.replace(/^Learning about:\s*/i, "");

    const generateGreeting = async () => {
      setIsLoading(true);
      const greetingId = `msg-greeting-${Date.now()}`;

      // Add a placeholder streaming message
      const assistantMessage: ChatMessage = {
        id: greetingId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages([assistantMessage]);

      try {
        const response = await authFetch(user, "/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `I want to learn about: ${topicText}. Please give me a brief, engaging introduction to this topic — what it covers, why it matters, and what I'll learn. Keep it to 2-3 paragraphs. Then suggest a good first question I could ask to get started.`,
            sessionId,
            history: [],
          }),
        });

        if (!response.ok) throw new Error("Greeting failed");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullContent += chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === greetingId ? { ...msg, content: fullContent } : msg
              )
            );
          }
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === greetingId ? { ...msg, isStreaming: false } : msg
          )
        );

        // Fetch contextual follow-ups for the greeting
        fetchFollowUps("", fullContent);
      } catch (error) {
        console.error("Failed to generate greeting:", error);
        // Fall back to a static greeting
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === greetingId
              ? {
                  ...msg,
                  content: `Welcome! Let's explore **${topicText}** together. What would you like to know first?`,
                  isStreaming: false,
                }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

    generateGreeting();
  }, [greetingSent, sessionTopic, user, sessionId, messages.length, isLoading]);

  // Handle quick action buttons
  const handleQuickAction = (action: string) => {
    // Simplify gets special handling — silent crossfade
    if (action === "simplify") {
      handleSimplify();
      return;
    }

    const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistantMessage) return;

    // If quiz action and we have ready objectives, start the quiz system
    if (action === "quiz" && milestoneObjectives?.length) {
      const readyIdx = milestoneObjectives.findIndex(
        (_, i) => readyToQuizObjectives.has(i) && !masteredObjectives.has(i)
      );
      if (readyIdx >= 0) {
        startQuiz(readyIdx);
        return;
      }
      // No ready objectives — fall through to chat-based quiz
    }

    // Continue milestone — build a context-rich prompt with remaining objectives
    if (action === "continue_milestone" && milestoneObjectives?.length) {
      const remaining = milestoneObjectives
        .map((obj, i) => ({ obj, i }))
        .filter(({ i }) => !masteredObjectives.has(i));
      const nextObjective = remaining[0];
      const remainingList = remaining.map(({ obj }) => `• ${obj}`).join("\n");
      const prompt = nextObjective
        ? `Let's get back to the milestone. I still need to cover these objectives:\n${remainingList}\n\nPlease pick up with the next one: "${nextObjective.obj}". Give me a clear explanation to get started.`
        : "Let's continue with the milestone. What should we cover next?";
      setInput(prompt);
      setTimeout(() => {
        const sendBtn = document.querySelector('[aria-label="Send message"]') as HTMLButtonElement;
        sendBtn?.click();
      }, 100);
      return;
    }

    const prompts: Record<string, string> = {
      explain: "Can you explain that in more detail?",
      example: "Can you give me a practical example of this?",
      quiz: "Quiz me on what we just discussed to check my understanding.",
    };

    const prompt = prompts[action];
    if (prompt) {
      setInput(prompt);
      // Auto-send after a brief delay
      setTimeout(() => {
        const sendBtn = document.querySelector('[aria-label="Send message"]') as HTMLButtonElement;
        sendBtn?.click();
      }, 100);
    }
  };

  // Silently fetch a simplified version and crossfade it in
  const handleSimplify = async () => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant" && !m.isStreaming);
    if (!lastAssistantMessage || !user || simplifyingMessageId) return;

    const targetId = lastAssistantMessage.id;

    // Save original content for undo
    setOriginalContents((prev) => ({
      ...prev,
      [targetId]: lastAssistantMessage.content,
    }));
    setSimplifyingMessageId(targetId);

    try {
      const response = await authFetch(user, "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Please rewrite the following explanation in simpler, more accessible terms. Keep the same key ideas but use shorter sentences, simpler words, and more analogies. Do NOT add any preamble like "Sure!" or "Here's a simpler version" — just give the simplified explanation directly:\n\n${lastAssistantMessage.content}`,
          sessionId,
          history: messages.slice(-10),
        }),
      });

      if (!response.ok) throw new Error("Simplify request failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      // Collect the full simplified response first
      let simplifiedContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        simplifiedContent += chunk;
      }

      // Phase 1: Fade out old content (750ms)
      setFadingMessageId(targetId);

      await new Promise((resolve) => setTimeout(resolve, 750));

      // Swap in the new content while invisible
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === targetId
            ? { ...msg, content: simplifiedContent }
            : msg
        )
      );

      // Phase 2: Fade in new content (750ms)
      // Small delay to ensure React renders the new content at opacity 0
      await new Promise((resolve) => setTimeout(resolve, 50));
      setFadingMessageId(null);

    } catch (error) {
      console.error("Failed to simplify:", error);
      // Revert on error
      setFadingMessageId(null);
      setOriginalContents((prev) => {
        const updated = { ...prev };
        delete updated[targetId];
        return updated;
      });
    } finally {
      setSimplifyingMessageId(null);
    }
  };

  // Undo simplification — restore original content with crossfade
  const handleUndoSimplify = async (messageId: string) => {
    const original = originalContents[messageId];
    if (!original) return;

    // Fade out
    setFadingMessageId(messageId);
    await new Promise((resolve) => setTimeout(resolve, 750));

    // Swap back
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, content: original }
          : msg
      )
    );

    // Remove from originals
    setOriginalContents((prev) => {
      const updated = { ...prev };
      delete updated[messageId];
      return updated;
    });

    // Fade in
    await new Promise((resolve) => setTimeout(resolve, 50));
    setFadingMessageId(null);
  };

  // Handle clicking a follow-up suggestion
  const handleFollowUpSelect = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      const sendBtn = document.querySelector('[aria-label="Send message"]') as HTMLButtonElement;
      sendBtn?.click();
    }, 100);
  };

  // Handle sending a message
  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    if (!user) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-error-${Date.now()}`,
          role: "assistant",
          content: "⚠️ Please sign in to chat.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
    };

    // Add user message to state
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setFollowUpSuggestions([]);
    setIsLoadingFollowUps(false);

    try {
      // Call chat API
      const response = await authFetch(user, "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedInput,
          sessionId,
          history: messages.slice(-10), // Send last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      // Create assistant message placeholder
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Read stream
      let fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        // Update message content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: fullContent }
              : msg
          )
        );
      }

      // Mark streaming complete and fetch concepts
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

      // Fetch concepts for this conversation (async, don't block UI)
      fetchConceptsForMessage(assistantMessage.id, trimmedInput, fullContent);

      // Fetch AI-powered follow-up suggestions (async, don't block UI)
      fetchFollowUps(trimmedInput, fullContent);

      // Assess milestone objectives if in a milestone-scoped session
      if (milestoneObjectives?.length) {
        // Get updated messages list including the new exchange
        const updatedMessages = [
          ...messages,
          userMessage,
          { ...assistantMessage, content: fullContent, isStreaming: false },
        ];
        assessObjectives(updatedMessages);
      }

      // Notify parent of new session if created
      if (!sessionId && onSessionCreate) {
        // Session ID would come from response headers or body
        // For now, we'll handle this in the API
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Remove the user message that failed
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
      
      // Show error toast/notification
      const errorMessage = error instanceof Error ? error.message : "Network error";
      
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-error-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Sorry, I encountered an error: ${errorMessage}. Please check your connection and try again.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && isLoading ? (
          /* Greeting is being generated — show typing indicator */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <BrainIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {sessionTopic || "Starting session..."}
            </h2>
            <div className="mt-4">
              <TypingIndicator />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <BrainIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            {sessionTopic ? (
              <>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  {sessionTopic}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mb-6">
                  Preparing your learning session...
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Start a Conversation
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mb-6">
                  Ask me anything you want to learn about. I&apos;ll help you understand
                  concepts through conversation and track your progress.
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-2 max-w-lg">
                  {[
                    "Explain recursion simply",
                    "What is a closure in JavaScript?",
                    "How do databases work?",
                  ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="px-3 py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all shadow-sm hover:shadow"
                  aria-label={`Use example prompt: ${prompt}`}
                >
                  {prompt}
                </button>
              ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={message.id}>
                <MessageBubble
                  message={message}
                  userPhotoURL={user?.photoURL}
                  onTermClick={handleTermClick}
                  isSimplifying={simplifyingMessageId === message.id}
                  isFading={fadingMessageId === message.id}
                  isSimplified={!!originalContents[message.id]}
                  onUndoSimplify={() => handleUndoSimplify(message.id)}
                />
                {/* Quick Actions after AI response */}
                {message.role === "assistant" && 
                 !message.isStreaming && 
                 index === messages.length - 1 && 
                 !isLoading && (
                  <>
                    <QuickActions onAction={handleQuickAction} simplifying={!!simplifyingMessageId} hasMilestone={!!milestoneObjectives?.length} />
                    <FollowUpSuggestions
                      suggestions={followUpSuggestions}
                      onSelect={handleFollowUpSelect}
                      isLoading={isLoadingFollowUps}
                    />
                  </>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <TypingIndicator />
            )}
          </>
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Objective Mastery Notice */}
      {assessmentNotice && (
        <div className="mx-3 sm:mx-4 mb-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-200 animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
          <span>{assessmentNotice}</span>
        </div>
      )}

      {/* Active Quiz — rendered inline above the objectives tracker */}
      {activeQuiz && (
        <ObjectiveQuizComponent
          quiz={activeQuiz}
          onComplete={handleQuizComplete}
          onCancel={handleQuizCancel}
        />
      )}

      {/* Milestone Objectives Tracker — shown when in a milestone-scoped session */}
      {milestoneObjectives && milestoneObjectives.length > 0 && messages.length > 0 && (
        <div className="mx-3 sm:mx-4 mb-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              Milestone Objectives
            </span>
            <span className="text-xs text-indigo-500 dark:text-indigo-400">
              {masteredObjectives.size}/{milestoneObjectives.length} mastered
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {milestoneObjectives.map((obj, i) => {
              const isMastered = masteredObjectives.has(i);
              const isReady = readyToQuizObjectives.has(i) && !isMastered;
              return (
                <button
                  key={i}
                  onClick={() => isReady && !activeQuiz && !isGeneratingQuiz && startQuiz(i)}
                  disabled={isMastered || !isReady || !!activeQuiz || isGeneratingQuiz}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-all ${
                    isMastered
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 cursor-default"
                      : isReady
                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 cursor-pointer hover:shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 cursor-default"
                  }`}
                  title={isMastered ? `✅ ${obj}` : isReady ? `🧪 Click to quiz: ${obj}` : obj}
                >
                  {isMastered ? "✅" : isReady ? "🧪" : "○"}{" "}
                  {obj.length > 30 ? obj.slice(0, 30) + "…" : obj}
                </button>
              );
            })}
          </div>
          {readyToQuizObjectives.size > 0 && !activeQuiz && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
              🧪 = Ready to quiz — click to test your understanding
            </p>
          )}
        </div>
      )}

      {/* Input Area - sticky for mobile keyboard handling */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-white dark:bg-gray-900 shadow-lg sticky bottom-0 safe-area-inset-bottom">
        <div className="flex gap-2 sm:gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={isLoading}
              aria-label="Message input"
              maxLength={2000}
              style={{ fontSize: "16px" }} // Prevents iOS zoom on focus
            />
            {input.length > 1800 && (
              <span className="absolute bottom-2 right-2 text-xs text-gray-400" aria-live="polite">
                {2000 - input.length}
              </span>
            )}
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-3 sm:px-4 min-w-[44px] min-h-[44px] h-10 sm:h-11 shrink-0"
            aria-label="Send message"
            title="Send message (Enter)"
          >
            {isLoading ? (
              <span className="animate-spin" aria-hidden="true">⏳</span>
            ) : (
              <SendIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 hidden sm:block">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}

export default ChatInterface;
