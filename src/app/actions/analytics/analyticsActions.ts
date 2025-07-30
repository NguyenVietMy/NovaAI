import { createClient } from "../../../../supabase/client";

export interface UserStats {
  totalVideos: number;
  totalChats: number;
  totalExports: number;
  planUsage: number;
  planLimit: number;
  rank: number;
  percentile: number;
}

export interface GlobalStats {
  avgVideosPerUser: number;
  avgChatsPerUser: number;
  avgExportsPerUser: number;
  totalUsers: number;
}

export interface ActivityItem {
  id: string;
  type: "video" | "chat" | "export";
  title: string;
  timestamp: string;
}

export interface UsageTrendItem {
  date: string;
  videos: number;
  chats: number;
  exports: number;
}

export interface ExportFormatItem {
  format: string;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  userStats: UserStats;
  globalStats: GlobalStats;
  recentActivity: ActivityItem[];
  usageTrend: UsageTrendItem[];
  exportFormats: ExportFormatItem[];
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = createClient();

  try {
    // Get user's video count
    const { count: videoCount } = await supabase
      .from("youtube_transcript_cache")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get user's chat sessions count
    const { count: chatCount } = await supabase
      .from("chat_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get user's export count (approximated from items with export data)
    const { count: exportCount } = await supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("type", "export");

    // Get user's subscription info
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Calculate plan usage (this month's videos)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: monthlyVideos } = await supabase
      .from("youtube_transcript_cache")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    const planLimit = subscription?.stripe_price_id === "price_pro" ? 100 : 10;
    const planUsage = monthlyVideos || 0;

    // Calculate rank and percentile (simplified)
    const { data: allUsers } = await supabase
      .from("youtube_transcript_cache")
      .select("user_id")
      .not("user_id", "is", null);

    const userVideoCounts =
      allUsers?.reduce(
        (acc, item) => {
          acc[item.user_id] = (acc[item.user_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const sortedUsers = Object.entries(userVideoCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([userId]) => userId);

    const rank = sortedUsers.indexOf(userId) + 1;
    const percentile = Math.round(
      ((sortedUsers.length - rank) / sortedUsers.length) * 100
    );

    return {
      totalVideos: videoCount || 0,
      totalChats: chatCount || 0,
      totalExports: exportCount || 0,
      planUsage,
      planLimit,
      rank,
      percentile,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      totalVideos: 0,
      totalChats: 0,
      totalExports: 0,
      planUsage: 0,
      planLimit: 10,
      rank: 0,
      percentile: 0,
    };
  }
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const supabase = createClient();

  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Get average videos per user
    const { data: allVideos } = await supabase
      .from("youtube_transcript_cache")
      .select("user_id");

    const userVideoCounts =
      allVideos?.reduce(
        (acc, item) => {
          acc[item.user_id] = (acc[item.user_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const avgVideosPerUser =
      Object.values(userVideoCounts).length > 0
        ? Math.round(
            Object.values(userVideoCounts).reduce((a, b) => a + b, 0) /
              Object.values(userVideoCounts).length
          )
        : 0;

    // Get average chats per user
    const { data: allChats } = await supabase
      .from("chat_sessions")
      .select("user_id");

    const userChatCounts =
      allChats?.reduce(
        (acc, item) => {
          acc[item.user_id] = (acc[item.user_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const avgChatsPerUser =
      Object.values(userChatCounts).length > 0
        ? Math.round(
            Object.values(userChatCounts).reduce((a, b) => a + b, 0) /
              Object.values(userChatCounts).length
          )
        : 0;

    // Get average exports per user
    const { data: allExports } = await supabase
      .from("items")
      .select("owner_id")
      .eq("type", "export");

    const userExportCounts =
      allExports?.reduce(
        (acc, item) => {
          acc[item.owner_id] = (acc[item.owner_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const avgExportsPerUser =
      Object.values(userExportCounts).length > 0
        ? Math.round(
            Object.values(userExportCounts).reduce((a, b) => a + b, 0) /
              Object.values(userExportCounts).length
          )
        : 0;

    return {
      avgVideosPerUser,
      avgChatsPerUser,
      avgExportsPerUser,
      totalUsers: totalUsers || 0,
    };
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return {
      avgVideosPerUser: 0,
      avgChatsPerUser: 0,
      avgExportsPerUser: 0,
      totalUsers: 0,
    };
  }
}

export async function getRecentActivity(
  userId: string
): Promise<ActivityItem[]> {
  const supabase = createClient();

  try {
    // Get recent videos
    const { data: recentVideos } = await supabase
      .from("youtube_transcript_cache")
      .select("id, video_title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get recent chat sessions
    const { data: recentChats } = await supabase
      .from("chat_sessions")
      .select("id, video_title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get recent exports
    const { data: recentExports } = await supabase
      .from("items")
      .select("id, name, created_at")
      .eq("owner_id", userId)
      .eq("type", "export")
      .order("created_at", { ascending: false })
      .limit(5);

    const activities: ActivityItem[] = [];

    // Combine and sort all activities
    recentVideos?.forEach((video) => {
      activities.push({
        id: video.id,
        type: "video",
        title: video.video_title || "Video processed",
        timestamp: formatTimestamp(video.created_at),
      });
    });

    recentChats?.forEach((chat) => {
      activities.push({
        id: chat.id,
        type: "chat",
        title: `AI Chat: ${chat.video_title || "Session"}`,
        timestamp: formatTimestamp(chat.created_at),
      });
    });

    recentExports?.forEach((export_) => {
      activities.push({
        id: export_.id,
        type: "export",
        title: `Exported: ${export_.name || "Document"}`,
        timestamp: formatTimestamp(export_.created_at),
      });
    });

    // Sort by timestamp and take top 10
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}

export async function getUsageTrend(userId: string): Promise<UsageTrendItem[]> {
  const supabase = createClient();

  try {
    // Get last 7 days of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const { data: videos } = await supabase
      .from("youtube_transcript_cache")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    const { data: chats } = await supabase
      .from("chat_sessions")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    const { data: exports } = await supabase
      .from("items")
      .select("created_at")
      .eq("owner_id", userId)
      .eq("type", "export")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    // Group by date
    const dailyData: Record<
      string,
      { videos: number; chats: number; exports: number }
    > = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyData[dateStr] = { videos: 0, chats: 0, exports: 0 };
    }

    // Count videos by date
    videos?.forEach((video) => {
      const dateStr = video.created_at.split("T")[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].videos++;
      }
    });

    // Count chats by date
    chats?.forEach((chat) => {
      const dateStr = chat.created_at.split("T")[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].chats++;
      }
    });

    // Count exports by date
    exports?.forEach((export_) => {
      const dateStr = export_.created_at.split("T")[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].exports++;
      }
    });

    return Object.entries(dailyData).map(([date, counts]) => ({
      date,
      ...counts,
    }));
  } catch (error) {
    console.error("Error fetching usage trend:", error);
    return [];
  }
}

export async function getExportFormats(
  userId: string
): Promise<ExportFormatItem[]> {
  const supabase = createClient();

  try {
    const { data: exports } = await supabase
      .from("items")
      .select("data")
      .eq("owner_id", userId)
      .eq("type", "export");

    const formatCounts: Record<string, number> = {};

    exports?.forEach((export_) => {
      const format = export_.data?.format || "unknown";
      formatCounts[format] = (formatCounts[format] || 0) + 1;
    });

    const total = Object.values(formatCounts).reduce((a, b) => a + b, 0);

    return Object.entries(formatCounts)
      .map(([format, count]) => ({
        format: format.toUpperCase(),
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("Error fetching export formats:", error);
    return [];
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }
}

export async function getAnalyticsData(userId: string): Promise<AnalyticsData> {
  const [userStats, globalStats, recentActivity, usageTrend, exportFormats] =
    await Promise.all([
      getUserStats(userId),
      getGlobalStats(),
      getRecentActivity(userId),
      getUsageTrend(userId),
      getExportFormats(userId),
    ]);

  return {
    userStats,
    globalStats,
    recentActivity,
    usageTrend,
    exportFormats,
  };
}
