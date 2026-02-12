/**
 * One-time script to restore abandoned paths to "paused" status.
 * Run: npx tsx scripts/restore-abandoned-path.ts
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";
import * as fs from "fs";

const keyPath = path.resolve(__dirname, "../firebase-admin-key.json");
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function restoreAbandonedPaths() {
  const userId = "8VdojQ26sxYfO3wuyNhv069WHzM2";

  const snapshot = await db
    .collection("learning_paths")
    .where("userId", "==", userId)
    .where("status", "==", "abandoned")
    .get();

  if (snapshot.empty) {
    console.log("No abandoned paths found.");
    return;
  }

  console.log(`Found ${snapshot.size} abandoned path(s):`);
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`  - ${doc.id}: "${data.title}" → changing to "paused"`);
    await doc.ref.update({ status: "paused" });
  }

  console.log("Done! Abandoned paths restored to paused status.");
}

restoreAbandonedPaths().catch(console.error);
