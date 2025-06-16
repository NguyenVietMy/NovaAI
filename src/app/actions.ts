"use server";
import { promisify } from "util";
import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import xml2js from "xml2js";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { tmpdir } from "os";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required"
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        email: email,
      },
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-up", error.message);
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link."
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {});

  if (error) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed"
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const checkUserSubscription = async (userId: string) => {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error) {
    return false;
  }

  return !!subscription;
};

export const getUserSubscriptionDetails = async (userId: string) => {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    return null;
  }

  return subscription;
};

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
        summary: `Transcript retrieved via yt-dlp.`,
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
