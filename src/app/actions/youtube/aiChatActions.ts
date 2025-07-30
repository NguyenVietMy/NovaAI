"use server";
import OpenAI from "openai";
import { createClient as createServerClient } from "../../../../supabase/server";
import {
  TranscriptData,
  AIChatResult,
  ChatSessionData,
  ChatMessage,
  TranscriptChunk,
} from "../../../types/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// --- UTILITY HELPER FUNCTIONS ---

/**
 * Convert time string to seconds for timestamp processing.
 * Supports formats like "MM:SS" and "HH:MM:SS".
 */
const timeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
};

/**
 * Generate embedding for text using OpenAI's text-embedding-3-small model.
 * Used for semantic search functionality.
 */
const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
};

/**
 * Convert any value to a primitive string representation.
 * Handles null, undefined, numbers, booleans, and objects.
 */
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

/**
 * Resolve a value to string, handling promises and complex types.
 */
const resolveToString = async (maybe: unknown): Promise<string> => {
  const r = await Promise.resolve(maybe as any);
  return String(toPrimitiveString(r));
};

/**
 * Sanitize user input to prevent XSS and limit length.
 * Keeps sanitization light to avoid mangling user instructions.
 */
const sanitize = (s: string): string => {
  let out = s.replace(/<script/gi, "[REDACTED]"); // bare-minimum XSS guard
  if (out.length > 4000) out = out.slice(0, 4000) + "...";
  return out;
};

/**
 * Extract video ID from YouTube URL for semantic search functionality.
 */
const extractVideoId = (url: string): string | null => {
  const match = url.match(/[?&]v=([^&#]+)/);
  return match ? match[1] : null;
};

/**
 * Get full transcript from transcript data, handling different formats.
 * Supports both transcriptBlocks and transcriptTimed formats.
 */
const getFullTranscript = async (
  transcriptData: TranscriptData
): Promise<string> => {
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
  return t.length > MAX ? t.slice(0, MAX) + "\n\n[Transcript truncated]" : t;
};

// --- TRANSCRIPT CHUNK MANAGEMENT FUNCTIONS ---

/**
 * Store transcript chunks with embeddings for semantic search.
 * Groups transcript blocks into chunks and generates embeddings for each.
 */
export const storeTranscriptChunks = async (
  videoId: string,
  transcriptBlocks: Array<{ start: string; end: string; text: string }>,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = await createServerClient();

    // Group blocks into chunks (1 block per chunk for better granularity)
    const chunks: TranscriptChunk[] = [];
    for (let i = 0; i < transcriptBlocks.length; i++) {
      const block = transcriptBlocks[i];

      const startSec = timeToSeconds(block.start);
      const endSec = timeToSeconds(block.end);

      const text = `${block.start} - ${block.end} : ${block.text}`;

      chunks.push({
        chunk_id: `${videoId}-${startSec}`,
        start_sec: startSec,
        end_sec: endSec,
        text: text,
      });
    }

    console.log(`Creating ${chunks.length} chunks for video ${videoId}`);

    // Generate embeddings for each chunk
    for (const chunk of chunks) {
      try {
        console.log(
          `Processing chunk ${chunk.chunk_id}: ${chunk.text.substring(0, 100)}...`
        );
        const embedding = await generateEmbedding(chunk.text);

        // Store chunk with embedding
        const { error } = await supabase
          .from("youtube_transcript_chunks")
          .upsert({
            video_id: videoId,
            chunk_id: chunk.chunk_id,
            start_sec: chunk.start_sec,
            end_sec: chunk.end_sec,
            text: chunk.text,
            embedding: embedding,
            user_id: userId,
          });

        if (error) {
          console.error("Error storing chunk:", error);
        } else {
          console.log(`Successfully stored chunk ${chunk.chunk_id}`);
        }
      } catch (error) {
        console.error("Error processing chunk:", error);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error storing transcript chunks:", error);
    return { success: false, error: "Failed to store transcript chunks" };
  }
};

/**
 * Find relevant transcript chunks using semantic search.
 * Uses OpenAI embeddings and Supabase's match_chunks function.
 */
export const findRelevantChunks = async (
  videoId: string,
  userQuestion: string,
  matchThreshold: number = 0.3
): Promise<{
  chunks: TranscriptChunk[];
  topSimilarity?: number;
  error?: string;
}> => {
  try {
    console.log("Starting semantic search for video:", videoId);
    console.log("User question:", userQuestion);

    // Generate embedding for user question
    const questionEmbedding = await generateEmbedding(userQuestion);
    console.log("Generated embedding, length:", questionEmbedding.length);

    const supabase = await createServerClient();

    // First, check if chunks exist for this video
    const { data: existingChunks, error: checkError } = await supabase
      .from("youtube_transcript_chunks")
      .select("chunk_id, text")
      .eq("video_id", videoId)
      .limit(5);

    if (checkError) {
      console.error("Error checking for existing chunks:", checkError);
    } else {
      console.log("Existing chunks found:", existingChunks?.length || 0);
      if (existingChunks && existingChunks.length > 0) {
        console.log(
          "Sample chunks:",
          existingChunks.slice(0, 2).map((c) => ({
            chunk_id: c.chunk_id,
            text_length: c.text?.length || 0,
          }))
        );
      }
    }

    // Use the match_chunks function to find relevant chunks
    const { data: matches, error } = await supabase.rpc("match_chunks", {
      query_embedding: questionEmbedding,
      match_threshold: matchThreshold,
      match_count: 3, // Get top 3 highest similarity chunks
      video_id_param: videoId,
    });

    if (error) {
      console.error("Error finding relevant chunks:", error);
      return { chunks: [], error: "Failed to find relevant chunks" };
    }

    console.log("Matches found:", matches?.length || 0);
    if (matches && matches.length > 0) {
      console.log("Top match similarity:", matches[0].similarity);
      console.log("Top match text:", matches[0].text?.substring(0, 200));

      // Check if similarity is high enough to use chunks
      if (matches[0].similarity > 0.37) {
        console.log("High similarity score, using top 3 chunks");
      } else {
        console.log("Low similarity score, will use full transcript");
      }
    } else {
      console.log("No matches found - this might indicate:");
      console.log("1. No chunks exist for this video");
      console.log("2. Similarity threshold too high");
      console.log("3. Embedding generation failed");
    }

    // Convert to TranscriptChunk format
    const chunks: TranscriptChunk[] = matches.map((match: any) => ({
      chunk_id: match.chunk_id,
      start_sec: match.start_sec,
      end_sec: match.end_sec,
      text: match.text,
    }));

    return { chunks, topSimilarity: matches[0]?.similarity };
  } catch (error) {
    console.error("Error in semantic search:", error);
    return { chunks: [], error: "Failed to perform semantic search" };
  }
};

// --- AI CHAT PROCESSING FUNCTIONS ---

/**
 * Process AI chat with minimal prompt and no forced format.
 * Handles both semantic search and full transcript approaches.
 */
export const processAIChat = async (
  userInput: string | Promise<string>,
  transcriptData: TranscriptData,
  conversationHistory: ChatMessage[] = [],
  useSemanticSearch: boolean = true
): Promise<AIChatResult> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { success: false, error: "OpenAI API key is not configured" };
    }

    const userMsg = sanitize(await resolveToString(userInput));

    if (!transcriptData || !transcriptData.title || !transcriptData.url) {
      return { success: false, error: "Invalid transcript data" };
    }

    // Extract video ID for semantic search
    const videoId = extractVideoId(transcriptData.url);
    let relevantTranscript = "";

    if (useSemanticSearch && videoId) {
      try {
        // Check if ALL chunks exist for this video
        const supabase = await createServerClient();
        const { data: existingChunks, error: checkError } = await supabase
          .from("youtube_transcript_chunks")
          .select("chunk_id")
          .eq("video_id", videoId);

        if (checkError) {
          console.error("Error checking for chunks:", checkError);
        }

        // Only use semantic search if we have chunks AND they represent the full video
        // We'll estimate this by checking if we have chunks for the expected duration
        if (existingChunks && existingChunks.length > 0) {
          // Get the expected number of chunks based on video duration
          const expectedChunks = Math.ceil(
            transcriptData.transcriptBlocks?.length || 0
          );
          const actualChunks = existingChunks.length;

          console.log(
            `Chunks found: ${actualChunks}/${expectedChunks} for video ${videoId}`
          );

          // Only use semantic search if we have ALL chunks (or close to it - allow 95% completion)
          if (actualChunks >= expectedChunks * 0.95) {
            console.log("All chunks processed, attempting semantic search");
            const { chunks, topSimilarity, error } = await findRelevantChunks(
              videoId,
              userMsg
            );

            if (chunks.length > 0 && topSimilarity && topSimilarity > 0.37) {
              // Sort chunks by start_sec to maintain chronological order
              const sortedChunks = chunks.sort(
                (a, b) => a.start_sec - b.start_sec
              );

              // Use relevant chunks in chronological order
              relevantTranscript = sortedChunks
                .map((chunk) => chunk.text)
                .join("\n\n");
              console.log(
                "Using semantic search - found",
                chunks.length,
                "relevant chunks (sorted chronologically)"
              );
            } else {
              console.log(
                "Low similarity or no chunks found, using full transcript"
              );
              // Use full transcript when similarity is too low or no chunks found
              relevantTranscript = await getFullTranscript(transcriptData);
            }
          } else {
            console.log(
              `Incomplete chunks (${actualChunks}/${expectedChunks}), using full transcript`
            );
            // Use full transcript when chunks are still being processed
            relevantTranscript = await getFullTranscript(transcriptData);
          }
        } else {
          // No chunks exist yet (still being processed in background)
          console.log("No chunks found yet, using full transcript");
          relevantTranscript = await getFullTranscript(transcriptData);
        }
      } catch (error) {
        console.error("Semantic search failed, using full transcript:", error);
        relevantTranscript = await getFullTranscript(transcriptData);
      }
    } else {
      // Use full transcript
      relevantTranscript = await getFullTranscript(transcriptData);
    }

    if (!relevantTranscript.trim()) {
      return { success: false, error: "Transcript is empty." };
    }

    // *** Enhanced system prompt: clear boundaries with helpful inference ***
    const systemPrompt =
      `You are a helpful assistant analyzing a YouTube transcript. You have access to the transcript below.\n\n` +
      `🚨 Your job is to ONLY respond to questions that are related to the transcript content.\n\n` +
      `TRANSCRIPT FORMAT:\n` +
      `Each line follows this format:\n` +
      `  "start - end : content"\n` +
      `(e.g., "01:20 - 01:40 : aaaaaaaa")\n\n` +
      `⏱ If a user asks about a timestamp (e.g., "01:35", "@1:35", "at 1:35"), find the line that CONTAINS that timestamp (e.g., 01:20 - 01:40 contains 01:35).\n\n` +
      `⚠️ STRICT RULE:\n` +
      `You MUST NOT answer questions unrelated to the transcript (e.g., personal projects, outside coding help, tool advice).\n\n` +
      `If the question is NOT clearly about this video, respond:\n` +
      `> "That's outside the scope of this video. I can only help with questions related to the transcript."\n\n` +
      `✅ OK TO ANSWER:\n` +
      `- Short or vague prompts (like "cursor tips?", "why mock data?") — if they relate to the transcript, interpret and answer them using reasoning.\n` +
      `- Anything about tools, workflows, demos, or examples shown in the video.\n\n` +
      `🚫 NOT OK TO ANSWER:\n` +
      `- Questions about unrelated topics (e.g., "I'm using Next.js and can't connect to Supabase").\n` +
      `- Requests for coding help, personal projects, or tutorials outside the transcript's scope.\n\n` +
      `🧠 Be extremely helpful, logical, and insightful — but ONLY within what's said or clearly implied in the transcript.\n\n` +
      `DO NOT break these rules.\n\n` +
      `VIDEO CONTEXT:\n` +
      `Title: ${transcriptData.title}\n` +
      `URL: ${transcriptData.url}\n\n` +
      `TRANSCRIPT:\n${relevantTranscript}`;

    // Build messages array with conversation history
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMsg },
    ];

    // Log the complete prompt being sent to OpenAI
    console.log("=== COMPLETE OPENAI PROMPT ===");
    console.log("CONVERSATION HISTORY LENGTH:", conversationHistory.length);
    console.log("TRANSCRIPT LENGTH:", relevantTranscript.length, "characters");
    console.log("MESSAGES:", JSON.stringify(messages, null, 2));
    console.log("== END PROMPT ==");

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

// --- CHAT SESSION MANAGEMENT FUNCTIONS ---

/**
 * Process AI chat with session storage and conversation history.
 * This function handles both AI processing and database storage with memory.
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
      conversationHistory,
      true
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
 * Get chat session and messages for a video.
 * Retrieves existing conversation history for a specific video and user.
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
 * Clear chat history for a video.
 * Removes all conversation messages for a specific video and user.
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

// --- CHUNK STATUS FUNCTIONS ---

/**
 * Check if transcript chunks are ready for semantic search for a given video.
 * Returns the count of available chunks and whether they're ready for use.
 */
export const checkChunksReady = async (
  videoId: string
): Promise<{ ready: boolean; count?: number; error?: string }> => {
  try {
    const supabase = await createServerClient();
    const { data: chunks, error } = await supabase
      .from("youtube_transcript_chunks")
      .select("chunk_id")
      .eq("video_id", videoId);

    if (error) {
      console.error("Error checking chunks:", error);
      return { ready: false, error: "Failed to check chunks" };
    }

    const count = chunks?.length || 0;
    const ready = count > 0;

    console.log(
      `Chunks ready for video ${videoId}: ${ready} (${count} chunks)`
    );
    return { ready, count };
  } catch (error) {
    console.error("Error in checkChunksReady:", error);
    return { ready: false, error: "Failed to check chunks" };
  }
};
