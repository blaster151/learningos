#!/usr/bin/env npx tsx

/**
 * Check if user doc exists in Firestore
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
const userId = process.argv[2];

if (!userId) {
  console.error("Usage: npx tsx scripts/check-user-doc.ts <userId>");
  process.exit(1);
}

async function checkUser() {
  const userDoc = await db.collection("users").doc(userId).get();
  
  if (!userDoc.exists) {
    console.log(`\n❌ No Firestore doc found for user: ${userId}`);
    console.log(`   Collection: users/${userId}`);
    console.log(`   This is likely why stats show 0s.\n`);
  } else {
    console.log(`\n✅ User doc exists: users/${userId}`);
    console.log(`   Data:`, JSON.stringify(userDoc.data(), null, 2));
  }

  // Check other collections
  const concepts = await db.collection("concepts").where("userId", "==", userId).limit(1).get();
  const sessions = await db.collection("sessions").where("userId", "==", userId).limit(1).get();
  const paths = await db.collection("learning_paths").where("userId", "==", userId).limit(1).get();

  console.log(`\n📊 Data counts for user ${userId}:`);
  console.log(`   Concepts: ${concepts.size > 0 ? 'found' : 'NONE'}`);
  console.log(`   Sessions: ${sessions.size > 0 ? 'found' : 'NONE'}`);
  console.log(`   Paths: ${paths.size > 0 ? 'found' : 'NONE'}\n`);
}

checkUser().catch(console.error);
