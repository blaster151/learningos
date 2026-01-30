import { SkeletonCard } from "./SkeletonCard";
import { cn } from "@/lib/utils";

interface SkeletonListProps {
  count?: number;
  variant?: "default" | "compact" | "with-avatar";
  className?: string;
}

export function SkeletonList({
  count = 3,
  variant = "default",
  className,
}: SkeletonListProps) {
  const variantProps = {
    default: { lines: 2, showActions: false, showAvatar: false },
    compact: { lines: 1, showActions: false, showAvatar: false },
    "with-avatar": { lines: 2, showActions: true, showAvatar: true },
  };

  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} {...variantProps[variant]} />
      ))}
    </div>
  );
}
