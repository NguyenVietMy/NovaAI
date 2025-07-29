"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";

interface SubscriptionData {
  id: string;
  user_id: string;
  status: string;
  plan_name: string;
  current_period_end: string;
  created_at: string;
}

interface SubscriptionCardProps {
  subscription: SubscriptionData | null;
}

export default function SubscriptionCard({
  subscription,
}: SubscriptionCardProps) {
  const subscriptionStatus = subscription?.status || "free";
  const planName = subscription?.plan_name || "Free Plan";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="font-semibold">{planName}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge
              variant={
                subscriptionStatus === "active" ? "default" : "secondary"
              }
            >
              {subscriptionStatus === "active" ? "Active" : "Free"}
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Billing</p>
            <p className="font-semibold">
              {subscription?.current_period_end
                ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
                : "No active subscription"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
