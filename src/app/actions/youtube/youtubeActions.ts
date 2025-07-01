"use server";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { tmpdir } from "os";
import OpenAI from "openai";

//YOUTUBE HELPER FUNCTIONS
const fetchYouTubeMetadata = async (videoId: string, apiKey: string) => {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  );

  const data = await res.json();

  if (!data.items?.length) throw new Error("Video not found");

  const video = data.items[0];
  const title = video.snippet.title;
  const durationISO = video.contentDetails.duration;

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
  };
};

// Extract Video ID from various YouTube formats
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

// MAIN YOUTUBE FUNCTION
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

  try {
    const { title, duration } = await fetchYouTubeMetadata(videoId, apiKey);

    const transcript = await downloadAndParseVTT(videoId);
    if (!transcript) {
      return {
        error:
          "No transcript found (video may not have captions or they are inaccessible).",
      };
    }

    const { plain, timed } = transcript;

    const timedBlocks = await groupTimedTranscript(timed, 20);

    return {
      success: true,
      data: {
        url,
        title,
        duration,
        transcriptPlain: plain,
        transcriptTimed: timed,
        transcriptBlocks: timedBlocks,
        summary: await summarizeTranscript(plain),
        processedAt: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    console.error("Transcript error:", err);
    return { error: `Failed to fetch transcript: ${err.message}` };
  }
};
const downloadAndParseVTT = async (
  videoId: string
): Promise<{ plain: string; timed: string } | null> => {
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
        resolve({ plain, timed });
      } catch (err) {
        console.error("Failed to read/parse VTT:", err);
        resolve(null);
      }
    });
  });
};
const parseVtt = (raw: string): { plain: string; timed: string } => {
  const lines = raw.split("\n");

  let currentTimestamp = ""; // remembers the most recent cue header
  let lastPhrase = ""; // original de-dupe sentinel
  const plainParts: string[] = [];
  const timedParts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // ── ignore header clutter ──────────────────────────────────────────────
    if (
      !trimmed ||
      trimmed.toLowerCase().startsWith("webvtt") ||
      trimmed.toLowerCase().startsWith("kind:") ||
      trimmed.toLowerCase().startsWith("language:")
    ) {
      continue;
    }

    // ── cue header?  remember its *start* timestamp ───────────────────────
    const cueMatch = trimmed.match(
      /^(\d{2}:\d{2}:\d{2}\.\d{3})\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}/
    );
    if (cueMatch) {
      currentTimestamp = cueMatch[1]; // e.g. "00:00:01.000"
      continue;
    }

    // ── actual caption text line (same logic you had) ─────────────────────
    let phrase = trimmed
      // strip word-level timestamps <00:00:01.000>
      .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, "")
      // strip <c> … </c>
      .replace(/<c[.\d\w-]*>|<\/c>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!phrase || phrase === lastPhrase) continue; // de-dupe (unchanged)

    // plain version
    plainParts.push(phrase);

    // timed version (only if we already saw a header)
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
    return "Failed to generate summary.";
  }
};

/**
 * Turns
 *   00:00:01.719  night building little projects on
 *   00:00:03.960  weekends maybe even finding leak code
 *   …
 * into blocks like
 *   { start:"00:00:00", end:"00:00:20", text:"night building little projects on weekends …" }
 *
 * @param timed       transcriptTimed (one line per cue, space-separated)
 * @param windowSize  size of each bucket in seconds (default 20)
 */
export type TimedBlock = { start: string; end: string; text: string };
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
