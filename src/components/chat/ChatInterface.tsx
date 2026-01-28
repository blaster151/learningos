"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button, Card } from "@/components/ui";
import { BrainIcon, UserIcon } from "@/components/icons";

// ===================================
// Types
// ===================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
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
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-blue-600"
            : "bg-gradient-to-br from-purple-500 to-indigo-600"
        }`}
      >
        {isUser ? (
          userPhotoURL ? (
            <img
              src={userPhotoURL}
              alt="You"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <UserIcon className="w-4 h-4 text-white" />
          )
        ) : (
          <BrainIcon className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse rounded-sm" />
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
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
        <BrainIcon className="w-4 h-4 text-white" />
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
    <div className="flex flex-wrap gap-2 mt-2 ml-12">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
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

      // Mark streaming complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

      // Notify parent of new session if created
      if (!sessionId && onSessionCreate) {
        // Session ID would come from response headers or body
        // For now, we'll handle this in the API
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
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
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <BrainIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Start a Conversation
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Ask me anything you want to learn about. I&apos;ll help you understand
              concepts through conversation and track your progress.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                "Explain recursion simply",
                "What is a closure in JavaScript?",
                "How do databases work?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 pr-12 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4"
            aria-label="Send message"
          >
            <SendIcon className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}

export default ChatInterface;
