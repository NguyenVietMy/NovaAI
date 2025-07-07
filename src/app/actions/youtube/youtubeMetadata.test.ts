// Jest globals are available by default in test environment

// Import the function from the original file
// Note: Since fetchYouTubeMetadata is not exported, we'll redefine it here for testing
const fetchYouTubeMetadata = async (videoId: string, apiKey: string) => {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  );

  const data = await res.json();

  if (!data.items?.length) throw new Error("Video not found");

  const video = data.items[0];
  const title = video.snippet.title;
  const durationISO = video.contentDetails.duration;
  const thumbnails = video.snippet.thumbnails;

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
    thumbnailUrl:
      thumbnails.maxres?.url ||
      thumbnails.standard?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      "",
  };
};

describe("fetchYouTubeMetadata", () => {
  const videoId = "6TQg96fFM0A"; // From your provided URL
  const apiKey = process.env.YOUTUBE_API_KEY;

  beforeAll(() => {
    if (!apiKey) {
      throw new Error(
        "YOUTUBE_API_KEY environment variable is required for testing"
      );
    }
  });

  it("should fetch metadata successfully and return expected structure", async () => {
    const result = await fetchYouTubeMetadata(videoId, apiKey!);

    // Test the basic structure
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("duration");
    expect(result).toHaveProperty("thumbnailUrl");

    // Test that title is a non-empty string
    expect(typeof result.title).toBe("string");
    expect(result.title.length).toBeGreaterThan(0);

    // Test that duration is in HH:MM:SS format
    expect(result.duration).toMatch(/^\d{2}:\d{2}:\d{2}$/);

    // Test that thumbnailUrl is a valid URL or empty string
    if (result.thumbnailUrl) {
      expect(result.thumbnailUrl).toMatch(/^https?:\/\/.+/);
    }

    console.log("✅ Metadata result:", JSON.stringify(result, null, 2));
  }, 10000); // 10 second timeout

  it("should fetch raw YouTube API response to inspect thumbnails structure", async () => {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
    );

    const data = await res.json();

    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);

    const video = data.items[0];
    expect(video).toHaveProperty("snippet");
    expect(video.snippet).toHaveProperty("thumbnails");

    // Log the full thumbnails object to inspect its structure
    console.log(
      "🔍 Full thumbnails object:",
      JSON.stringify(video.snippet.thumbnails, null, 2)
    );

    // Test that thumbnails object exists and has expected properties
    const thumbnails = video.snippet.thumbnails;
    expect(typeof thumbnails).toBe("object");
    expect(thumbnails).not.toBeNull();

    // Check for common thumbnail sizes (some may not exist)
    const expectedSizes = ["default", "medium", "high", "standard", "maxres"];
    const availableSizes = Object.keys(thumbnails);

    console.log("📸 Available thumbnail sizes:", availableSizes);

    // At least one thumbnail size should be available
    expect(availableSizes.length).toBeGreaterThan(0);

    // Test that each available thumbnail has url, width, and height
    availableSizes.forEach((size) => {
      const thumbnail = thumbnails[size];
      expect(thumbnail).toHaveProperty("url");
      expect(thumbnail).toHaveProperty("width");
      expect(thumbnail).toHaveProperty("height");

      expect(typeof thumbnail.url).toBe("string");
      expect(typeof thumbnail.width).toBe("number");
      expect(typeof thumbnail.height).toBe("number");

      expect(thumbnail.url).toMatch(/^https?:\/\/.+/);
      expect(thumbnail.width).toBeGreaterThan(0);
      expect(thumbnail.height).toBeGreaterThan(0);
    });

    console.log("✅ Thumbnails structure validation passed");
  }, 10000); // 10 second timeout

  it("should handle invalid video ID gracefully", async () => {
    const invalidVideoId = "invalid_video_id_12345";

    await expect(fetchYouTubeMetadata(invalidVideoId, apiKey!)).rejects.toThrow(
      "Video not found"
    );
  }, 10000); // 10 second timeout
});
