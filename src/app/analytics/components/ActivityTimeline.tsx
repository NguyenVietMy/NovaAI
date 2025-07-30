"use client";

import { Video, MessageSquare, Download, Clock } from "lucide-react";

interface Activity {
  id: string;
  type: "video" | "chat" | "export";
  title: string;
  timestamp: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getIcon = (type: Activity["type"]) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4 text-blue-500" />;
      case "chat":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "export":
        return <Download className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: Activity["type"]) => {
    switch (type) {
      case "video":
        return "Video processed";
      case "chat":
        return "AI chat session";
      case "export":
        return "Export completed";
      default:
        return "Activity";
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">{getIcon(activity.type)}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">
                {activity.title}
              </p>
              <span className="text-xs text-muted-foreground">
                {activity.timestamp}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {getTypeLabel(activity.type)}
            </p>
          </div>
        </div>
      ))}

      {activities.length === 0 && (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </div>
      )}
    </div>
  );
}
