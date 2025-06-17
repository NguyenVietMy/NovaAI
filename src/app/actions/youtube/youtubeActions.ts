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

    return {
      success: true,
      data: {
        url,
        title,
        duration,
        transcript,
        summary: await summarizeTranscript(transcript),
        processedAt: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    console.error("Transcript error:", err);
    return { error: `Failed to fetch transcript: ${err.message}` };
  }
};
const downloadAndParseVTT = async (videoId: string): Promise<string | null> => {
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

        //remove the redundant metadata: "kind: captions language: en" at the beginning
        const cleanedRaw = raw
          .split("\n")
          .filter((line) => {
            const trimmed = line.trim().toLowerCase();
            return !(
              trimmed.startsWith("kind: captions") ||
              trimmed.startsWith("language: en")
            );
          })
          .join("\n");

        const lines = cleanedRaw
          .split("\n")
          .filter(
            (line) =>
              line && !line.startsWith("WEBVTT") && !line.includes("-->")
          );

        // Clean & de-duplicate
        const cleanedWords: string[] = [];
        let lastPhrase = "";

        for (let line of lines) {
          // Remove <c> and inline timestamps like <00:00:01.000>
          line = line
            .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, "")
            .replace(/<c[.\d\w-]*>|<\/c>/g, "")
            .trim();

          if (line && line !== lastPhrase) {
            cleanedWords.push(line);
            lastPhrase = line;
          }
        }

        await fs.unlink(tempPath); // cleanup
        resolve(cleanedWords.join(" "));
      } catch (err) {
        console.error("Failed to read/parse VTT:", err);
        resolve(null);
      }
    });
  });
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
