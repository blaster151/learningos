"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@/components/ui";
import { BookIcon, BrainIcon } from "@/components/icons";

export default function LearnPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookIcon className="w-6 h-6" />
            Learning Map
          </CardTitle>
          <CardDescription>
            Explore concepts and track your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <BrainIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              The visual concept map is being developed. You&apos;ll be able to 
              see all your learned concepts and how they connect.
            </p>
            <Button disabled>
              View Concept Map
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
