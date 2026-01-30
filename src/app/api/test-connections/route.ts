// API route to test all external service connections
// Access at: http://localhost:3000/api/test-connections

import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const results = {
    firebase: { client: false, admin: false, error: null as string | null },
    openai: { connected: false, error: null as string | null },
    timestamp: new Date().toISOString(),
  };

  // Test Firebase Client
  try {
    const { app } = await import("@/lib/firebase/config");
    results.firebase.client = !!app.name;
  } catch (error) {
    results.firebase.error = error instanceof Error ? error.message : String(error);
    console.error("Firebase client test failed:", error);
  }

  // Test Firebase Admin
  try {
    const { adminApp } = await import("@/lib/firebase/admin");
    results.firebase.admin = !!adminApp.name;
  } catch (error) {
    if (!results.firebase.error) {
      results.firebase.error = error instanceof Error ? error.message : String(error);
    }
    console.error("Firebase admin test failed:", error);
  }

  // Test OpenAI
  try {
    const { testOpenAIConnection } = await import("@/lib/ai/config");
    results.openai.connected = await testOpenAIConnection();
  } catch (error) {
    results.openai.error = error instanceof Error ? error.message : String(error);
    console.error("OpenAI test failed:", error);
  }

  const allPassed =
    results.firebase.client && results.firebase.admin && results.openai.connected;

  return NextResponse.json(
    {
      status: allPassed ? "success" : "partial",
      results,
      message: allPassed
        ? "All services connected successfully!"
        : "Some services failed to connect. Check logs for details.",
    },
    { status: 200 } // Always return 200 to see the actual results
  );
}
