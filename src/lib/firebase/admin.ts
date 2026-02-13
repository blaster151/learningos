// Firebase Admin SDK configuration
// This runs on the server and has elevated permissions

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminApp: App;
let adminAuth: Auth;

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
  } else {
    adminApp = getApps()[0];
    adminAuth = getAuth(adminApp);
  }
}

// Initialize on first use (not at import time, to avoid build-time failures)
let _initialized = false;
function ensureInitialized() {
  if (!_initialized) {
    initializeAdminApp();
    _initialized = true;
  }
}

// Lazy-load Firestore to avoid OpenTelemetry issues
export async function getAdminDb() {
  ensureInitialized();
  const { getFirestore } = await import("firebase-admin/firestore");
  return getFirestore(adminApp);
}

export function getAdminApp(): App {
  ensureInitialized();
  return adminApp;
}

export function getAdminAuth(): Auth {
  ensureInitialized();
  return adminAuth;
}
