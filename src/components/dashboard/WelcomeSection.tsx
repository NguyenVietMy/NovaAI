"use client";

import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface WelcomeSectionProps {
  userName: string;
  subscriptionStatus: string;
  planName: string;
}

export default function WelcomeSection({
  userName,
  subscriptionStatus,
  planName,
}: WelcomeSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {userName}! 👋</h1>
          <p className="text-muted-foreground mt-1">
            Ready to download some YouTube transcripts?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          <Badge
            variant={subscriptionStatus === "active" ? "default" : "secondary"}
          >
            {planName}
          </Badge>
        </div>
      </div>
    </div>
  );
}
