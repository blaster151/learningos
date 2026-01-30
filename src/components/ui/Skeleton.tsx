import { cn } from "@/lib/utils";
import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-700", className)} />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && "w-3/4"
          )}
        />
      ))}
    </div>
  );
}

interface SkeletonAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SkeletonAvatar({ size = "md", className }: SkeletonAvatarProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };
  return (
    <Skeleton className={cn("rounded-full", sizes[size], className)} />
  );
}
