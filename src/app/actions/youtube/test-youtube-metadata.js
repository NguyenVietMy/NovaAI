// Simple test script for fetchYouTubeMetadata function
// Run with: node src/app/actions/youtube/test-youtube-metadata.js
// Make sure to set YOUTUBE_API_KEY environment variable first

const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local if it exists
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, "../../../../.env.local");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      const envVars = envContent.split("\n");

      envVars.forEach((line) => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      });
    }
  } catch (error) {
    console.log("Could not load .env.local file:", error.message);
  }
}

loadEnvFile();

const fetchYouTubeMetadata = async (videoId, apiKey) => {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  );

  const data = await res.json();

  if (!data.items?.length) throw new Error("Video not found");

  const video = data.items[0];
  const title = video.snippet.title;
  const durationISO = video.contentDetails.duration;
  const thumbnails = video.snippet.thumbnails;

  const parseDuration = (iso) => {
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

async function runTest() {
  const videoId = "6TQg96fFM0A"; // From your provided URL
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("❌ YOUTUBE_API_KEY environment variable is required");
    console.error(
      "Please set it in your .env.local file or as an environment variable"
    );
    process.exit(1);
  }

  console.log("🚀 Testing fetchYouTubeMetadata function...");
  console.log("📹 Video ID:", videoId);
  console.log("🔑 API Key:", apiKey.substring(0, 10) + "...");
  console.log("");

  try {
    // Test 1: Get the processed metadata
    console.log("📋 Test 1: Getting processed metadata...");
    const result = await fetchYouTubeMetadata(videoId, apiKey);
    console.log("✅ Processed metadata result:");
    console.log(JSON.stringify(result, null, 2));
    console.log("");

    // Test 2: Get raw YouTube API response to inspect thumbnails
    console.log("🔍 Test 2: Getting raw YouTube API response...");
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
    );

    const data = await res.json();
    const video = data.items[0];

    console.log("✅ Raw YouTube API response structure:");
    console.log("Video title:", video.snippet.title);
    console.log("Duration ISO:", video.contentDetails.duration);
    console.log("");

    console.log("📸 Thumbnails object:");
    console.log(JSON.stringify(video.snippet.thumbnails, null, 2));
    console.log("");

    console.log(
      "📊 Available thumbnail sizes:",
      Object.keys(video.snippet.thumbnails)
    );
    console.log("");

    // Test 3: Validate thumbnail structure
    console.log("🔍 Test 3: Validating thumbnail structure...");
    const thumbnails = video.snippet.thumbnails;
    const availableSizes = Object.keys(thumbnails);

    availableSizes.forEach((size) => {
      const thumbnail = thumbnails[size];
      console.log(
        `  ${size}: ${thumbnail.width}x${thumbnail.height} - ${thumbnail.url.substring(0, 50)}...`
      );
    });

    console.log("");
    console.log("✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

runTest();
