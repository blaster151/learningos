"use client";

import { AuthProvider } from "@/lib/auth/AuthContext";
import { ErrorBoundary, ToastProvider } from "@/components/error";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
