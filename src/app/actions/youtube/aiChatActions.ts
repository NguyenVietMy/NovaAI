"use server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface TranscriptData {
  transcriptTimed: unknown; // string | string[] | any
  title: string;
  url: string;
}

export interface AIChatResult {
  success: boolean;
  response?: string;
  error?: string;
}

/** ---------- Helpers: keep them tiny ---------- */
const toPrimitiveString = (v: unknown): string => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint")
    return String(v);
  try {
    const j = JSON.stringify(v);
    return typeof j === "string" ? j : String(v);
  } catch {
    return String(v);
  }
};

const resolveToString = async (maybe: unknown): Promise<string> => {
  const r = await Promise.resolve(maybe as any);
  return String(toPrimitiveString(r));
};

// keep sanitization light so we don't mangle the user's instruction
const sanitize = (s: string): string => {
  let out = s.replace(/<script/gi, "[REDACTED]"); // bare-minimum XSS guard
  if (out.length > 4000) out = out.slice(0, 4000) + "...";
  return out;
};

/** ---------- MAIN: minimal prompt, no forced format ---------- */
export const processAIChat = async (
  userInput: string | Promise<string>,
  transcriptData: TranscriptData
): Promise<AIChatResult> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { success: false, error: "OpenAI API key is not configured" };
    }

    const userMsg = sanitize(await resolveToString(userInput));

    if (!transcriptData || !transcriptData.title || !transcriptData.url) {
      return { success: false, error: "Invalid transcript data" };
    }

    const t = Array.isArray(transcriptData.transcriptTimed)
      ? transcriptData.transcriptTimed.map(toPrimitiveString).join("\n")
      : toPrimitiveString(transcriptData.transcriptTimed);

    const MAX = 60_000;
    const transcript =
      t.length > MAX ? t.slice(0, MAX) + "\n\n[Transcript truncated]" : t;

    if (!transcript.trim()) {
      return { success: false, error: "Transcript is empty." };
    }

    // *** Minimal system prompt: follow the user's instruction; use only the transcript. ***
    const systemPrompt =
      `You are an assistant that has ONLY the transcript below.\n` +
      `Follow the user's instructions EXACTLY (style, format, focus, length, etc.).\n` +
      `Do NOT add extra sections or headings unless the user asks.\n` +
      `Use timestamps from the transcript when they are present and helpful.\n` +
      `If the user asks for something not supported by the transcript, say briefly: ` +
      `"I can't answer that from the transcript." Otherwise, answer directly.\n\n` +
      `VIDEO CONTEXT:\n` +
      `Title: ${transcriptData.title}\n` +
      `URL: ${transcriptData.url}\n\n` +
      `TRANSCRIPT:\n${transcript}`;

    // No “focus modes”, no canned formats—just the user’s prompt.
    // Log the complete prompt being sent to OpenAI
    console.log("=== COMPLETE OPENAI PROMPT ===");
    console.log("SYSTEM PROMPT:");
    console.log(systemPrompt);
    console.log("\nUSER MESSAGE:");
    console.log(`${userMsg}\n\n(Use only the transcript above.)`);
    console.log("=== END PROMPT ===");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        { role: "system", content: [{ type: "text", text: systemPrompt }] },
        // tiny reminder to stay within the transcript, but it won't override the user's format
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${userMsg}\n\n(Use only the transcript above.)`,
            },
          ],
        },
      ],
    });

    const response = completion.choices?.[0]?.message?.content ?? "";
    return { success: true, response: response || "No response generated" };
  } catch (err: any) {
    const msg = String(err?.message ?? err ?? "");
    if (/unauthorized|401/i.test(msg))
      return { success: false, error: "OpenAI API key is invalid or expired" };
    if (/429|rate limit/i.test(msg))
      return {
        success: false,
        error: "OpenAI rate limit exceeded. Please try again later",
      };
    if (/500|server error/i.test(msg))
      return {
        success: false,
        error: "OpenAI service is temporarily unavailable",
      };
    if (/network|fetch/i.test(msg))
      return {
        success: false,
        error: "Network error. Please check your connection",
      };
    return {
      success: false,
      error: "Failed to process AI chat request. Please try again",
    };
  }
};
