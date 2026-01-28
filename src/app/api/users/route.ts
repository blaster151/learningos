import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

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
  learningGoal?: string;
  selectedTopics?: string[];
  experienceLevel?: string;
  preferredPace?: string;
}

// ===================================
// POST - Create new user profile
// ===================================

export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();
    const { userId, email, displayName, photoURL } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: "userId and email are required" },
        { status: 400 }
      );
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
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

    return NextResponse.json({
      user: userDoc.data(),
    });
  } catch (error) {
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const body: UpdateUserRequest = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
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

    // Only update provided fields
    const updates: Record<string, unknown> = {};
    if (body.learningGoal !== undefined) updates.learningGoal = body.learningGoal;
    if (body.selectedTopics !== undefined) updates.selectedTopics = body.selectedTopics;
    if (body.experienceLevel !== undefined) updates.experienceLevel = body.experienceLevel;
    if (body.preferredPace !== undefined) updates.preferredPace = body.preferredPace;

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
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
