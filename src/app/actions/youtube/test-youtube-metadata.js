// Test script to verify background chunk storage
// Run this with: node src/app/actions/youtube/test-youtube-metadata.js

const { processYouTubeTranscript } = require("./youtubeTranscriptActions");

async function testBackgroundChunkStorage() {
  console.log("Testing background chunk storage...");

  const formData = new FormData();
  formData.append("url", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"); // Test video

  try {
    console.log("Starting transcript processing...");
    const startTime = Date.now();

    const result = await processYouTubeTranscript(formData);
    const endTime = Date.now();

    console.log(`Transcript processing completed in ${endTime - startTime}ms`);
    console.log("Result:", result);

    if (result.success) {
      console.log("✅ Transcript fetched successfully");
      console.log("📝 Background chunk storage should be running...");
      console.log(
        "⏳ Check the database in a few seconds to see if chunks were stored"
      );
    } else {
      console.log("❌ Transcript processing failed:", result.error);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testBackgroundChunkStorage();
