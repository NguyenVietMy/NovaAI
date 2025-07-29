"use server";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { tmpdir } from "os";
import OpenAI from "openai";
import { supabase } from "../../../../supabase/supabase";
import { createClient as createServerClient } from "../../../../supabase/server";
import {
  ChannelVideo,
  FetchChannelVideosResult,
  YtDlpChannelDump,
  TimedBlock,
} from "../../../types/supabase";

// --- YOUTUBE API HELPER FUNCTIONS ---

/**
 * Fetches metadata (title, thumbnail, and duration) from YouTube for a given video ID.
 * Uses the YouTube Data API v3 to get video information.
 */
const fetchYouTubeMetadata = async (videoId: string, apiKey: string) => {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  );

  const data = await res.json();

  if (!data.items?.length) throw new Error("Video not found");

  const video = data.items[0];
  const title = video.snippet.title;
  const durationISO = video.contentDetails.duration;
  const thumbnails = video.snippet.thumbnails;

  const parseDuration = (iso: string): string => {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "00:00:00";
    const [, h = "0", m = "0", s = "0"] = match;
    return [h.padStart(2, "0"), m.padStart(2, "0"), s.padStart(2, "0")].join(
      ":"
    );
  };

  return {
    title,
    duration: parseDuration(durationISO),
    thumbnailUrl:
      thumbnails.maxres?.url ||
      thumbnails.standard?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      "",
  };
};

/**
 * Extracts the YouTube video ID from various possible URL formats.
 * Supports youtu.be, youtube.com/watch?v=, and youtube.com/shorts/ formats.
 */
const extractVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1);
    if (parsed.searchParams.has("v")) return parsed.searchParams.get("v");
    if (parsed.pathname.startsWith("/shorts/"))
      return parsed.pathname.split("/")[2];
    return null;
  } catch {
    return null;
  }
};

// --- VTT DOWNLOAD AND PARSING FUNCTIONS ---

/**
 * Downloads the auto-generated VTT subtitles from YouTube for the given video,
 * reads the file, parses it into plain text and timed transcript,
 * then cleans up the temporary file.
 */
const downloadVttAndExtractText = async (
  videoId: string
): Promise<{ plain: string; timed: string; vtt: string } | null> => {
  const outputName = `${videoId}.en.vtt`;
  const tempPath = path.join(tmpdir(), outputName);

  return new Promise((resolve, reject) => {
    const yt = spawn("./yt-dlp.exe", [
      "--write-auto-sub",
      "--skip-download",
      "--sub-format",
      "best",
      "-o",
      path.join(tmpdir(), "%(id)s.%(ext)s"),
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);

    yt.stderr.on("data", (data) => {
      console.error("yt-dlp error:", data.toString());
    });

    yt.on("close", async (code) => {
      if (code !== 0) return resolve(null);

      try {
        const raw = await fs.readFile(tempPath, "utf-8");
        const { plain, timed } = parseVtt(raw);

        await fs.unlink(tempPath); // cleanup
        resolve({ plain, timed, vtt: raw });
      } catch (err) {
        console.error("Failed to read/parse VTT:", err);
        resolve(null);
      }
    });
  });
};

/**
 * Parses a raw VTT file string into two versions:
 * - a plain text string (deduplicated phrases)
 * - a timed transcript (timestamp + phrase on each line)
 *
 * Handles ignoring header lines, extracting cue timestamps,
 * and cleaning up tags or redundant lines.
 */
const parseVtt = (raw: string): { plain: string; timed: string } => {
  const lines = raw.split("\n");

  let currentTimestamp = ""; // remembers the most recent cue header
  let lastPhrase = ""; // original de-dupe sentinel
  const plainParts: string[] = [];
  const timedParts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Ignore non-caption lines like "WEBVTT", "Kind:", or "Language:"
    if (
      !trimmed ||
      trimmed.toLowerCase().startsWith("webvtt") ||
      trimmed.toLowerCase().startsWith("kind:") ||
      trimmed.toLowerCase().startsWith("language:")
    ) {
      continue;
    }

    // Check for cue header lines (timestamps), e.g. "00:00:01.000 --> 00:00:04.000"
    const cueMatch = trimmed.match(
      /^(\d{2}:\d{2}:\d{2}\.\d{3})\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}/
    );
    if (cueMatch) {
      currentTimestamp = cueMatch[1]; // e.g. "00:00:01.000"
      continue;
    }

    // Remove inline timestamps <00:00:01.000> and <c> tags from caption text
    let phrase = trimmed
      // strip word-level timestamps <00:00:01.000>
      .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, "")
      // strip <c> … </c>
      .replace(/<c[.\d\w-]*>|<\/c>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!phrase || phrase === lastPhrase) continue; // Skip duplicate lines (avoid repeating same phrase if unchanged)

    // Build plain transcript by joining cleaned lines
    plainParts.push(phrase);

    // Build timed transcript lines that include the start timestamp
    if (currentTimestamp) {
      timedParts.push(`${currentTimestamp}  ${phrase}`);
    }

    lastPhrase = phrase;
  }

  return {
    plain: plainParts.join(" "),
    timed: timedParts.join("\n"),
  };
};

// --- TRANSCRIPT PROCESSING FUNCTIONS ---

/**
 * Turns timed transcript lines into blocks with start/end times and text.
 * Groups transcript lines into time windows for better organization.
 *
 * Example input:
 *   00:00:01.719  night building little projects on
 *   00:00:03.960  weekends maybe even finding leak code
 *
 * Example output:
 *   { start:"00:00:00", end:"00:00:20", text:"night building little projects on weekends …" }
 *
 * @param timed       transcriptTimed (one line per cue, space-separated)
 * @param windowSize  size of each bucket in seconds (default 20)
 */
export async function groupTimedTranscript(
  timed: string,
  windowSize = 20
): Promise<TimedBlock[]> {
  const toSeconds = (h: string, m: string, s: string, ms: string) =>
    +h * 3600 + +m * 60 + +s + +ms / 1000;

  const pad = (n: number, len = 2) => n.toString().padStart(len, "0");
  const fmt = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const buckets: Record<number, string[]> = {};
  let maxSec = 0; // ← track the last timestamp we see

  timed.split("\n").forEach((line) => {
    const match = line.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s+(.*)$/);
    if (!match) return;

    const [, hh, mm, ss, mmm, phrase] = match;
    const t = toSeconds(hh, mm, ss, mmm);

    maxSec = Math.max(maxSec, t);

    const idx = Math.floor(t / windowSize);
    (buckets[idx] ??= []).push(phrase.trim());
  });

  return Object.keys(buckets)
    .map(Number)
    .sort((a, b) => a - b)
    .map((idx) => {
      const startSec = idx * windowSize;
      const endSec = Math.min(startSec + windowSize, maxSec);
      return {
        start: fmt(startSec),
        end: fmt(endSec),
        text: buckets[idx].join(" "),
      };
    });
}

// --- AI SUMMARY FUNCTIONS ---

/**
 * Summarizes the plain transcript using the OpenAI chat model,
 * producing a concise multi-sentence summary.
 */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const summarizeTranscript = async (text: string): Promise<string> => {
  const maxLength = 8000;
  const input = text.length > maxLength ? text.slice(0, maxLength) : text;

  try {
    const prompt = `Summarize the following YouTube transcript in 4-6 sentences:\n\n${input}`;
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You summarize YouTube transcripts clearly and concisely.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return (
      chatResponse.choices[0].message.content?.trim() || "No summary available."
    );
  } catch (err) {
    console.error("AI summary error:", JSON.stringify(err, null, 2));
    return "Server error, failed to initialize AI chat";
  }
};

// --- BACKGROUND PROCESSING FUNCTIONS ---

/**
 * Store transcript chunks in background without blocking the main transcript fetch.
 * This allows transcript fetching to be fast while chunks are processed in background.
 */
const storeTranscriptChunksInBackground = async (
  videoId: string,
  timedBlocks: TimedBlock[],
  userId: string
): Promise<void> => {
  try {
    console.log(`Starting background chunk storage for video ${videoId}`);
    const { storeTranscriptChunks } = await import("./aiChatActions");
    await storeTranscriptChunks(videoId, timedBlocks, userId);
    console.log(`Background chunk storage completed for video ${videoId}`);
  } catch (error) {
    console.error(
      `Background chunk storage failed for video ${videoId}:`,
      error
    );
    throw error; // Re-throw to be caught by the caller
  }
};

// --- MAIN ENTRYPOINT FUNCTION ---

/**
 * Processes a YouTube URL submitted via form data:
 * - extracts video ID,
 * - checks for cached transcript in Supabase,
 * - downloads metadata and captions if needed,
 * - parses and summarizes,
 * - stores the processed result back to Supabase.
 */
export const processYouTubeTranscript = async (formData: FormData) => {
  const url = formData.get("url")?.toString();
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!url) {
    return { error: "YouTube URL is required" };
  }

  if (!apiKey) {
    return { error: "Missing YouTube API key" };
  }

  const videoId = extractVideoId(url);
  if (!videoId) return { error: "Invalid YouTube URL." };

  // --- CACHE LOGIC ---
  // Try to retrieve an existing processed response from Supabase for this video ID
  const { data: cached, error: cacheError } = await supabase
    .from("youtube_transcript_cache")
    .select("output")
    .eq("video_id", videoId)
    .single();
  if (cached && cached.output) {
    // If found, return cached response immediately
    return cached.output;
  }

  try {
    const { title, duration, thumbnailUrl } = await fetchYouTubeMetadata(
      videoId,
      apiKey
    );

    const transcript = await downloadVttAndExtractText(videoId);
    if (!transcript) {
      return {
        error:
          "No transcript found (video may not have captions or they are inaccessible).",
      };
    }

    const { plain, timed, vtt } = transcript;

    const timedBlocks = await groupTimedTranscript(timed, 20);

    const output = {
      success: true,
      data: {
        url,
        title,
        duration,
        thumbnailUrl,
        transcriptPlain: plain,
        transcriptTimed: timed,
        transcriptVtt: vtt,
        transcriptBlocks: timedBlocks,
        summary: await summarizeTranscript(plain),
        processedAt: new Date().toISOString(),
      },
    };

    // --- CACHE STORE ---
    // Store the response in Supabase for future requests (if not already cached)
    // Now includes user_id for per-user history
    const serverSupabase = await createServerClient();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();
    const user_id = user?.id;
    await supabase.from("youtube_transcript_cache").insert([
      {
        video_id: videoId,
        url,
        output,
        user_id, // Store the user_id for history
      },
    ]);

    // --- STORE TRANSCRIPT CHUNKS FOR SEMANTIC SEARCH (BACKGROUND TASK) ---
    if (user_id && timedBlocks.length > 0) {
      // Fire and forget - don't wait for chunk storage to complete
      // This allows transcript fetching to be fast while chunks are processed in background
      storeTranscriptChunksInBackground(videoId, timedBlocks, user_id).catch(
        (error) => {
          console.error("Background chunk storage failed:", error);
          // Don't fail the transcript processing if background chunk storage fails
        }
      );
    }

    return output;
  } catch (err: any) {
    console.error("Transcript error:", err);
    return { error: `Failed to fetch transcript: ${err.message}` };
  }
};

// --- CHANNEL VIDEO FETCHING FUNCTIONS ---

const YTDLP_PATH = "./yt-dlp.exe";

/**
 * Fetch every video in a YouTube channel (or any playlist-like URL) as JSON.
 *
 * @param channelUrl e.g. "https://www.youtube.com/@veritasium/videos"
 * @param flat       keep it flat (faster, fewer fields). If false, yt-dlp will resolve each entry fully.
 * @returns FetchChannelVideosResult
 */
export async function fetchChannelVideos(
  channelUrl: string,
  flat: boolean = true,
  fetchShorts: boolean = false
): Promise<FetchChannelVideosResult> {
  if (!channelUrl) {
    return { success: false, error: "channelUrl is required" };
  }

  // Helper to fetch a single tab
  async function fetchTab(tabUrl: string) {
    return new Promise<FetchChannelVideosResult>((resolve) => {
      const args = [
        flat ? "--flat-playlist" : "",
        "-J", // dump single json
        tabUrl,
      ].filter(Boolean);

      const proc = spawn(YTDLP_PATH, args);

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (d) => (stdout += d.toString()));
      proc.stderr.on("data", (d) => (stderr += d.toString()));

      proc.on("close", (code) => {
        if (code !== 0) {
          console.log("fetchChannelVideos error:", { code, stderr });
          return resolve({
            success: false,
            error: `yt-dlp exited with code ${code}. ${stderr || ""}`,
          });
        }
        try {
          const raw: YtDlpChannelDump = JSON.parse(stdout);

          const videos: ChannelVideo[] = (raw.entries || []).map((e) => {
            let thumbnailUrl = "";
            if (
              e.thumbnails &&
              Array.isArray(e.thumbnails) &&
              e.thumbnails.length > 0
            ) {
              thumbnailUrl =
                e.thumbnails[e.thumbnails.length - 1].url ||
                e.thumbnails[0].url;
            } else if (e.thumbnail) {
              thumbnailUrl = e.thumbnail;
            }
            return {
              id: e.id,
              title: e.title || "",
              url: e.url || `https://www.youtube.com/watch?v=${e.id}`,
              thumbnailUrl,
            };
          });

          console.log("fetchChannelVideos result:", {
            raw,
            videos,
            count: videos.length,
          });

          resolve({
            success: true,
            raw,
            videos,
            count: videos.length,
          });
        } catch (e: any) {
          console.log("fetchChannelVideos parse error:", e);
          resolve({
            success: false,
            error: `Failed to parse yt-dlp JSON: ${e?.message || e}`,
          });
        }
      });
    });
  }

  // Check if this is a playlist URL
  const isPlaylist = channelUrl.includes("/playlist?list=");

  if (isPlaylist) {
    // For playlists, use the URL as-is
    const playlistResult = await fetchTab(channelUrl);
    return playlistResult;
  }

  // For channels, always fetch /videos
  const videosUrl =
    channelUrl.replace(/\/shorts$|\/featured$|\/videos$|\/home$/i, "") +
    "/videos";
  const videosResult = await fetchTab(videosUrl);

  if (!fetchShorts) return videosResult;

  // If fetchShorts is true, also fetch /shorts and merge
  const shortsUrl =
    channelUrl.replace(/\/shorts$|\/featured$|\/videos$|\/home$/i, "") +
    "/shorts";
  const shortsResult = await fetchTab(shortsUrl);

  if (!videosResult.success && !shortsResult.success) {
    return {
      success: false,
      error: [videosResult.error, shortsResult.error]
        .filter(Boolean)
        .join("; "),
    };
  }
  // At least one is successful, so raw will always be defined
  let raw;
  if (videosResult.success) raw = videosResult.raw;
  else if (shortsResult.success) raw = shortsResult.raw;
  else raw = undefined; // Should never happen due to guard above

  const allVideos = [
    ...(videosResult.success ? videosResult.videos : []),
    ...(shortsResult.success ? shortsResult.videos : []),
  ];
  return {
    success: true,
    raw: raw as YtDlpChannelDump,
    videos: allVideos,
    count: allVideos.length,
  };
}
