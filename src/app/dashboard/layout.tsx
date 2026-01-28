"use client";

// Dashboard Layout
// Wraps all dashboard pages with the shell and auth protection

import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth";
import { DashboardShell } from "@/components/dashboard";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
