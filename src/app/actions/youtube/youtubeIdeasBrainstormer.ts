"use server";
import OpenAI from "openai";

// Enhanced AI model with web browsing capabilities
const AI_MODEL = "gpt-4o";

// Generates 5 catchy YouTube video titles for a given topic using OpenAI
export async function generateSuggestedTitles({
  topic,
  contentType,
  duration,
  inspirationLinks,
  additionalIdeas,
}: {
  topic: string;
  contentType: string;
  duration: string;
  inspirationLinks: string[];
  additionalIdeas: string;
}): Promise<string[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // Build the prompt for title suggestions
  let prompt = `Suggest 5 catchy YouTube video titles for a video on the topic: "${topic}".\n`;
  prompt += `Content Type: ${contentType}\n`;
  prompt += `Desired Duration: ${duration}\n`;
  if (inspirationLinks.filter(Boolean).length > 0) {
    prompt += `Use these YouTube videos as inspiration: ${inspirationLinks.filter(Boolean).join(", ")}\n`;
  }
  if (additionalIdeas && additionalIdeas.trim().length > 0) {
    prompt += `Incorporate these additional ideas or points: ${additionalIdeas}\n`;
  }
  prompt += `\nReturn only the list of 5 titles, each on a new line, no extra commentary.`;

  try {
    const chatResponse = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a creative assistant that suggests catchy, relevant, and engaging YouTube video titles for creators. Research current trends and popular content in this topic area to make titles more engaging and up-to-date. Only return the list of titles, no extra commentary.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });
    // Parse the response into an array of titles
    const content = chatResponse.choices[0].message.content || "";
    return content
      .split("\n")
      .map((t) => t.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);
  } catch (err) {
    console.error("OpenAI title suggestion error:", err);
    return ["Failed to generate titles. Please try again later."];
  }
}

// Generates a YouTube script using OpenAI based on user input
// Only works if topicType is 'title'. If topicType is 'topic', call generateSuggestedTitles instead.
export async function generateYouTubeScript({
  topicType,
  topic,
  duration,
  contentType,
  inspirationLinks,
  additionalIdeas,
}: {
  topicType: "topic" | "title";
  topic: string;
  duration: string;
  contentType: string;
  inspirationLinks: string[];
  additionalIdeas: string;
}): Promise<string | string[]> {
  if (topicType === "topic") {
    // If user provided a general topic, generate suggested titles instead
    return generateSuggestedTitles({
      topic,
      contentType,
      duration,
      inspirationLinks,
      additionalIdeas,
    });
  }

  // Instantiate OpenAI client with API key from environment
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // Build the prompt based on user input
  let prompt = `Write a full YouTube script for a video titled: "${topic}".\n`;
  prompt += `Content Type: ${contentType}\n`;
  prompt += `Desired Duration: ${duration}\n`;
  if (inspirationLinks.filter(Boolean).length > 0) {
    prompt += `Use these YouTube videos as inspiration: ${inspirationLinks.filter(Boolean).join(", ")}\n`;
  }
  if (additionalIdeas && additionalIdeas.trim().length > 0) {
    prompt += `Incorporate these additional ideas or points: ${additionalIdeas}\n`;
  }
  prompt += `\nThe script should be engaging, clear, and suitable for YouTube. Format it with clear sections and speaker cues if appropriate.\n`;

  try {
    // Call OpenAI Chat API to generate the script
    const chatResponse = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that writes engaging, clear, and well-structured YouTube video scripts for creators. Research current information, trends, and relevant content to make the script more accurate and up-to-date. Always follow the user's instructions and format scripts for easy reading. YOU HAVE TO UNDERSTAND DEEPLY WHAT THE USER INPUT BY SEARCHING THE INTERNET, DO NOT ASSUME.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
    // Return the generated script
    return (
      chatResponse.choices[0].message.content?.trim() || "No script generated."
    );
  } catch (err) {
    console.error("OpenAI script generation error:", err);
    return "Failed to generate script. Please try again later.";
  }
}
