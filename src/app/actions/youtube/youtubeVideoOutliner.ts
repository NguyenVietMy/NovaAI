"use server";
import OpenAI from "openai";

// Server-side function to generate a video outline and hashtags using GPT-4o
export async function generateVideoOutline({
  contentType,
  duration,
  topicType,
  topic,
  style,
  audience,
  hookStyle,
  language,
  generateHashtags,
}: {
  contentType: string;
  duration: string;
  topicType: "topic" | "title";
  topic: string;
  style: string;
  audience: string[];
  hookStyle: string;
  language: string; // can be custom
  generateHashtags: string; // "yes" or "no"
}): Promise<{ outline: string; hashtags: string[] }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // Build the prompt
  let prompt = "";
  if (topicType === "title") {
    prompt += `Create a detailed YouTube video outline for the video titled: "${topic}".\n`;
  } else {
    prompt += `Create a detailed YouTube video outline for a video on the topic: "${topic}".\n`;
  }
  prompt += `Content Type: ${contentType}\n`;
  prompt += `Desired Length: ${duration}\n`;
  if (style) prompt += `Style: ${style}\n`;
  if (audience && audience.length > 0)
    prompt += `Target Audience: ${audience.join(", ")}\n`;
  if (hookStyle) prompt += `Hook Style: ${hookStyle}\n`;
  if (language) {
    prompt += `Language: ${language}. If you do not know this language, generate the outline in English.\n`;
  }
  prompt += `\nFormat the outline as clear bullet points.\n`;
  if (generateHashtags === "yes") {
    prompt += `\nAt the end, suggest 5-10 relevant SEO hashtags for this video as a JSON array (e.g. ["#coding", "#learning"]).\n`;
  }

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates clear, actionable, and well-structured YouTube video outlines and relevant hashtags for creators. Always follow the user's instructions and format output as requested.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });
    const content = chatResponse.choices[0].message.content?.trim() || "";

    // Extract hashtags array if present
    let hashtags: string[] = [];
    let outline = content;
    if (generateHashtags === "yes") {
      // Try to extract the last JSON array from the response
      const match = content.match(/\[[^\]]+\]/);
      if (match) {
        try {
          hashtags = JSON.parse(match[0].replace(/'/g, '"'));
          outline = content.replace(match[0], "").trim();
        } catch {
          hashtags = [];
        }
      }
    }
    return { outline, hashtags };
  } catch (err) {
    console.error("OpenAI video outline generation error:", err);
    return {
      outline: "Failed to generate outline. Please try again later.",
      hashtags: [],
    };
  }
}
