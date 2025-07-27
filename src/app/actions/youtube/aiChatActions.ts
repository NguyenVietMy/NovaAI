"use server";
import OpenAI from "openai";
import { createClient as createServerClient } from "../../../../supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface TranscriptData {
  transcriptTimed: unknown; // string | string[] | any
  transcriptBlocks?: Array<{ start: string; end: string; text: string }>;
  title: string;
  url: string;
}

export interface AIChatResult {
  success: boolean;
  response?: string;
  error?: string;
}

export interface ChatSessionData {
  user_id: string;
  video_id: string;
  video_title: string;
  video_url: string;
  transcript_data: any;
  model_used?: string;
}

// New interface for conversation messages
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

// Extract video ID from YouTube URL
const extractVideoId = (url: string): string | null => {
  const match = url.match(/[?&]v=([^&#]+)/);
  return match ? match[1] : null;
};

/** ---------- MAIN: minimal prompt, no forced format ---------- */
export const processAIChat = async (
  userInput: string | Promise<string>,
  transcriptData: TranscriptData,
  conversationHistory: ChatMessage[] = []
): Promise<AIChatResult> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { success: false, error: "OpenAI API key is not configured" };
    }

    const userMsg = sanitize(await resolveToString(userInput));

    if (!transcriptData || !transcriptData.title || !transcriptData.url) {
      return { success: false, error: "Invalid transcript data" };
    }

    // Use transcriptBlocks format with timestamps for better context
    const blocks = transcriptData.transcriptBlocks || [];
    let t: string;

    if (blocks.length > 0) {
      // Use transcriptBlocks format with timestamps
      t = blocks
        .map(
          (block: { start: string; end: string; text: string }) =>
            `${block.start} - ${block.end} : ${block.text}`
        )
        .join("\n");
    } else {
      // Fallback to transcriptTimed for older cached data
      t = Array.isArray(transcriptData.transcriptTimed)
        ? transcriptData.transcriptTimed.map(toPrimitiveString).join("\n")
        : toPrimitiveString(transcriptData.transcriptTimed);
    }

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
      `The transcript format is: "start - end : content" (e.g., "01:20 - 01:40 : aaaaaaaa").\n` +
      `DO NOT MISUNDERSTAND THIS FORMAT. UNDERSTAND IT AS IS.\n` +
      `IMPORTANT: When users reference timestamps (e.g., "01:35", "@01:35", "at 1:35"), find the block that CONTAINS that timestamp.\n` +
      `For example, if user says "01:35", look for the block where 01:35 falls between the start and end times.\n` +
      `If user says "01:35", find the block like [01:20-01:40] that contains 01:35, NOT [01:40-02:00] or whatever.\n` +
      `Use timestamps when they are helpful for the user's question.\n` +
      `If the user asks for something not supported by the transcript, say briefly: ` +
      `"I can't answer that from the transcript." Otherwise, answer directly.\n\n` +
      `VIDEO CONTEXT:\n` +
      `Title: ${transcriptData.title}\n` +
      `URL: ${transcriptData.url}\n\n` +
      `TRANSCRIPT:\n${transcript}`;

    // Build messages array with conversation history
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMsg },
    ];

    // Log the complete prompt being sent to OpenAI
    console.log("=== COMPLETE OPENAI PROMPT ===");
    console.log("CONVERSATION HISTORY LENGTH:", conversationHistory.length);
    console.log(
      "TRANSCRIPT FORMAT:",
      blocks.length > 0
        ? "transcriptBlocks (with timestamps)"
        : "transcriptTimed (fallback)"
    );
    console.log("TRANSCRIPT LENGTH:", t.length, "characters");
    console.log("MESSAGES:", JSON.stringify(messages, null, 2));
    console.log("=== END PROMPT ===");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 1200,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: [{ type: "text", text: msg.content }],
      })),
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

/**
 * Process AI chat with session storage and conversation history
 * This function handles both AI processing and database storage with memory
 */
export const processAIChatWithStorage = async (
  userInput: string | Promise<string>,
  transcriptData: TranscriptData,
  userId: string
): Promise<AIChatResult> => {
  try {
    // Extract video ID from transcript URL
    const videoId = extractVideoId(transcriptData.url);
    if (!videoId) {
      console.error("Could not extract video ID from URL:", transcriptData.url);
      // Fall back to stateless chat if we can't get video ID
      return await processAIChat(userInput, transcriptData);
    }

    // Get server-side Supabase client
    const supabase = await createServerClient();

    // Load existing conversation history
    let conversationHistory: ChatMessage[] = [];
    let sessionId: string | null = null;

    try {
      // Check if chat session exists for this user and video
      let { data: existingSession } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("video_id", videoId)
        .eq("user_id", userId)
        .single();

      sessionId = existingSession?.id;

      // Create new session if it doesn't exist
      if (!sessionId) {
        const { data: newSession, error: sessionError } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: userId,
            video_id: videoId,
            video_title: transcriptData.title,
            video_url: transcriptData.url,
            transcript_data: transcriptData,
            model_used: "gpt-4o-mini",
          })
          .select("id")
          .single();

        if (sessionError) {
          console.error("Error creating chat session:", sessionError);
        } else {
          sessionId = newSession.id;
        }
      }

      // Load conversation history if session exists
      if (sessionId) {
        const { data: messages, error: messagesError } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (!messagesError && messages) {
          // Convert database messages to ChatMessage format
          conversationHistory = messages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));
          console.log(
            "Loaded conversation history:",
            conversationHistory.length,
            "messages"
          );
        }
      }
    } catch (storageError) {
      console.error("Error loading conversation history:", storageError);
      // Continue with empty history if storage fails
    }

    // Process AI chat with conversation history
    const aiResult = await processAIChat(
      userInput,
      transcriptData,
      conversationHistory
    );

    if (!aiResult.success) {
      return aiResult;
    }

    // Save the new conversation turn to database
    if (sessionId) {
      try {
        const userMsg = await resolveToString(userInput);
        const messagesToSave = [
          {
            session_id: sessionId,
            role: "user",
            content: userMsg,
          },
          {
            session_id: sessionId,
            role: "assistant",
            content: aiResult.response || "No response generated",
          },
        ];

        const { error: messageError } = await supabase
          .from("chat_messages")
          .insert(messagesToSave);

        if (messageError) {
          console.error("Error saving chat messages:", messageError);
        } else {
          console.log(
            "Chat messages saved successfully for session:",
            sessionId
          );
        }
      } catch (saveError) {
        console.error("Error saving chat messages:", saveError);
        // Don't fail the AI response if storage fails
      }
    }

    return aiResult;
  } catch (error) {
    console.error("Error in processAIChatWithStorage:", error);
    return {
      success: false,
      error: "Failed to process chat request. Please try again.",
    };
  }
};

/**
 * Get chat session and messages for a video
 */
export const getChatSession = async (
  videoId: string,
  userId: string
): Promise<{
  session: any;
  messages: Array<{ role: string; content: string; created_at: string }>;
} | null> => {
  try {
    const supabase = await createServerClient();

    // Get chat session
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("video_id", videoId)
      .eq("user_id", userId)
      .single();

    if (sessionError || !session) {
      return null;
    }

    // Get chat messages
    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching chat messages:", messagesError);
      return { session, messages: [] };
    }

    return { session, messages: messages || [] };
  } catch (error) {
    console.error("Error getting chat session:", error);
    return null;
  }
};

/**
 * Clear chat history for a video
 */
export const clearChatHistory = async (
  videoId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = await createServerClient();

    console.log("Clearing chat history for video:", videoId, "user:", userId);

    // Get chat session
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("video_id", videoId)
      .eq("user_id", userId)
      .single();

    if (sessionError || !session) {
      console.log("No chat session found for video:", videoId);
      return { success: false, error: "Chat session not found" };
    }

    console.log("Found chat session:", session.id);

    // Delete all messages for this session
    const { error: deleteError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("session_id", session.id);

    if (deleteError) {
      console.error("Error clearing chat messages:", deleteError);
      return { success: false, error: "Failed to clear chat history" };
    }

    console.log("Successfully cleared chat history for session:", session.id);
    return { success: true };
  } catch (error) {
    console.error("Error clearing chat history:", error);
    return { success: false, error: "Failed to clear chat history" };
  }
};
