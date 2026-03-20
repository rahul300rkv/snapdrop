export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });

  const isYT = /youtube\.com|youtu\.be/.test(url);
  const isIG = /instagram\.com/.test(url);

  if (!isYT && !isIG) {
    return res.status(400).json({ error: "Only YouTube and Instagram links are supported." });
  }

  try {
    const cobaltRes = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        url,
        videoQuality: "1080",
        audioFormat: "mp3",
        filenameStyle: "pretty",
      }),
    });

    const data = await cobaltRes.json();

    if (!cobaltRes.ok || data.status === "error") {
      return res.status(400).json({
        error: data?.error?.code || "Could not process this URL.",
      });
    }

    const formats = [];

    if (data.status === "picker") {
      // Instagram carousel / multiple items
      data.picker.forEach((item, i) => {
        formats.push({
          label: item.type === "photo" ? `Photo ${i + 1}` : `Video ${i + 1}`,
          container: item.type === "photo" ? "jpg" : "mp4",
          size: null,
          downloadUrl: item.url,
          directUrl: true,
        });
      });
    } else {
      // Single video — tunnel or redirect
      const qualities = isYT ? ["1080", "720", "480", "360"] : ["1080"];
      qualities.forEach((q, i) => {
        formats.push({
          label: i === 0 ? `${q}p HD` : `${q}p`,
          container: "mp4",
          size: null,
          downloadUrl: `/api/download?url=${encodeURIComponent(url)}&quality=${q}`,
        });
      });

      if (isYT) {
        formats.push({
          label: "Audio",
          container: "mp3",
          size: null,
          isAudio: true,
          downloadUrl: `/api/download?url=${encodeURIComponent(url)}&audio=1`,
        });
      }
    }

    return res.status(200).json({
      platform: isYT ? "youtube" : "instagram",
      title: "Video ready",
      author: "",
      duration: "",
      thumbnail: null,
      formats,
    });

  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ error: "Failed to process URL. Try again." });
  }
}
