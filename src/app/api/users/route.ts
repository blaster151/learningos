import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";

// ===================================
// Types
// ===================================

interface CreateUserRequest {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

interface UpdateUserRequest {
  displayName?: string;
  learningGoal?: string;
  selectedTopics?: string[];
  experienceLevel?: string;
  preferredPace?: string;
  metaGoal?: string;
  highlightsEnabled?: boolean;
}

// ===================================
// POST - Create new user profile
// ===================================

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body: CreateUserRequest = await request.json();
    const { userId: requestedUserId, email: requestedEmail, displayName, photoURL } = body;

    assertSameUser(requestedUserId, authed.uid);

    const userId = authed.uid;
    const email = authed.email ?? requestedEmail;

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    if (authed.email && requestedEmail && authed.email !== requestedEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getAdminDb();
    const userRef = db.collection("users").doc(userId);

    // Check if user already exists
    const existingUser = await userRef.get();
    if (existingUser.exists) {
      // Update last login instead
      await userRef.update({
        lastLoginAt: Timestamp.now(),
      });
      return NextResponse.json({
        message: "User already exists, updated last login",
        userId,
        isNew: false,
      });
    }

    // Create new user profile
    const now = Timestamp.now();
    const userProfile = {
      userId,
      email,
      displayName: displayName || null,
      photoURL: photoURL || null,
      createdAt: now,
      lastLoginAt: now,
      learningGoal: "",
      selectedTopics: [],
      totalSessions: 0,
      totalMessages: 0,
      streak: 0,
      onboardingCompleted: false,
    };

    await userRef.set(userProfile);

    return NextResponse.json({
      message: "User profile created successfully",
      userId,
      isNew: true,
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error creating user profile:", error);
    return NextResponse.json(
      { error: "Failed to create user profile" },
      { status: 500 }
    );
  }
}

// ===================================
// GET - Get user profile
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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: userDoc.data(),
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// ===================================
// PATCH - Update user profile
// ===================================

export async function PATCH(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const body: UpdateUserRequest = await request.json();

    assertSameUser(requestedUserId, authed.uid);
    const userId = authed.uid;

    const db = await getAdminDb();
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only update provided fields
    const updates: Record<string, unknown> = {};
    if (body.displayName !== undefined) updates.displayName = body.displayName;
    if (body.learningGoal !== undefined) updates.learningGoal = body.learningGoal;
    if (body.selectedTopics !== undefined) updates.selectedTopics = body.selectedTopics;
    if (body.experienceLevel !== undefined) updates.experienceLevel = body.experienceLevel;
    if (body.preferredPace !== undefined) updates.preferredPace = body.preferredPace;
    if (body.metaGoal !== undefined) updates.metaGoal = body.metaGoal;
    if (body.highlightsEnabled !== undefined) updates.highlightsEnabled = body.highlightsEnabled;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await userRef.update(updates);

    return NextResponse.json({
      message: "User profile updated successfully",
      userId,
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
