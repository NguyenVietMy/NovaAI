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
import { Checkbox } from "@/components/ui/checkbox";

const SHORTS_DURATIONS = ["< 15 sec", "< 30 sec", "< 45 sec", "< 1 minute"];
const VIDEO_DURATIONS = [
  "< 2 minutes",
  "< 5 minutes",
  "< 10 minutes",
  "> 10 minutes",
];

const STYLES = [
  "Informative",
  "Funny/Entertaining",
  "Motivational/Inspiring",
  "Controversial/Provocative",
  "Casual/Conversational",
  "Professional/Formal",
  "Storytelling/Narrative",
  "Action-Oriented/Direct",
  "Minimalist/Concise",
];

const AUDIENCES = [
  "Beginner (no background knowledge)",
  "Intermediate",
  "Advanced/ Expert",
  "Kids",
  "General Audience (casual viewers, assuming no special knowledge)",
  "Other",
];

const HOOK_STYLES = [
  "Shocking Fact",
  "Question",
  "Relatable Problem",
  "Anecdote",
  "Bold claim/ hot take",
  "Humor/Joke",
  "Direct",
];

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Korean",
  "Vietnamese",
  "Hindi",
  "Other",
];

export default function VideoOutliner() {
  const [contentType, setContentType] = useState("Shorts");
  const [duration, setDuration] = useState("");
  const [topicType, setTopicType] = useState<"topic" | "title">("topic");
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("");
  const [audience, setAudience] = useState<string[]>([]);
  const [hookStyle, setHookStyle] = useState("");
  const [language, setLanguage] = useState("English");
  const [generateHashtags, setGenerateHashtags] = useState("no");

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
            <CardTitle>Video Outliner</CardTitle>
            <CardDescription>
              Plan your next YouTube video or short with an AI-generated
              outline. NovaAI helps you structure your content for maximum
              impact.
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
                <label className="block text-sm font-medium mb-1">Length</label>
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
              {/* Style Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1">Style</label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  <option value="" disabled>
                    Select style
                  </option>
                  {STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {/* Audience Checkbox List */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Audience
                </label>
                <div className="flex flex-col gap-2 mt-2">
                  {AUDIENCES.map((a) => (
                    <label
                      key={a}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <Checkbox
                        checked={audience.includes(a)}
                        onCheckedChange={(checked) => {
                          setAudience((prev) =>
                            checked
                              ? [...prev, a]
                              : prev.filter((val) => val !== a)
                          );
                        }}
                        id={`audience-${a}`}
                      />
                      <span className="text-sm">{a}</span>
                    </label>
                  ))}
                </div>
                {audience.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">
                    Please select at least one audience type.
                  </div>
                )}
              </div>
              {/* Hook Style Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Hook Style
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={hookStyle}
                  onChange={(e) => setHookStyle(e.target.value)}
                >
                  <option value="" disabled>
                    Select hook style
                  </option>
                  {HOOK_STYLES.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              {/* Language Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Language
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              {/* Generate SEO Hashtags */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Generate additional SEO hashtags?
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={generateHashtags}
                  onChange={(e) => setGenerateHashtags(e.target.value)}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <Separator />
              <Button type="button" className="w-full" disabled>
                Generate Outline (Coming Soon)
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
