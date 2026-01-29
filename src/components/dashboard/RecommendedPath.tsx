"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { ProgressRing } from "@/components/learning";
import type { LearningPath } from "@/types";

export default function RecommendedPath() {
  const { user } = useAuth();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecommendedPath();
    }
  }, [user]);

  const loadRecommendedPath = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/paths?status=active");
      if (response.ok) {
        const data = await response.json();
        const activePath = data.paths?.[0];
        if (activePath) {
          setPath(activePath);
        } else {
          // Try to get a suggested path
          const suggestedResponse = await fetch("/api/paths?status=suggested");
          if (suggestedResponse.ok) {
            const suggestedData = await suggestedResponse.json();
            setPath(suggestedData.paths?.[0] || null);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load recommended path:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Learn?</h3>
        <p className="text-gray-600 mb-4">
          Generate a personalized learning path based on your interests and goals
        </p>
        <a
          href="/dashboard/learn"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Create Learning Path
        </a>
      </div>
    );
  }

  const isActive = path.status === "active";

  return (
    <div
      className={`rounded-lg border-2 p-6 ${
        isActive
          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
          : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
      }`}
    >
      <div className="flex items-start gap-4 mb-4">
        {isActive && (
          <ProgressRing
            progress={Math.round((path.progress || 0) * 100)}
            size={80}
            strokeWidth={6}
            showLabel={false}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{path.title}</h3>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {isActive ? "In Progress" : "Suggested"}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{path.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-700 mb-4">
        <div className="flex items-center gap-1">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{path.milestones.length} milestones</span>
        </div>
        <div className="flex items-center gap-1">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{Math.ceil((path.estimatedMinutes || 0) / 60)}h</span>
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={`/dashboard/learn/${path.pathId}`}
          className={`flex-1 text-center px-4 py-2 rounded-lg font-medium transition-colors ${
            isActive
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isActive ? "Continue Learning" : "Start Path"}
        </a>
        <a
          href="/dashboard/learn"
          className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          View All
        </a>
      </div>
    </div>
  );
}
