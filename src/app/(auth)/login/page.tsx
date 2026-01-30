"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthWithToast } from "@/lib/hooks";
import { createUserProfile, checkOnboardingStatus } from "@/lib/api/userProfile";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui";
import { GoogleIcon, EmailIcon, LockIcon, EyeIcon, EyeOffIcon, BrainIcon, AlertCircleIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, error, clearError } = useAuthWithToast();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Validate form
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle email/password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    clearError();
    setIsGoogleLoading(true);
    try {
      const credential = await signInWithGoogle();
      // Create profile if new user (returns isNew flag)
      const result = await createUserProfile(credential.user);
      
      if (result.isNew) {
        router.push("/onboarding");
      } else {
        // Check if returning user completed onboarding
        const status = await checkOnboardingStatus(credential.user.uid);
        router.push(status.onboardingCompleted ? "/dashboard" : "/onboarding");
      }
    } catch {
      // Error is handled by AuthContext
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <BrainIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">LearningOS</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back!</p>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Continue your learning journey</CardDescription>
          </CardHeader>

          <CardContent>
            {/* Auth Error Alert */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
                <AlertCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={handleGoogleLogin}
              isLoading={isGoogleLoading}
              disabled={isLoading}
              leftIcon={<GoogleIcon />}
            >
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={validationErrors.email}
                leftIcon={<EmailIcon />}
                autoComplete="email"
                disabled={isLoading || isGoogleLoading}
              />

              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={validationErrors.password}
                leftIcon={<LockIcon />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                }
                autoComplete="current-password"
                disabled={isLoading || isGoogleLoading}
              />

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                disabled={isGoogleLoading}
              >
                Sign in
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
