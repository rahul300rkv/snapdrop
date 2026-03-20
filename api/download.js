export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url, quality, audio } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url" });

  try {
    const body = {
      url,
      filenameStyle: "pretty",
    };

    if (audio === "1") {
      body.downloadMode = "audio";
      body.audioFormat = "mp3";
    } else {
      body.videoQuality = quality || "1080";
      body.downloadMode = "auto";
    }

    const cobaltRes = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await cobaltRes.json();

    if (!cobaltRes.ok || data.status === "error") {
      return res.status(400).json({
        error: data?.error?.code || "Download failed.",
      });
    }

    // Cobalt returns a tunnel URL — redirect the browser to it
    // The tunnel streams the file directly to the user
    const downloadUrl = data.url;
    if (!downloadUrl) {
      return res.status(500).json({ error: "No download URL returned." });
    }

    return res.redirect(302, downloadUrl);

  } catch (err) {
    console.error("Download error:", err.message);
    return res.status(500).json({ error: "Download failed. Try again." });
  }
}
