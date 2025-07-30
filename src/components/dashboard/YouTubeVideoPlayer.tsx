"use client";

import React, { useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import type { TimedBlock, TranscriptData } from "@/types/supabase";

interface YouTubeVideoPlayerProps {
  videoUrl: string; // Any YouTube URL (watch?v=..., youtu.be/..., etc.)
  thumbnailUrl?: string; // Optional thumbnail for "click to play" poster
  className?: string; // Optional wrapper classes
  transcriptData?: TranscriptData; // Optional transcript data for inline display
  showTranscript?: boolean; // Whether to show transcript inline
}

export default function YouTubeVideoPlayer({
  videoUrl,
  thumbnailUrl,
  className = "",
  transcriptData,
  showTranscript = false,
}: YouTubeVideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isTranscriptVisible, setIsTranscriptVisible] =
    useState(showTranscript);

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

  // Parse timestamp string to seconds (e.g., "00:01:23" -> 83)
  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(":");
    if (parts.length === 3) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseInt(parts[2], 10);
      return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      return minutes * 60 + seconds;
    }
    return 0;
  };

  // Seek to specific timestamp
  const seekToTimestamp = (timestamp: string) => {
    const seconds = parseTimestamp(timestamp);
    if (playerRef.current) {
      playerRef.current.seekTo(seconds);
    }
  };

  // Parse transcript timed format and create clickable timestamps
  const renderTranscriptWithTimestamps = () => {
    if (!transcriptData?.transcriptTimed) return null;

    // Ensure transcriptTimed is a string
    const transcriptTimed =
      typeof transcriptData.transcriptTimed === "string"
        ? transcriptData.transcriptTimed
        : String(transcriptData.transcriptTimed);

    const lines = transcriptTimed.split("\n").filter(Boolean);

    return (
      <div className="mt-4 max-h-64 overflow-y-auto space-y-1 text-sm">
        {lines.map((line: string, index: number) => {
          const match = line.match(/^(\d{2}:\d{2}:\d{2}\.\d{3})\s+(.*)$/);
          if (!match) return null;

          const [, timestamp, text] = match;
          // Remove milliseconds for display
          const displayTimestamp = timestamp.replace(/\.\d{3}$/, "");

          // Parse timestamp to seconds for comparison
          const timestampSeconds = parseTimestamp(displayTimestamp);
          const isCurrentLine =
            currentTime >= timestampSeconds &&
            (index === lines.length - 1 ||
              currentTime <
                parseTimestamp(
                  lines[index + 1]
                    .match(/^(\d{2}:\d{2}:\d{2}\.\d{3})/)?.[1]
                    ?.replace(/\.\d{3}$/, "") || "0"
                ));

          return (
            <div
              key={index}
              className={`flex items-start gap-2 hover:bg-muted/50 p-1 rounded transition-colors ${
                isCurrentLine ? "bg-primary/10 border-l-2 border-primary" : ""
              }`}
            >
              <button
                onClick={() => seekToTimestamp(displayTimestamp)}
                className={`font-mono text-xs px-2 py-1 rounded transition-colors ${
                  isCurrentLine
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20"
                }`}
                title={`Jump to ${displayTimestamp}`}
              >
                {displayTimestamp}
              </button>
              <span
                className={`flex-1 ${isCurrentLine ? "text-foreground font-medium" : "text-muted-foreground"}`}
              >
                {text}
              </span>
            </div>
          );
        })}
      </div>
    );
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
        <div className="p-3 text-xs md:text-sm text-muted-foreground flex items-center justify-between">
          <span>Time: {formatTime(currentTime)}</span>
          {transcriptData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTranscriptVisible(!isTranscriptVisible)}
              className="flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              {isTranscriptVisible ? (
                <>
                  Hide Transcript
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Show Transcript
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
        {isTranscriptVisible && transcriptData && (
          <div className="px-3 pb-3 border-t">
            <h4 className="text-sm font-medium mb-2">Transcript</h4>
            {renderTranscriptWithTimestamps()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
