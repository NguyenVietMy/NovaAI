"use client";

import React, { useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Card, CardContent } from "@/components/ui/card";

interface YouTubeVideoPlayerProps {
  videoUrl: string; // Any YouTube URL (watch?v=..., youtu.be/..., etc.)
  thumbnailUrl?: string; // Optional thumbnail for "click to play" poster
  className?: string; // Optional wrapper classes
}

export default function YouTubeVideoPlayer({
  videoUrl,
  thumbnailUrl,
  className = "",
}: YouTubeVideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // ReactPlayer -> progress ticks
  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const playedSeconds = video.currentTime;
    setCurrentTime(playedSeconds);
  };

  // Utility: 90:05 -> "1:30:05" / "12:05"
  const formatTime = (s: number) => {
    const sec = Math.max(0, Math.floor(s));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const xs = sec % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${xs.toString().padStart(2, "0")}`
      : `${m}:${xs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
          <ReactPlayer
            ref={playerRef}
            src={videoUrl}
            width="100%"
            height="100%"
            controls
            light={thumbnailUrl || false} // shows poster until clicked
            onTimeUpdate={handleTimeUpdate}
            config={{
              youtube: {
                rel: 0,
              },
            }}
          />
        </div>
        <div className="p-3 text-xs md:text-sm text-muted-foreground">
          Time: {formatTime(currentTime)}
        </div>
      </CardContent>
    </Card>
  );
}
