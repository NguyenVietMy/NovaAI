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
  const [topic, setTopic] = useState("");
  const [inspirationLinks, setInspirationLinks] = useState([""]);
  const [additionalIdeas, setAdditionalIdeas] = useState("");

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
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium mb-1">Topic</label>
                <Input
                  type="text"
                  placeholder="e.g. How to grow on YouTube"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>
              {/* Inspiration Links */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Inspiration Links (YouTube URLs)
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
              <Button type="button" className="w-full" disabled>
                Generate Script (Coming Soon)
              </Button>
            </form>
            {/* Placeholder for future script results */}
            <div className="mt-8 text-center text-muted-foreground">
              <p>Script results will appear here after generation.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
