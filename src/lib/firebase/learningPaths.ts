// Learning Paths Firebase Service
// CRUD operations for learning path management

import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type { LearningPath, PathStatus, PathMilestone } from "@/types";

// ===================================
// Learning Paths Service
// ===================================

export const pathsService = {
  /**
   * Create a new learning path
   */
  async createPath(
    userId: string,
    path: Omit<LearningPath, "pathId">
  ): Promise<string> {
    const db = await getAdminDb();
    const pathRef = await db.collection("learning_paths").add({
      ...path,
      userId,
      createdAt: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
    });
    return pathRef.id;
  },

  /**
   * Get a path by ID
   */
  async getPath(
    userId: string,
    pathId: string
  ): Promise<LearningPath | null> {
    const db = await getAdminDb();
    const pathDoc = await db.collection("learning_paths").doc(pathId).get();

    if (!pathDoc.exists) {
      return null;
    }

    const data = pathDoc.data();

    // Verify ownership
    if (data?.userId !== userId) {
      return null;
    }

    return {
      pathId: pathDoc.id,
      ...data,
    } as LearningPath;
  },

  /**
   * Get all paths for a user
   */
  async getUserPaths(
    userId: string,
    status?: PathStatus
  ): Promise<LearningPath[]> {
    const db = await getAdminDb();
    let query: FirebaseFirestore.Query = db
      .collection("learning_paths")
      .where("userId", "==", userId);

    if (status) {
      query = query.where("status", "==", status);
    }

    // Removed orderBy to avoid composite index requirement
    // TODO: Create Firestore index for (userId, lastActivityAt)
    // query = query.orderBy("lastActivityAt", "desc");

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      pathId: doc.id,
      ...doc.data(),
    })) as LearningPath[];
  },

  /**
   * Get the current active path for a user
   */
  async getActivePath(userId: string): Promise<LearningPath | null> {
    const db = await getAdminDb();
    const snapshot = await db
      .collection("learning_paths")
      .where("userId", "==", userId)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      pathId: doc.id,
      ...doc.data(),
    } as LearningPath;
  },

  /**
   * Accept a suggested path (change status to active)
   */
  async acceptPath(userId: string, pathId: string): Promise<void> {
    const db = await getAdminDb();
    const pathRef = db.collection("learning_paths").doc(pathId);
    const pathDoc = await pathRef.get();

    if (!pathDoc.exists) {
      throw new Error(`Path ${pathId} not found`);
    }

    const data = pathDoc.data();

    // Verify ownership
    if (data?.userId !== userId) {
      throw new Error("Unauthorized: Path belongs to different user");
    }

    const updateData: Record<string, any> = {
      status: "active",
      lastActivityAt: Timestamp.now(),
    };

    // Only set startedAt on first acceptance
    if (!data?.startedAt) {
      updateData.startedAt = Timestamp.now();
    }

    await pathRef.update(updateData);
  },

  /**
   * Pause an active path (preserves progress, can resume later)
   */
  async pausePath(userId: string, pathId: string): Promise<void> {
    const db = await getAdminDb();
    const pathRef = db.collection("learning_paths").doc(pathId);
    const pathDoc = await pathRef.get();

    if (!pathDoc.exists) {
      throw new Error(`Path ${pathId} not found`);
    }

    const data = pathDoc.data();
    if (data?.userId !== userId) {
      throw new Error("Unauthorized: Path belongs to different user");
    }

    if (data?.status !== "active") {
      throw new Error("Can only pause an active path");
    }

    await pathRef.update({
      status: "paused",
      lastActivityAt: Timestamp.now(),
    });
  },

  /**
   * Resume a paused path
   */
  async resumePath(userId: string, pathId: string): Promise<void> {
    const db = await getAdminDb();
    const pathRef = db.collection("learning_paths").doc(pathId);
    const pathDoc = await pathRef.get();

    if (!pathDoc.exists) {
      throw new Error(`Path ${pathId} not found`);
    }

    const data = pathDoc.data();
    if (data?.userId !== userId) {
      throw new Error("Unauthorized: Path belongs to different user");
    }

    if (data?.status !== "paused") {
      throw new Error("Can only resume a paused path");
    }

    await pathRef.update({
      status: "active",
      lastActivityAt: Timestamp.now(),
    });
  },

  /**
   * Update path progress and milestones
   */
  async updatePathProgress(
    userId: string,
    pathId: string,
    updates: {
      progress?: number;
      milestones?: PathMilestone[];
      status?: PathStatus;
      currentMilestoneIndex?: number;
    }
  ): Promise<void> {
    const db = await getAdminDb();
    const pathRef = db.collection("learning_paths").doc(pathId);
    const pathDoc = await pathRef.get();

    if (!pathDoc.exists) {
      throw new Error(`Path ${pathId} not found`);
    }

    const data = pathDoc.data();

    // Verify ownership
    if (data?.userId !== userId) {
      throw new Error("Unauthorized: Path belongs to different user");
    }

    const updateData: Record<string, any> = {
      lastActivityAt: Timestamp.now(),
    };

    if (updates.progress !== undefined) {
      updateData.progress = updates.progress;
    }

    if (updates.milestones) {
      updateData.milestones = updates.milestones;
    }

    if (updates.status) {
      updateData.status = updates.status;
      
      // Set completedAt if status is completed
      if (updates.status === "completed" && !data?.completedAt) {
        updateData.completedAt = Timestamp.now();
      }
    }

    if (updates.currentMilestoneIndex !== undefined) {
      updateData.currentMilestoneIndex = updates.currentMilestoneIndex;
    }

    await pathRef.update(updateData);
  },

  /**
   * Complete a milestone
   */
  async completeMilestone(
    userId: string,
    pathId: string,
    milestoneId: string
  ): Promise<void> {
    const path = await this.getPath(userId, pathId);
    if (!path) {
      throw new Error(`Path ${pathId} not found`);
    }

    const milestoneIndex = path.milestones.findIndex(
      (m) => m.milestoneId === milestoneId
    );

    if (milestoneIndex === -1) {
      throw new Error(`Milestone ${milestoneId} not found in path`);
    }

    // Update milestone status
    path.milestones[milestoneIndex].status = "completed";
    path.milestones[milestoneIndex].progress = 1.0;
    path.milestones[milestoneIndex].completedAt = Timestamp.now();

    // Calculate overall path progress
    const completedMilestones = path.milestones.filter(
      (m) => m.status === "completed"
    ).length;
    const progress = completedMilestones / path.milestones.length;

    // Update path
    await this.updatePathProgress(userId, pathId, {
      milestones: path.milestones,
      progress,
      status: progress === 1.0 ? "completed" : "active",
    });
  },

  /**
   * Abandon a path
   */
  async abandonPath(userId: string, pathId: string): Promise<void> {
    const db = await getAdminDb();
    const pathRef = db.collection("learning_paths").doc(pathId);
    const pathDoc = await pathRef.get();

    if (!pathDoc.exists) {
      throw new Error(`Path ${pathId} not found`);
    }

    const data = pathDoc.data();

    // Verify ownership
    if (data?.userId !== userId) {
      throw new Error("Unauthorized: Path belongs to different user");
    }

    await pathRef.update({
      status: "abandoned",
      lastActivityAt: Timestamp.now(),
    });
  },

  /**
   * Get suggested paths (not yet started)
   */
  async getSuggestedPaths(userId: string): Promise<LearningPath[]> {
    return this.getUserPaths(userId, "suggested");
  },

  /**
   * Get completed paths
   */
  async getCompletedPaths(userId: string): Promise<LearningPath[]> {
    return this.getUserPaths(userId, "completed");
  },

  /**
   * Update milestone in path
   */
  async updateMilestone(
    userId: string,
    pathId: string,
    milestoneId: string,
    updates: Partial<PathMilestone>
  ): Promise<void> {
    const path = await this.getPath(userId, pathId);
    if (!path) {
      throw new Error(`Path ${pathId} not found`);
    }

    const milestoneIndex = path.milestones.findIndex(
      (m) => m.milestoneId === milestoneId
    );

    if (milestoneIndex === -1) {
      throw new Error(`Milestone ${milestoneId} not found in path`);
    }

    // Update milestone
    path.milestones[milestoneIndex] = {
      ...path.milestones[milestoneIndex],
      ...updates,
    };

    // Save path
    await this.updatePathProgress(userId, pathId, {
      milestones: path.milestones,
    });
  },
};
