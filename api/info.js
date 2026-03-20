const ytdl = require("@distube/ytdl-core");

function isYouTube(url) {
  return /youtube\.com|youtu\.be/.test(url);
}

function isInstagram(url) {
  return /instagram\.com/.test(url);
}

function formatDuration(seconds) {
  if (!seconds) return "Unknown";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(bytes) {
  if (!bytes) return null;
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + " MB";
  return (bytes / 1024).toFixed(0) + " KB";
}

async function getYouTubeInfo(url) {
  const info = await ytdl.getInfo(url);
  const details = info.videoDetails;

  const wantedQualities = [
    { label: "1080p", itag: 137, container: "mp4" },
    { label: "720p",  itag: 22,  container: "mp4" },
    { label: "720p",  itag: 136, container: "mp4" },
    { label: "480p",  itag: 135, container: "mp4" },
    { label: "360p",  itag: 18,  container: "mp4" },
  ];

  const availableFormats = info.formats;
  const formats = [];

  for (const q of wantedQualities) {
    const found = availableFormats.find(
      (f) => f.itag === q.itag && f.hasVideo
    );
    if (found && !formats.find((f) => f.label === q.label)) {
      formats.push({
        label: q.label,
        container: q.container,
        itag: q.itag,
        size: formatBytes(found.contentLength),
        hasAudio: found.hasAudio,
        downloadUrl: `/api/download?url=${encodeURIComponent(url)}&itag=${q.itag}&title=${encodeURIComponent(details.title)}`,
      });
    }
  }

  // Audio only
  const audioFormat = availableFormats.find(
    (f) => f.itag === 140 && !f.hasVideo
  );
  if (audioFormat) {
    formats.push({
      label: "Audio",
      container: "mp3",
      itag: 140,
      size: formatBytes(audioFormat.contentLength),
      hasAudio: true,
      isAudio: true,
      downloadUrl: `/api/download?url=${encodeURIComponent(url)}&itag=140&title=${encodeURIComponent(details.title)}&audio=1`,
    });
  }

  return {
    platform: "youtube",
    title: details.title,
    author: details.author?.name || "",
    duration: formatDuration(parseInt(details.lengthSeconds)),
    thumbnail:
      details.thumbnails?.sort((a, b) => b.width - a.width)[0]?.url || null,
    formats,
  };
}

async function getInstagramInfo(url) {
  // Instagram requires authentication for most content now.
  // We return a passthrough so the frontend can attempt a direct open,
  // and provide instructions. For a production app you'd use a
  // third-party Instagram API service here.
  return {
    platform: "instagram",
    title: "Instagram Video",
    author: "",
    duration: "",
    thumbnail: null,
    formats: [
      {
        label: "Best Quality",
        container: "mp4",
        size: null,
        isInstagram: true,
        downloadUrl: url,
        originalUrl: url,
      },
    ],
    note: "Instagram restricts direct downloads. Click 'Open' to view on Instagram, or use a logged-in session tool.",
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });

  try {
    let data;
    if (isYouTube(url)) {
      data = await getYouTubeInfo(url);
    } else if (isInstagram(url)) {
      data = await getInstagramInfo(url);
    } else {
      return res.status(400).json({ error: "Unsupported platform. Use YouTube or Instagram links." });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Info error:", err.message);

    if (err.message?.includes("private") || err.message?.includes("unavailable")) {
      return res.status(404).json({ error: "Video is private or unavailable." });
    }
    if (err.message?.includes("age")) {
      return res.status(403).json({ error: "Age-restricted video — cannot process." });
    }

    return res.status(500).json({ error: "Failed to fetch video info. " + err.message });
  }
};
