const ytdl = require("@distube/ytdl-core");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url, itag, title, audio } = req.query;

  if (!url || !itag) {
    return res.status(400).json({ error: "Missing url or itag" });
  }

  if (!/youtube\.com|youtu\.be/.test(url)) {
    return res.status(400).json({ error: "Only YouTube downloads are proxied." });
  }

  try {
    const itagNum = parseInt(itag);
    const safeTitle = (title || "video").replace(/[^a-z0-9 \-_]/gi, "").trim() || "video";
    const ext = audio === "1" ? "mp3" : "mp4";
    const filename = `${safeTitle}.${ext}`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", audio === "1" ? "audio/mpeg" : "video/mp4");

    const stream = ytdl(url, {
      quality: itagNum,
      filter: audio === "1" ? "audioonly" : undefined,
    });

    stream.on("error", (err) => {
      console.error("Stream error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Stream failed: " + err.message });
      }
    });

    stream.pipe(res);
  } catch (err) {
    console.error("Download error:", err.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Download failed: " + err.message });
    }
  }
};
