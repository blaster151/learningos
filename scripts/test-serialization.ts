#!/usr/bin/env npx tsx

/**
 * Test if seeded data can be serialized to JSON
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";
import * as fs from "fs";

const keyPath = path.resolve(__dirname, "../firebase-admin-key.json");
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const userId = "8VdojQ26sxYfO3wuyNhv069WHzM2";

async function testSerialization() {
  console.log("\n🔍 Testing data serialization...\n");

  // Test concepts
  try {
    const conceptsSnap = await db.collection("concepts").where("userId", "==", userId).limit(1).get();
    if (!conceptsSnap.empty) {
      const concept = { id: conceptsSnap.docs[0].id, ...conceptsSnap.docs[0].data() };
      console.log("✅ Concepts query succeeded");
      console.log("   Raw data keys:", Object.keys(concept).join(", "));
      
      // Try to JSON stringify
      try {
        JSON.stringify(concept);
        console.log("✅ Concept serializes to JSON");
      } catch (err) {
        console.log("❌ Concept JSON serialization failed:", (err as Error).message);
      }
    } else {
      console.log("⚠️  No concepts found");
    }
  } catch (err) {
    console.log("❌ Concepts query failed:", (err as Error).message);
  }

  // Test paths
  try {
    const pathsSnap = await db.collection("learning_paths").where("userId", "==", userId).limit(1).get();
    if (!pathsSnap.empty) {
      const pathData = pathsSnap.docs[0].data();
      console.log("\n✅ Paths query succeeded");
      console.log("   Path keys:", Object.keys(pathData).join(", "));
      console.log("   Milestones count:", pathData.milestones?.length || 0);
      
      // Try to JSON stringify
      try {
        JSON.stringify({ id: pathsSnap.docs[0].id, ...pathData });
        console.log("✅ Path serializes to JSON");
      } catch (err) {
        console.log("❌ Path JSON serialization failed:", (err as Error).message);
      }
    } else {
      console.log("⚠️  No paths found");
    }
  } catch (err) {
    console.log("❌ Paths query failed:", (err as Error).message);
  }

  // Test sessions
  try {
    const sessionsSnap = await db.collection("sessions").where("userId", "==", userId).limit(1).get();
    if (!sessionsSnap.empty) {
      const session = { id: sessionsSnap.docs[0].id, ...sessionsSnap.docs[0].data() };
      console.log("\n✅ Sessions query succeeded");
      console.log("   Session keys:", Object.keys(session).join(", "));
      
      // Try to JSON stringify
      try {
        JSON.stringify(session);
        console.log("✅ Session serializes to JSON");
      } catch (err) {
        console.log("❌ Session JSON serialization failed:", (err as Error).message);
      }
    } else {
      console.log("⚠️  No sessions found");
    }
  } catch (err) {
    console.log("❌ Sessions query failed:", (err as Error).message);
  }

  console.log("\n");
}

testSerialization().catch(console.error);
