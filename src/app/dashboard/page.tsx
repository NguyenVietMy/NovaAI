"use client";

import { useState, useEffect } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserSubscriptionDetails } from "../actions/auth_actions/authActions";
import {
  processYouTubeTranscript,
  fetchChannelVideos,
} from "../actions/youtube/youtubeTranscriptActions";
import { createClient } from "../../../supabase/client";
import type { TimedBlock } from "../actions/youtube/youtubeTranscriptActions";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Crown,
  Calendar,
  CreditCard,
  Play,
  Clock,
  Copy,
  Send,
  Video,
  List,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useRef } from "react";
import type { ChannelVideo } from "@/types/supabase";

interface TranscriptData {
  url: string;
  title: string;
  duration: string;
  transcriptPlain: string;
  transcriptTimed: string;
  transcriptVtt: string;
  transcriptBlocks: TimedBlock[];
  summary: string;
  processedAt: string;
  thumbnailUrl?: string;
}

interface SubscriptionData {
  id: string;
  user_id: string;
  status: string;
  plan_name: string;
  current_period_end: string;
  created_at: string;
}

// Utility to normalize YouTube channel URLs to the /videos tab
function normalizeChannelUrl(url: string): string {
  try {
    const u = new URL(url);
    // Handles /@handle, /@handle/featured, /@handle/shorts, /@handle/videos, etc.
    const match = u.pathname.match(/^\/@[\w\-]+/);
    if (match) {
      return `${u.origin}${match[0]}/videos`;
    }
    // Handles /channel/UCxxxxxx
    const channelMatch = u.pathname.match(/^\/channel\/[\w\-]+/);
    if (channelMatch) {
      return `${u.origin}${channelMatch[0]}/videos`;
    }
    // Fallback: return original
    return url;
  } catch {
    return url;
  }
}

// Utility to check if a URL is a YouTube video
function isYouTubeVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    // Match /watch?v= or /shorts/ or /embed/
    return (
      (u.pathname === "/watch" && u.searchParams.has("v")) ||
      u.pathname.startsWith("/shorts/") ||
      u.pathname.startsWith("/embed/")
    );
  } catch {
    return false;
  }
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(
    null
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState("plain");
  const [videoType, setVideoType] = useState<"single" | "channel">("single");
  const [fetchShorts, setFetchShorts] = useState(false);

  // --- AI Chat State ---
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "ai"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Placeholder send handler (no AI logic yet)
  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const input = chatInput.trim();
    if (!input) return;
    setChatMessages((msgs) => [...msgs, { role: "user", content: input }]);
    setChatInput("");
    // TODO: Add AI response logic here
  };

  const [channelVideos, setChannelVideos] = useState<ChannelVideo[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);

  // Update state for pageSize to allow string 'all'
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Compute paginated videos
  const totalPages =
    pageSize === "all"
      ? 1
      : Math.ceil(channelVideos.length / (pageSize as number));
  const paginatedVideos =
    pageSize === "all"
      ? channelVideos
      : channelVideos.slice(
          (currentPage - 1) * (pageSize as number),
          currentPage * (pageSize as number)
        );

  // Reset to page 1 when channelVideos or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [channelVideos, pageSize]);

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        // Fetch subscription details
        const subscriptionData = await getUserSubscriptionDetails(user.id);
        setSubscription(subscriptionData);
      }
      setIsInitialLoading(false);
    };

    fetchUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setTranscriptData(null);
    setChannelVideos([]);
    setSelectedVideos([]);

    if (videoType === "channel" && isYouTubeVideoUrl(url)) {
      setError(
        "Please enter a valid channel or playlist URL, not a single video URL."
      );
      setIsLoading(false);
      return;
    }

    try {
      if (videoType === "channel") {
        const fixedUrl = normalizeChannelUrl(url);
        const result = await fetchChannelVideos(fixedUrl, true, fetchShorts);
        if (result.success) {
          setChannelVideos(result.videos);
          setSuccess(`Fetched ${result.count} videos!`);
        } else {
          let errMsg = result.error;
          if (
            /yt-dlp|Failed to resolve|TransportError|download webpage|Traceback|HTTPSConnection|getaddrinfo/i.test(
              errMsg
            )
          ) {
            errMsg =
              "Invalid or unreachable URL. Please check your input and try again.";
          }
          setError(errMsg);
        }
      } else {
        const formData = new FormData();
        formData.append("url", url);
        const result = await processYouTubeTranscript(formData);
        if (result?.data) {
          setTranscriptData(result.data as TranscriptData);
          setSuccess("Transcript generated successfully!");
        } else if (result?.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      setError("Failed to process. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear data when switching modes
  useEffect(() => {
    setTranscriptData(null);
    setChannelVideos([]);
    setSelectedVideos([]);
  }, [videoType]);

  const downloadTranscript = (
    format:
      | "txt"
      | "srt"
      | "json"
      | "vtt"
      | "vtt-clean"
      | "vtt-advanced"
      | "csv"
      | "md",
    txtVariant?: "withTimestamp" | "plain"
  ) => {
    if (!transcriptData) return;

    let content = "";
    let filename = "";
    let mimeType = "";

    switch (format) {
      case "txt":
        if (txtVariant === "withTimestamp") {
          content = transcriptData.transcriptTimed;
          filename = `transcript-${Date.now()}-with-timestamps.txt`;
        } else {
          content = transcriptData.transcriptPlain;
          filename = `transcript-${Date.now()}.txt`;
        }
        mimeType = "text/plain";
        break;
      case "srt":
        // Generate SRT from transcriptTimed (pattern: time1->time2, text1)
        const timedLines = transcriptData.transcriptTimed
          .split("\n")
          .filter(Boolean);
        const srtBlocks = [];
        for (let i = 0; i < timedLines.length - 1; i++) {
          const [start, ...textArr] = timedLines[i].split(/\s{2,}/);
          const [end] = timedLines[i + 1].split(/\s{2,}/);
          if (!start || !end || textArr.length === 0) continue;
          // SRT expects comma for ms
          const toSrtTime = (t: string) => t.replace(/\.(\d{3})$/, ",$1");
          srtBlocks.push(
            `${i + 1}\n${toSrtTime(start)} --> ${toSrtTime(end)}\n${textArr.join(" ")}\n`
          );
        }
        content = srtBlocks.join("\n");
        filename = `transcript-${Date.now()}.srt`;
        mimeType = "text/plain";
        break;
      case "json":
        content = JSON.stringify(transcriptData, null, 2);
        filename = `transcript-${Date.now()}.json`;
        mimeType = "application/json";
        break;
      case "vtt":
        content = transcriptData.transcriptVtt;
        filename = `transcript-${Date.now()}.vtt`;
        mimeType = "text/vtt";
        break;
      case "vtt-clean":
        // Cleaned VTT: SRT-to-VTT logic
        const timedLinesVtt = transcriptData.transcriptTimed
          .split("\n")
          .filter(Boolean);
        const vttBlocks = [];
        for (let i = 0; i < timedLinesVtt.length - 1; i++) {
          const [start, ...textArr] = timedLinesVtt[i].split(/\s{2,}/);
          const [end] = timedLinesVtt[i + 1].split(/\s{2,}/);
          if (!start || !end || textArr.length === 0) continue;
          // VTT expects dot for ms
          const toVttTime = (t: string) => t.replace(/\.(\d{3})$/, ".$1");
          vttBlocks.push(
            `${toVttTime(start)} --> ${toVttTime(end)}\n${textArr.join(" ")}\n`
          );
        }
        content = `WEBVTT\n\n${vttBlocks.join("\n")}`;
        filename = `transcript-${Date.now()}-cleaned.vtt`;
        mimeType = "text/vtt";
        break;
      case "vtt-advanced":
        // Advanced VTT: original
        content = transcriptData.transcriptVtt;
        filename = `transcript-${Date.now()}-advanced.vtt`;
        mimeType = "text/vtt";
        break;
      case "csv":
        // CSV from transcriptTimed: Start,End,Text
        const timedLinesCsv = transcriptData.transcriptTimed
          .split("\n")
          .filter(Boolean);
        let csvRows = ["Start,End,Text"];
        for (let i = 0; i < timedLinesCsv.length - 1; i++) {
          const [start, ...textArr] = timedLinesCsv[i].split(/\s{2,}/);
          const [end] = timedLinesCsv[i + 1].split(/\s{2,}/);
          if (!start || !end || textArr.length === 0) continue;
          // Escape quotes in text for CSV
          const text = textArr.join(" ").replace(/"/g, '""');
          csvRows.push(`"${start}","${end}","${text}"`);
        }
        content = csvRows.join("\n");
        filename = `transcript-${Date.now()}.csv`;
        mimeType = "text/csv";
        break;
      case "md":
        // Markdown export: Title, ID, then transcript with start time only (seconds only)
        const mdTitle = transcriptData.title || "";
        // Try to extract YouTube ID from URL
        let mdId = "";
        try {
          const urlObj = new URL(transcriptData.url);
          mdId =
            urlObj.searchParams.get("v") ||
            urlObj.pathname.split("/").pop() ||
            "";
        } catch {}
        let md = `# Video Information\n\n**Title:** ${mdTitle}\n**ID:** ${mdId}\n\n## Transcript\n\n`;
        const timedLinesMd = transcriptData.transcriptTimed
          .split("\n")
          .filter(Boolean);
        for (const line of timedLinesMd) {
          const [start, ...textArr] = line.split(/\s{2,}/);
          if (!start || textArr.length === 0) continue;
          // Remove milliseconds from start time
          const startNoMs = start.replace(/\.(\d{3})$/, "");
          md += `**[${startNoMs}]** ${textArr.join(" ")}\n\n`;
        }
        content = md;
        filename = `transcript-${Date.now()}.md`;
        mimeType = "text/markdown";
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async (type: "withTimestamp" | "plain") => {
    if (!transcriptData) return;
    let text = "";
    if (type === "withTimestamp") {
      text = transcriptData.transcriptBlocks
        .map((block) => `${block.start} - ${block.end}\n${block.text}`)
        .join("\n\n");
    } else {
      text = transcriptData.transcriptPlain;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(
        type === "withTimestamp" ? "Copied with timestamp!" : "Copied plain!"
      );
      setTimeout(() => setCopyStatus(""), 1500);
    } catch {
      setCopyStatus("Failed to copy");
      setTimeout(() => setCopyStatus(""), 1500);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const subscriptionStatus = subscription?.status || "free";
  const planName = subscription?.plan_name || "Free Plan";

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {userName}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Ready to download some YouTube transcripts?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <Badge
                variant={
                  subscriptionStatus === "active" ? "default" : "secondary"
                }
              >
                {planName}
              </Badge>
            </div>
          </div>
        </div>

        {/* Subscription Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="font-semibold">{planName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    subscriptionStatus === "active" ? "default" : "secondary"
                  }
                >
                  {subscriptionStatus === "active" ? "Active" : "Free"}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Billing</p>
                <p className="font-semibold">
                  {subscription?.current_period_end
                    ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
                    : "No active subscription"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Video Type Toggle */}
          <div className="lg:col-span-2 flex justify-center mb-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex items-center">
              <button
                onClick={() => setVideoType("single")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  videoType === "single"
                    ? "bg-red-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Video className="w-4 h-4" />
                <span className="font-medium">Single Video</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setVideoType("channel")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                    videoType === "channel"
                      ? "bg-red-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="font-medium">Channel/Playlist</span>
                </button>
              </div>
            </div>
          </div>

          {/* YouTube URL Input Form */}
          <Card className="flex flex-col h-full relative">
            {videoType === "channel" && (
              <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                <span className="text-sm font-medium">Include shorts?</span>
                <button
                  type="button"
                  aria-pressed={fetchShorts}
                  onClick={() => setFetchShorts((v) => !v)}
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
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M5 10.5l4 4 6-8"
                          stroke="#166534"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
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
                    Get <span className="gradient-red-text">YouTube</span>{" "}
                    Videos{" "}
                    <span className="bg-indigo-500 text-white px-2 py-1 text-xs font-bold rounded">
                      PRO
                    </span>
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {videoType === "single"
                  ? "Enter a YouTube URL to generate transcript and AI summary"
                  : "Enter a valid channel URL or a public playlist to get all videos for transcript generation"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
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
                      {videoType === "single"
                        ? "Generate Transcript"
                        : "Get Videos"}
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

          {/* AI Summary Panel */}
          {transcriptData && (
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
                    <h4 className="font-semibold mb-2">
                      {transcriptData.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {transcriptData.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(
                          transcriptData.processedAt
                        ).toLocaleDateString()}
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
          )}
        </div>

        {/* Transcript Results */}
        {transcriptData && (
          <Card className="relative flex flex-col h-[1400px]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transcript & Downloads
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <Tabs
                defaultValue="plain"
                className="relative flex-1 flex flex-col min-h-0 w-full"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="grid w-full grid-cols-2 z-10">
                  <TabsTrigger value="plain">Full Transcript</TabsTrigger>
                  <TabsTrigger value="summary">AI Chat</TabsTrigger>
                </TabsList>
                {/* Copy/Download Buttons */}
                <div className="mt-2 mb-4 flex items-center z-10">
                  {activeTab === "plain" ? (
                    <>
                      {/* Move Copy button to the far left */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex gap-2"
                          >
                            <Copy className="h-4 w-4" />
                            Copy
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() => handleCopy("withTimestamp")}
                          >
                            Copy with timestamp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopy("plain")}>
                            Copy without timestamp
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {/* Download buttons follow */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            .TXT
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() =>
                              downloadTranscript("txt", "withTimestamp")
                            }
                          >
                            With Timestamps
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => downloadTranscript("txt", "plain")}
                          >
                            Without Timestamps
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTranscript("srt")}
                      >
                        {" "}
                        <Download className="mr-2 h-4 w-4" /> .SRT{" "}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTranscript("json")}
                      >
                        {" "}
                        <Download className="mr-2 h-4 w-4" /> .JSON{" "}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            .VTT
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() => downloadTranscript("vtt-clean")}
                          >
                            Cleaned VTT
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => downloadTranscript("vtt-advanced")}
                          >
                            Advanced VTT
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTranscript("csv")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        .CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTranscript("md")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        .MD
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Download summary as txt
                          const content = transcriptData.summary;
                          const filename = `summary-${Date.now()}.txt`;
                          const blob = new Blob([content], {
                            type: "text/plain",
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = filename;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        .TXT
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex gap-2 ml-2"
                        onClick={async () => {
                          await navigator.clipboard.writeText(
                            transcriptData.summary
                          );
                        }}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </>
                  )}
                  {copyStatus && (
                    <span className="ml-3 text-xs text-muted-foreground animate-fade-in">
                      {copyStatus}
                    </span>
                  )}
                </div>
                <TabsContent
                  value="plain"
                  className="absolute inset-0 flex flex-col min-h-0 pt-[4.5rem]"
                >
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-4">
                    {transcriptData.transcriptBlocks.map((block, idx) => (
                      <div
                        key={idx}
                        className="bg-muted/50 rounded-lg p-4 border border-muted-foreground/10 shadow-sm"
                      >
                        <div className="text-xs text-muted-foreground mb-2 font-mono">
                          {block.start} - {block.end}
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-line">
                          {block.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent
                  value="summary"
                  className="absolute inset-0 flex flex-col min-h-0 pt-[4.5rem]"
                >
                  <div className="flex flex-col flex-1 min-h-0 bg-muted/30 rounded-lg p-2 border border-muted-foreground/10 shadow-sm mt-4">
                    <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2 min-h-0">
                      {chatMessages.length === 0 && transcriptData?.title && (
                        <div className="mb-2 px-4 py-2 rounded-lg bg-white/80 text-primary font-medium text-sm shadow border border-primary/10 w-1/3 mx-auto text-center">
                          <span role="img" aria-label="video">
                            🎬
                          </span>{" "}
                          Ready to dive into <b>{transcriptData.title}</b>? Use{" "}
                          <b>Ask</b> to learn key insights and <b>Create</b> to
                          brainstorm CRAZY Ideas relevant to this video, or you
                          can chat freely to explore anything!
                        </div>
                      )}
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`rounded-lg px-3 py-2 max-w-[80%] text-sm whitespace-pre-line shadow-sm
                              ${
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background border border-muted-foreground/10"
                              }
                            `}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    {/* Input box */}
                    <form
                      onSubmit={handleSendChat}
                      className="flex items-center gap-2 px-2 py-2 bg-background rounded-xl shadow border mt-2"
                    >
                      <input
                        type="text"
                        className="flex-1 px-5 py-2 rounded-full bg-background border-none focus:outline-none text-base placeholder:text-muted-foreground"
                        placeholder="Ask anything about this video..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        autoComplete="off"
                        disabled={false}
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="ml-2 rounded-full bg-primary/10 hover:bg-primary/20 p-3 transition-colors"
                      >
                        <Send className="h-5 w-5 text-primary" />
                      </button>
                    </form>
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <span role="img" aria-label="lightbulb">
                        💡
                      </span>
                      You can reference specific timestamps like this:{" "}
                      <span className="bg-primary/10 text-primary px-1 rounded">
                        @01:23
                      </span>{" "}
                      or{" "}
                      <span className="bg-primary/10 text-primary px-1 rounded">
                        @01:23:45
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        {/* Video/Shorts Table */}
        {videoType === "channel" && channelVideos.length > 0 && (
          <div className="overflow-x-auto mt-6">
            {/* Page size selector */}
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm">Rows per page:</span>
              {[10, 50, 100, "All"].map((size) => (
                <button
                  key={size}
                  className={`px-2 py-1 rounded border text-sm ${pageSize === size || (size === "All" && pageSize === "all") ? "bg-blue-600 text-white" : "bg-white text-blue-600 border-blue-600"}`}
                  onClick={() =>
                    setPageSize(size === "All" ? "all" : Number(size))
                  }
                >
                  {size}
                </button>
              ))}
            </div>
            <table className="min-w-full bg-white border rounded-lg shadow">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedVideos.length === channelVideos.length}
                      onChange={(e) =>
                        setSelectedVideos(
                          e.target.checked ? channelVideos.map((v) => v.id) : []
                        )
                      }
                    />
                  </th>
                  <th className="p-3">Thumbnail</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">YouTube Link</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVideos.map((video) => {
                  const isShort = video.url.includes("/shorts/");
                  return (
                    <tr key={video.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedVideos.includes(video.id)}
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedVideos([...selectedVideos, video.id]);
                            else
                              setSelectedVideos(
                                selectedVideos.filter((id) => id !== video.id)
                              );
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <div className="w-20 aspect-video bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt="thumbnail"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              N/A
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-gray-900">
                        {video.title}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${isShort ? "bg-yellow-300 text-yellow-800" : "bg-red-600 text-white"}`}
                        >
                          {isShort ? "Shorts" : "Videos"}
                        </span>
                      </td>
                      <td className="p-3">
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          YouTube
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Pagination controls */}
            {pageSize !== "all" && (
              <div className="flex items-center justify-between mt-2">
                <button
                  className="px-3 py-1 rounded border text-sm bg-white text-blue-600 border-blue-600 disabled:opacity-50"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="px-3 py-1 rounded border text-sm bg-white text-blue-600 border-blue-600 disabled:opacity-50"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
