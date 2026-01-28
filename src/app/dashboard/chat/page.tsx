"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@/components/ui";
import { MessageCircleIcon, BrainIcon } from "@/components/icons";

export default function ChatPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircleIcon className="w-6 h-6" />
            Chat with AI Tutor
          </CardTitle>
          <CardDescription>
            Start a conversation to learn through dialogue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <BrainIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              The AI chat feature is being developed. Soon you&apos;ll be able to have 
              intelligent conversations with your personal tutor.
            </p>
            <Button disabled>
              Start Conversation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
