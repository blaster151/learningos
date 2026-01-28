// Firebase Admin SDK configuration
// This runs on the server and has elevated permissions

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

function initializeAdminApp() {
  if (getApps().length === 0) {
    // Parse the private key (handles escaped newlines in .env)
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );

    if (!privateKey) {
      throw new Error(
        "FIREBASE_ADMIN_PRIVATE_KEY is not set in environment variables"
      );
    }

    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
    });

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  } else {
    adminApp = getApps()[0];
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  }
}

// Initialize on import
initializeAdminApp();

export { adminApp, adminAuth, adminDb };
