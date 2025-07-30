"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import SubscriptionCard from "@/components/dashboard/SubscriptionCard";
import VideoTypeToggle from "@/components/dashboard/VideoTypeToggle";
import UrlInputForm from "@/components/dashboard/UrlInputForm";
import AiSummaryPanel from "@/components/dashboard/AiSummaryPanel";
import TranscriptResults from "@/components/dashboard/TranscriptResults";
import ChannelVideosTable from "@/components/dashboard/ChannelVideosTable";
import YouTubeVideoPlayer from "@/components/dashboard/YouTubeVideoPlayer";
import { getUserSubscriptionDetails } from "../actions/auth_actions/authActions";
import {
  processYouTubeTranscript,
  fetchChannelVideos,
} from "../actions/youtube/youtubeTranscriptActions";
import {
  processAIChatWithStorage,
  getChatSession,
  clearChatHistory,
} from "../actions/youtube/aiChatActions";
import { createClient } from "../../../supabase/client";
import type { TimedBlock } from "../../types/supabase";
import { Loader2 } from "lucide-react";
import type { ChannelVideo } from "@/types/supabase";
import {
  normalizeChannelUrl,
  isYouTubeVideoUrl,
  extractVideoId,
  downloadTranscript as downloadTranscriptUtil,
  copyTranscript as copyTranscriptUtil,
} from "@/components/dashboard/utils";

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
  const [showAskPopup, setShowAskPopup] = useState(false);

  // Scroll to bottom when new message
  useEffect(() => {
    if (chatMessages.length > 0) {
      // Simple scroll to bottom without ref
      window.scrollTo(0, document.body.scrollHeight);
    }
  }, [chatMessages]);

  // Close ask popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        showAskPopup &&
        !target.closest(".ask-popup") &&
        !target.closest(".ask-button")
      ) {
        setShowAskPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAskPopup]);

  // AI chat handler with transcript integration
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const input = chatInput.trim();
    if (!input || !transcriptData) return;

    // Add user message to chat
    setChatMessages((msgs) => [...msgs, { role: "user", content: input }]);
    setChatInput("");

    // Show loading state
    setChatMessages((msgs) => [
      ...msgs,
      { role: "ai", content: "Thinking..." },
    ]);

    try {
      console.log("Calling AI chat with:", { input, transcriptData });

      // Call AI chat action with storage
      const result = await processAIChatWithStorage(
        input,
        transcriptData,
        user.id
      );

      console.log("AI chat result:", result);

      if (!result.success) {
        throw new Error(result.error || "Failed to get AI response");
      }

      // Remove loading message and add AI response
      setChatMessages((msgs) => {
        const filtered = msgs.filter((msg) => msg.content !== "Thinking...");
        return [
          ...filtered,
          { role: "ai", content: result.response || "No response generated" },
        ];
      });
    } catch (error) {
      console.error("AI chat error:", error);
      // Remove loading message and add error
      setChatMessages((msgs) => {
        const filtered = msgs.filter((msg) => msg.content !== "Thinking...");
        return [
          ...filtered,
          {
            role: "ai",
            content:
              error instanceof Error
                ? error.message
                : "Sorry, I encountered an error. Please try again.",
          },
        ];
      });
    }
  };

  // Handle ask option selection
  const handleAskOption = (option: string) => {
    let message = "";
    switch (option) {
      case "summarize":
        message = "Summarize the main points of this video";
        break;
      case "takeaways":
        message = "What are the main key takeaways of this video";
        break;
      case "quotes":
        message = "What are the important quotes mentioned in the video";
        break;
      default:
        message = option;
    }
    setChatInput(message);
    setShowAskPopup(false);
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

  // Handle videoId query parameter for pre-loading transcript
  useEffect(() => {
    const handleVideoIdFromQuery = async () => {
      // Get videoId from URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const videoIdFromQuery = urlParams.get("videoId");

      if (videoIdFromQuery && !transcriptData && !isLoading) {
        setIsLoading(true);
        setError("");

        try {
          // Fetch transcript from cache using videoId
          const supabase = createClient();
          const { data: transcriptCache, error } = await supabase
            .from("youtube_transcript_cache")
            .select("*")
            .eq("video_id", videoIdFromQuery)
            .single();

          if (error || !transcriptCache) {
            setError("Transcript not found in cache.");
            setIsLoading(false);
            return;
          }

          // Convert cache data to TranscriptData format
          const transcriptDataFromCache: TranscriptData = {
            url: transcriptCache.url,
            title: transcriptCache.output?.data?.title || "Video Title",
            duration: transcriptCache.output?.data?.duration || "--:--:--",
            transcriptPlain:
              transcriptCache.output?.data?.transcriptPlain || "",
            transcriptTimed:
              transcriptCache.output?.data?.transcriptTimed || "",
            transcriptVtt: transcriptCache.output?.data?.transcriptVtt || "",
            transcriptBlocks:
              transcriptCache.output?.data?.transcriptBlocks || [],
            summary: transcriptCache.output?.data?.summary || "",
            processedAt: transcriptCache.created_at,
            thumbnailUrl: transcriptCache.output?.data?.thumbnailUrl,
          };

          setTranscriptData(transcriptDataFromCache);
          setUrl(transcriptCache.url); // Pre-fill the input
          setSuccess("Transcript loaded from history!");

          // Check if chat session exists for this video
          const chatSessionData = await getChatSession(
            videoIdFromQuery,
            user.id
          );

          if (chatSessionData) {
            // Load existing chat messages
            const formattedMessages = chatSessionData.messages.map((msg) => ({
              role: msg.role as "user" | "ai",
              content: msg.content,
            }));
            setChatMessages(formattedMessages);
          }
        } catch (err) {
          console.error("Error loading transcript from cache:", err);
          setError("Failed to load transcript from cache.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    // Only run if we have a user and no transcript data
    if (user && !transcriptData) {
      handleVideoIdFromQuery();
    }
  }, [user, transcriptData, isLoading]);

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

          // Load chat history for the new transcript
          const videoId = extractVideoId(result.data.url);
          if (videoId && user) {
            try {
              const chatSessionData = await getChatSession(videoId, user.id);
              if (chatSessionData) {
                // Load existing chat messages
                const formattedMessages = chatSessionData.messages.map(
                  (msg) => ({
                    role: msg.role as "user" | "ai",
                    content: msg.content,
                  })
                );
                setChatMessages(formattedMessages);
              } else {
                // Clear chat messages for new transcript
                setChatMessages([]);
              }
            } catch (error) {
              console.error("Error loading chat history:", error);
              setChatMessages([]);
            }
          }
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

  // Periodically check if chunks are ready for semantic search
  useEffect(() => {
    if (!transcriptData || !user) return;

    const videoId = extractVideoId(transcriptData.url);
    if (!videoId) return;

    // Check immediately
    const checkChunks = async () => {
      try {
        const { checkChunksReady } = await import(
          "../actions/youtube/aiChatActions"
        );
        const result = await checkChunksReady(videoId);
        // Don't update UI, just log for debugging
        console.log("Chunks status:", result);
      } catch (error) {
        console.error("Error checking chunks:", error);
      }
    };

    checkChunks();

    // Check every 10 seconds if chunks are still processing
    const interval = setInterval(() => {
      checkChunks();
    }, 10000);

    return () => clearInterval(interval);
  }, [transcriptData, user]);

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
    downloadTranscriptUtil(transcriptData, format, txtVariant);
  };

  const handleCopy = async (type: "withTimestamp" | "plain") => {
    if (!transcriptData) return;
    const status = await copyTranscriptUtil(transcriptData, type);
    setCopyStatus(status);
    setTimeout(() => setCopyStatus(""), 1500);
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
        <WelcomeSection
          userName={userName}
          subscriptionStatus={subscriptionStatus}
          planName={planName}
        />

        {/* Subscription Status Card */}
        <SubscriptionCard subscription={subscription} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Video Type Toggle */}
          <VideoTypeToggle
            videoType={videoType}
            onVideoTypeChange={setVideoType}
          />

          {/* YouTube URL Input Form */}
          <UrlInputForm
            videoType={videoType}
            url={url}
            isLoading={isLoading}
            error={error}
            success={success}
            fetchShorts={fetchShorts}
            onUrlChange={setUrl}
            onSubmit={handleSubmit}
            onFetchShortsChange={setFetchShorts}
          />

          {/* AI Summary Panel */}
          {transcriptData && <AiSummaryPanel transcriptData={transcriptData} />}
        </div>

        {/* YouTube Video Player */}
        {transcriptData && (
          <YouTubeVideoPlayer
            videoUrl={transcriptData.url}
            thumbnailUrl={transcriptData.thumbnailUrl}
            className="max-w-4xl mx-auto"
            transcriptData={{
              transcriptTimed: transcriptData.transcriptTimed,
              transcriptBlocks: transcriptData.transcriptBlocks,
              title: transcriptData.title,
              url: transcriptData.url,
            }}
            showTranscript={false}
          />
        )}

        {/* Transcript Results */}
        {transcriptData && (
          <TranscriptResults
            transcriptData={transcriptData}
            chatMessages={chatMessages}
            chatInput={chatInput}
            showAskPopup={showAskPopup}
            copyStatus={copyStatus}
            activeTab={activeTab}
            onChatInputChange={setChatInput}
            onSendChat={handleSendChat}
            onAskOption={handleAskOption}
            onShowAskPopupChange={setShowAskPopup}
            onActiveTabChange={setActiveTab}
            onCopy={handleCopy}
            onDownloadTranscript={downloadTranscript}
            onClearChat={async () => {
              setChatMessages([]);
              // Also clear from database
              if (transcriptData && user) {
                const videoId = extractVideoId(transcriptData.url);
                if (videoId) {
                  try {
                    const result = await clearChatHistory(videoId, user.id);
                    if (!result.success) {
                      console.error(
                        "Failed to clear chat history:",
                        result.error
                      );
                      setError("Failed to clear chat history from database");
                    }
                  } catch (error) {
                    console.error("Error clearing chat history:", error);
                    setError("Failed to clear chat history");
                  }
                }
              }
            }}
          />
        )}

        {/* Channel Videos Table */}
        {videoType === "channel" && channelVideos.length > 0 && (
          <ChannelVideosTable
            channelVideos={channelVideos}
            selectedVideos={selectedVideos}
            pageSize={pageSize}
            currentPage={currentPage}
            onSelectedVideosChange={setSelectedVideos}
            onPageSizeChange={setPageSize}
            onCurrentPageChange={setCurrentPage}
          />
        )}
      </main>
    </div>
  );
}
