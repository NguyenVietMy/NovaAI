"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Calendar } from "lucide-react";

interface TranscriptData {
  url: string;
  title: string;
  duration: string;
  transcriptPlain: string;
  transcriptTimed: string;
  transcriptVtt: string;
  transcriptBlocks: any[];
  summary: string;
  processedAt: string;
  thumbnailUrl?: string;
}

interface AiSummaryPanelProps {
  transcriptData: TranscriptData;
}

export default function AiSummaryPanel({
  transcriptData,
}: AiSummaryPanelProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          AI Summary
        </CardTitle>
        <CardDescription>
          Generated summary of the video content
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="bg-muted/50 rounded-lg p-4">
            {/* Thumbnail image above the title and duration */}
            {transcriptData.thumbnailUrl && (
              <img
                src={transcriptData.thumbnailUrl}
                alt="YouTube thumbnail"
                className="mb-4 w-full max-w-xs rounded shadow-sm object-cover"
                style={{ aspectRatio: "16/9", background: "#eee" }}
              />
            )}
            <h4 className="font-semibold mb-2">{transcriptData.title}</h4>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {transcriptData.duration}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(transcriptData.processedAt).toLocaleDateString()}
              </span>
            </div>
            <Separator className="mb-3" />
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {transcriptData.summary}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
