"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button, Card } from "@/components/ui";
import { BrainIcon, UserIcon } from "@/components/icons";
import { ConceptTagsList, type ConceptData } from "./ConceptTag";

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
}

function MessageBubble({ message, userPhotoURL }: MessageBubbleProps) {
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
          className={`inline-block rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base ${
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-700"
          }`}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-3.5 ml-1 bg-current animate-pulse rounded-sm" aria-label="Typing" />
          )}
        </div>
        
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
}

function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    { id: "explain", label: "Explain more", icon: "💡" },
    { id: "example", label: "Give me an example", icon: "📝" },
    { id: "quiz", label: "Quiz me", icon: "❓" },
    { id: "simplify", label: "Simplify this", icon: "🎯" },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 ml-9 sm:ml-12" role="group" aria-label="Quick actions">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all shadow-sm hover:shadow"
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
// Chat Interface Component
// ===================================

export function ChatInterface({
  sessionId,
  initialMessages = [],
  onSessionCreate,
  onSessionEnd,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Expose onSessionEnd in case we need to use it later
  // Currently unused but available for session management
  void onSessionEnd;

  // Fetch concepts for a message after streaming completes
  const fetchConceptsForMessage = async (
    userId: string,
    messageId: string,
    userMessage: string,
    assistantMessage: string
  ) => {
    try {
      // Call the concept extraction API
      const response = await fetch("/api/concepts/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
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

  // Handle quick action buttons
  const handleQuickAction = (action: string) => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistantMessage) return;

    const prompts: Record<string, string> = {
      explain: "Can you explain that in more detail?",
      example: "Can you give me a practical example of this?",
      quiz: "Quiz me on what we just discussed to check my understanding.",
      simplify: "Can you explain that in simpler terms?",
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

  // Handle sending a message
  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

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

    try {
      // Call chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedInput,
          sessionId,
          userId: user?.uid,
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
      if (user?.uid) {
        fetchConceptsForMessage(user.uid, assistantMessage.id, trimmedInput, fullContent);
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
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <BrainIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
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
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={message.id}>
                <MessageBubble
                  message={message}
                  userPhotoURL={user?.photoURL}
                />
                {/* Quick Actions after AI response */}
                {message.role === "assistant" && 
                 !message.isStreaming && 
                 index === messages.length - 1 && 
                 !isLoading && (
                  <QuickActions onAction={handleQuickAction} />
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
