// Learning Paths Firebase Service
// CRUD operations for learning path management

import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type { LearningPath, PathStatus, PathMilestone } from "@/types";

/**
 * Calculate overall path progress as the average of all milestone progress values.
 * Each milestone's progress reflects its objective completion (0.0–1.0).
 */
function calculatePathProgress(milestones: PathMilestone[]): number {
  if (milestones.length === 0) return 0;
  const total = milestones.reduce((sum, m) => sum + (m.progress || 0), 0);
  return total / milestones.length;
}

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
  async getPath(userId: string, pathId: string): Promise<LearningPath | null> {
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

    // Calculate overall path progress from milestone-level progress
    const progress = calculatePathProgress(path.milestones);

    // Update path
    await this.updatePathProgress(userId, pathId, {
      milestones: path.milestones,
      progress,
      status: progress === 1.0 ? "completed" : "active",
    });
  },

  /**
   * Abandon a path and clean up concepts that were exclusively from this path
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

    // Mark path as abandoned
    await pathRef.update({
      status: "abandoned",
      lastActivityAt: Timestamp.now(),
    });

    // Collect all concept IDs from this path's milestones
    const milestones = data?.milestones || [];
    const pathConceptIds = new Set<string>();
    for (const milestone of milestones) {
      if (milestone.conceptIds) {
        for (const id of milestone.conceptIds) {
          pathConceptIds.add(id);
        }
      }
    }

    if (pathConceptIds.size === 0) return;

    // For each concept, check if it's used elsewhere (other sessions, other paths, or has chat exposure)
    // Only delete concepts that were exclusively from this path and never discussed in chat
    const deletePromises: Promise<void>[] = [];
    const relationDeletePromises: Promise<void>[] = [];

    for (const conceptId of pathConceptIds) {
      try {
        const conceptDoc = await db.collection("concepts").doc(conceptId).get();
        if (!conceptDoc.exists) continue;

        const conceptData = conceptDoc.data();
        if (!conceptData || conceptData.userId !== userId) continue;

        // Check if this concept has been encountered in sessions beyond the path
        const sessionIds = conceptData.sessionIds || [];
        const learnedFrom = conceptData.learnedFrom || "";
        const exposureCount = conceptData.exposureCount || 0;

        // Keep the concept if:
        // 1. It was discussed in chat sessions (sessionIds has entries not matching the pathId)
        // 2. It was learned from a different source
        // 3. It has meaningful exposure (encountered multiple times organically)
        // 4. It has moved beyond "exploring" mastery (user has engaged with it)
        const hasOtherSessions =
          sessionIds.length > 0 && sessionIds.some((s: string) => s !== pathId);
        const learnedElsewhere = learnedFrom && learnedFrom !== pathId;
        const hasSignificantExposure = exposureCount > 2;
        const hasMasteryProgress =
          conceptData.masteryLevel && conceptData.masteryLevel !== "exploring";

        if (
          hasOtherSessions ||
          learnedElsewhere ||
          hasSignificantExposure ||
          hasMasteryProgress
        ) {
          continue; // Keep this concept
        }

        // Delete concept and its relations
        deletePromises.push(
          conceptDoc.ref
            .delete()
            .then(() => {})
            .catch((err) =>
              console.warn(`Failed to delete concept ${conceptId}:`, err)
            )
        );

        // Delete relations involving this concept
        const [sourceRels, targetRels] = await Promise.all([
          db
            .collection("concept_relations")
            .where("userId", "==", userId)
            .where("sourceConceptId", "==", conceptId)
            .get(),
          db
            .collection("concept_relations")
            .where("userId", "==", userId)
            .where("targetConceptId", "==", conceptId)
            .get(),
        ]);

        for (const doc of [...sourceRels.docs, ...targetRels.docs]) {
          relationDeletePromises.push(
            doc.ref
              .delete()
              .then(() => {})
              .catch((err) =>
                console.warn(`Failed to delete relation ${doc.id}:`, err)
              )
          );
        }
      } catch (err) {
        console.warn(`Error checking concept ${conceptId} for cleanup:`, err);
      }
    }

    // Execute all deletions in parallel
    await Promise.all([...deletePromises, ...relationDeletePromises]);
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

  /**
   * Insert a milestone at a specific index and re-index milestone ordering/dependencies.
   */
  async insertMilestone(
    userId: string,
    pathId: string,
    milestone: PathMilestone,
    insertIndex: number
  ): Promise<void> {
    const path = await this.getPath(userId, pathId);
    if (!path) {
      throw new Error(`Path ${pathId} not found`);
    }

    const safeIndex = Math.max(
      0,
      Math.min(insertIndex, path.milestones.length)
    );
    const milestones = [...path.milestones];
    milestones.splice(safeIndex, 0, milestone);

    const idByOldIndex = path.milestones.map((m) => m.milestoneId);
    const idByNewIndex = milestones.map((m) => m.milestoneId);

    const remapped = milestones.map((m, newIndex) => {
      let prereqs = m.prerequisiteMilestoneIds || [];

      // For the inserted milestone, ensure no broken prerequisites.
      if (m.milestoneId === milestone.milestoneId) {
        prereqs = prereqs.filter((id) => idByNewIndex.includes(id));
      }

      // If a milestone previously depended on the milestone at the insertion index,
      // preserve that dependency and keep others intact.
      const oldIndex = idByOldIndex.indexOf(m.milestoneId);
      if (oldIndex !== -1 && oldIndex >= safeIndex) {
        prereqs = Array.from(new Set(prereqs));
      }

      return {
        ...m,
        order: newIndex,
        prerequisiteMilestoneIds: prereqs,
      };
    });

    await this.updatePathProgress(userId, pathId, {
      milestones: remapped,
      currentMilestoneIndex:
        path.currentMilestoneIndex >= safeIndex
          ? path.currentMilestoneIndex + 1
          : path.currentMilestoneIndex,
      progress: calculatePathProgress(remapped),
    });
  },

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
