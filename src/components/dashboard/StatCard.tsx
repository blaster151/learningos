"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {label}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {value}
            </p>
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-sm mt-1",
                  trend.direction === "up" && "text-green-600 dark:text-green-400",
                  trend.direction === "down" && "text-red-600 dark:text-red-400",
                  trend.direction === "neutral" && "text-gray-500 dark:text-gray-400"
                )}
              >
                {trend.direction === "up" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {trend.direction === "down" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                <span>{trend.value}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;
