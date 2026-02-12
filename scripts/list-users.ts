#!/usr/bin/env npx tsx

/**
 * List Firebase Auth users — find your UID for seeding
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as path from "path";
import * as fs from "fs";

const keyPath = path.resolve(__dirname, "../firebase-admin-key.json");
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}

const auth = getAuth();

async function listUsers() {
  const result = await auth.listUsers(100);
  console.log(`\n👥 Firebase Auth Users (${result.users.length}):\n`);
  for (const user of result.users) {
    console.log(`  UID:   ${user.uid}`);
    console.log(`  Email: ${user.email || "(none)"}`);
    console.log(`  Name:  ${user.displayName || "(none)"}`);
    console.log(`  ---`);
  }
  if (result.users.length === 0) {
    console.log("  No users found. Sign up first at http://localhost:3000");
  }
}

listUsers().catch(console.error);
