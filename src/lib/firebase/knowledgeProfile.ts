// Knowledge Profile Firebase Service
// Persists global per-user concept → confidence profile (E18-S6)

import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type { KnowledgeProfileEntry } from "@/types";

// ===================================
// Knowledge Profile Service
// ===================================

export const knowledgeProfileService = {
  /**
   * Get all knowledge profile entries for a user
   */
  async getProfile(userId: string): Promise<KnowledgeProfileEntry[]> {
    const db = await getAdminDb();
    const snapshot = await db
      .collection("knowledge_profiles")
      .where("userId", "==", userId)
      .get();

    return snapshot.docs.map((doc) => ({
      ...(doc.data() as KnowledgeProfileEntry),
    }));
  },

  /**
   * Upsert knowledge profile entries (merge new pill selections into the global profile).
   * - "known" concepts get confidence 1.0
   * - "familiar" concepts get confidence 0.5
   * Existing entries are updated if the new confidence is higher (never downgrade).
   */
  async upsertEntries(
    userId: string,
    entries: Array<{ concept: string; confidence: number }>
  ): Promise<void> {
    if (entries.length === 0) return;

    const db = await getAdminDb();
    const batch = db.batch();
    const now = Timestamp.now();

    // Fetch existing entries for this user to decide update vs create
    const existingSnapshot = await db
      .collection("knowledge_profiles")
      .where("userId", "==", userId)
      .get();

    const existingByName = new Map<string, { docId: string; confidence: number }>();
    for (const doc of existingSnapshot.docs) {
      const data = doc.data();
      existingByName.set(data.concept, {
        docId: doc.id,
        confidence: data.confidence,
      });
    }

    for (const entry of entries) {
      const normalized = entry.concept.toLowerCase().trim();
      const existing = existingByName.get(normalized);

      if (existing) {
        // Only update if new confidence is >= existing (never downgrade)
        if (entry.confidence >= existing.confidence) {
          const ref = db.collection("knowledge_profiles").doc(existing.docId);
          batch.update(ref, {
            confidence: entry.confidence,
            source: "calibration",
            updatedAt: now,
          });
        }
      } else {
        // Create new entry
        const ref = db.collection("knowledge_profiles").doc();
        batch.set(ref, {
          userId,
          concept: normalized,
          confidence: entry.confidence,
          source: "calibration",
          updatedAt: now,
        });
      }
    }

    await batch.commit();
  },
};
