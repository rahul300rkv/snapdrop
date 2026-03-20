# SnapDrop — Video Downloader

YouTube + Instagram video downloader built with Vercel Serverless Functions.

## Project Structure

```
snapdrop/
├── api/
│   ├── info.js        ← GET /api/info?url=...   (fetch video metadata)
│   └── download.js    ← GET /api/download?url=...&itag=... (stream download)
├── public/
│   └── index.html     ← Frontend
├── package.json
├── vercel.json
└── README.md
```

## Deploy in 3 steps

### 1. Install dependencies locally (optional, for testing)
```bash
npm install
```

### 2. Install Vercel CLI & login
```bash
npm i -g vercel
vercel login
```

### 3. Deploy
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Pick your account
- Link to existing project? **N**
- Project name: `snapdrop` (or anything you want)
- In which directory is your code? `.` (current directory)

Vercel will give you a live URL like `https://snapdrop-xxx.vercel.app`

## Production deploy
```bash
vercel --prod
```

## Local dev
```bash
vercel dev
```
Then open http://localhost:3000

---

## Notes

### YouTube ✅
- Powered by `@distube/ytdl-core`
- Supports: 1080p, 720p, 480p, 360p, MP3 audio
- Videos stream directly through `/api/download`

### Instagram ⚠️
- Instagram heavily restricts direct API access (no public download API)
- The info endpoint returns the original URL — clicking "Open" takes the user to Instagram
- For real Instagram downloads, consider integrating a paid service like RapidAPI's
  "Instagram Downloader" API and swap out `getInstagramInfo()` in `api/info.js`

### Vercel Free Tier Limits
- Functions timeout after 10 seconds — works fine for most YouTube videos
- If you hit timeouts on long videos, upgrade to Vercel Pro (60s timeout)
  or switch to Railway/Render for unlimited execution time

## Environment Variables (optional)
If you add an Instagram API key later:
```bash
vercel env add INSTAGRAM_API_KEY
```
Then access it in your function via `process.env.INSTAGRAM_API_KEY`
