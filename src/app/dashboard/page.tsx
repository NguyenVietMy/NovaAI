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
import {
  processYouTubeTranscript,
  getUserSubscriptionDetails,
} from "../actions";
import { createClient } from "../../../supabase/client";
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
} from "lucide-react";

interface TranscriptData {
  url: string;
  title: string;
  duration: string;
  transcript: string;
  summary: string;
  processedAt: string;
}

interface SubscriptionData {
  id: string;
  user_id: string;
  status: string;
  plan_name: string;
  current_period_end: string;
  created_at: string;
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

    try {
      const formData = new FormData();
      formData.append("url", url);

      const result = await processYouTubeTranscript(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success && result.data) {
        setTranscriptData(result.data);
        setSuccess("Transcript generated successfully!");
      }
    } catch (err) {
      setError("Failed to process video. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTranscript = (format: "txt" | "srt" | "json") => {
    if (!transcriptData) return;

    let content = "";
    let filename = "";
    let mimeType = "";

    switch (format) {
      case "txt":
        content = transcriptData.transcript;
        filename = `transcript-${Date.now()}.txt`;
        mimeType = "text/plain";
        break;
      case "srt":
        // Mock SRT format
        content = `1\n00:00:00,000 --> 00:00:10,000\n${transcriptData.transcript.substring(0, 100)}...\n\n2\n00:00:10,000 --> 00:00:20,000\n${transcriptData.transcript.substring(100, 200)}...`;
        filename = `transcript-${Date.now()}.srt`;
        mimeType = "text/plain";
        break;
      case "json":
        content = JSON.stringify(transcriptData, null, 2);
        filename = `transcript-${Date.now()}.json`;
        mimeType = "application/json";
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* YouTube URL Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Transcript
              </CardTitle>
              <CardDescription>
                Enter a YouTube URL to generate transcript and AI summary
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      Generate Transcript
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  AI Summary
                </CardTitle>
                <CardDescription>
                  Generated summary of the video content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transcript & Downloads
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTranscript("txt")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    TXT
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTranscript("srt")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    SRT
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTranscript("json")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    JSON
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="transcript" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="transcript">Full Transcript</TabsTrigger>
                  <TabsTrigger value="summary">AI Summary</TabsTrigger>
                </TabsList>
                <TabsContent value="transcript" className="mt-4">
                  <div className="bg-muted/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <Textarea
                      value={transcriptData.transcript}
                      readOnly
                      className="min-h-[300px] resize-none border-0 bg-transparent focus-visible:ring-0"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="summary" className="mt-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {transcriptData.summary}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
