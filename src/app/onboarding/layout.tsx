"use client";

// Onboarding Layout
// Protects onboarding page - requires authentication

import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth";

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
