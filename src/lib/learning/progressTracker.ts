// Progress Tracking Service
// Handles milestone completion detection, path progress calculation, and mastery updates

import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type { 
  LearningPath, 
  PathMilestone, 
  ConceptNode, 
  MasteryLevel,
  MilestoneStatus,
  PathStatus 
} from "@/types";

// ===================================
// Types
// ===================================

export interface ProgressUpdateResult {
  pathProgress: number;
  milestoneUpdates: Array<{
    milestoneId: string;
    previousStatus: MilestoneStatus;
    newStatus: MilestoneStatus;
    progress: number;
  }>;
  pathCompleted: boolean;
  celebrationMessage?: string;
}

interface ConceptMasteryInfo {
  conceptId: string;
  name: string;
  understanding: number;
  confidence: number;
  masteryLevel: MasteryLevel;
}

// ===================================
// Mastery Level Thresholds
// ===================================

const MASTERY_THRESHOLDS: Record<MasteryLevel, number> = {
  exploring: 0,
  learning: 0.25,
  practicing: 0.5,
  comfortable: 0.75,
  expert: 0.9,
};

// Minimum mastery to consider a concept "learned" for milestone purposes
const MILESTONE_COMPLETION_THRESHOLD: MasteryLevel = "practicing";

// ===================================
// Main Progress Tracker
// ===================================

export const progressTracker = {
  /**
   * Update progress for a learning path based on current concept mastery
   * Call this after chat sessions or concept updates
   */
  async updatePathProgress(
    userId: string,
    pathId: string
  ): Promise<ProgressUpdateResult> {
    const db = await getAdminDb();
    
    // Get the learning path
    const pathDoc = await db.collection("learning_paths").doc(pathId).get();
    if (!pathDoc.exists) {
      throw new Error(`Learning path ${pathId} not found`);
    }
    
    const path = { pathId: pathDoc.id, ...pathDoc.data() } as LearningPath;
    
    // Get user's concept mastery for all concepts in the path
    const allConceptIds = path.milestones.flatMap(m => m.conceptIds);
    const conceptMastery = await this.getConceptMastery(db, userId, allConceptIds);
    
    // Calculate progress for each milestone
    const milestoneUpdates: ProgressUpdateResult["milestoneUpdates"] = [];
    let completedMilestones = 0;
    
    for (const milestone of path.milestones) {
      const previousStatus = milestone.status;
      const { progress, status } = this.calculateMilestoneProgress(
        milestone,
        conceptMastery
      );
      
      if (status !== previousStatus || Math.abs(progress - milestone.progress) > 0.01) {
        milestoneUpdates.push({
          milestoneId: milestone.milestoneId,
          previousStatus,
          newStatus: status,
          progress,
        });
        
        milestone.status = status;
        milestone.progress = progress;
        
        if (status === "completed" && previousStatus !== "completed") {
          milestone.completedAt = Timestamp.now();
        }
      }
      
      if (status === "completed") {
        completedMilestones++;
      }
    }
    
    // Calculate overall path progress
    const pathProgress = completedMilestones / path.milestones.length;
    const pathCompleted = pathProgress === 1.0;
    
    // Determine path status
    let newPathStatus: PathStatus = path.status;
    if (pathCompleted && path.status !== "completed") {
      newPathStatus = "completed";
    } else if (completedMilestones > 0 && path.status === "suggested") {
      newPathStatus = "active";
    }
    
    // Save updates to Firestore
    await db.collection("learning_paths").doc(pathId).update({
      milestones: path.milestones,
      progress: pathProgress,
      status: newPathStatus,
      lastActivityAt: Timestamp.now(),
      ...(pathCompleted && { completedAt: Timestamp.now() }),
    });
    
    // Generate celebration message if path completed
    const celebrationMessage = pathCompleted
      ? this.generateCelebrationMessage(path)
      : milestoneUpdates.some(u => u.newStatus === "completed" && u.previousStatus !== "completed")
        ? this.generateMilestoneCelebration(milestoneUpdates, path)
        : undefined;
    
    return {
      pathProgress,
      milestoneUpdates,
      pathCompleted,
      celebrationMessage,
    };
  },

  /**
   * Check if a specific milestone should be marked complete
   */
  async checkMilestoneCompletion(
    userId: string,
    pathId: string,
    milestoneId: string
  ): Promise<boolean> {
    const db = await getAdminDb();
    
    const pathDoc = await db.collection("learning_paths").doc(pathId).get();
    if (!pathDoc.exists) return false;
    
    const path = pathDoc.data() as LearningPath;
    const milestone = path.milestones.find(m => m.milestoneId === milestoneId);
    if (!milestone) return false;
    
    const conceptMastery = await this.getConceptMastery(db, userId, milestone.conceptIds);
    const { status } = this.calculateMilestoneProgress(milestone, conceptMastery);
    
    return status === "completed";
  },

  /**
   * Update progress after a chat session ends
   */
  async updateProgressFromSession(
    userId: string,
    sessionId: string
  ): Promise<ProgressUpdateResult | null> {
    const db = await getAdminDb();
    
    // Get the session
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();
    if (!sessionDoc.exists) return null;
    
    const session = sessionDoc.data();
    if (!session?.pathId) return null; // Not following a path
    
    // Update path progress
    const result = await this.updatePathProgress(userId, session.pathId);
    
    // Update current milestone in session if needed
    if (result.milestoneUpdates.length > 0) {
      const activeIndex = await this.findActiveMilestoneIndex(userId, session.pathId);
      
      if (activeIndex !== -1) {
        const pathDoc = await db.collection("learning_paths").doc(session.pathId).get();
        const path = pathDoc.data() as LearningPath;
        const activeMilestone = path.milestones[activeIndex];
        
        await db.collection("sessions").doc(sessionId).update({
          currentMilestoneId: activeMilestone?.milestoneId,
        });
      }
    }
    
    return result;
  },

  /**
   * Get mastery information for a list of concepts
   */
  async getConceptMastery(
    db: FirebaseFirestore.Firestore,
    userId: string,
    conceptIds: string[]
  ): Promise<Map<string, ConceptMasteryInfo>> {
    const mastery = new Map<string, ConceptMasteryInfo>();
    
    if (conceptIds.length === 0) return mastery;
    
    // Firestore 'in' queries limited to 30 items, so batch if needed
    const batches: string[][] = [];
    for (let i = 0; i < conceptIds.length; i += 30) {
      batches.push(conceptIds.slice(i, i + 30));
    }
    
    for (const batch of batches) {
      const snapshot = await db
        .collection("concepts")
        .where("userId", "==", userId)
        .where("conceptId", "in", batch)
        .get();
      
      for (const doc of snapshot.docs) {
        const data = doc.data() as ConceptNode;
        mastery.set(doc.id, {
          conceptId: doc.id,
          name: data.name,
          understanding: data.understanding || 0,
          confidence: data.confidence || 0,
          masteryLevel: data.masteryLevel || "exploring",
        });
      }
    }
    
    // Also try to find concepts by name (in case IDs don't match)
    // This handles the case where concepts were created with different IDs
    const foundIds = new Set([...mastery.keys()]);
    const missingIds = conceptIds.filter(id => !foundIds.has(id));
    
    if (missingIds.length > 0) {
      // Get concept names from path to search by name
      const nameSnapshot = await db
        .collection("concepts")
        .where("userId", "==", userId)
        .get();
      
      for (const doc of nameSnapshot.docs) {
        const data = doc.data() as ConceptNode;
        // If the concept name matches any we're looking for
        const normalizedName = data.name.toLowerCase();
        
        // Check if this matches any concept we need
        mastery.set(doc.id, {
          conceptId: doc.id,
          name: data.name,
          understanding: data.understanding || 0,
          confidence: data.confidence || 0,
          masteryLevel: data.masteryLevel || "exploring",
        });
      }
    }
    
    return mastery;
  },

  /**
   * Calculate progress for a single milestone
   */
  calculateMilestoneProgress(
    milestone: PathMilestone,
    conceptMastery: Map<string, ConceptMasteryInfo>
  ): { progress: number; status: MilestoneStatus } {
    if (milestone.conceptIds.length === 0) {
      return { progress: 1.0, status: "completed" };
    }
    
    let totalProgress = 0;
    let conceptsAtThreshold = 0;
    const threshold = MASTERY_THRESHOLDS[MILESTONE_COMPLETION_THRESHOLD];
    
    for (const conceptId of milestone.conceptIds) {
      const info = conceptMastery.get(conceptId);
      
      if (info) {
        // Calculate concept progress as average of understanding and confidence
        const conceptProgress = (info.understanding + info.confidence) / 2;
        totalProgress += Math.min(1.0, conceptProgress / threshold);
        
        if (conceptProgress >= threshold) {
          conceptsAtThreshold++;
        }
      }
      // If concept not found in user's concepts, progress is 0 for that concept
    }
    
    const progress = totalProgress / milestone.conceptIds.length;
    
    // Determine status
    let status: MilestoneStatus;
    if (conceptsAtThreshold === milestone.conceptIds.length) {
      status = "completed";
    } else if (progress > 0) {
      status = "in_progress";
    } else {
      status = "not_started";
    }
    
    return { progress: Math.min(1.0, progress), status };
  },

  /**
   * Find the index of the next active milestone
   */
  async findActiveMilestoneIndex(
    userId: string,
    pathId: string
  ): Promise<number> {
    const db = await getAdminDb();
    
    const pathDoc = await db.collection("learning_paths").doc(pathId).get();
    if (!pathDoc.exists) return -1;
    
    const path = pathDoc.data() as LearningPath;
    
    // Find first non-completed milestone
    for (let i = 0; i < path.milestones.length; i++) {
      if (path.milestones[i].status !== "completed") {
        return i;
      }
    }
    
    return -1; // All completed
  },

  /**
   * Generate celebration message for path completion
   */
  generateCelebrationMessage(path: LearningPath): string {
    const messages = [
      `🎉 Amazing! You've completed "${path.title}"!`,
      `🏆 Congratulations! You've mastered all milestones in "${path.title}"!`,
      `⭐ Incredible work! "${path.title}" is now complete!`,
      `🚀 You did it! "${path.title}" has been conquered!`,
    ];
    
    const totalConcepts = path.milestones.reduce(
      (sum, m) => sum + m.conceptIds.length, 
      0
    );
    
    return `${messages[Math.floor(Math.random() * messages.length)]}\n\nYou learned ${totalConcepts} concepts across ${path.milestones.length} milestones. Keep up the great work!`;
  },

  /**
   * Generate celebration message for milestone completion
   */
  generateMilestoneCelebration(
    updates: ProgressUpdateResult["milestoneUpdates"],
    path: LearningPath
  ): string | undefined {
    const completedUpdate = updates.find(
      u => u.newStatus === "completed" && u.previousStatus !== "completed"
    );
    
    if (!completedUpdate) return undefined;
    
    const milestone = path.milestones.find(
      m => m.milestoneId === completedUpdate.milestoneId
    );
    
    if (!milestone) return undefined;
    
    const completedCount = path.milestones.filter(m => m.status === "completed").length;
    const totalCount = path.milestones.length;
    
    return `🎯 Milestone complete: "${milestone.title}"!\n\nProgress: ${completedCount}/${totalCount} milestones completed.`;
  },

  /**
   * Update concept mastery based on reflection or explicit user feedback
   */
  async updateConceptMastery(
    userId: string,
    conceptId: string,
    updates: {
      confidence?: number;
      understanding?: number;
    }
  ): Promise<void> {
    const db = await getAdminDb();
    
    const conceptRef = db.collection("concepts").doc(conceptId);
    const conceptDoc = await conceptRef.get();
    
    if (!conceptDoc.exists) return;
    
    const current = conceptDoc.data() as ConceptNode;
    const newConfidence = updates.confidence ?? current.confidence;
    const newUnderstanding = updates.understanding ?? current.understanding;
    
    const newMasteryLevel = this.calculateMasteryLevel(newUnderstanding, newConfidence);
    
    await conceptRef.update({
      confidence: newConfidence,
      understanding: newUnderstanding,
      masteryLevel: newMasteryLevel,
      lastReviewed: Timestamp.now(),
    });
  },

  /**
   * Calculate mastery level from understanding and confidence
   */
  calculateMasteryLevel(understanding: number, confidence: number): MasteryLevel {
    const combined = (understanding + confidence) / 2;
    
    if (combined >= MASTERY_THRESHOLDS.expert) return "expert";
    if (combined >= MASTERY_THRESHOLDS.comfortable) return "comfortable";
    if (combined >= MASTERY_THRESHOLDS.practicing) return "practicing";
    if (combined >= MASTERY_THRESHOLDS.learning) return "learning";
    return "exploring";
  },
};

// ===================================
// Helper Functions for Path Recommendations
// ===================================

export async function shouldSuggestNewPath(
  userId: string
): Promise<{ suggest: boolean; reason?: string }> {
  const db = await getAdminDb();
  
  // Check if user has any active paths
  const activePathsSnapshot = await db
    .collection("learning_paths")
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .limit(1)
    .get();
  
  if (!activePathsSnapshot.empty) {
    return { suggest: false, reason: "User has an active path" };
  }
  
  // Check if user recently completed a path
  const recentCompletedSnapshot = await db
    .collection("learning_paths")
    .where("userId", "==", userId)
    .where("status", "==", "completed")
    .orderBy("completedAt", "desc")
    .limit(1)
    .get();
  
  if (!recentCompletedSnapshot.empty) {
    const lastCompleted = recentCompletedSnapshot.docs[0].data();
    const completedAt = lastCompleted.completedAt?.toDate();
    
    if (completedAt) {
      const hoursSinceCompletion = 
        (Date.now() - completedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCompletion < 24) {
        return { 
          suggest: true, 
          reason: "Great job completing your last path! Ready for a new challenge?" 
        };
      }
    }
  }
  
  // Check user's session count - suggest path after initial exploration
  const sessionCount = await db
    .collection("sessions")
    .where("userId", "==", userId)
    .count()
    .get();
  
  if (sessionCount.data().count >= 3) {
    return { 
      suggest: true, 
      reason: "You've been exploring well! A structured learning path could help you go deeper." 
    };
  }
  
  return { suggest: false };
}
