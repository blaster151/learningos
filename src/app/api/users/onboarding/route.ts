import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";

// ===================================
// Types
// ===================================

interface OnboardingData {
  learningGoal: string;
  experienceLevel: string;
  selectedTopics: string[];
  preferredPace: string;
}

// ===================================
// POST - Complete onboarding
// ===================================

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const body: OnboardingData = await request.json();

    assertSameUser(requestedUserId, authed.uid);
    const userId = authed.uid;

    const { learningGoal, experienceLevel, selectedTopics, preferredPace } = body;

    // Validate required fields
    if (!learningGoal || !experienceLevel || !selectedTopics?.length || !preferredPace) {
      return NextResponse.json(
        { error: "All onboarding fields are required" },
        { status: 400 }
      );
    }

    const db = await getAdminDb();
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user profile with onboarding data
    await userRef.update({
      learningGoal,
      experienceLevel,
      selectedTopics,
      preferredPace,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
    });

    return NextResponse.json({
      message: "Onboarding completed successfully",
      userId,
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}

// ===================================
// GET - Check onboarding status
// ===================================

export async function GET(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    assertSameUser(requestedUserId, authed.uid);
    const userId = authed.uid;

    const db = await getAdminDb();
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({
        exists: false,
        onboardingCompleted: false,
      });
    }

    const userData = userDoc.data();
    return NextResponse.json({
      exists: true,
      onboardingCompleted: userData?.onboardingCompleted || false,
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error checking onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    );
  }
}
