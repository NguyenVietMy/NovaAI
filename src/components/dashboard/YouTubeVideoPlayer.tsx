"use client";

import React, { useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import type { TranscriptData } from "@/types/supabase";

interface YouTubeVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  className?: string;
  transcriptData?: TranscriptData;
  showTranscript?: boolean;
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

  // Handle time updates from ReactPlayer
  const handleTimeUpdate = (payload: any) => {
    const t =
      typeof payload === "number"
        ? payload
        : (payload?.seconds ??
          payload?.currentTime ??
          playerRef.current?.currentTime ??
          0);
    setCurrentTime(t);
  };

  // Format seconds to "MM:SS" or "HH:MM:SS"
  const formatTime = (s: number) => {
    const sec = Math.max(0, Math.floor(s));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const xs = sec % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${xs.toString().padStart(2, "0")}`
      : `${m}:${xs.toString().padStart(2, "0")}`;
  };

  // Parse timestamp to seconds
  const parseTimestamp = (timestamp: string): number => {
    const full = timestamp.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
    if (full) {
      const [, hh, mm, ss, ms] = full;
      return (
        parseInt(hh, 10) * 3600 +
        parseInt(mm, 10) * 60 +
        parseInt(ss, 10) +
        (ms ? parseInt(ms, 10) / 1000 : 0)
      );
    }
    const short = timestamp.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/);
    if (short) {
      const [, mm, ss, ms] = short;
      return (
        parseInt(mm, 10) * 60 +
        parseInt(ss, 10) +
        (ms ? parseInt(ms, 10) / 1000 : 0)
      );
    }
    return 0;
  };

  // Seek to specific time in video
  const seekToSeconds = (seconds: number) => {
    const inst = playerRef.current as any;
    if (!inst) return;

    try {
      inst.currentTime = seconds; // ReactPlayer v3 preferred method
    } catch {
      if (typeof inst.seekTo === "function") {
        inst.seekTo(seconds, "seconds");
      }
    }
  };

  // Render transcript with clickable timestamps
  const renderTranscriptWithTimestamps = () => {
    if (!transcriptData?.transcriptTimed) return null;

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
          const displayTimestamp = timestamp.replace(/\.\d{3}$/, "");
          const ts = parseTimestamp(timestamp);

          // Determine if this is the current line
          const nextMatch = lines[index + 1]?.match(
            /^(\d{2}:\d{2}:\d{2}\.\d{3})/
          );
          const nextTs = nextMatch
            ? parseTimestamp(nextMatch[1])
            : Number.POSITIVE_INFINITY;
          const isCurrentLine = currentTime >= ts && currentTime < nextTs;

          const handleActivate = () => seekToSeconds(ts);
          const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleActivate();
            }
          };

          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              onClick={handleActivate}
              onKeyDown={handleKey}
              className={`flex items-start gap-2 p-1 rounded transition-colors cursor-pointer hover:bg-muted/50 ${
                isCurrentLine ? "bg-primary/10 border-l-2 border-primary" : ""
              }`}
              aria-current={isCurrentLine ? "true" : undefined}
              title={`Jump to ${displayTimestamp}`}
            >
              <span
                className={`font-mono text-xs px-2 py-1 rounded ${
                  isCurrentLine
                    ? "bg-primary text-primary-foreground"
                    : "text-primary bg-primary/10"
                }`}
              >
                {displayTimestamp}
              </span>
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
            onTimeUpdate={handleTimeUpdate}
            config={{ youtube: { rel: 0 } }}
          />
        </div>

        <div className="p-3 text-xs md:text-sm text-muted-foreground flex items-center justify-between">
          <span>Time: {formatTime(currentTime)}</span>
          {transcriptData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTranscriptVisible((v) => !v)}
              className="flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              {isTranscriptVisible ? (
                <>
                  Hide Transcript <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Show Transcript <ChevronDown className="h-4 w-4" />
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
