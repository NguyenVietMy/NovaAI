"use client";
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import DashboardNavbar from "@/components/dashboard-navbar";
import { generateYouTubeScript } from "../actions/youtube/youtubeIdeasBrainstormer";

const SHORTS_DURATIONS = ["< 15 sec", "< 30 sec", "< 45 sec", "< 1 minute"];
const VIDEO_DURATIONS = [
  "< 2 minutes",
  "< 5 minutes",
  "< 10 minutes",
  "> 10 minutes",
];

export default function IdeasBrainstormer() {
  const [contentType, setContentType] = useState("Shorts");
  const [duration, setDuration] = useState("");
  const [topicType, setTopicType] = useState<"topic" | "title">("topic");
  const [topic, setTopic] = useState("");
  const [inspirationLinks, setInspirationLinks] = useState([""]);
  const [additionalIdeas, setAdditionalIdeas] = useState("");
  const [result, setResult] = useState<string | string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  const handleAddLink = () => {
    if (inspirationLinks.length < 20) {
      setInspirationLinks([...inspirationLinks, ""]);
    }
  };
  const handleLinkChange = (idx: number, value: string) => {
    setInspirationLinks((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };
  const handleRemoveLink = (idx: number) => {
    setInspirationLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  // Reset duration if content type changes
  const handleContentTypeChange = (val: string) => {
    setContentType(val);
    setDuration("");
  };

  // Handler for Generate Script button
  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setSelectedTitle(null);
    try {
      const res = await generateYouTubeScript({
        topicType,
        topic,
        duration,
        contentType,
        inspirationLinks,
        additionalIdeas,
      });
      setResult(res);
    } catch (err) {
      setError("Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for when user selects a suggested title
  const handleTitleSelect = async (title: string) => {
    setSelectedTitle(title);
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const script = await generateYouTubeScript({
        topicType: "title",
        topic: title,
        duration,
        contentType,
        inspirationLinks,
        additionalIdeas,
      });
      setResult(script);
    } catch (err) {
      setError("Failed to generate script for this title.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>YouTube Script Generator</CardTitle>
            <CardDescription>
              Brainstorm and generate engaging scripts for your next YouTube
              video or short. NovaAI helps you turn ideas into content, fast.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Content Type
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={contentType}
                  onChange={(e) => handleContentTypeChange(e.target.value)}
                >
                  <option value="Shorts">Shorts</option>
                  <option value="Video">Video</option>
                </select>
              </div>
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Duration
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="" disabled>
                    Select duration
                  </option>
                  {(contentType === "Shorts"
                    ? SHORTS_DURATIONS
                    : VIDEO_DURATIONS
                  ).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              {/* Topic Type Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  What do you want to start with?
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={topicType}
                  onChange={(e) =>
                    setTopicType(e.target.value as "topic" | "title")
                  }
                >
                  <option value="topic">General Topic</option>
                  <option value="title">Exact Video Title</option>
                </select>
              </div>
              {/* Topic or Title Input */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {topicType === "topic" ? "Topic" : "Exact Video Title"}
                </label>
                <Input
                  type="text"
                  placeholder={
                    topicType === "topic"
                      ? "e.g. Coding / Cooking / Growing on Youtube / ..."
                      : "e.g. 10 Tips to Grow Your Channel Fast"
                  }
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>
              {/* Inspiration Links */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Inspiration Links (YouTube URLs)
                  <span className="text-gray-400">
                    {" "}
                    (optional, but helps generate even better scripts ✨)
                  </span>
                </label>
                <div className="space-y-2">
                  {inspirationLinks.map((link, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="w-5 text-right text-sm text-muted-foreground">
                        {idx + 1}.
                      </span>
                      <Input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={link}
                        onChange={(e) => handleLinkChange(idx, e.target.value)}
                        className="flex-1"
                      />
                      {inspirationLinks.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLink(idx)}
                          aria-label="Remove link"
                        >
                          &times;
                        </Button>
                      )}
                    </div>
                  ))}
                  {inspirationLinks.length < 20 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddLink}
                      className="mt-1"
                    >
                      + Add more YouTube links
                    </Button>
                  )}
                </div>
              </div>
              {/* Additional Ideas */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Additional Ideas / Points{" "}
                  <span className="text-gray-400">(optional)</span>
                </label>
                <Textarea
                  placeholder="Any extra points, ideas, or notes for your script..."
                  value={additionalIdeas}
                  onChange={(e) => setAdditionalIdeas(e.target.value)}
                  rows={4}
                />
              </div>
              <Separator />
              <Button
                type="button"
                className="w-full"
                onClick={handleGenerate}
                disabled={loading || !topic || !duration}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "Generate Script"
                )}
              </Button>
            </form>
            {/* Results Section */}
            <div className="mt-8">
              {error && (
                <div className="text-red-500 text-center mb-4">{error}</div>
              )}
              {/* Show 5 suggested titles as cards if result is an array */}
              {Array.isArray(result) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.map((title, idx) => (
                    <button
                      key={idx}
                      className={`rounded-lg shadow-md p-4 text-left border hover:border-primary transition-colors ${selectedTitle === title ? "border-primary bg-primary/10" : "bg-white"}`}
                      onClick={() => handleTitleSelect(title)}
                      disabled={loading}
                    >
                      <span className="font-semibold">{title}</span>
                    </button>
                  ))}
                </div>
              )}
              {/* Show script in a styled card if result is a string */}
              {typeof result === "string" && !loading && (
                <Card className="mt-6 bg-muted/50">
                  <CardHeader>
                    <CardTitle>Generated Script</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm">{result}</pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
