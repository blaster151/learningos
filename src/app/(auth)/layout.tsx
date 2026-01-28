// Auth Layout
// Minimal layout for authentication pages (login, signup, forgot password)

import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LearningOS - Authentication",
  description: "Sign in or create an account to start learning",
};

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <>{children}</>;
}
