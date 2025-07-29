"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Play,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface UrlInputFormProps {
  videoType: "single" | "channel";
  url: string;
  isLoading: boolean;
  error: string;
  success: string;
  fetchShorts: boolean;
  onUrlChange: (url: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFetchShortsChange: (fetchShorts: boolean) => void;
}

export default function UrlInputForm({
  videoType,
  url,
  isLoading,
  error,
  success,
  fetchShorts,
  onUrlChange,
  onSubmit,
  onFetchShortsChange,
}: UrlInputFormProps) {
  return (
    <Card className="flex flex-col h-full relative">
      {videoType === "channel" && (
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <span className="text-sm font-medium">Include shorts?</span>
          <button
            type="button"
            aria-pressed={fetchShorts}
            onClick={() => onFetchShortsChange(!fetchShorts)}
            className={`w-14 h-8 flex items-center rounded-full transition-colors duration-200 focus:outline-none border-2 border-green-700 ${
              fetchShorts ? "bg-green-700" : "bg-gray-200"
            }`}
          >
            <span
              className={`w-7 h-7 flex items-center justify-center rounded-full bg-white shadow transform transition-transform duration-200 ${
                fetchShorts ? "translate-x-6" : "translate-x-0"
              }`}
            >
              {fetchShorts ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M5 10.5l4 4 6-8"
                    stroke="#166534"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M6 6l8 8M14 6l-8 8"
                    stroke="#64748b"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </span>
          </button>
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {videoType === "single" ? (
            "Generate Transcript"
          ) : (
            <>
              Get <span className="gradient-red-text">YouTube</span> Videos{" "}
              <span className="bg-indigo-500 text-white px-2 py-1 text-xs font-bold rounded">
                PRO
              </span>
            </>
          )}
        </CardTitle>
        <CardDescription>
          {videoType === "single"
            ? "Enter a YouTube URL to generate transcript and AI summary"
            : "Enter a valid channel URL or a public playlist URL to get all videos for transcript generation"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                {videoType === "single" ? "Generate Transcript" : "Get Videos"}
              </>
            )}
          </Button>
        </form>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
