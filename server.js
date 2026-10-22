import express from "express";
import multer from "multer";

const app = express();
const port = process.env.PORT || 10000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }
});

app.use(express.static("."));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "Voxora AI backend" });
});

app.post("/api/analyze", upload.single("video"), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Render-এ GEMINI_API_KEY Secret সেট করা হয়নি।" });
    }
    if (!req.file) return res.status(400).json({ error: "ভিডিও ফাইল পাঠানো হয়নি।" });

    const language = String(req.body.language || "bn");
    const style = String(req.body.style || "shorts");
    const languages = { bn: "Bengali (Bangla)", en: "English", hi: "Hindi" };
    const styles = {
      shorts: "engaging short-form video / YouTube Shorts",
      gaming: "energetic gaming commentary",
      storytelling: "storytelling narration",
      promotional: "promotional / marketing voice-over",
      review: "review narration",
      informative: "clear informative narration"
    };

    const prompt = `You are Voxora AI, a professional video voice-over scriptwriter.
Analyze the uploaded video's visual scenes and audible context when available.
Write a natural, engaging voice-over script in ${languages[language] || languages.bn}.
Style: ${styles[style] || styles.shorts}.
Describe only what is supported by the video; do not invent facts.
Start with a strong hook, follow the order of scenes, and use concise speakable sentences.
Return only the finished script, without markdown or extra commentary.`;

    const base64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype || "video/mp4";

    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
        input: [
          { type: "text", text: prompt },
          { type: "video", data: base64, mime_type: mimeType }
        ]
      })
    });

    const raw = await upstream.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: "AI পরিষেবা থেকে সঠিক উত্তর পাওয়া যায়নি।" });
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || "Gemini API request ব্যর্থ হয়েছে।"
      });
    }

    let script = data.output_text;
    if (!script && Array.isArray(data.output)) {
      script = data.output.flatMap(x => x.content || [])
        .filter(x => x.type === "text" && x.text)
        .map(x => x.text).join("\n");
    }
    if (!script && Array.isArray(data.steps)) {
      script = data.steps.flatMap(x => x.content || [])
        .filter(x => x.type === "text" && x.text)
        .map(x => x.text).join("\n");
    }
    if (!script) return res.status(502).json({ error: "AI স্ক্রিপ্ট তৈরি করতে পারেনি।" });

    res.json({ script: script.trim() });
  } catch (err) {
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "এই প্রাথমিক সংস্করণে সর্বোচ্চ 12 MB ভিডিও ব্যবহার করুন।" });
    }
    console.error("Voxora analyze error:", err);
    res.status(500).json({ error: "সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Voxora AI server listening on ${port}`);
});
