// API route to test all external service connections
// Access at: http://localhost:3000/api/test-connections

import { NextResponse } from "next/server";

export async function GET() {
  const results = {
    firebase: { client: false, admin: false },
    openai: false,
    timestamp: new Date().toISOString(),
  };

  // Test Firebase Client
  try {
    const { app } = await import("@/lib/firebase/config");
    results.firebase.client = !!app.name;
  } catch (error) {
    console.error("Firebase client test failed:", error);
  }

  // Test Firebase Admin
  try {
    const { adminApp } = await import("@/lib/firebase/admin");
    results.firebase.admin = !!adminApp.name;
  } catch (error) {
    console.error("Firebase admin test failed:", error);
  }

  // Test OpenAI
  try {
    const { testOpenAIConnection } = await import("@/lib/ai/config");
    results.openai = await testOpenAIConnection();
  } catch (error) {
    console.error("OpenAI test failed:", error);
  }

  const allPassed =
    results.firebase.client && results.firebase.admin && results.openai;

  return NextResponse.json(
    {
      status: allPassed ? "success" : "partial",
      results,
      message: allPassed
        ? "All services connected successfully!"
        : "Some services failed to connect. Check logs for details.",
    },
    { status: allPassed ? 200 : 500 }
  );
}
