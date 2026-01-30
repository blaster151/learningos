"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/error";
import { useCallback } from "react";
import type { UserCredential } from "firebase/auth";

/**
 * Hook that wraps auth operations with toast notifications
 * Use this hook when you want auth errors to show as toasts
 */
export function useAuthWithToast() {
  const auth = useAuth();
  const toast = useToast();

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string
    ): Promise<UserCredential | null> => {
      try {
        const result = await auth.signUp(email, password, displayName);
        toast.success("Account created successfully!");
        return result;
      } catch {
        // Error is already set in auth context
        if (auth.error) {
          toast.error(auth.error);
        }
        return null;
      }
    },
    [auth, toast]
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<UserCredential | null> => {
      try {
        const result = await auth.signIn(email, password);
        toast.success("Welcome back!");
        return result;
      } catch {
        // Error is already set in auth context
        if (auth.error) {
          toast.error(auth.error);
        }
        return null;
      }
    },
    [auth, toast]
  );

  const signInWithGoogle = useCallback(async (): Promise<UserCredential | null> => {
    try {
      const result = await auth.signInWithGoogle();
      toast.success("Signed in with Google!");
      return result;
    } catch {
      // Error is already set in auth context
      if (auth.error) {
        toast.error(auth.error);
      }
      return null;
    }
  }, [auth, toast]);

  const signOut = useCallback(async (): Promise<boolean> => {
    try {
      await auth.signOut();
      toast.info("You have been signed out");
      return true;
    } catch {
      if (auth.error) {
        toast.error(auth.error);
      }
      return false;
    }
  }, [auth, toast]);

  return {
    ...auth,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
}
