"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UsageChart } from "./charts/UsageChart";
import { ExportFormatsChart } from "./charts/ExportFormatsChart";
import { ActivityTimeline } from "./ActivityTimeline";
import {
  Video,
  MessageSquare,
  Download,
  Trophy,
  BarChart3,
} from "lucide-react";
import {
  getAnalyticsData,
  type AnalyticsData,
} from "@/app/actions/analytics/analyticsActions";
import { createClient } from "../../../../supabase/client";
import Link from "next/link";

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        const analyticsData = await getAnalyticsData(user.id);
        setData(analyticsData);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        // Log more details for debugging
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load analytics</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  const { userStats, globalStats, recentActivity, usageTrend, exportFormats } =
    data;

  // Handle empty data
  if (
    userStats.totalVideos === 0 &&
    userStats.totalChats === 0 &&
    userStats.totalExports === 0
  ) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Data Yet</h3>
          <p className="text-muted-foreground mb-4">
            Start using the platform to see your analytics here.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with ranking */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <Badge variant="secondary" className="text-sm">
            Top {userStats.percentile}% of users
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Rank #{userStats.rank} out of{" "}
          {globalStats.totalUsers.toLocaleString()} users
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Videos Processed
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalVideos}</div>
            <p className="text-xs text-muted-foreground">
              vs {globalStats.avgVideosPerUser} avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              AI Chat Sessions
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalChats}</div>
            <p className="text-xs text-muted-foreground">
              vs {globalStats.avgChatsPerUser} avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exports</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalExports}</div>
            <p className="text-xs text-muted-foreground">
              vs {globalStats.avgExportsPerUser} avg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Usage</CardTitle>
          <CardDescription>
            {userStats.planUsage} of {userStats.planLimit} videos used this
            month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={(userStats.planUsage / userStats.planLimit) * 100}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage Trend</CardTitle>
            <CardDescription>
              Your activity over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsageChart data={usageTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Formats</CardTitle>
            <CardDescription>Your preferred export formats</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportFormatsChart data={exportFormats} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityTimeline activities={recentActivity} />
        </CardContent>
      </Card>
    </div>
  );
}
