import React from "react";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export default function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  label,
  className = "",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  // Color gradient based on progress
  const getColor = (progress: number): string => {
    if (progress < 30) return "#EF4444"; // red
    if (progress < 60) return "#F59E0B"; // amber
    if (progress < 90) return "#3B82F6"; // blue
    return "#10B981"; // green
  };

  const color = getColor(progress);

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
        {/* Center text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.3em"
          className="transform rotate-90 origin-center text-2xl font-bold"
          fill={color}
          style={{ fontSize: `${size / 4}px` }}
        >
          {Math.round(progress)}%
        </text>
      </svg>
      {showLabel && (
        <span className="mt-2 text-sm text-gray-600 font-medium">
          {label || "Progress"}
        </span>
      )}
    </div>
  );
}
