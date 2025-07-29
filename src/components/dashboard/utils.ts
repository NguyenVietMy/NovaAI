// Utility to normalize YouTube channel and playlist URLs
export function normalizeChannelUrl(url: string): string {
  try {
    const u = new URL(url);

    // Handle playlist URLs - return as-is since yt-dlp handles them correctly
    if (u.pathname === "/playlist" && u.searchParams.has("list")) {
      return url;
    }

    // Handles /@handle, /@handle/featured, /@handle/shorts, /@handle/videos, etc.
    const match = u.pathname.match(/^\/@[\w\-]+/);
    if (match) {
      return `${u.origin}${match[0]}/videos`;
    }

    // Handles /channel/UCxxxxxx
    const channelMatch = u.pathname.match(/^\/channel\/[\w\-]+/);
    if (channelMatch) {
      return `${u.origin}${channelMatch[0]}/videos`;
    }

    // Fallback: return original
    return url;
  } catch {
    return url;
  }
}

// Utility to check if a URL is a YouTube video
export function isYouTubeVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    // Match /watch?v= or /shorts/ or /embed/
    return (
      (u.pathname === "/watch" && u.searchParams.has("v")) ||
      u.pathname.startsWith("/shorts/") ||
      u.pathname.startsWith("/embed/")
    );
  } catch {
    return false;
  }
}

// Extract video ID from YouTube URL
export function extractVideoId(url: string): string | null {
  const match = url.match(/[?&]v=([^&#]+)/);
  return match ? match[1] : null;
}

// Download transcript in various formats
export function downloadTranscript(
  transcriptData: any,
  format:
    | "txt"
    | "srt"
    | "json"
    | "vtt"
    | "vtt-clean"
    | "vtt-advanced"
    | "csv"
    | "md",
  txtVariant?: "withTimestamp" | "plain"
) {
  let content = "";
  let filename = "";
  let mimeType = "";

  switch (format) {
    case "txt":
      if (txtVariant === "withTimestamp") {
        content = transcriptData.transcriptTimed;
        filename = `transcript-${Date.now()}-with-timestamps.txt`;
      } else {
        content = transcriptData.transcriptPlain;
        filename = `transcript-${Date.now()}.txt`;
      }
      mimeType = "text/plain";
      break;
    case "srt":
      // Generate SRT from transcriptTimed (pattern: time1->time2, text1)
      const timedLines = transcriptData.transcriptTimed
        .split("\n")
        .filter(Boolean);
      const srtBlocks = [];
      for (let i = 0; i < timedLines.length - 1; i++) {
        const [start, ...textArr] = timedLines[i].split(/\s{2,}/);
        const [end] = timedLines[i + 1].split(/\s{2,}/);
        if (!start || !end || textArr.length === 0) continue;
        // SRT expects comma for ms
        const toSrtTime = (t: string) => t.replace(/\.(\d{3})$/, ",$1");
        srtBlocks.push(
          `${i + 1}\n${toSrtTime(start)} --> ${toSrtTime(end)}\n${textArr.join(" ")}\n`
        );
      }
      content = srtBlocks.join("\n");
      filename = `transcript-${Date.now()}.srt`;
      mimeType = "text/plain";
      break;
    case "json":
      content = JSON.stringify(transcriptData, null, 2);
      filename = `transcript-${Date.now()}.json`;
      mimeType = "application/json";
      break;
    case "vtt":
      content = transcriptData.transcriptVtt;
      filename = `transcript-${Date.now()}.vtt`;
      mimeType = "text/vtt";
      break;
    case "vtt-clean":
      // Cleaned VTT: SRT-to-VTT logic
      const timedLinesVtt = transcriptData.transcriptTimed
        .split("\n")
        .filter(Boolean);
      const vttBlocks = [];
      for (let i = 0; i < timedLinesVtt.length - 1; i++) {
        const [start, ...textArr] = timedLinesVtt[i].split(/\s{2,}/);
        const [end] = timedLinesVtt[i + 1].split(/\s{2,}/);
        if (!start || !end || textArr.length === 0) continue;
        // VTT expects dot for ms
        const toVttTime = (t: string) => t.replace(/\.(\d{3})$/, ".$1");
        vttBlocks.push(
          `${toVttTime(start)} --> ${toVttTime(end)}\n${textArr.join(" ")}\n`
        );
      }
      content = `WEBVTT\n\n${vttBlocks.join("\n")}`;
      filename = `transcript-${Date.now()}-cleaned.vtt`;
      mimeType = "text/vtt";
      break;
    case "vtt-advanced":
      // Advanced VTT: original
      content = transcriptData.transcriptVtt;
      filename = `transcript-${Date.now()}-advanced.vtt`;
      mimeType = "text/vtt";
      break;
    case "csv":
      // CSV from transcriptTimed: Start,End,Text
      const timedLinesCsv = transcriptData.transcriptTimed
        .split("\n")
        .filter(Boolean);
      let csvRows = ["Start,End,Text"];
      for (let i = 0; i < timedLinesCsv.length - 1; i++) {
        const [start, ...textArr] = timedLinesCsv[i].split(/\s{2,}/);
        const [end] = timedLinesCsv[i + 1].split(/\s{2,}/);
        if (!start || !end || textArr.length === 0) continue;
        // Escape quotes in text for CSV
        const text = textArr.join(" ").replace(/"/g, '""');
        csvRows.push(`"${start}","${end}","${text}"`);
      }
      content = csvRows.join("\n");
      filename = `transcript-${Date.now()}.csv`;
      mimeType = "text/csv";
      break;
    case "md":
      // Markdown export: Title, ID, then transcript with start time only (seconds only)
      const mdTitle = transcriptData.title || "";
      // Try to extract YouTube ID from URL
      let mdId = "";
      try {
        const urlObj = new URL(transcriptData.url);
        mdId =
          urlObj.searchParams.get("v") ||
          urlObj.pathname.split("/").pop() ||
          "";
      } catch {}
      let md = `# Video Information\n\n**Title:** ${mdTitle}\n**ID:** ${mdId}\n\n## Transcript\n\n`;
      const timedLinesMd = transcriptData.transcriptTimed
        .split("\n")
        .filter(Boolean);
      for (const line of timedLinesMd) {
        const [start, ...textArr] = line.split(/\s{2,}/);
        if (!start || textArr.length === 0) continue;
        // Remove milliseconds from start time
        const startNoMs = start.replace(/\.(\d{3})$/, "");
        md += `**[${startNoMs}]** ${textArr.join(" ")}\n\n`;
      }
      content = md;
      filename = `transcript-${Date.now()}.md`;
      mimeType = "text/markdown";
      break;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Copy transcript to clipboard
export async function copyTranscript(
  transcriptData: any,
  type: "withTimestamp" | "plain"
): Promise<string> {
  let text = "";
  if (type === "withTimestamp") {
    text = transcriptData.transcriptBlocks
      .map((block: any) => `${block.start} - ${block.end}\n${block.text}`)
      .join("\n\n");
  } else {
    text = transcriptData.transcriptPlain;
  }

  try {
    await navigator.clipboard.writeText(text);
    return type === "withTimestamp"
      ? "Copied with timestamp!"
      : "Copied plain!";
  } catch {
    return "Failed to copy";
  }
}
