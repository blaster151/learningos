"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatInterface, ChatMessage, SessionSummary } from "@/components/chat";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@/components/ui";
import { MessageCircleIcon, PlusIcon, HistoryIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth/AuthContext";

interface Session {
  id: string;
  topic: string;
  status: "active" | "paused" | "completed";
  createdAt: string;
  messageCount: number;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  // Load user's sessions
  const loadSessions = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/sessions?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        
        // Auto-select most recent active session
        const activeSession = data.sessions?.find((s: Session) => s.status === "active");
        if (activeSession) {
          setActiveSessionId(activeSession.id);
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
      const response = await fetch(`/api/messages?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setInitialMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

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
      const response = await fetch("/api/sessions", {
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
        setActiveSessionId(newSession.id);
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
    if (!activeSessionId) return;

    try {
      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeSessionId,
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
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading chat...</div>
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
                    key={session.id}
                    onClick={() => selectSession(session.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      session.id === activeSessionId
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
  const currentSession = sessions.find((s) => s.id === activeSessionId);

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
