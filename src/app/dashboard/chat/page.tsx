"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ChatInterface, ChatMessage, SessionSummary } from "@/components/chat";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Skeleton, SkeletonText } from "@/components/ui";
import { MessageCircleIcon, PlusIcon, HistoryIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { authFetch } from "@/lib/api/authFetch";

interface Session {
  sessionId: string;
  topic: string;
  status: "active" | "paused" | "completed";
  createdAt: string;
  messageCount: number;
}

export default function ChatPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [conceptHandled, setConceptHandled] = useState(false);

  // Load user's sessions
  const loadSessions = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await authFetch(user, `/api/sessions?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        
        // Auto-select most recent active session
        const activeSession = data.sessions?.find((s: Session) => s.status === "active");
        if (activeSession) {
          setActiveSessionId(activeSession.sessionId);
        }
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load messages for active session
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      if (!user) return;
      const response = await authFetch(user, `/api/messages?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setInitialMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }, [user]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Handle "Chat from Context" — auto-create session when navigated from concept graph
  useEffect(() => {
    if (conceptHandled || isLoading || !user) return;
    const conceptName = searchParams.get("concept");
    if (!conceptName) return;

    setConceptHandled(true);
    const conceptId = searchParams.get("conceptId");
    const topic = `Learning about: ${conceptName}`;
    
    // Create a session with concept context
    const startConceptSession = async () => {
      try {
        const response = await authFetch(user, "/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            topic,
            goal: `Deep dive into the concept: ${conceptName}`,
            ...(conceptId && { conceptId }),
          }),
        });

        if (response.ok) {
          const newSession = await response.json();
          setActiveSessionId(newSession.sessionId);
          setInitialMessages([]);
          setSessions((prev) => [newSession, ...prev]);
          setShowHistory(false);
          setShowSummary(false);

          // Clean up URL params without triggering a navigation
          window.history.replaceState({}, "", "/dashboard/chat");
        }
      } catch (error) {
        console.error("Failed to create concept session:", error);
      }
    };

    startConceptSession();
  }, [conceptHandled, isLoading, user, searchParams]);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    } else {
      setInitialMessages([]);
    }
  }, [activeSessionId, loadMessages]);

  // Create new session
  const createNewSession = async (topic: string = "General Learning") => {
    if (!user) return;

    try {
      const response = await authFetch(user, "/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          topic,
          goal: "Explore and learn through conversation",
        }),
      });

      if (response.ok) {
        const newSession = await response.json();
        setActiveSessionId(newSession.sessionId);
        setInitialMessages([]);
        setSessions((prev) => [newSession, ...prev]);
        setShowHistory(false);
        setShowSummary(false);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  // End session and show summary
  const endSession = async () => {
    if (!user || !activeSessionId) return;

    try {
      await authFetch(user, `/api/sessions?sessionId=${activeSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
        }),
      });

      setCompletedSessionId(activeSessionId);
      setShowSummary(true);
      loadSessions(); // Refresh sessions list
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  };

  // Handle selecting a session from history
  const selectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowHistory(false);
    setShowSummary(false);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Skeleton header */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-24 h-3" />
              </div>
            </div>
            <Skeleton className="w-24 h-9 rounded-md" />
          </div>
        </div>
        {/* Skeleton messages */}
        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className={`max-w-[70%] space-y-2 ${i % 2 === 0 ? "items-end" : ""}`}>
                <Skeleton className={`h-16 rounded-2xl ${i % 2 === 0 ? "w-40" : "w-64"}`} />
              </div>
            </div>
          ))}
        </div>
        {/* Skeleton input */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="flex gap-3">
            <Skeleton className="flex-1 h-11 rounded-xl" />
            <Skeleton className="w-11 h-11 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Show session summary
  if (showSummary && completedSessionId) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <SessionSummary
          sessionId={completedSessionId}
          onContinue={() => {
            setShowSummary(false);
            setCompletedSessionId(null);
            createNewSession();
          }}
          onClose={() => {
            setShowSummary(false);
            setCompletedSessionId(null);
            setActiveSessionId(null);
          }}
        />
      </div>
    );
  }

  // Show history panel
  if (showHistory) {
    return (
      <div className="h-full flex flex-col max-w-4xl mx-auto">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HistoryIcon className="w-5 h-5" />
                Chat History
              </CardTitle>
              <CardDescription>
                Select a previous conversation to continue
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowHistory(false)}>
              Back to Chat
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No previous conversations found
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <button
                    key={session.sessionId}
                    onClick={() => selectSession(session.sessionId)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      session.sessionId === activeSessionId
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {session.topic}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        session.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : session.status === "completed"
                          ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {session.messageCount} messages • {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // No active session - show welcome screen
  if (!activeSessionId) {
    return (
      <div className="h-full flex flex-col max-w-4xl mx-auto">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircleIcon className="w-6 h-6" />
              Chat with AI Tutor
            </CardTitle>
            <CardDescription>
              Start a conversation to learn through dialogue
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                <MessageCircleIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Ready to Learn?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                Start a new conversation with your AI tutor. Ask questions, explore topics, 
                and learn through guided dialogue.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => createNewSession()}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
                {sessions.length > 0 && (
                  <Button variant="outline" onClick={() => setShowHistory(true)}>
                    <HistoryIcon className="w-4 h-4 mr-2" />
                    View History
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active chat session
  const currentSession = sessions.find((s) => s.sessionId === activeSessionId);

  return (
    <div className="h-full flex flex-col">
      {/* Session Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {currentSession?.topic || "Chat Session"}
          </h2>
          <p className="text-sm text-gray-500">
            {currentSession?.messageCount || 0} messages
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
            <HistoryIcon className="w-4 h-4 mr-1" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={() => createNewSession()}>
            <PlusIcon className="w-4 h-4 mr-1" />
            New
          </Button>
          <Button variant="secondary" size="sm" onClick={endSession}>
            End Session
          </Button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 min-h-0">
        <ChatInterface
          sessionId={activeSessionId}
          initialMessages={initialMessages}
          onSessionEnd={endSession}
        />
      </div>
    </div>
  );
}
