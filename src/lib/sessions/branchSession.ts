import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type { LearningSession } from "@/types";

/**
 * Creates a new branched session from an existing session.
 * Copies context and sets parent reference.
 * 
 * @param userId - The user creating the branch
 * @param parentSessionId - The session to branch from
 * @param branchTopic - New topic for the branched session
 * @returns The newly created branch session
 */
export async function branchSession(
  userId: string,
  parentSessionId: string,
  branchTopic: string
): Promise<LearningSession> {
  const db = await getAdminDb();

  // Get parent session
  const parentDoc = await db.collection("sessions").doc(parentSessionId).get();
  if (!parentDoc.exists) {
    throw new Error("Parent session not found");
  }

  const parentData = parentDoc.data();
  if (parentData?.userId !== userId) {
    throw new Error("Not authorized to branch this session");
  }

  // Create branch session with inherited context
  const branchData = {
    userId,
    topic: branchTopic,
    parentSessionId,
    pathId: parentData?.pathId || null,
    status: "active" as const,
    startTime: Timestamp.now(),
    lastMessageTime: Timestamp.now(),
    messageCount: 0,
    conceptsCovered: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const branchRef = await db.collection("sessions").add(branchData);
  const branchDoc = await branchRef.get();

  return {
    sessionId: branchDoc.id,
    ...branchDoc.data(),
  } as unknown as LearningSession;
}

/**
 * Returns to the parent session from a branched session.
 * Closes the branch and reactivates the parent.
 * 
 * @param userId - The user performing the return
 * @param branchSessionId - The branch session to close
 * @returns The parent session that was resumed
 */
export async function returnToParentSession(
  userId: string,
  branchSessionId: string
): Promise<LearningSession> {
  const db = await getAdminDb();

  // Get branch session
  const branchDoc = await db.collection("sessions").doc(branchSessionId).get();
  if (!branchDoc.exists) {
    throw new Error("Branch session not found");
  }

  const branchData = branchDoc.data();
  if (branchData?.userId !== userId) {
    throw new Error("Not authorized to close this branch");
  }

  const parentSessionId = branchData?.parentSessionId;
  if (!parentSessionId) {
    throw new Error("Session is not a branch");
  }

  // Close branch session
  await branchDoc.ref.update({
    status: "completed",
    endTime: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Get and reactivate parent session
  const parentDoc = await db.collection("sessions").doc(parentSessionId).get();
  if (!parentDoc.exists) {
    throw new Error("Parent session not found");
  }

  await parentDoc.ref.update({
    status: "active",
    lastMessageTime: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return {
    sessionId: parentDoc.id,
    ...parentDoc.data(),
  } as unknown as LearningSession;
}
