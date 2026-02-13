import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  requireAuthUser,
  authErrorResponse,
} from "@/lib/auth/serverAuth";

// ===================================
// DELETE - Delete user account and all data
// ===================================

export async function DELETE(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");

    // Only allow self-deletion
    if (requestedUserId && requestedUserId !== authed.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = authed.uid;
    const db = await getAdminDb();

    // Collect all subcollection data to delete
    const deletionPromises: Promise<unknown>[] = [];

    // 1. Delete user's sessions and their messages
    const sessionsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("sessions")
      .get();

    for (const sessionDoc of sessionsSnap.docs) {
      // Delete messages subcollection
      const messagesSnap = await sessionDoc.ref.collection("messages").get();
      const messageBatch = db.batch();
      messagesSnap.docs.forEach((msg) => messageBatch.delete(msg.ref));
      deletionPromises.push(messageBatch.commit());

      // Delete the session doc
      deletionPromises.push(sessionDoc.ref.delete());
    }

    // 2. Delete user's concepts
    const conceptsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("userConcepts")
      .get();
    const conceptBatch = db.batch();
    conceptsSnap.docs.forEach((doc) => conceptBatch.delete(doc.ref));
    if (conceptsSnap.docs.length > 0) {
      deletionPromises.push(conceptBatch.commit());
    }

    // 3. Delete user's concept relations
    const relationsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("conceptRelations")
      .get();
    const relationBatch = db.batch();
    relationsSnap.docs.forEach((doc) => relationBatch.delete(doc.ref));
    if (relationsSnap.docs.length > 0) {
      deletionPromises.push(relationBatch.commit());
    }

    // 4. Delete user's reflections
    const reflectionsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("reflections")
      .get();
    const reflectionBatch = db.batch();
    reflectionsSnap.docs.forEach((doc) => reflectionBatch.delete(doc.ref));
    if (reflectionsSnap.docs.length > 0) {
      deletionPromises.push(reflectionBatch.commit());
    }

    // 5. Delete user's learning paths
    const pathsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("learningPaths")
      .get();
    const pathBatch = db.batch();
    pathsSnap.docs.forEach((doc) => pathBatch.delete(doc.ref));
    if (pathsSnap.docs.length > 0) {
      deletionPromises.push(pathBatch.commit());
    }

    // Execute all subcollection deletions
    await Promise.all(deletionPromises);

    // 6. Delete the user profile document
    await db.collection("users").doc(userId).delete();

    // 7. Delete the Firebase Auth user
    await getAdminAuth().deleteUser(userId);

    return NextResponse.json({
      message: "Account and all data deleted successfully",
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
