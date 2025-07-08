// --- HISTORY PAGE: Shows user action history for transcripts, outlines, and scripts ---

"use client";
import React, { useState } from "react";
import { useEffect } from "react";
import { createClient } from "../../../supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { Clock, FileText, Play } from "lucide-react";
import DashboardNavbar from "../../components/dashboard-navbar";

// Helper to fetch YouTube video metadata
async function fetchYouTubeMetadata(videoId: string) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) return null;
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
    );
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url,
        duration: item.contentDetails.duration,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function HistoryPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [outlines, setOutlines] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [modalData, setModalData] = useState<any | null>(null);
  const [ytMeta, setYtMeta] = useState<any | null>(null);

  // Fetch user id on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => {
      setUserId(data.user?.id || null);
    });
  }, [supabase]);

  // Fetch history data when userId is available
  useEffect(() => {
    if (!userId) return;
    // Fetch transcripts
    supabase
      .from("youtube_transcript_cache")
      .select("id, created_at, output, url")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setTranscripts(data || []));
    // Fetch outlines
    supabase
      .from("youtube_outline_cache")
      .select("id, created_at, input_params, output, version, is_active")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setOutlines(data || []));
    // Fetch scripts
    supabase
      .from("youtube_script_cache")
      .select("id, created_at, input_params, output, version, is_active")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setScripts(data || []));
  }, [userId, supabase]);

  // When opening transcript modal, fetch YouTube metadata
  useEffect(() => {
    if (modalData && modalData.type === "transcript" && modalData.url) {
      // Extract video ID from URL
      const match = modalData.url.match(/[?&]v=([^&#]+)/);
      const videoId = match ? match[1] : null;
      if (videoId) {
        fetchYouTubeMetadata(videoId).then(setYtMeta);
      } else {
        setYtMeta(null);
      }
    } else {
      setYtMeta(null);
    }
  }, [modalData]);

  // --- RENDER ---
  return (
    <>
      <DashboardNavbar />
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Your Past Activities</h1>
        {/* --- TRANSCRIPTS --- */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Transcripts Generated</h2>
          <ul className="divide-y divide-gray-200">
            {transcripts.map((item) => (
              <li key={item.id} className="mb-4">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <span>
                    <span className="font-mono text-sm">{item.id}</span>
                    <span className="ml-4 text-gray-500 text-xs">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </span>
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() =>
                      setModalData({ ...item, type: "transcript" })
                    }
                  >
                    View Details
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        {/* --- OUTLINES --- */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Outlines Generated</h2>
          <ul className="divide-y divide-gray-200">
            {outlines.map((item) => (
              <li key={item.id} className="mb-4">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <span>
                    <span className="font-mono text-sm">{item.id}</span>
                    <span className="ml-4 text-gray-500 text-xs">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </span>
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => setModalData({ ...item, type: "outline" })}
                  >
                    View Details
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        {/* --- SCRIPTS --- */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            Video Scripts Generated
          </h2>
          <ul className="divide-y divide-gray-200">
            {scripts.map((item) => (
              <li key={item.id} className="mb-4">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <span>
                    <span className="font-mono text-sm">{item.id}</span>
                    <span className="ml-4 text-gray-500 text-xs">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </span>
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => setModalData({ ...item, type: "script" })}
                  >
                    View Details
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* --- DETAILS MODAL --- */}
        {modalData && modalData.type === "transcript" && (
          <Dialog
            open={!!modalData}
            onOpenChange={() => {
              setModalData(null);
              setYtMeta(null);
            }}
          >
            <DialogContent className="max-w-2xl w-full p-0 overflow-hidden">
              <div className="bg-white dark:bg-gray-900 p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" /> Transcript
                    Details
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    ID: {modalData.id}
                  </DialogDescription>
                  <DialogDescription className="text-xs text-gray-500 mb-2">
                    Created: {new Date(modalData.created_at).toLocaleString()}
                  </DialogDescription>
                </DialogHeader>
                {/* Video Section */}
                <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
                  {modalData.output?.data?.thumbnailUrl && (
                    <img
                      src={modalData.output.data.thumbnailUrl}
                      alt="YouTube thumbnail"
                      className="rounded-lg shadow w-full sm:w-64 object-cover mt-3"
                      style={{ aspectRatio: "16/9", background: "#eee" }}
                    />
                  )}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="mb-1">
                      <span className="font-bold text-lg">
                        {modalData.output?.data?.title || "Video Title"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span>
                        {modalData.output?.data?.duration || "--:--:--"}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Tabs for transcript formats */}
                <Tabs defaultValue="blocks" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="blocks">Transcript Blocks</TabsTrigger>
                    <TabsTrigger value="plain">Transcript Plain</TabsTrigger>
                  </TabsList>
                  <TabsContent value="blocks">
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {modalData.output?.data?.transcriptBlocks?.map(
                        (block: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
                          >
                            <div className="text-xs text-gray-500 mb-2 font-mono">
                              {block.start} - {block.end}
                            </div>
                            <div className="text-sm leading-relaxed whitespace-pre-line">
                              {block.text}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="plain">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-h-80 overflow-y-auto font-mono text-sm whitespace-pre-line">
                      {modalData.output?.data?.transcriptPlain ||
                        "No transcript available."}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}
