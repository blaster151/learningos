import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type { LearningSession, Message } from "@/types";

export interface ResumedSessionContext {
  session: LearningSession;
  recentMessages: Message[];
  conceptsCovered: string[];
  pathContext?: {
    pathId: string;
    pathName: string;
    currentMilestone: string;
  };
}

/**
 * Resumes a paused or completed session.
 * Loads full context including recent messages and covered concepts.
 * 
 * @param userId - The user resuming the session
 * @param sessionId - The session to resume
 * @param loadMessageCount - Number of recent messages to load (default: 10)
 * @returns Full session context for continuation
 */
export async function resumeSession(
  userId: string,
  sessionId: string,
  loadMessageCount: number = 10
): Promise<ResumedSessionContext> {
  const db = getAdminDb();

  // Get session
  const sessionDoc = await db.collection("sessions").doc(sessionId).get();
  if (!sessionDoc.exists) {
    throw new Error("Session not found");
  }

  const sessionData = sessionDoc.data();
  if (sessionData?.userId !== userId) {
    throw new Error("Not authorized to resume this session");
  }

  // Update session status to active
  await sessionDoc.ref.update({
    status: "active",
    lastMessageTime: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const session: LearningSession = {
    id: sessionDoc.id,
    ...sessionData,
    status: "active",
  } as LearningSession;

  // Load recent messages
  const messagesSnapshot = await db
    .collection("messages")
    .where("sessionId", "==", sessionId)
    .orderBy("timestamp", "desc")
    .limit(loadMessageCount)
    .get();

  const recentMessages: Message[] = messagesSnapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .reverse() as Message[];

  // Get path context if session is following a path
  let pathContext;
  if (sessionData?.pathId) {
    const pathDoc = await db.collection("learningPaths").doc(sessionData.pathId).get();
    if (pathDoc.exists) {
      const pathData = pathDoc.data();
      const currentMilestone = pathData?.milestones?.find(
        (m: any) => m.status === "in-progress"
      );
      pathContext = {
        pathId: pathDoc.id,
        pathName: pathData?.name || "Unknown Path",
        currentMilestone: currentMilestone?.title || "No active milestone",
      };
    }
  }

  return {
    session,
    recentMessages,
    conceptsCovered: sessionData?.conceptsCovered || [],
    pathContext,
  };
}
