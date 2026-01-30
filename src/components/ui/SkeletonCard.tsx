import { Card, CardContent, CardHeader } from "./Card";
import { Skeleton, SkeletonText, SkeletonAvatar } from "./Skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  showAvatar?: boolean;
  lines?: number;
  showActions?: boolean;
  className?: string;
}

export function SkeletonCard({
  showAvatar = false,
  lines = 3,
  showActions = false,
  className,
}: SkeletonCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center gap-4">
        {showAvatar && <SkeletonAvatar />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </CardHeader>
      <CardContent>
        <SkeletonText lines={lines} />
        {showActions && (
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
