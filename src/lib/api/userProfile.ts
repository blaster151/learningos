// User Profile API Service
// Client-side functions for interacting with user profile endpoints

import type { User } from "firebase/auth";
import { authFetch } from "@/lib/api/authFetch";

// ===================================
// Types
// ===================================

export interface UserProfileResponse {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  learningGoal: string;
  selectedTopics: string[];
  experienceLevel?: string;
  preferredPace?: string;
  totalSessions: number;
  totalMessages: number;
  streak: number;
  onboardingCompleted: boolean;
}

export interface OnboardingData {
  learningGoal: string;
  experienceLevel: string;
  selectedTopics: string[];
  preferredPace: string;
}

// ===================================
// API Functions
// ===================================

/**
 * Create or update user profile after authentication
 */
export async function createUserProfile(user: User): Promise<{ isNew: boolean }> {
  const response = await authFetch(user, "/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create user profile");
  }

  return response.json();
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(user: User): Promise<UserProfileResponse | null> {
  const response = await authFetch(user, `/api/users?userId=${user.uid}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch user profile");
  }

  const data = await response.json();
  return data.user;
}

/**
 * Complete user onboarding
 */
export async function completeOnboarding(
  user: User,
  data: OnboardingData
): Promise<void> {
  const response = await authFetch(user, `/api/users/onboarding?userId=${user.uid}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to complete onboarding");
  }
}

/**
 * Check if user has completed onboarding
 */
export async function checkOnboardingStatus(
  user: User
): Promise<{ exists: boolean; onboardingCompleted: boolean }> {
  const response = await authFetch(user, `/api/users/onboarding?userId=${user.uid}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to check onboarding status");
  }

  return response.json();
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  user: User,
  updates: Partial<OnboardingData>
): Promise<void> {
  const response = await authFetch(user, `/api/users?userId=${user.uid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update user profile");
  }
}
