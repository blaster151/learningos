// Reflections Firebase Service
// CRUD operations for reflection prompts, submissions, and analyses

import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type {
  ReflectionPrompt,
  ReflectionSubmission,
  ReflectionAnalysis,
} from "@/types";

// ===================================
// Reflections Service
// ===================================

export const reflectionsService = {
  /**
   * Create a new reflection prompt
   */
  async createPrompt(
    prompt: Omit<ReflectionPrompt, "promptId">
  ): Promise<string> {
    const db = await getAdminDb();
    const promptRef = await db.collection("reflection_prompts").add({
      ...prompt,
      createdAt: prompt.createdAt || Timestamp.now(),
    });
    return promptRef.id;
  },

  /**
   * Get a reflection prompt by ID
   */
  async getPrompt(promptId: string): Promise<ReflectionPrompt | null> {
    const db = await getAdminDb();
    const promptDoc = await db
      .collection("reflection_prompts")
      .doc(promptId)
      .get();

    if (!promptDoc.exists) {
      return null;
    }

    const data = promptDoc.data();
    return {
      promptId: promptDoc.id,
      ...data,
    } as ReflectionPrompt;
  },

  /**
   * Create a new reflection submission
   */
  async createSubmission(
    submission: Omit<ReflectionSubmission, "reflectionId">
  ): Promise<string> {
    const db = await getAdminDb();
    const submissionRef = await db.collection("reflections").add({
      ...submission,
      submittedAt: submission.submittedAt || Timestamp.now(),
    });
    return submissionRef.id;
  },

  /**
   * Get a reflection submission by ID
   */
  async getSubmission(
    reflectionId: string
  ): Promise<ReflectionSubmission | null> {
    const db = await getAdminDb();
    const submissionDoc = await db
      .collection("reflections")
      .doc(reflectionId)
      .get();

    if (!submissionDoc.exists) {
      return null;
    }

    const data = submissionDoc.data();
    return {
      reflectionId: submissionDoc.id,
      ...data,
    } as ReflectionSubmission;
  },

  /**
   * Save analysis results for a reflection
   */
  async saveAnalysis(
    reflectionId: string,
    analysis: ReflectionAnalysis
  ): Promise<void> {
    const db = await getAdminDb();
    await db
      .collection("reflection_analyses")
      .doc(reflectionId)
      .set({
        ...analysis,
        createdAt: Timestamp.now(),
      });
  },

  /**
   * Get analysis results for a reflection
   */
  async getAnalysis(
    reflectionId: string
  ): Promise<ReflectionAnalysis | null> {
    const db = await getAdminDb();
    const analysisDoc = await db
      .collection("reflection_analyses")
      .doc(reflectionId)
      .get();

    if (!analysisDoc.exists) {
      return null;
    }

    return analysisDoc.data() as ReflectionAnalysis;
  },

  /**
   * Get all reflections for a user
   */
  async getUserReflections(
    userId: string,
    limit: number = 20
  ): Promise<ReflectionSubmission[]> {
    const db = await getAdminDb();
    const snapshot = await db
      .collection("reflections")
      .where("userId", "==", userId)
      .orderBy("submittedAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      reflectionId: doc.id,
      ...doc.data(),
    })) as ReflectionSubmission[];
  },

  /**
   * Get all reflections for a session
   */
  async getSessionReflections(
    sessionId: string
  ): Promise<ReflectionSubmission[]> {
    const db = await getAdminDb();
    const snapshot = await db
      .collection("reflections")
      .where("sessionId", "==", sessionId)
      .orderBy("submittedAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      reflectionId: doc.id,
      ...doc.data(),
    })) as ReflectionSubmission[];
  },

  /**
   * Get recent reflections with their analyses
   */
  async getRecentReflectionsWithAnalysis(
    userId: string,
    limit: number = 10
  ): Promise<
    Array<{
      submission: ReflectionSubmission;
      analysis: ReflectionAnalysis | null;
    }>
  > {
    const submissions = await this.getUserReflections(userId, limit);

    const withAnalysis = await Promise.all(
      submissions.map(async (submission) => ({
        submission,
        analysis: await this.getAnalysis(submission.reflectionId),
      }))
    );

    return withAnalysis;
  },

  /**
   * Mark a prompt as used (to prevent re-use)
   */
  async markPromptUsed(promptId: string): Promise<void> {
    const db = await getAdminDb();
    await db
      .collection("reflection_prompts")
      .doc(promptId)
      .update({
        used: true,
        usedAt: Timestamp.now(),
      });
  },

  /**
   * Get statistics for user's reflection history
   */
  async getReflectionStats(userId: string): Promise<{
    totalReflections: number;
    totalSkipped: number;
    averageScore: number;
    levelUpsFromReflections: number;
  }> {
    const db = await getAdminDb();

    // Get all reflections
    const reflectionsSnapshot = await db
      .collection("reflections")
      .where("userId", "==", userId)
      .get();

    const totalReflections = reflectionsSnapshot.size;
    const totalSkipped = reflectionsSnapshot.docs.filter(
      (doc) => doc.data().skipped
    ).length;

    // Get analyses for completed reflections
    const analyses = await Promise.all(
      reflectionsSnapshot.docs
        .filter((doc) => !doc.data().skipped)
        .map(async (doc) => {
          const analysis = await this.getAnalysis(doc.id);
          return analysis;
        })
    );

    const validAnalyses = analyses.filter((a) => a !== null) as ReflectionAnalysis[];
    
    const averageScore =
      validAnalyses.length > 0
        ? validAnalyses.reduce((sum, a) => sum + a.overallScore, 0) /
          validAnalyses.length
        : 0;

    const levelUpsFromReflections = validAnalyses.reduce((sum, analysis) => {
      return (
        sum +
        analysis.conceptUpdates.filter(
          (update) => update.newMastery !== update.previousMastery
        ).length
      );
    }, 0);

    return {
      totalReflections,
      totalSkipped,
      averageScore: Math.round(averageScore),
      levelUpsFromReflections,
    };
  },
};
